# 🔐 Rotate Supabase Anon Key - Step-by-Step Guide

## ⚠️ CRITICAL: Complete This NOW!

Your anon key was exposed in Git history AND your database has overly permissive RLS policies. This is a **CRITICAL SECURITY ISSUE**.

---

## 📋 Step-by-Step Instructions

### **Step 1: Open Supabase Dashboard** ✅

I've opened the Supabase API settings page for you in your browser.

**Manual URL (if needed):**
https://supabase.com/dashboard/project/ierrbnbghexwlwgizvww/settings/api

---

### **Step 2: Reset the Anon Key** 

1. **Look for the "Project API keys" section**
2. **Find the row labeled:** `anon` `public`
3. **Click the "Reset" or "Regenerate" button** next to the anon key
   - ⚠️ **DO NOT** reset the `service_role` key!
   - Only reset the `anon` / `public` key
4. **Confirm the reset** when prompted
5. **Copy the NEW anon key** that appears
   - It will start with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Click the copy icon to copy it to clipboard

---

### **Step 3: Update Your .env File**

1. **Open your `.env` file** in the project root
2. **Find the line:**
   ```env
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. **Replace the old key** with the NEW key you just copied:
   ```env
   VITE_SUPABASE_ANON_KEY=<paste_your_new_key_here>
   ```
4. **Save the file** (Ctrl+S)

---

### **Step 4: Restart Your Dev Server**

1. **Go to your terminal** running `npm run dev`
2. **Press `Ctrl+C`** to stop the server
3. **Wait for it to fully stop**
4. **Run:** `npm run dev` again
5. **Wait for the server to start**

---

### **Step 5: Test Your Application**

1. **Open:** http://localhost:5173
2. **Try to log in** to the admin panel
3. **Check if everything works:**
   - ✅ Login works
   - ✅ Dashboard loads
   - ✅ Bookings are visible
   - ✅ No console errors

---

## ✅ Verification Checklist

Mark each item as you complete it:

- [ ] Opened Supabase API settings page
- [ ] Reset the **anon** key (NOT service_role!)
- [ ] Copied the new anon key
- [ ] Updated `.env` file with new key
- [ ] Saved the `.env` file
- [ ] Stopped dev server (Ctrl+C)
- [ ] Restarted dev server (npm run dev)
- [ ] Tested login - works ✓
- [ ] Tested dashboard - works ✓
- [ ] No console errors ✓

---

## 🚨 Common Issues & Solutions

### **Error: "Missing Supabase environment variables"**
- Make sure `.env` file exists in project root
- Check that both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart the dev server

### **Error: "Invalid API key"**
- Double-check you copied the **full** anon key
- Make sure there are no extra spaces or line breaks
- Verify you're using the **anon** key, not the service_role key

### **Login doesn't work**
- Clear browser cache and cookies
- Try incognito/private browsing mode
- Check browser console for errors (F12)

### **Still having issues?**
- Verify the Supabase URL is correct: `https://ierrbnbghexwlwgizvww.supabase.co`
- Check if the old key is still in the `.env` file
- Make sure you saved the `.env` file after editing

---

## 🔒 What Happens After Rotation?

### **Immediate Effects:**
- ✅ Old anon key becomes **invalid immediately**
- ✅ Anyone with the old key can no longer access your database
- ✅ Your application will use the new key after restart

### **What's Protected:**
- ✅ No more unauthorized access via the old key
- ✅ API calls with old key will fail

### **What's NOT Fixed Yet:**
- ⚠️ Overly permissive RLS policies (we'll fix this next)
- ⚠️ Old key still in Git history (optional cleanup)

---

## 📝 Next Steps (After Rotation)

Once you've successfully rotated the key and verified everything works:

1. **Fix RLS Policies** - I'll help you create a migration to secure your database properly
2. **Update Production** - If you have a deployed version, update the env vars there too
3. **Clean Git History** - Optional but recommended to remove old keys from Git

---

## 🆘 Need Help?

If you encounter any issues during this process:
1. **Don't panic** - the old key is already compromised, so there's no harm in trying
2. **Take a screenshot** of any errors
3. **Check the browser console** (F12 → Console tab)
4. **Let me know** what went wrong and I'll help you fix it

---

**Status:** ⏳ IN PROGRESS - Complete all steps above  
**Priority:** 🔴 CRITICAL - Do this before continuing development!  
**Time Required:** ~5 minutes

---

**Last Updated:** 2025-12-12 12:25  
**Created by:** Antigravity AI Assistant
