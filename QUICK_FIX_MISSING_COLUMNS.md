# Quick Fix: Missing Database Columns

## Error
You're getting this error because some columns are missing from your `studios` table:
- `enable_portfolio_photo_upload`
- `portfolio_upload_instructions`
- `portfolio_max_file_size`
- `show_studio_name`

## Solution

### Run This Migration NOW:

1. **Open Supabase Dashboard** > **SQL Editor**
2. **Copy the contents** of: `supabase/migrations/016_add_missing_portfolio_columns.sql`
3. **Paste and Run** the query
4. You should see: **"Success. No rows returned"**

### Then Try Saving Settings Again

After running the migration:
1. Go back to your Admin Settings page
2. Click **"Simpan Tetapan"** again
3. It should work now!

## What This Migration Does

Adds 4 missing columns to your `studios` table:
- ✅ `enable_portfolio_photo_upload` - Enable portfolio gallery feature
- ✅ `portfolio_upload_instructions` - Instructions for customers
- ✅ `portfolio_max_file_size` - Max file size in MB
- ✅ `show_studio_name` - Show studio name in booking form

These columns are safe to add and won't affect existing data.

## After Running Migration

Your settings should save successfully, including:
- ✅ Terms & Conditions (text or PDF)
- ✅ All booking form customizations
- ✅ Portfolio settings
- ✅ All other studio settings

The Terms & Conditions feature will work perfectly after this! 🚀
