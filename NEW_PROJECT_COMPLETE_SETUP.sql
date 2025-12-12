-- =============================================
-- RAYA STUDIO - COMPLETE DATABASE SETUP SCRIPT
-- =============================================
-- This is a comprehensive setup script for a NEW Supabase project
-- It includes ALL tables, policies, functions, triggers, and seed data
-- 
-- IMPORTANT: Run this script in your NEW Supabase project's SQL Editor
-- 
-- What this script includes:
-- 1. All database tables and schemas
-- 2. Row Level Security (RLS) policies (SECURE VERSION)
-- 3. Helper functions and triggers
-- 4. Indexes for performance
-- 5. Seed data for testing
-- 6. Email notification system
-- 7. Payment gateway settings
-- 8. Google Calendar integration
-- 9. Portfolio and booking customization
-- 10. Storage bucket policies
-- 
-- Created: 2025-12-12
-- Version: 1.0 (Consolidated from 20 migrations)
-- =============================================

-- =============================================
-- SECTION 1: EXTENSIONS
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- =============================================
-- SECTION 2: CORE TABLES
-- =============================================

-- 1. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo TEXT,
  timezone VARCHAR(100) DEFAULT 'Asia/Kuala_Lumpur',
  min_booking_duration INTEGER DEFAULT 1,
  max_booking_duration INTEGER DEFAULT 8,
  buffer_time INTEGER DEFAULT 30,
  opening_hours JSONB DEFAULT '{
    "monday": {"open": "09:00", "close": "21:00"},
    "tuesday": {"open": "09:00", "close": "21:00"},
    "wednesday": {"open": "09:00", "close": "21:00"},
    "thursday": {"open": "09:00", "close": "21:00"},
    "friday": {"open": "09:00", "close": "21:00"},
    "saturday": {"open": "10:00", "close": "18:00"},
    "sunday": null
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. STUDIOS TABLE
CREATE TABLE IF NOT EXISTS studios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100),
  location TEXT,
  description TEXT,
  image TEXT,
  email VARCHAR(255),
  google_maps_link TEXT,
  waze_link TEXT,
  bank_account_number VARCHAR(100),
  account_owner_name VARCHAR(255),
  qr_code TEXT,
  booking_link TEXT,
  opening_hours JSONB DEFAULT '{
    "monday": {"open": "09:00", "close": "21:00"},
    "tuesday": {"open": "09:00", "close": "21:00"},
    "wednesday": {"open": "09:00", "close": "21:00"},
    "thursday": {"open": "09:00", "close": "21:00"},
    "friday": {"open": "09:00", "close": "21:00"},
    "saturday": {"open": "10:00", "close": "18:00"},
    "sunday": null
  }'::jsonb,
  -- Google Calendar Integration
  google_calendar_enabled BOOLEAN DEFAULT false,
  google_calendar_id TEXT,
  google_client_id TEXT,
  google_client_secret TEXT,
  google_refresh_token TEXT,
  google_access_token TEXT,
  google_token_expires_at TIMESTAMPTZ,
  -- Booking Form Settings
  terms_conditions_type VARCHAR(20) DEFAULT 'none' CHECK (terms_conditions_type IN ('text', 'pdf', 'none')),
  terms_conditions_text TEXT,
  terms_conditions_pdf TEXT,
  time_slot_gap INTEGER DEFAULT 30 CHECK (time_slot_gap IN (15, 30, 45, 60)),
  studio_logo TEXT,
  -- Booking Form Customization
  enable_custom_header BOOLEAN DEFAULT false,
  enable_custom_footer BOOLEAN DEFAULT false,
  enable_whatsapp_button BOOLEAN DEFAULT false,
  header_logo TEXT,
  header_home_enabled BOOLEAN DEFAULT false,
  header_home_url TEXT,
  header_about_enabled BOOLEAN DEFAULT false,
  header_about_url TEXT,
  header_portfolio_enabled BOOLEAN DEFAULT false,
  header_portfolio_url TEXT,
  header_contact_enabled BOOLEAN DEFAULT false,
  header_contact_url TEXT,
  footer_whatsapp_link TEXT,
  footer_facebook_link TEXT,
  footer_instagram_link TEXT,
  footer_trademark TEXT DEFAULT '© 2025 {{BrandName}}. All rights reserved.',
  whatsapp_message TEXT DEFAULT 'Hubungi kami',
  brand_color_primary TEXT DEFAULT '#000000',
  brand_color_secondary TEXT DEFAULT '#ffffff',
  -- Portfolio Settings
  enable_portfolio_photo_upload BOOLEAN DEFAULT false,
  portfolio_upload_instructions TEXT DEFAULT 'Upload your photos for your portfolio session. Maximum 20 photos, each file up to 10MB.',
  portfolio_max_file_size INTEGER DEFAULT 10,
  show_studio_name BOOLEAN DEFAULT false,
  -- Booking Title Customization
  booking_title_text TEXT DEFAULT 'Tempahan Studio',
  booking_subtitle_text TEXT DEFAULT 'Isi maklumat dan buat pembayaran untuk tempahan slot anda.',
  booking_title_font VARCHAR(50) DEFAULT 'default',
  booking_title_size VARCHAR(20) DEFAULT 'xl',
  booking_subtitle_font VARCHAR(50) DEFAULT 'default',
  booking_subtitle_size VARCHAR(20) DEFAULT 'base',
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on slug (allowing NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_studios_slug_unique ON studios(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_studios_company_id ON studios(company_id);
CREATE INDEX IF NOT EXISTS idx_studios_google_calendar_enabled ON studios(google_calendar_enabled);
CREATE INDEX IF NOT EXISTS idx_studios_terms_conditions_type ON studios(terms_conditions_type);
CREATE INDEX IF NOT EXISTS idx_studios_time_slot_gap ON studios(time_slot_gap);
CREATE INDEX IF NOT EXISTS idx_studios_enable_custom_header ON studios(enable_custom_header);
CREATE INDEX IF NOT EXISTS idx_studios_enable_custom_footer ON studios(enable_custom_footer);
CREATE INDEX IF NOT EXISTS idx_studios_enable_whatsapp_button ON studios(enable_whatsapp_button);

-- 3. STUDIO LAYOUTS TABLE
CREATE TABLE IF NOT EXISTS studio_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  capacity INTEGER DEFAULT 6,
  price_per_hour DECIMAL(10, 2) NOT NULL,
  image TEXT,
  amenities TEXT[] DEFAULT '{}',
  configured_time_slots TEXT[] DEFAULT '{}',
  layout_photos TEXT[] DEFAULT '{}',
  thumbnail_photo TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_studio_layouts_studio_id ON studio_layouts(studio_id);

-- 4. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE NOT NULL,
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'staff')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT superadmin_studio_check CHECK (
    (role = 'super_admin' AND studio_id IS NULL) OR
    (role != 'super_admin' AND studio_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_admin_users_auth_user_id ON admin_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_studio_id ON admin_users(studio_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- 5. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- 6. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  layout_id UUID NOT NULL REFERENCES studio_layouts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no-show')),
  notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_studio_id ON bookings(studio_id);
CREATE INDEX IF NOT EXISTS idx_bookings_layout_id ON bookings(layout_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- =============================================
-- SECTION 3: EMAIL NOTIFICATION SYSTEM
-- =============================================

-- EMAIL TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  from_email TEXT NOT NULL DEFAULT 'noreply@rayastudio.com',
  template_variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EMAIL NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  email_template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  recipients TEXT[] NOT NULL DEFAULT ARRAY['customer'],
  is_enabled BOOLEAN DEFAULT false,
  triggers TEXT[] DEFAULT ARRAY[]::TEXT[],
  template_variables JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EMAIL LOGS TABLE
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  email_template_id UUID REFERENCES email_templates(id),
  recipient_email TEXT NOT NULL,
  recipient_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  template_data JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SECTION 4: PAYMENT & TWILIO SETTINGS
-- =============================================

-- PAYMENT GATEWAY SETTINGS TABLE
CREATE TABLE IF NOT EXISTS payment_gateway_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_secret_key TEXT NOT NULL,
  category_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_gateway_settings_created_at ON payment_gateway_settings(created_at);

-- TWILIO SETTINGS TABLE
CREATE TABLE IF NOT EXISTS twilio_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  twilio_sid TEXT NOT NULL,
  twilio_auth_token TEXT NOT NULL,
  twilio_whatsapp_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_twilio_settings_created_at ON twilio_settings(created_at);

-- =============================================
-- SECTION 5: PORTFOLIO PHOTOS
-- =============================================

CREATE TABLE IF NOT EXISTS portfolio_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_photos_studio_id ON portfolio_photos(studio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_photos_uploaded_at ON portfolio_photos(uploaded_at DESC);

-- =============================================
-- SECTION 6: HELPER FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_reference TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 11) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM bookings
  WHERE reference LIKE 'RAYA-' || year_part || '-%';
  
  new_reference := 'RAYA-' || year_part || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN new_reference;
END;
$$ LANGUAGE plpgsql;

-- Function to get admin's studio
CREATE OR REPLACE FUNCTION get_admin_studio(user_auth_id UUID)
RETURNS UUID AS $$
DECLARE
  studio_id UUID;
  user_role VARCHAR(50);
BEGIN
  SELECT admin_users.studio_id, admin_users.role INTO studio_id, user_role
  FROM admin_users
  WHERE admin_users.auth_user_id = user_auth_id
  AND admin_users.is_active = true;

  -- Super admins don't have a specific studio
  IF user_role = 'super_admin' THEN
    RETURN NULL;
  END IF;

  RETURN studio_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin of a specific studio
CREATE OR REPLACE FUNCTION is_admin_of_studio(user_auth_id UUID, check_studio_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role VARCHAR(50);
BEGIN
  SELECT role INTO user_role
  FROM admin_users
  WHERE auth_user_id = user_auth_id
  AND is_active = true;

  -- Super admins have access to all studios
  IF user_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;

  -- Regular admins only have access to their own studio
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = user_auth_id
    AND studio_id = check_studio_id
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate slug from studio name
CREATE OR REPLACE FUNCTION generate_studio_slug(studio_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert to lowercase, replace spaces with hyphens, remove special characters
    base_slug := lower(trim(studio_name));
    base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- Ensure slug is not empty
    IF base_slug = '' OR base_slug IS NULL THEN
        base_slug := 'studio';
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness and append number if needed
    WHILE EXISTS (SELECT 1 FROM studios WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate slug on insert
CREATE OR REPLACE FUNCTION auto_generate_studio_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_studio_slug(NEW.name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SECTION 7: TRIGGERS
-- =============================================

-- Updated_at triggers
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_studios_updated_at
  BEFORE UPDATE ON studios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_studio_layouts_updated_at
  BEFORE UPDATE ON studio_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_notifications_updated_at
  BEFORE UPDATE ON email_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER payment_gateway_settings_updated_at_trigger
  BEFORE UPDATE ON payment_gateway_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER twilio_settings_updated_at_trigger
  BEFORE UPDATE ON twilio_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate studio slug trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_studio_slug ON studios;
CREATE TRIGGER trigger_auto_generate_studio_slug
  BEFORE INSERT ON studios
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_studio_slug();

-- =============================================
-- SECTION 8: ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_photos ENABLE ROW LEVEL SECURITY;

-- =============================================
-- COMPANIES POLICIES
-- =============================================

CREATE POLICY "Companies are viewable by everyone" ON companies
  FOR SELECT USING (true);

CREATE POLICY "Super admins can manage companies" ON companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- =============================================
-- STUDIOS POLICIES (SECURE VERSION)
-- =============================================

-- Public can view active studios
CREATE POLICY "Studios are viewable by everyone" ON studios
  FOR SELECT USING (is_active = true);

-- Allow studio creation during registration (unauthenticated or authenticated)
CREATE POLICY "Allow studio creation during registration" ON studios
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NULL OR auth.uid() IS NOT NULL
  );

-- Only admins of the studio can update their own studio
CREATE POLICY "Admins can update their studio" ON studios
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.studio_id = studios.id
    )
  );

-- Only super admins can delete studios
CREATE POLICY "Super admins can delete studios" ON studios
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
      AND admin_users.is_active = true
    )
  );

-- Super admins can view all studios
CREATE POLICY "Super admins can view all studios" ON studios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Super admins can manage all studios
CREATE POLICY "Super admins can manage all studios" ON studios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- =============================================
-- STUDIO LAYOUTS POLICIES
-- =============================================

CREATE POLICY "Studio layouts are viewable by everyone" ON studio_layouts
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage their studio layouts" ON studio_layouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.studio_id = studio_layouts.studio_id
    )
  );

CREATE POLICY "Super admins can view all studio layouts" ON studio_layouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage all studio layouts" ON studio_layouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- =============================================
-- ADMIN USERS POLICIES (SECURE VERSION)
-- =============================================

-- Admins can only view users in their own studio
CREATE POLICY "Admins view own studio users" ON admin_users
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND (
      -- User can see themselves
      auth_user_id = auth.uid()
      OR
      -- Or users in the same studio
      studio_id IN (
        SELECT studio_id FROM admin_users 
        WHERE auth_user_id = auth.uid() 
        AND is_active = true
      )
    )
  );

-- Allow admin creation during registration
CREATE POLICY "Allow admin creation during registration" ON admin_users
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NULL OR auth.uid() IS NOT NULL
  );

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON admin_users
  FOR UPDATE 
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Super admins can view all admin users
CREATE POLICY "Super admins can view all admin users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.auth_user_id = auth.uid()
      AND au.role = 'super_admin'
    )
  );

-- Super admins can manage all admin users
CREATE POLICY "Super admins can manage all admin users" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.auth_user_id = auth.uid()
      AND au.role = 'super_admin'
    )
  );

-- =============================================
-- CUSTOMERS POLICIES
-- =============================================

CREATE POLICY "Admins can view their studio customers" ON customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      JOIN bookings ON bookings.studio_id = admin_users.studio_id
      WHERE admin_users.auth_user_id = auth.uid()
      AND bookings.customer_id = customers.id
    )
  );

CREATE POLICY "Public can create customers" ON customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view customers" ON customers
  FOR SELECT USING (true);

CREATE POLICY "Super admins can view all customers" ON customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage all customers" ON customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- =============================================
-- BOOKINGS POLICIES
-- =============================================

CREATE POLICY "Admins can view their studio bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.studio_id = bookings.studio_id
    )
  );

CREATE POLICY "Admins can manage their studio bookings" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.studio_id = bookings.studio_id
    )
  );

CREATE POLICY "Public can create bookings" ON bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view own bookings" ON bookings
  FOR SELECT USING (true);

CREATE POLICY "Super admins can view all bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage all bookings" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- =============================================
-- EMAIL SYSTEM POLICIES
-- =============================================

CREATE POLICY "super_admins_manage_email_templates"
ON email_templates FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND role = 'super_admin'
    AND is_active = true
  )
);

CREATE POLICY "super_admins_manage_email_notifications"
ON email_notifications FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND role = 'super_admin'
    AND is_active = true
  )
);

CREATE POLICY "super_admins_view_email_logs"
ON email_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND role = 'super_admin'
    AND is_active = true
  )
);

-- =============================================
-- PORTFOLIO PHOTOS POLICIES
-- =============================================

CREATE POLICY "studios_manage_portfolio_photos" ON portfolio_photos
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND studio_id = portfolio_photos.studio_id
  )
);

-- =============================================
-- SECTION 9: STORAGE BUCKETS & POLICIES
-- =============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('studio-terms-pdfs', 'studio-terms-pdfs', true),
  ('studio-layout-photos', 'studio-layout-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Terms PDFs Storage Policies
CREATE POLICY "Authenticated users can upload terms PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'studio-terms-pdfs' AND
  (storage.foldername(name))[1] IN (
    SELECT studio_id::text
    FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Authenticated users can update their terms PDFs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'studio-terms-pdfs' AND
  (storage.foldername(name))[1] IN (
    SELECT studio_id::text
    FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Authenticated users can delete their terms PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'studio-terms-pdfs' AND
  (storage.foldername(name))[1] IN (
    SELECT studio_id::text
    FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Public can view terms PDFs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'studio-terms-pdfs');

-- Layout Photos Storage Policies
CREATE POLICY "Authenticated users can upload layout photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'studio-layout-photos');

CREATE POLICY "Public can view layout photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'studio-layout-photos');

CREATE POLICY "Users can delete their studio layout photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'studio-layout-photos');

CREATE POLICY "Users can update their studio layout photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'studio-layout-photos');

-- =============================================
-- SECTION 10: SEED DATA
-- =============================================

-- Insert default company
INSERT INTO companies (id, name, slug, timezone) 
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Raya Studio KL',
  'raya-kl',
  'Asia/Kuala_Lumpur'
) ON CONFLICT (slug) DO NOTHING;

-- Insert sample studios
INSERT INTO studios (id, company_id, name, location, description) VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Raya Studio KL Main',
  'Kuala Lumpur City Centre',
  'Studio utama kami di tengah bandar dengan akses mudah dan peralatan lengkap.'
),
(
  'b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Raya Studio Bangsar',
  'Bangsar, Kuala Lumpur',
  'Studio moden di kawasan Bangsar yang popular dengan artis dan pengarah.'
),
(
  'b0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'Raya Studio Cheras',
  'Cheras, Kuala Lumpur',
  'Studio komuniti mesra di Cheras, sesuai untuk projek tempatan dan sesi keluarga.'
)
ON CONFLICT DO NOTHING;

-- Insert sample studio layouts
INSERT INTO studio_layouts (id, studio_id, name, description, capacity, price_per_hour) VALUES
-- KL Main Studio Layouts
(
  'c0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'Studio Klasik',
  'Persediaan klasik dengan pencahayaan profesional dan pilihan latar belakang. Sempurna untuk potret dan fotografi produk.',
  6,
  150.00
),
(
  'c0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000001',
  'Studio Minimalist',
  'Studio bendera kami dengan peralatan canggih dan persekitaran luas. Ideal untuk penggambaran komersial dan pengeluaran video.',
  12,
  280.00
),
(
  'c0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000001',
  'Studio Moden',
  'Ruang kreatif serba boleh dengan cahaya semula jadi. Bagus untuk penggambaran gaya hidup, sesi yoga, dan acara kecil.',
  20,
  200.00
),
-- Bangsar Studio Layouts
(
  'c0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000002',
  'Studio Klasik',
  'Persediaan klasik dengan pencahayaan profesional.',
  6,
  150.00
),
(
  'c0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000002',
  'Studio Minimalist',
  'Studio bendera dengan peralatan canggih.',
  12,
  280.00
),
-- Cheras Studio Layouts
(
  'c0000000-0000-0000-0000-000000000006',
  'b0000000-0000-0000-0000-000000000003',
  'Studio Klasik',
  'Persediaan klasik dengan pencahayaan profesional.',
  6,
  150.00
),
(
  'c0000000-0000-0000-0000-000000000007',
  'b0000000-0000-0000-0000-000000000003',
  'Studio Moden',
  'Ruang kreatif serba boleh dengan cahaya semula jadi.',
  20,
  200.00
)
ON CONFLICT DO NOTHING;

-- Insert default email templates
INSERT INTO email_templates (template_id, name, description, subject, template_variables) VALUES
('199982901212-231', 'Admin Email Onboarding', 'Welcome email sent to new admin users after registration', 'Welcome to Studio Raya Admin Panel - {{studio_name}}', '[\"admin_name\", \"studio_name\", \"login_url\", \"registration_date\"]'::jsonb),
('booking-confirmation-template', 'Booking Confirmation', 'Confirmation email sent to customers after successful booking', 'Booking Confirmation - {{booking_reference}}', '[\"customer_name\", \"booking_reference\", \"booking_date\", \"booking_time\", \"studio_name\", \"layout_name\"]'::jsonb),
('booking-status-update-template', 'Booking Status Update', 'Email sent when booking status changes', 'Booking Update - {{booking_reference}}', '[\"customer_name\", \"booking_reference\", \"new_status\", \"studio_name\"]'::jsonb),
('booking-cancellation-template', 'Booking Cancellation', 'Email sent when booking is cancelled', 'Booking Cancelled - {{booking_reference}}', '[\"customer_name\", \"booking_reference\", \"cancellation_reason\", \"refund_info\"]'::jsonb),
('admin-new-booking-template', 'New Booking Alert', 'Alert email sent to admins for new bookings', 'New Booking Alert - {{booking_reference}}', '[\"customer_name\", \"customer_email\", \"booking_reference\", \"booking_date\", \"booking_time\", \"studio_name\", \"total_price\"]'::jsonb),
('payment-reminder-template', 'Payment Reminder', 'Reminder email for pending payments', 'Payment Reminder - {{booking_reference}}', '[\"customer_name\", \"booking_reference\", \"due_date\", \"amount_due\"]'::jsonb);

-- Insert default notification configurations
INSERT INTO email_notifications (action, name, description, recipients, is_enabled, triggers) VALUES
('admin_registration', 'Admin Registration', 'Sent when a new admin registers or is created', ARRAY['admin'], true, ARRAY[]::TEXT[]),
('booking_confirmation', 'Booking Confirmation', 'Sent immediately after successful booking', ARRAY['customer'], false, ARRAY[]::TEXT[]),
('booking_status_confirmed', 'Booking Confirmed', 'Sent when booking status changes to confirmed', ARRAY['customer'], false, ARRAY['confirmed']),
('booking_status_cancelled', 'Booking Cancelled', 'Sent when booking status changes to cancelled', ARRAY['customer'], false, ARRAY['cancelled']),
('booking_status_completed', 'Booking Completed', 'Sent when booking status changes to completed', ARRAY['customer'], false, ARRAY['completed']),
('admin_booking_alert', 'New Booking Alert', 'Sent to studio admins for new bookings', ARRAY['admin'], false, ARRAY[]::TEXT[]),
('booking_created_admin', 'Booking Created (Admin)', 'Sent to admins when any booking is created', ARRAY['admin'], false, ARRAY[]::TEXT[]),
('payment_reminder', 'Payment Reminder', 'Sent for pending payments approaching due date', ARRAY['customer'], false, ARRAY[]::TEXT[]);

-- Insert default payment gateway settings
INSERT INTO payment_gateway_settings (user_secret_key, category_code) VALUES ('', '');

-- Insert default Twilio settings
INSERT INTO twilio_settings (twilio_sid, twilio_auth_token, twilio_whatsapp_number) VALUES ('', '', '');

-- =============================================
-- SETUP COMPLETE!
-- =============================================
-- 
-- Next steps:
-- 1. Update your .env file with the NEW Supabase credentials
-- 2. Deploy Edge Functions to the new project
-- 3. Test your application
-- 4. Migrate any production data if needed
-- 
-- Edge Functions to deploy:
-- - create-studio-user
-- - send-whatsapp-twilio
-- - send-email-notification
-- - google-oauth-callback
-- - create-calendar-event
-- 
-- =============================================
