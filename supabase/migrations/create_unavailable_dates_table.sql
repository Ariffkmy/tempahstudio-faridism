-- Create unavailable_dates table to store dates when studio is not operational
CREATE TABLE IF NOT EXISTS unavailable_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE, -- NULL if single date, populated if date range
  is_whole_day BOOLEAN DEFAULT true,
  start_time TIME, -- NULL if whole day
  end_time TIME, -- NULL if whole day
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_unavailable_dates_studio_id ON unavailable_dates(studio_id);
CREATE INDEX IF NOT EXISTS idx_unavailable_dates_dates ON unavailable_dates(start_date, end_date);

-- Add comment
COMMENT ON TABLE unavailable_dates IS 'Stores dates and times when studio is not operational (holidays, closures, etc.)';
COMMENT ON COLUMN unavailable_dates.is_whole_day IS 'If true, studio is unavailable for the entire day. If false, only unavailable during start_time to end_time.';
COMMENT ON COLUMN unavailable_dates.end_date IS 'If NULL, this is a single date. If populated, this represents a date range from start_date to end_date.';
