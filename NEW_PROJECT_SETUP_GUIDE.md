# 🚀 New Supabase Project Setup Guide

## ✅ Complete Migration to New Project with Fresh Keys

This guide will help you set up a brand new Supabase project with all your database schema, policies, and Edge Functions.

---

## 📋 **Prerequisites**

- [ ] Supabase account
- [ ] Access to create new projects
- [ ] Supabase CLI installed (optional, for Edge Functions)
- [ ] Git repository access

---

## 🎯 **Step 1: Create New Supabase Project** (5 minutes)

### 1.1 Create the Project

1. Go to: https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: `rayastudio-production` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Select your plan
4. Click **"Create new project"**
5. Wait ~2 minutes for project initialization

### 1.2 Save Your New Credentials

Once the project is ready:

1. Go to **Settings** → **API**
2. Copy and save these values:
   ```
   Project URL: https://[your-project-ref].supabase.co
   anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (keep this secret!)
   ```

---

## 🗄️ **Step 2: Run Database Setup Script** (5 minutes)

### 2.1 Open SQL Editor

1. In your new Supabase project, go to **SQL Editor**
2. Click **"New Query"**

### 2.2 Run the Complete Setup Script

1. Open the file: `NEW_PROJECT_COMPLETE_SETUP.sql`
2. Copy **ALL** the content (Ctrl+A, Ctrl+C)
3. Paste into the SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)
5. Wait for completion (~30 seconds)
6. You should see: **"Success. No rows returned"**

### 2.3 Verify Database Setup

Run this query to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these tables:
- ✅ admin_users
- ✅ bookings
- ✅ companies
- ✅ customers
- ✅ email_logs
- ✅ email_notifications
- ✅ email_templates
- ✅ payment_gateway_settings
- ✅ portfolio_photos
- ✅ studio_layouts
- ✅ studios
- ✅ twilio_settings

---

## 🔧 **Step 3: Update Your Local Environment** (2 minutes)

### 3.1 Update .env File

1. Open your `.env` file in the project root
2. Replace with your NEW credentials:

```env
VITE_SUPABASE_URL=https://[your-new-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[your-new-anon-key]
```

3. Save the file (Ctrl+S)

### 3.2 Restart Development Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## ⚡ **Step 4: Deploy Edge Functions** (10 minutes)

You have 5 Edge Functions to deploy:

### 4.1 Install Supabase CLI (if not installed)

```bash
# Windows (PowerShell)
scoop install supabase

# Or download from: https://github.com/supabase/cli/releases
```

### 4.2 Login to Supabase CLI

```bash
supabase login
```

### 4.3 Link to Your New Project

```bash
supabase link --project-ref [your-new-project-ref]
```

### 4.4 Deploy Each Edge Function

```bash
# Deploy all functions at once
supabase functions deploy create-studio-user
supabase functions deploy send-whatsapp-twilio
supabase functions deploy send-email-notification
supabase functions deploy google-oauth-callback
supabase functions deploy create-calendar-event
```

### 4.5 Verify Deployment

1. Go to **Edge Functions** in Supabase Dashboard
2. You should see all 5 functions listed
3. Each should show status: **"Deployed"**

---

## 🔐 **Step 5: Configure Edge Function Secrets** (5 minutes)

Your Edge Functions need environment variables. Set them in Supabase Dashboard:

### 5.1 Go to Edge Functions Settings

1. In Supabase Dashboard, go to **Edge Functions**
2. Click **"Manage secrets"** or **"Environment variables"**

### 5.2 Add Required Secrets

Add these secrets (if you're using these features):

```bash
# Twilio (for WhatsApp notifications)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# SendGrid (for email notifications)
SENDGRID_API_KEY=your_sendgrid_api_key

# Google OAuth (for calendar integration)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://[your-project-ref].supabase.co/functions/v1/google-oauth-callback
```

**Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically provided by Supabase.

---

## 🧪 **Step 6: Test Your Application** (10 minutes)

### 6.1 Test Admin Registration

1. Open your app: http://localhost:5173
2. Go to admin registration page
3. Try creating a new admin account
4. Verify you receive confirmation

### 6.2 Test Admin Login

1. Go to admin login page
2. Login with the account you just created
3. Verify you can access the dashboard

### 6.3 Test Booking Form

1. Go to a studio booking page
2. Try creating a test booking
3. Verify booking appears in admin dashboard

### 6.4 Check Database

In Supabase Dashboard:
1. Go to **Table Editor**
2. Check `admin_users` table - your account should be there
3. Check `bookings` table - test booking should be there

---

## 📊 **Step 7: Migrate Production Data** (Optional)

If you have existing production data to migrate:

### 7.1 Export from Old Project

1. Go to your OLD Supabase project
2. Go to **Database** → **Backups** or use SQL:

```sql
-- Export bookings
COPY (SELECT * FROM bookings) TO STDOUT WITH CSV HEADER;

-- Export customers
COPY (SELECT * FROM customers) TO STDOUT WITH CSV HEADER;

-- Repeat for other tables as needed
```

### 7.2 Import to New Project

1. In NEW project, go to **SQL Editor**
2. Use `COPY` command or Table Editor to import data

---

## 🔒 **Step 8: Update Production Deployment** (If applicable)

If you have a deployed version (Vercel, Netlify, etc.):

### For Vercel:

```bash
vercel env add VITE_SUPABASE_URL production
# Paste your new URL

vercel env add VITE_SUPABASE_ANON_KEY production
# Paste your new anon key

# Redeploy
vercel --prod
```

### For Netlify:

1. Go to Site Settings → Environment Variables
2. Update `VITE_SUPABASE_URL`
3. Update `VITE_SUPABASE_ANON_KEY`
4. Trigger new deployment

---

## ✅ **Step 9: Verification Checklist**

Mark each item as you complete it:

- [ ] New Supabase project created
- [ ] Database setup script executed successfully
- [ ] All tables visible in Table Editor
- [ ] Local `.env` file updated with new credentials
- [ ] Dev server restarted and running
- [ ] Supabase CLI installed and logged in
- [ ] All 5 Edge Functions deployed
- [ ] Edge Function secrets configured
- [ ] Admin registration works
- [ ] Admin login works
- [ ] Booking creation works
- [ ] Data appears in database
- [ ] Production deployment updated (if applicable)
- [ ] Old project can be deleted (after verification)

---

## 🗑️ **Step 10: Clean Up Old Project** (After verification)

**IMPORTANT: Only do this after verifying everything works!**

1. Wait 24-48 hours to ensure everything is stable
2. Export any remaining data you need
3. Go to old Supabase project
4. Settings → General → Delete Project
5. Type project name to confirm
6. Delete the project

---

## 📝 **Edge Functions Reference**

Your Edge Functions and their purposes:

| Function | Purpose | Used For |
|----------|---------|----------|
| `create-studio-user` | Create admin users without email verification | Admin user management |
| `send-whatsapp-twilio` | Send WhatsApp notifications via Twilio | Booking notifications |
| `send-email-notification` | Send email notifications via SendGrid | Email alerts |
| `google-oauth-callback` | Handle Google OAuth for calendar | Calendar integration |
| `create-calendar-event` | Create events in Google Calendar | Booking sync |

---

## 🆘 **Troubleshooting**

### Database Setup Failed

**Error: "relation already exists"**
- Some tables already exist
- Safe to ignore if you're re-running the script

**Error: "permission denied"**
- Make sure you're running in SQL Editor as project owner
- Check you're in the correct project

### Edge Functions Won't Deploy

**Error: "not logged in"**
```bash
supabase login
```

**Error: "project not linked"**
```bash
supabase link --project-ref [your-project-ref]
```

### Application Not Working

**Error: "Missing Supabase environment variables"**
- Check `.env` file exists
- Verify both variables are set
- Restart dev server

**Error: "Invalid API key"**
- Double-check you copied the full anon key
- No extra spaces or line breaks
- Using anon key, not service_role key

---

## 📞 **Need Help?**

If you encounter issues:

1. Check the browser console (F12) for errors
2. Check Supabase Dashboard → Logs for API errors
3. Verify RLS policies are working correctly
4. Test with a fresh incognito window

---

## 🎉 **Success!**

Once all checklist items are complete, you have:

✅ A brand new Supabase project with fresh, secure keys  
✅ All database tables, policies, and functions set up  
✅ Edge Functions deployed and configured  
✅ Your application running on the new infrastructure  
✅ Eliminated the security risk from exposed keys  

---

**Status:** 📋 Ready to Execute  
**Estimated Time:** 30-45 minutes total  
**Difficulty:** ⭐⭐⭐ Intermediate  

**Last Updated:** 2025-12-12  
**Created by:** Antigravity AI Assistant
