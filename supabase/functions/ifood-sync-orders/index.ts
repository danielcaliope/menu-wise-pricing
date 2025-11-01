import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IFOOD_API_URL = 'https://merchant-api.ifood.com.br';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body to check if it's a webhook
    const body = await req.text();
    let webhookData = null;
    
    try {
      webhookData = body ? JSON.parse(body) : null;
    } catch {
      // Not JSON, probably a manual call
    }

    // If empty request or KEEPALIVE (connection test from iFood), return success
    if (!body || body === '[]') {
      console.log('Empty request received');
      return new Response(null, {
        status: 202,
        headers: corsHeaders,
      });
    }

    // Check if this is a KEEPALIVE event
    if (webhookData && (webhookData.code === 'KEEPALIVE' || webhookData.fullCode === 'KEEPALIVE')) {
      console.log('KEEPALIVE event received');
      return new Response(null, {
        status: 202,
        headers: corsHeaders,
      });
    }

    // Check if this is a webhook from iFood
    const isWebhook = webhookData && Array.isArray(webhookData) && webhookData.length > 0 && webhookData[0].code;
    
    console.log('Request type:', isWebhook ? 'Webhook' : 'Manual');

    // Create Supabase client
    // For webhooks, use service role key; for manual calls, use user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      isWebhook ? (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '') : (Deno.env.get('SUPABASE_ANON_KEY') ?? ''),
      isWebhook ? {} : {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    let userId: string;
    let config: any;

    if (isWebhook) {
      // For webhook, identify user by merchant_id from the first event
      const firstEvent = webhookData[0];
      const merchantId = firstEvent.metadata?.merchantId || firstEvent.merchantId;

      console.log('Webhook received for merchant:', merchantId);

      if (!merchantId) {
        return new Response(JSON.stringify({ error: 'Missing merchantId in webhook' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Find user by merchant_id
      const { data: configData } = await supabaseClient
        .from('ifood_config')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('is_active', true)
        .single();

      if (!configData) {
        console.error('No config found for merchant:', merchantId);
        return new Response(JSON.stringify({ error: 'Merchant not configured' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      config = configData;
      userId = config.user_id;
      console.log('Found user for merchant:', userId);
    } else {
      // Manual call - authenticate user
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      userId = user.id;

      // Get user's iFood config
      const { data: configData } = await supabaseClient
        .from('ifood_config')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (!configData) {
        return new Response(JSON.stringify({ error: 'iFood not configured' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      config = configData;
    }

    // Check if token is expired
    const tokenExpiry = new Date(config.token_expires_at);
    if (tokenExpiry < new Date()) {
      console.error('Token expired for user:', userId);
      return new Response(JSON.stringify({ error: 'Token expired, please refresh' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let events = [];

    if (isWebhook) {
      // Use events from webhook body
      events = webhookData;
      console.log('Processing webhook events:', events.length);
    } else {
      // Manual call - poll for events
      const ordersResponse = await fetch(`${IFOOD_API_URL}/order/v1.0/events:polling`, {
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
        },
      });

      if (!ordersResponse.ok) {
        const error = await ordersResponse.text();
        console.error('Failed to poll orders:', error);
        return new Response(JSON.stringify({ error: 'Failed to poll orders', details: error }), {
          status: ordersResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      events = await ordersResponse.json();
      console.log('Polling returned events:', events.length);
    }

    const newOrders = [];

    // Process each event
    for (const event of events) {
      if (event.code === 'PLC' || event.code === 'PLACED') {
        console.log('Processing order event:', event.orderId);
        
        // Get full order details
        const orderResponse = await fetch(`${IFOOD_API_URL}/order/v1.0/orders/${event.orderId}`, {
          headers: {
            'Authorization': `Bearer ${config.access_token}`,
          },
        });

        if (orderResponse.ok) {
          const order = await orderResponse.json();
          
          // Check if order already exists
          const { data: existingOrder } = await supabaseClient
            .from('ifood_orders')
            .select('id')
            .eq('ifood_order_id', order.id)
            .single();

          if (!existingOrder) {
            console.log('Inserting new order:', order.id);
            
            // Insert new order
            const { data: insertedOrder, error } = await supabaseClient
              .from('ifood_orders')
              .insert({
                user_id: userId,
                ifood_order_id: order.id,
                merchant_id: config.merchant_id,
                order_type: order.orderType || 'DELIVERY',
                order_timing: order.orderTiming || 'IMMEDIATE',
                delivery_address: order.delivery?.deliveryAddress || null,
                customer: {
                  name: order.customer?.name || 'Cliente iFood',
                  phone: order.customer?.phone || '',
                },
                items: order.items || [],
                total_amount: order.total?.orderAmount || 0,
                sub_total: order.total?.subTotal || 0,
                delivery_fee: order.total?.deliveryFee || 0,
                benefits: order.total?.benefits || null,
                payments: order.payments || [],
                order_status: 'PLACED',
                created_at_ifood: order.createdAt || new Date().toISOString(),
              })
              .select()
              .single();

            if (!error && insertedOrder) {
              newOrders.push(insertedOrder);
              console.log('Order inserted successfully');
            } else if (error) {
              console.error('Error inserting order:', error);
            }
          } else {
            console.log('Order already exists:', order.id);
          }

          // Acknowledge the event
          await fetch(`${IFOOD_API_URL}/order/v1.0/events/acknowledgment`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([event.id]),
          });
        } else {
          console.error('Failed to get order details:', event.orderId);
        }
      }
    }

    console.log('Processing complete. New orders:', newOrders.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        newOrders: newOrders.length,
        orders: newOrders,
        source: isWebhook ? 'webhook' : 'manual',
      }),
      { 
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
