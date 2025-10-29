import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IFOOD_AUTH_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token';

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

    const { action, clientId, clientSecret } = await req.json();

    if (action === 'authenticate') {
      // Request access token from iFood
      const authResponse = await fetch(IFOOD_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grantType: 'client_credentials',
          clientId: clientId,
          clientSecret: clientSecret,
        }),
      });

      if (!authResponse.ok) {
        const error = await authResponse.text();
        console.error('iFood auth error:', error);
        return new Response(JSON.stringify({ error: 'Failed to authenticate with iFood', details: error }), {
          status: authResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const authData = await authResponse.json();
      
      // Calculate token expiration
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + authData.expiresIn);

      // Save or update config
      const { data: existingConfig } = await supabaseClient
        .from('ifood_config')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingConfig) {
        await supabaseClient
          .from('ifood_config')
          .update({
            client_id: clientId,
            client_secret: clientSecret,
            access_token: authData.accessToken,
            token_expires_at: expiresAt.toISOString(),
            is_active: true,
          })
          .eq('id', existingConfig.id);
      } else {
        await supabaseClient
          .from('ifood_config')
          .insert({
            user_id: user.id,
            client_id: clientId,
            client_secret: clientSecret,
            access_token: authData.accessToken,
            token_expires_at: expiresAt.toISOString(),
            is_active: true,
          });
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Authenticated successfully',
          expiresAt: expiresAt.toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'refresh') {
      // Get current config
      const { data: config } = await supabaseClient
        .from('ifood_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!config) {
        return new Response(JSON.stringify({ error: 'No config found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Refresh token
      const authResponse = await fetch(IFOOD_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grantType: 'client_credentials',
          clientId: config.client_id,
          clientSecret: config.client_secret,
        }),
      });

      if (!authResponse.ok) {
        return new Response(JSON.stringify({ error: 'Failed to refresh token' }), {
          status: authResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const authData = await authResponse.json();
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + authData.expiresIn);

      // Update token
      await supabaseClient
        .from('ifood_config')
        .update({
          access_token: authData.accessToken,
          token_expires_at: expiresAt.toISOString(),
        })
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Token refreshed successfully',
          expiresAt: expiresAt.toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
