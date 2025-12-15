-- Create packages table for managing subscription packages
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  period VARCHAR(50) NOT NULL DEFAULT 'tahun',
  is_popular BOOLEAN DEFAULT false,
  features JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_packages_active ON packages(is_active);
CREATE INDEX idx_packages_display_order ON packages(display_order);

-- Insert default packages
INSERT INTO packages (name, slug, price, period, is_popular, features, is_active, display_order) VALUES
(
  'Silver',
  'silver',
  300.00,
  'tahun',
  false,
  '[
    "✨ Tempahan atas talian (domain tempahstudio.com)",
    "📱 Responsive untuk semua peranti",
    "💳 Integrasi Google Calendar",
    "🔔 Notifikasi ke emel anda & pelanggan anda",
    "📧 Data analitik tentang tempahan, pengguna, dan banyak lagi",
    "🧾 Resit elektronik untuk pelanggan anda",
    "🧾 1 akaun admin user",
    "🎨 Disenaraikan dalam website caristudioraya.vercel.app"
  ]'::jsonb,
  true,
  1
),
(
  'Gold',
  'gold',
  599.00,
  'tahun',
  true,
  '[
    "🎯 Semua dalam Silver",
    "📊 Whatsapp blast untuk menghantar link gambar / maklumat order",
    "🗓️ Tambahan admin user (2 akaun/studio)",
    "🗓️ Customize Booking Form"
  ]'::jsonb,
  true,
  2
),
(
  'Platinum',
  'platinum',
  1199.00,
  'tahun',
  false,
  '[
    "🏢 Semua dalam Gold",
    "📈 Custom domain (nama studio anda di link booking)",
    "⚡ Payment Gateway",
    "👑 Tambahan admin user (4 akaun/studio)",
    "🚀 Pembangunan ciri khas"
  ]'::jsonb,
  true,
  3
);

-- Add RLS policies
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active packages
CREATE POLICY "Allow public read access to active packages"
  ON packages
  FOR SELECT
  USING (is_active = true);

-- Allow super admins to manage packages
CREATE POLICY "Allow super admins to manage packages"
  ON packages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION update_packages_updated_at();
