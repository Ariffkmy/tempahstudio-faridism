-- =============================================
-- CREATE STUDIO STAFF TABLE
-- =============================================
-- This table stores staff members (photographers and editors) for each studio

CREATE TABLE IF NOT EXISTS studio_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Photographer', 'Editor')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster studio lookups
CREATE INDEX IF NOT EXISTS idx_studio_staff_studio_id ON studio_staff(studio_id);
CREATE INDEX IF NOT EXISTS idx_studio_staff_role ON studio_staff(role);
CREATE INDEX IF NOT EXISTS idx_studio_staff_is_active ON studio_staff(is_active);

-- Enable RLS
ALTER TABLE studio_staff ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Admins can view staff for their studio
CREATE POLICY "Admins can view their studio staff" ON studio_staff
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.studio_id = studio_staff.studio_id
    )
  );

-- Admins can insert staff for their studio
CREATE POLICY "Admins can create their studio staff" ON studio_staff
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.studio_id = studio_staff.studio_id
    )
  );

-- Admins can update staff for their studio
CREATE POLICY "Admins can update their studio staff" ON studio_staff
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.studio_id = studio_staff.studio_id
    )
  );

-- Admins can delete staff for their studio
CREATE POLICY "Admins can delete their studio staff" ON studio_staff
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.studio_id = studio_staff.studio_id
    )
  );

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger for updated_at
CREATE TRIGGER update_studio_staff_updated_at
  BEFORE UPDATE ON studio_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
