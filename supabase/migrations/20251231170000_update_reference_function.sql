-- Drop the old version first to avoid ambiguity
DROP FUNCTION IF EXISTS generate_booking_reference();

-- Update booking reference function to support different prefixes
-- Default prefix is 'RAYA' for backward compatibility
CREATE OR REPLACE FUNCTION generate_booking_reference(p_prefix TEXT DEFAULT 'RAYA')
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_reference TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Find the highest sequence number for the given prefix and year
  -- Pattern: PREFIX-YYYY-NNN
  SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM (LENGTH(p_prefix) + 7)) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM bookings
  WHERE reference LIKE p_prefix || '-' || year_part || '-%';
  
  new_reference := p_prefix || '-' || year_part || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN new_reference;
END;
$$ LANGUAGE plpgsql;

-- Comment for clarity
COMMENT ON FUNCTION generate_booking_reference(TEXT) IS 'Generates a booking reference with a custom prefix (default: RAYA) and current year.';
