-- Create addon_packages table
-- This allows studios to define multiple add-on packages for bookings

CREATE TABLE IF NOT EXISTS addon_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster studio lookups
CREATE INDEX IF NOT EXISTS idx_addon_packages_studio_id ON addon_packages(studio_id);

-- Add trigger for updated_at
CREATE TRIGGER update_addon_packages_updated_at
  BEFORE UPDATE ON addon_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE addon_packages ENABLE ROW LEVEL SECURITY;

-- Admins can view their studio's add-on packages
CREATE POLICY "Admins can view their studio addon packages" ON addon_packages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.studio_id = addon_packages.studio_id
    )
  );

-- Admins can manage their studio's add-on packages
CREATE POLICY "Admins can manage their studio addon packages" ON addon_packages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.studio_id = addon_packages.studio_id
    )
  );

-- Public can view active add-on packages (for booking page)
CREATE POLICY "Public can view active addon packages" ON addon_packages
  FOR SELECT USING (is_active = true);

-- Add comment for documentation
COMMENT ON TABLE addon_packages IS 'Add-on packages that can be selected during booking';
COMMENT ON COLUMN addon_packages.price IS 'Additional price for this add-on package';
