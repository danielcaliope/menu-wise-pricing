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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's iFood config
    const { data: config } = await supabaseClient
      .from('ifood_config')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!config) {
      return new Response(JSON.stringify({ error: 'iFood not configured' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if token is expired
    const tokenExpiry = new Date(config.token_expires_at);
    if (tokenExpiry < new Date()) {
      return new Response(JSON.stringify({ error: 'Token expired, please refresh' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get merchants
    const merchantsResponse = await fetch(`${IFOOD_API_URL}/merchant/v1.0/merchants`, {
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
      },
    });

    if (!merchantsResponse.ok) {
      const error = await merchantsResponse.text();
      console.error('Failed to get merchants:', error);
      return new Response(JSON.stringify({ error: 'Failed to get merchants', details: error }), {
        status: merchantsResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const merchants = await merchantsResponse.json();
    
    if (!merchants || merchants.length === 0) {
      return new Response(JSON.stringify({ error: 'No merchants found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const merchantId = merchants[0].id;

    // Update merchant_id in config if not set
    if (!config.merchant_id) {
      await supabaseClient
        .from('ifood_config')
        .update({ merchant_id: merchantId })
        .eq('user_id', user.id);
    }

    // Poll for new orders
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

    const events = await ordersResponse.json();
    const newOrders = [];

    // Process each event
    for (const event of events) {
      if (event.code === 'PLC' || event.code === 'PLACED') {
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
            // Insert new order
            const { data: insertedOrder, error } = await supabaseClient
              .from('ifood_orders')
              .insert({
                user_id: user.id,
                ifood_order_id: order.id,
                merchant_id: merchantId,
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
            }
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
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        newOrders: newOrders.length,
        orders: newOrders,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
