# Database Migration Instructions

## Migration: Add Navigation Content Fields

### What This Migration Does
Adds 5 new columns to the `studios` table to support navigation popup content:
- `header_home_text` - Text for Home navigation popup
- `header_about_text` - Text for About navigation popup  
- `header_contact_address` - Address for Contact popup
- `header_contact_phone` - Phone number for Contact popup
- `header_contact_email` - Email for Contact popup

### How to Apply

#### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/add_navigation_content_fields.sql`
5. Click **Run** to execute the migration

#### Option 2: Using Supabase CLI
```bash
# Make sure you're in the project root directory
cd c:\Users\AriffHakimiChik\rayastudio

# Apply the migration
supabase db push
```

### Verification
After running the migration, verify the columns were added:

```sql
-- Run this query in Supabase SQL Editor
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'studios' 
AND column_name IN (
  'header_home_text',
  'header_about_text', 
  'header_contact_address',
  'header_contact_phone',
  'header_contact_email'
);
```

You should see all 5 columns listed with `TEXT` data type and empty string defaults.

### Rollback (if needed)
If you need to remove these columns:

```sql
ALTER TABLE studios DROP COLUMN IF EXISTS header_home_text;
ALTER TABLE studios DROP COLUMN IF EXISTS header_about_text;
ALTER TABLE studios DROP COLUMN IF EXISTS header_contact_address;
ALTER TABLE studios DROP COLUMN IF EXISTS header_contact_phone;
ALTER TABLE studios DROP COLUMN IF EXISTS header_contact_email;
```

### Notes
- All columns have default empty strings, so existing studios won't be affected
- The migration is safe to run multiple times (uses `IF NOT EXISTS`)
- No data will be lost when applying this migration
