import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =============================================
// CREATE STUDIO USER
// =============================================
// Supabase Edge Function for creating admin users without email verification
// Uses Admin API to bypass email confirmation requirement

interface CreateStudioUserRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  studio_id: string;
  requesting_user_id: string; // Auth user ID of the admin creating the user
}

serve(async (req: Request) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Method not allowed. Use POST.',
        }),
        { 
          status: 405, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body with error handling
    let requestData: CreateStudioUserRequest;
    try {
      const bodyText = await req.text();
      if (!bodyText || bodyText.trim() === '') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Request body is empty',
          }),
          { 
            status: 400, 
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            } 
          }
        );
      }
      requestData = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
          details: parseError.message,
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    const { email, password, full_name, phone, studio_id, requesting_user_id } = requestData;

    // Validate required fields
    if (!email || !password || !full_name || !studio_id || !requesting_user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: email, password, full_name, studio_id, and requesting_user_id are required',
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    console.log(`Creating studio user: ${email} for studio: ${studio_id}`);

    // Step 1: Validate requesting user is an admin of the studio
    const { data: requestingAdmin, error: adminError } = await supabase
      .from('admin_users')
      .select('id, role, studio_id')
      .eq('auth_user_id', requesting_user_id)
      .eq('is_active', true)
      .single();

    if (adminError || !requestingAdmin) {
      console.error('Requesting user not found or not active:', adminError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized: Admin user not found',
        }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Check if requesting user is admin (not staff) and belongs to the studio
    if (requestingAdmin.role === 'staff') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized: Staff cannot create users',
        }),
        { 
          status: 403, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    if (requestingAdmin.studio_id !== studio_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized: Cannot create users for different studio',
        }),
        { 
          status: 403, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Step 2: Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email already registered',
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Step 3: Create auth user using Admin API (bypasses email verification)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Mark email as confirmed immediately
      user_metadata: {
        full_name,
        studio_id,
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return new Response(
        JSON.stringify({
          success: false,
          error: authError.message || 'Failed to create user account',
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create user account',
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Step 4: Create admin_users record
    const adminUserData = {
      auth_user_id: authData.user.id,
      studio_id: studio_id,
      email: email,
      full_name: full_name,
      phone: phone || null,
      role: 'admin' as const,
      is_active: true,
    };

    const { data: adminUser, error: adminUserError } = await supabase
      .from('admin_users')
      .insert(adminUserData)
      .select()
      .single();

    if (adminUserError) {
      console.error('Error creating admin user record:', adminUserError);
      
      // Rollback: Try to delete the auth user (best effort)
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.error('Failed to rollback auth user:', deleteError);
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create admin user record',
          details: adminUserError.message,
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    console.log(`Studio user created successfully: ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          full_name: adminUser.full_name,
          phone: adminUser.phone,
          role: adminUser.role,
          studio_id: adminUser.studio_id,
        },
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in create-studio-user:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unexpected error occurred',
        details: error.message,
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
});

