#!/usr/bin/env node

// =============================================
// CREATE SUPER ADMIN UTILITY
// =============================================
// One-time script to create the first super admin user
// Run with: node scripts/create-super-admin.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables (you might need to adjust this based on your setup)
const envPath = join(__dirname, '..', '.env.local');
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables. Please check your .env.local file.');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSuperAdmin() {
  console.log('🚀 Creating Super Admin User...');
  console.log('================================');

  // Get user input (in a real script you'd use readline or commander)
  const email = process.argv[2] || 'superadmin@rayastudio.com';
  const password = process.argv[3] || 'superadmin123';
  const fullName = process.argv[4] || 'Super Administrator';
  const phone = process.argv[5] || '+60123456789';

  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Full Name: ${fullName}`);
  console.log(`Phone: ${phone}`);
  console.log('');

  try {
    // Check if super admin already exists
    console.log('🔍 Checking for existing super admins...');
    const { data: existingAdmins, error: checkError } = await supabase
      .from('admin_users')
      .select('email, role')
      .eq('role', 'super_admin')
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking existing super admins:', checkError.message);
      return;
    }

    if (existingAdmins && existingAdmins.length > 0) {
      console.log('✅ A super admin already exists! Skipping creation.');
      console.log(`Existing super admin: ${existingAdmins[0].email}`);
      return;
    }

    console.log('📝 Creating Supabase Auth user...');

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError.message);
      return;
    }

    if (!authData.user) {
      console.error('❌ Failed to create auth user');
      return;
    }

    console.log('📝 Creating super admin record...');

    // Create super admin record
    const superAdminData = {
      auth_user_id: authData.user.id,
      studio_id: null, // Super admins don't belong to a studio
      email,
      full_name: fullName,
      phone,
      role: 'super_admin',
      is_active: true,
    };

    const { data: superAdmin, error: adminError } = await supabase
      .from('admin_users')
      .insert(superAdminData)
      .select()
      .single();

    if (adminError) {
      console.error('❌ Error creating super admin record:', adminError.message);

      // Try to clean up the auth user (this might not work)
      console.log('⚠️  Auth user created but admin record failed. You may need to manually clean up.');

      return;
    }

    console.log('');
    console.log('✅ Super Admin Created Successfully!');
    console.log('====================================');
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Name: ${superAdmin.full_name}`);
    console.log(`Role: ${superAdmin.role}`);
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after your first login!');
    console.log('');
    console.log('🌐 You can now login at: /admin/login');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the script
createSuperAdmin().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
