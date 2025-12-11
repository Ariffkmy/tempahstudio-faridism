# Alternative Setup: Manual Policy Creation via Dashboard

If the SQL migration gives you permission errors, you can create the policies manually through the Supabase Dashboard.

## Step 1: Create the Storage Bucket (if not done yet)

1. Go to **Supabase Dashboard** > **Storage**
2. Click **"New bucket"**
3. Enter:
   - **Name**: `studio-terms-pdfs`
   - **Public bucket**: ✅ **CHECK THIS**
4. Click **"Create bucket"**

## Step 2: Set Up Policies Manually

### Option A: Try the Fixed Migration First

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy the contents of `supabase/migrations/015_add_terms_pdf_storage.sql`
3. Paste and click **"Run"**

If this works, you're done! If you still get permission errors, use Option B below.

### Option B: Create Policies via Dashboard UI

1. **Go to Storage Policies**
   - In Supabase Dashboard, click **"Storage"**
   - Click on the `studio-terms-pdfs` bucket
   - Click the **"Policies"** tab at the top

2. **Create Policy 1: Upload (INSERT)**
   - Click **"New Policy"**
   - Select **"For full customization"**
   - Fill in:
     - **Policy name**: `Authenticated users can upload terms PDFs`
     - **Allowed operation**: SELECT **INSERT**
     - **Target roles**: `authenticated`
     - **USING expression**: Leave empty
     - **WITH CHECK expression**:
       ```sql
       bucket_id = 'studio-terms-pdfs' AND
       (storage.foldername(name))[1] IN (
         SELECT studio_id::text
         FROM admin_users
         WHERE auth_user_id = auth.uid()
         AND is_active = true
       )
       ```
   - Click **"Review"** then **"Save policy"**

3. **Create Policy 2: Update (UPDATE)**
   - Click **"New Policy"** again
   - Select **"For full customization"**
   - Fill in:
     - **Policy name**: `Authenticated users can update their terms PDFs`
     - **Allowed operation**: SELECT **UPDATE**
     - **Target roles**: `authenticated`
     - **USING expression**:
       ```sql
       bucket_id = 'studio-terms-pdfs' AND
       (storage.foldername(name))[1] IN (
         SELECT studio_id::text
         FROM admin_users
         WHERE auth_user_id = auth.uid()
         AND is_active = true
       )
       ```
     - **WITH CHECK expression**: Same as USING
   - Click **"Review"** then **"Save policy"**

4. **Create Policy 3: Delete (DELETE)**
   - Click **"New Policy"** again
   - Select **"For full customization"**
   - Fill in:
     - **Policy name**: `Authenticated users can delete their terms PDFs`
     - **Allowed operation**: SELECT **DELETE**
     - **Target roles**: `authenticated`
     - **USING expression**:
       ```sql
       bucket_id = 'studio-terms-pdfs' AND
       (storage.foldername(name))[1] IN (
         SELECT studio_id::text
         FROM admin_users
         WHERE auth_user_id = auth.uid()
         AND is_active = true
       )
       ```
   - Click **"Review"** then **"Save policy"**

5. **Create Policy 4: Read (SELECT)**
   - Click **"New Policy"** again
   - Select **"For full customization"**
   - Fill in:
     - **Policy name**: `Public can view terms PDFs`
     - **Allowed operation**: SELECT **SELECT**
     - **Target roles**: `public`
     - **USING expression**:
       ```sql
       bucket_id = 'studio-terms-pdfs'
       ```
   - Click **"Review"** then **"Save policy"**

## Step 3: Verify Setup

1. Go to **Storage** > `studio-terms-pdfs` > **Policies**
2. You should see 4 policies listed:
   - ✅ Authenticated users can upload terms PDFs (INSERT)
   - ✅ Authenticated users can update their terms PDFs (UPDATE)
   - ✅ Authenticated users can delete their terms PDFs (DELETE)
   - ✅ Public can view terms PDFs (SELECT)

## Step 4: Test Upload

1. Log in to your admin panel
2. Go to **Settings** > **Booking Form** tab
3. Select **"Muat naik fail PDF"** in Terma dan Syarat section
4. Upload a test PDF
5. Click **"Simpan Tetapan"**

If successful, you should see:
- ✅ "PDF uploaded" success message
- ✅ A link to view the PDF
- ✅ The PDF displays in your booking form

## Troubleshooting

### Error: "Upload failed"
- Make sure the bucket is **Public**
- Verify all 4 policies are created
- Check that you're logged in as an admin

### Error: "Permission denied"
- Double-check the policy expressions (copy-paste exactly)
- Ensure your admin user has a `studio_id` in the `admin_users` table
- Verify the bucket name is exactly `studio-terms-pdfs`

### PDF not showing in booking form
- Check that you saved the settings after uploading
- Verify the PDF URL is saved in the database
- Try opening the PDF URL directly in a new tab

## Quick Test

To verify the bucket is working:
1. Go to **Storage** > `studio-terms-pdfs`
2. Try uploading a file manually through the dashboard
3. If you can upload and view it, the bucket is configured correctly
4. Then test through your admin panel
