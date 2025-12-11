# Terms & Conditions Feature Implementation

## Overview
This document summarizes the implementation of the dynamic Terms & Conditions (Terma & Syarat) section in the booking form, which can be configured through the Admin Settings page.

## What Was Implemented

### 1. **New Component: TermsAndConditions**
- **Location**: `src/components/booking/TermsAndConditions.tsx`
- **Features**:
  - Displays Terms & Conditions based on admin configuration
  - Supports three modes:
    - `none`: No T&C displayed
    - `text`: Displays text content in a formatted box
    - `pdf`: Displays PDF inline with iframe viewer and "Open in new tab" link
  - Responsive design with proper styling

### 2. **Updated Booking Form**
- **Location**: `src/pages/BrandBooking.tsx`
- **Changes**:
  - Added Terms & Conditions section **above** the Payment Selection (Kaedah Pembayaran)
  - Loads T&C configuration from studio settings
  - Dynamically renders based on configuration type

### 3. **Admin Settings Enhancement**
- **Location**: `src/pages/admin/AdminSettings.tsx`
- **Features**:
  - PDF file upload with progress tracking
  - Real-time upload status with loading indicator
  - View uploaded PDF link with external link icon
  - Proper error handling and user feedback via toast notifications
  - File size validation (max 5MB for PDFs)

### 4. **File Upload Service**
- **Location**: `src/services/fileUploadService.ts`
- **New Functions**:
  - `validatePdfFile()`: Validates PDF files before upload
  - `uploadTermsPdf()`: Uploads PDF to Supabase storage
- **Features**:
  - File type validation (only PDF)
  - File size validation (max 5MB)
  - Unique filename generation with studio ID and timestamp
  - Public URL generation for uploaded PDFs

### 5. **Database Migration**
- **Location**: `supabase/migrations/015_add_terms_pdf_storage.sql`
- **Features**:
  - Creates `studio-terms-pdfs` storage bucket
  - Sets up RLS policies:
    - Authenticated users can upload/update/delete their studio's PDFs
    - Public read access for all PDFs
  - Proper folder structure by studio ID

### 6. **Studio Settings Service Update**
- **Location**: `src/services/studioSettings.ts`
- **Changes**:
  - Added T&C fields to save operation:
    - `terms_conditions_type`
    - `terms_conditions_text`
    - `terms_conditions_pdf`
  - Loads T&C configuration from database
  - Saves T&C configuration to database

## Database Fields (Already Exist)

The following fields in the `studios` table are used:
- `terms_conditions_type`: VARCHAR(20) - Options: 'none', 'text', 'pdf'
- `terms_conditions_text`: TEXT - Stores text content
- `terms_conditions_pdf`: TEXT - Stores PDF URL

## How It Works

### For Admins:
1. Navigate to **Admin Settings** > **Booking Form** tab
2. Scroll to **Terma dan Syarat** section
3. Choose one of three options:
   - **Tiada terma dan syarat**: No T&C will be shown
   - **Taipkan teks terma dan syarat**: Enter text content
   - **Muat naik fail PDF**: Upload a PDF file
4. Click **Simpan Tetapan** to save

### For Customers (Booking Form):
1. When filling out the booking form, they will see:
   - **If text**: A formatted text box with the T&C content
   - **If PDF**: An embedded PDF viewer with option to open in new tab
   - **If none**: No T&C section appears
2. The T&C section appears **above** the payment selection

## Next Steps Required

### 1. **Run Database Migration**
You need to run the migration to create the storage bucket:

```bash
# If using Supabase CLI
supabase db push

# Or manually execute the SQL in Supabase Dashboard
# Navigate to SQL Editor and run: supabase/migrations/015_add_terms_pdf_storage.sql
```

### 2. **Create Storage Bucket (Alternative)**
If the migration doesn't work, manually create the bucket in Supabase Dashboard:
1. Go to **Storage** in Supabase Dashboard
2. Create new bucket: `studio-terms-pdfs`
3. Make it **public**
4. Set up the RLS policies as defined in the migration file

### 3. **Test the Feature**
1. Upload a PDF in Admin Settings
2. Save the settings
3. Visit the booking form
4. Verify the PDF displays correctly

## File Structure
```
src/
├── components/
│   └── booking/
│       └── TermsAndConditions.tsx (NEW)
├── pages/
│   ├── admin/
│   │   └── AdminSettings.tsx (UPDATED)
│   └── BrandBooking.tsx (UPDATED)
└── services/
    ├── fileUploadService.ts (UPDATED)
    └── studioSettings.ts (UPDATED)

supabase/
└── migrations/
    └── 015_add_terms_pdf_storage.sql (NEW)
```

## Notes
- PDF files are limited to 5MB
- Only PDF file type is accepted
- PDFs are stored in Supabase Storage with public read access
- Each studio's PDFs are organized in separate folders by studio ID
- The iframe viewer works for most modern browsers
- Users can always open the PDF in a new tab if the inline viewer has issues
