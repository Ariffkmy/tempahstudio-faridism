# Supabase Database Setup Guide

## Overview

This guide explains how to set up the database for Raya Studio admin system in Supabase.

### Key Features:
- **1 Admin = 1 Studio**: Each admin user belongs to exactly one studio
- **1 Studio = Multiple Admins**: One studio can have multiple admin users
- **Row Level Security (RLS)**: Admins can only access data for their own studio

---

## Database Schema

### Tables Structure

```
┌─────────────────┐       ┌─────────────────┐
│   companies     │       │    studios      │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────┤ company_id (FK) │
│ name            │       │ id (PK)         │
│ slug            │       │ name            │
│ timezone        │       │ location        │
│ opening_hours   │       │ opening_hours   │
└─────────────────┘       └────────┬────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
            ┌───────▼───────┐ ┌────▼────────┐ ┌──▼──────────┐
            │  admin_users  │ │studio_layouts│ │  bookings   │
            ├───────────────┤ ├─────────────┤ ├─────────────┤
            │ id (PK)       │ │ id (PK)     │ │ id (PK)     │
            │ auth_user_id  │ │ studio_id   │ │ studio_id   │
            │ studio_id(FK) │ │ name        │ │ layout_id   │
            │ email         │ │ price       │ │ customer_id │
            │ full_name     │ │ capacity    │ │ date        │
            │ role          │ └─────────────┘ │ status      │
            └───────────────┘                 └─────────────┘
```

---

## Setup Instructions

### Step 1: Go to Supabase SQL Editor

1. Log in to your Supabase project: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** in the left sidebar

### Step 2: Run the Migration Script

1. Open the file: `supabase/migrations/001_initial_schema.sql`
2. Copy all the content
3. Paste it into the SQL Editor
4. Click **Run** to execute

### Step 3: Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Configure email templates if needed

### Step 4: Configure Site URL (for password reset)

1. Go to **Authentication** → **URL Configuration**
2. Set your Site URL (e.g., `http://localhost:5173` for development)
3. Add redirect URLs for password reset

---

## Admin User Registration Flow

### How it works:

1. **User fills registration form** with:
   - Full name
   - Email
   - Password
   - Studio name (text input - creates new studio)
   - Studio location (optional)
   - Phone (optional)

2. **Backend process**:
   - Creates a **new studio** with the provided name and location
   - Creates user in Supabase Auth (`auth.users`)
   - Creates record in `admin_users` table linking auth user to the new studio
   - Admin is assigned default role: `admin`

3. **After registration**:
   - User receives email verification (if enabled)
   - User can log in and access only their studio's data

### Code Example:

```typescript
// Register a new admin with new studio
import { registerAdmin } from '@/services/adminAuth';

const result = await registerAdmin({
  email: 'admin@example.com',
  password: 'secure123',
  full_name: 'Ahmad Abdullah',
  phone: '+601129947089',
  studio_name: 'Studio Fotografi ABC',
  studio_location: 'Kuala Lumpur, Malaysia'
});

if (result.success) {
  console.log('Registration successful!', result.user);
} else {
  console.error('Registration failed:', result.error);
}
```

---

## Row Level Security (RLS) Policies

### Admin Users Policy
- Admins can only view other admins in the same studio
- Admins can only update their own profile

### Bookings Policy
- Admins can only view/manage bookings for their studio
- Public can create bookings (customer booking flow)

### Studios Policy
- Public can view active studios
- Admins can only update their own studio settings

---

## API Reference

### Authentication Service (`src/services/adminAuth.ts`)

| Function | Description |
|----------|-------------|
| `registerAdmin(data)` | Register new admin user |
| `loginAdmin(data)` | Login admin and get session |
| `logoutAdmin()` | Logout current admin |
| `getCurrentAdmin()` | Get current authenticated admin with studio |
| `getAvailableStudios()` | Get list of studios for registration |
| `requestPasswordReset(email)` | Send password reset email |
| `updatePassword(newPassword)` | Update password for logged-in user |

### Auth Context (`src/contexts/AuthContext.tsx`)

```typescript
const { 
  user,           // Current admin user
  studio,         // Admin's studio info
  isAuthenticated, // Auth status
  isLoading,      // Loading state
  login,          // Login function
  logout,         // Logout function
  register,       // Register function
} = useAuth();
```

---

## Default Seed Data

The migration includes sample data for testing:

### Company
- **Raya Studio KL** (slug: `raya-kl`)

### Studios
| ID | Name | Location |
|----|------|----------|
| `b0000000-...001` | Raya Studio KL Main | Kuala Lumpur City Centre |
| `b0000000-...002` | Raya Studio Bangsar | Bangsar, Kuala Lumpur |
| `b0000000-...003` | Raya Studio Cheras | Cheras, Kuala Lumpur |

### Studio Layouts (per studio)
- Studio Klasik (RM 150/hour)
- Studio Minimalist (RM 280/hour)
- Studio Moden (RM 200/hour)

---

## Troubleshooting

### "Studio not found" error during registration
- Make sure you've run the seed data in the migration
- Check if studios exist: `SELECT * FROM studios WHERE is_active = true;`

### "Email already registered" error
- User already exists in Supabase Auth
- They should use "Forgot Password" to reset

### Cannot access admin dashboard after login
- Check if `admin_users` record exists for the auth user
- Verify `is_active = true` in `admin_users` table

### RLS blocking queries
- Make sure user is authenticated before making queries
- Check RLS policies are correctly applied

---

## Security Notes

1. **Never expose Supabase service role key** in frontend code
2. **Always use RLS** to protect sensitive data
3. **Validate studio_id** on registration to prevent unauthorized access
4. **Email verification** is recommended for production

---

## Files Structure

```
src/
├── services/
│   └── adminAuth.ts       # Authentication service functions
├── contexts/
│   └── AuthContext.tsx    # React context for auth state
├── types/
│   └── database.ts        # TypeScript types for DB tables
├── pages/admin/
│   ├── AdminLogin.tsx     # Login page
│   ├── AdminRegister.tsx  # Registration page
│   └── AdminDashboard.tsx # Dashboard (protected)
└── components/admin/
    └── AdminSidebar.tsx   # Sidebar with user info & logout

supabase/
├── migrations/
│   └── 001_initial_schema.sql  # Database schema & seed data
└── README.md              # This file
```
