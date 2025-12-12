# 🚨 URGENT: Security Actions Required

## ⚠️ YOUR SUPABASE CREDENTIALS ARE COMPROMISED!

The old credentials were exposed in Git history and **MUST** be rotated immediately.

---

## 🔥 DO THIS RIGHT NOW (5 minutes)

### 1. Rotate Supabase Anon Key

**Go to:** https://supabase.com/dashboard/project/ierrbnbghexwlwgizvww/settings/api

**Steps:**
1. Click on "Settings" → "API"
2. Find "Project API keys" section
3. Click "Reset" next to the anon/public key
4. Copy the NEW anon key

### 2. Update Your .env File

Open `.env` in your project root and replace the old key:

```env
VITE_SUPABASE_URL=https://ierrbnbghexwlwgizvww.supabase.co
VITE_SUPABASE_ANON_KEY=<paste_your_new_key_here>
```

### 3. Restart Your Dev Server

```bash
# Press Ctrl+C to stop the current server
# Then restart:
npm run dev
```

### 4. Test Your Application

- Open http://localhost:5173
- Try logging in
- Try creating a booking
- Verify everything works

---

## ✅ What We Fixed

- ✅ Moved credentials from code to `.env` file
- ✅ Added `.env` to `.gitignore` (won't be committed)
- ✅ Created `.env.example` template
- ✅ Updated code to use environment variables
- ✅ Committed and pushed security fixes

---

## 📋 Quick Checklist

- [ ] Rotated Supabase anon key (DO THIS NOW!)
- [ ] Updated `.env` with new key
- [ ] Restarted dev server
- [ ] Tested application
- [ ] Verified login works
- [ ] Verified bookings work

---

## 🆘 If Something Breaks

**Error: "Missing Supabase environment variables"**
- Make sure `.env` file exists in project root
- Check that both variables are set
- Restart the dev server

**Error: "Invalid API key"**
- Double-check you copied the full anon key
- Make sure there are no extra spaces
- Verify you're using the anon key, not the service role key

**Still not working?**
- Check the console for errors
- Verify the Supabase URL is correct
- Try regenerating the key again

---

## 📞 Need Help?

See the full guide: `SECURITY_CREDENTIALS_MIGRATION.md`

---

**Status:** ⚠️ INCOMPLETE - Credentials need rotation!  
**Priority:** 🔴 CRITICAL - Do this before deploying to production!
