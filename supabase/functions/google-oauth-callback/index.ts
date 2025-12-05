import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

interface OAuthCallbackData {
  code: string
  clientId: string
  clientSecret: string
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user from JWT
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const callbackData: OAuthCallbackData = await req.json()
    const { code, clientId, clientSecret } = callbackData

    // Get admin user with studio info
    const { data: adminUser, error: adminError } = await supabaseClient
      .from('admin_users')
      .select('*, studio:studios(*)')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !adminUser) {
      throw new Error('Studio not found or access denied')
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: `${new URL(req.headers.get('origin') || 'http://localhost:3000').origin}/admin/settings`,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      throw new Error(`OAuth token exchange failed: ${tokenResponse.status} - ${errorText}`)
    }

    const tokens = await tokenResponse.json()
    const { access_token, refresh_token } = tokens

    // Calculate token expiration (tokens are typically valid for 1 hour)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)

    // Save tokens to database using admin client (service role)
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: updateError } = await adminSupabase
      .from('studios')
      .update({
        google_refresh_token: refresh_token,
        google_access_token: access_token,
        google_token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', adminUser.studio.id)

    if (updateError) {
      throw new Error(`Failed to save tokens: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Google Calendar authorization completed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in OAuth callback:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'OAuth callback failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
