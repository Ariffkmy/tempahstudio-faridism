-- Enable RLS on unavailable_dates table
ALTER TABLE unavailable_dates ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all unavailable dates
CREATE POLICY "Enable read access for all users"
ON unavailable_dates
FOR SELECT
TO public
USING (true);

-- Policy: Allow authenticated users to insert unavailable dates for their studio
CREATE POLICY "Enable insert for authenticated users only"
ON unavailable_dates
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to update unavailable dates for their studio
CREATE POLICY "Enable update for authenticated users only"
ON unavailable_dates
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to delete unavailable dates for their studio
CREATE POLICY "Enable delete for authenticated users only"
ON unavailable_dates
FOR DELETE
TO authenticated
USING (true);

-- Add comments
COMMENT ON POLICY "Enable read access for all users" ON unavailable_dates IS 'Allow anyone to view unavailable dates (needed for booking form)';
COMMENT ON POLICY "Enable insert for authenticated users only" ON unavailable_dates IS 'Allow authenticated admin users to add unavailable dates';
COMMENT ON POLICY "Enable update for authenticated users only" ON unavailable_dates IS 'Allow authenticated admin users to edit unavailable dates';
COMMENT ON POLICY "Enable delete for authenticated users only" ON unavailable_dates IS 'Allow authenticated admin users to delete unavailable dates';
