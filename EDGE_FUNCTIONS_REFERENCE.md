# 📦 Edge Functions Deployment Quick Reference

## 🚀 Quick Deploy Commands

```bash
# Login to Supabase
supabase login

# Link to your new project
supabase link --project-ref [YOUR_PROJECT_REF]

# Deploy all functions
supabase functions deploy create-studio-user
supabase functions deploy send-whatsapp-twilio
supabase functions deploy send-email-notification
supabase functions deploy google-oauth-callback
supabase functions deploy create-calendar-event
```

---

## 📁 Edge Functions in Your Project

### Location
```
rayastudio/
└── supabase/
    └── functions/
        ├── create-studio-user/
        │   └── index.ts
        ├── send-whatsapp-twilio/
        │   └── index.ts
        ├── send-email-notification/
        │   └── index.ts
        ├── google-oauth-callback/
        │   └── index.ts
        └── create-calendar-event/
            └── index.ts
```

---

## 🔑 Required Environment Variables

Set these in Supabase Dashboard → Edge Functions → Manage Secrets:

### Auto-Provided by Supabase:
- ✅ `SUPABASE_URL` - Automatically set
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Automatically set
- ✅ `SUPABASE_ANON_KEY` - Automatically set

### You Need to Add:

#### For Twilio/WhatsApp (send-whatsapp-twilio):
```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

#### For SendGrid/Email (send-email-notification):
```bash
SENDGRID_API_KEY=SG.your_sendgrid_api_key
```

#### For Google Calendar (google-oauth-callback, create-calendar-event):
```bash
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://[your-project-ref].supabase.co/functions/v1/google-oauth-callback
```

---

## 🧪 Testing Edge Functions

### Test create-studio-user:
```bash
curl -X POST https://[your-project-ref].supabase.co/functions/v1/create-studio-user \
  -H "Authorization: Bearer [your-anon-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "full_name": "Test User",
    "studio_id": "[studio-uuid]",
    "requesting_user_id": "[admin-uuid]"
  }'
```

### Test send-whatsapp-twilio:
```bash
curl -X POST https://[your-project-ref].supabase.co/functions/v1/send-whatsapp-twilio \
  -H "Authorization: Bearer [your-anon-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+60123456789",
    "message": "Test message"
  }'
```

---

## 🔍 Viewing Function Logs

### In Supabase Dashboard:
1. Go to **Edge Functions**
2. Click on a function name
3. Click **"Logs"** tab
4. View real-time logs

### Using CLI:
```bash
supabase functions logs create-studio-user
```

---

## 🛠️ Troubleshooting

### Function deployment fails:
```bash
# Check if logged in
supabase status

# Re-login if needed
supabase login

# Re-link project
supabase link --project-ref [YOUR_PROJECT_REF]
```

### Function returns 500 error:
1. Check function logs in Dashboard
2. Verify environment variables are set
3. Check SUPABASE_SERVICE_ROLE_KEY is available

### CORS errors:
- Edge Functions automatically handle CORS
- Check if OPTIONS method is handled in function code

---

## 📋 Deployment Checklist

- [ ] Supabase CLI installed
- [ ] Logged in to Supabase CLI
- [ ] Project linked
- [ ] All 5 functions deployed
- [ ] Environment variables configured
- [ ] Functions tested and working
- [ ] Logs checked for errors

---

**Quick Tip:** You can deploy all functions at once by running the deploy commands in sequence, or create a script to automate it!
