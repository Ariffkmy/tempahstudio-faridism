-- =============================================
-- RAYA STUDIO DATABASE SCHEMA
-- =============================================
-- Run this SQL in Supabase SQL Editor
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. COMPANIES TABLE
-- =============================================
-- Main company/brand that owns multiple studios
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

-- =============================================
-- 2. STUDIOS TABLE
-- =============================================
-- Individual studio locations (belongs to a company)
CREATE TABLE IF NOT EXISTS studios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  location TEXT,
  description TEXT,
  image TEXT,
  opening_hours JSONB DEFAULT '{
    "monday": {"open": "09:00", "close": "21:00"},
    "tuesday": {"open": "09:00", "close": "21:00"},
    "wednesday": {"open": "09:00", "close": "21:00"},
    "thursday": {"open": "09:00", "close": "21:00"},
    "friday": {"open": "09:00", "close": "21:00"},
    "saturday": {"open": "10:00", "close": "18:00"},
    "sunday": null
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster company lookups
CREATE INDEX IF NOT EXISTS idx_studios_company_id ON studios(company_id);

-- =============================================
-- 3. STUDIO LAYOUTS TABLE
-- =============================================
-- Different room types/layouts within a studio
CREATE TABLE IF NOT EXISTS studio_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  capacity INTEGER DEFAULT 6,
  price_per_hour DECIMAL(10, 2) NOT NULL,
  image TEXT,
  amenities TEXT[] DEFAULT '{}',
  configured_time_slots TEXT[] DEFAULT '{}', -- Empty means all default slots available
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster studio lookups
CREATE INDEX IF NOT EXISTS idx_studio_layouts_studio_id ON studio_layouts(studio_id);

-- =============================================
-- 4. ADMIN USERS TABLE
-- =============================================
-- Admin users linked to Supabase Auth
-- Key: 1 admin belongs to 1 studio, but 1 studio can have multiple admins
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE NOT NULL, -- References auth.users(id)
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'staff')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_auth_user_id ON admin_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_studio_id ON admin_users(studio_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- =============================================
-- 5. CUSTOMERS TABLE
-- =============================================
-- Customers who make bookings
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- =============================================
-- 6. BOOKINGS TABLE
-- =============================================
-- Booking records
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
  duration INTEGER NOT NULL, -- in hours
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no-show')),
  notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_studio_id ON bookings(studio_id);
CREATE INDEX IF NOT EXISTS idx_bookings_layout_id ON bookings(layout_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- =============================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Companies Policies
-- =============================================
-- Public can view companies (for landing page)
CREATE POLICY "Companies are viewable by everyone" ON companies
  FOR SELECT USING (true);

-- Only super admins can manage companies
CREATE POLICY "Super admins can manage companies" ON companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- =============================================
-- Studios Policies
-- =============================================
-- Public can view active studios
CREATE POLICY "Studios are viewable by everyone" ON studios
  FOR SELECT USING (is_active = true);

-- Anyone can create studios (for registration)
CREATE POLICY "Anyone can create studios" ON studios
  FOR INSERT WITH CHECK (true);

-- Admins can view their own studio
CREATE POLICY "Admins can view their studio" ON studios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.studio_id = studios.id
    )
  );

-- Admins can update their own studio
CREATE POLICY "Admins can update their studio" ON studios
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.studio_id = studios.id
    )
  );

-- Admins can delete their own studio
CREATE POLICY "Admins can delete their studio" ON studios
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.studio_id = studios.id
    )
  );

-- =============================================
-- Studio Layouts Policies
-- =============================================
-- Public can view active layouts
CREATE POLICY "Studio layouts are viewable by everyone" ON studio_layouts
  FOR SELECT USING (is_active = true);

-- Admins can manage layouts for their studio
CREATE POLICY "Admins can manage their studio layouts" ON studio_layouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.studio_id = studio_layouts.studio_id
    )
  );

-- =============================================
-- Admin Users Policies
-- =============================================
-- Admins can view other admins in their studio
CREATE POLICY "Admins can view studio admins" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.auth_user_id = auth.uid()
      AND au.studio_id = admin_users.studio_id
    )
  );

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON admin_users
  FOR SELECT USING (auth_user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON admin_users
  FOR UPDATE USING (auth_user_id = auth.uid());

-- =============================================
-- Customers Policies
-- =============================================
-- Admins can view customers who booked at their studio
CREATE POLICY "Admins can view their studio customers" ON customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      JOIN bookings ON bookings.studio_id = admin_users.studio_id
      WHERE admin_users.auth_user_id = auth.uid()
      AND bookings.customer_id = customers.id
    )
  );

-- Anyone can create customer (for booking)
CREATE POLICY "Anyone can create customer for booking" ON customers
  FOR INSERT WITH CHECK (true);

-- =============================================
-- Bookings Policies
-- =============================================
-- Admins can only view bookings for their studio
CREATE POLICY "Admins can view their studio bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.studio_id = bookings.studio_id
    )
  );

-- Admins can manage bookings for their studio
CREATE POLICY "Admins can manage their studio bookings" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.studio_id = bookings.studio_id
    )
  );

-- Public can create bookings (for customers making reservations)
CREATE POLICY "Public can create bookings" ON bookings
  FOR INSERT WITH CHECK (true);

-- Public can view their own bookings by reference
CREATE POLICY "Public can view own bookings" ON bookings
  FOR SELECT USING (true);

-- =============================================
-- 8. FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
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

-- =============================================
-- 9. HELPER FUNCTIONS
-- =============================================

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
BEGIN
  SELECT admin_users.studio_id INTO studio_id
  FROM admin_users
  WHERE admin_users.auth_user_id = user_auth_id
  AND admin_users.is_active = true;
  
  RETURN studio_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin of a specific studio
CREATE OR REPLACE FUNCTION is_admin_of_studio(user_auth_id UUID, check_studio_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = user_auth_id
    AND studio_id = check_studio_id
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 10. SEED DATA (Optional - for testing)
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
