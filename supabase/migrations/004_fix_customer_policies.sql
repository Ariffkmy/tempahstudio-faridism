-- =============================================
-- FIX CUSTOMER POLICIES FOR PUBLIC BOOKING
-- =============================================
-- Allow anonymous users to create customers for booking
-- =============================================

-- Allow public to create customers (for anonymous booking)
-- This policy allows anyone to insert customers
CREATE POLICY "Public can create customers" ON customers
  FOR INSERT WITH CHECK (true);

-- Allow public to view customers (for booking confirmations)
-- This allows viewing customer data for confirmations
CREATE POLICY "Public can view customers" ON customers
  FOR SELECT USING (true);

-- =============================================
-- DONE! Public booking should now work.
-- =============================================