import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get the authorization header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('No authorization header')
        }

        // Create Supabase client with service role for admin operations
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Extract JWT token from Authorization header
        const token = authHeader.replace('Bearer ', '')

        // Verify the JWT and get user using service role client
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

        if (userError || !user) {
            throw new Error('Unauthorized: Invalid token')
        }

        // Check if user is super admin
        const { data: adminUser, error: adminError } = await supabaseAdmin
            .from('admin_users')
            .select('role')
            .eq('auth_user_id', user.id)
            .single()

        if (adminError || !adminUser || adminUser.role !== 'super_admin') {
            throw new Error('Only super admins can onboard users')
        }

        // Get request body
        const { email, password, fullName, phone, role, studioName } = await req.json()

        // Validate required fields
        if (!email || !password || !fullName || !role) {
            throw new Error('Missing required fields: email, password, fullName, role')
        }

        if (role !== 'super_admin' && !studioName) {
            throw new Error('Studio name is required for admin and staff roles')
        }

        // 1. Create auth user with auto-confirm
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                phone: phone || null,
            }
        })

        if (authError) {
            throw new Error(`Failed to create auth user: ${authError.message}`)
        }

        if (!authData.user) {
            throw new Error('Failed to create user')
        }

        // 2. Create company and studio if role is admin or staff
        let studioId: string | null = null
        let companyId: string | null = null
        if (role !== 'super_admin' && studioName) {
            // Generate a slug from the studio name
            const slug = studioName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

            // First, create a company for this studio
            const { data: companyData, error: companyError } = await supabaseAdmin
                .from('companies')
                .insert({
                    name: studioName,
                    slug: `${slug}-${Date.now()}`, // Add timestamp to ensure uniqueness
                })
                .select()
                .single()

            if (companyError) {
                // Rollback: delete the auth user
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
                throw new Error(`Failed to create company: ${companyError.message}`)
            }

            companyId = companyData.id

            // Then create the studio linked to the company
            const { data: studioData, error: studioError } = await supabaseAdmin
                .from('studios')
                .insert({
                    company_id: companyData.id,
                    name: studioName,
                })
                .select()
                .single()

            if (studioError) {
                // Rollback: delete company and auth user
                await supabaseAdmin.from('companies').delete().eq('id', companyData.id)
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
                throw new Error(`Failed to create studio: ${studioError.message}`)
            }

            studioId = studioData.id
        }

        // 3. Create admin user record
        const { error: adminUserError } = await supabaseAdmin
            .from('admin_users')
            .insert({
                auth_user_id: authData.user.id,
                email: email,
                full_name: fullName,
                phone: phone || null,
                role: role,
                studio_id: studioId,
                onboarding_completed: role === 'super_admin',
                is_active: true,
            })

        if (adminUserError) {
            // Rollback: delete studio, company and auth user
            if (studioId) {
                await supabaseAdmin.from('studios').delete().eq('id', studioId)
            }
            if (companyId) {
                await supabaseAdmin.from('companies').delete().eq('id', companyId)
            }
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
            throw new Error(`Failed to create admin user: ${adminUserError.message}`)
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'User created successfully',
                user: {
                    id: authData.user.id,
                    email: email,
                    full_name: fullName,
                    role: role,
                    studio_id: studioId,
                }
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error in onboard-user function:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'An error occurred while onboarding user'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
