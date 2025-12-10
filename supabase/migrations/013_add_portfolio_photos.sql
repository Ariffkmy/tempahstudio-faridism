-- =============================================
-- MIGRATION: Add Portfolio Photos Table
-- =============================================
-- Run this SQL in Supabase SQL Editor to create portfolio photos table

-- Create table for portfolio photos
CREATE TABLE portfolio_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_portfolio_photos_studio_id ON portfolio_photos(studio_id);
CREATE INDEX idx_portfolio_photos_uploaded_at ON portfolio_photos(uploaded_at DESC);

-- =============================================
-- ENABLE ROW LEVEL SECURITY & POLICIES
-- =============================================

-- Enable RLS on portfolio_photos table
ALTER TABLE portfolio_photos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow studios to manage their own portfolio photos
CREATE POLICY "studios_manage_portfolio_photos" ON portfolio_photos
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
    AND studio_id = portfolio_photos.studio_id
  )
);
