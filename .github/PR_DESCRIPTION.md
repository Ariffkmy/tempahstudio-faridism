# 📸 Add About Photo Upload to Booking Form Header

## 📋 Summary
This PR adds the ability to upload and display a photo in the About section of the booking form header navigation. Studio admins can now upload a photo that will be displayed alongside the About text in the popup dialog, creating a more engaging and visual experience for customers.

## ✨ Features Added

### 1. **About Photo Upload in Admin Settings**
- ✅ Photo upload field in Admin Settings > Booking Form > Penyesuaian Borang Tempahan > About section
- ✅ Compact photo preview (320px × 192px max) with centered display
- ✅ Delete button positioned in top-right corner (matching portfolio photo style)
- ✅ Smart label showing "Upload new to replace" when photo exists
- ✅ Loading indicator during upload
- ✅ Error handling for failed uploads

### 2. **About Photo Display in Booking Form**
- ✅ Photo displayed in About popup dialog above the text
- ✅ Responsive sizing (max 40vh height) to prevent scrolling
- ✅ Maintains aspect ratio with `object-contain`
- ✅ Centered presentation with subtle background
- ✅ Graceful error handling if image fails to load

### 3. **Dialog Improvements**
- ✅ All header dialogs (Home, About, Contact) now have consistent styling:
  - Maximum height: 85vh (85% of viewport)
  - Outer padding: 16px margin
  - Scrollable content when needed
  - Better visual hierarchy

### 4. **CSS Fix**
- ✅ Fixed `@import` statement order in `index.css`
- ✅ Moved Google Fonts import before `@tailwind` directives
- ✅ Resolved Vite HMR error

## 🗄️ Database Changes

### New Column Added
```sql
ALTER TABLE studios
ADD COLUMN IF NOT EXISTS header_about_photo TEXT DEFAULT '';
```

**Column Details:**
- **Name**: `header_about_photo`
- **Type**: `TEXT`
- **Default**: Empty string
- **Purpose**: Store Supabase Storage URL for About photo
- **Storage Location**: `studio-logos/{studioId}/about/about_{studioId}_{timestamp}.{ext}`

## 📁 Files Changed

### Frontend Components
- `src/components/booking/CustomBookingHeader.tsx`
  - Added `aboutPhoto` prop
  - Updated About dialog to display photo
  - Added consistent dialog styling (max-h-[85vh], m-4)
  
- `src/pages/BrandBooking.tsx`
  - Added `headerAboutPhoto` to customization state
  - Load photo URL from database
  - Pass photo to CustomBookingHeader

- `src/pages/admin/AdminSettings.tsx`
  - Added `headerAboutPhoto` field to settings state
  - Added `isUploadingAboutPhoto` loading state
  - Created photo upload UI with preview
  - Added icon-style delete button
  - Updated loadSettings to include all header fields

### Backend Services
- `src/services/fileUploadService.ts`
  - Added `uploadAboutPhoto()` function
  - Uploads to `studio-logos` bucket
  - Path: `{studioId}/about/about_{studioId}_{timestamp}.{ext}`
  - Max size: 2MB
  - Allowed types: JPEG, PNG, WebP, GIF

- `src/services/studioSettings.ts`
  - Added `headerAboutPhoto` to `StudioSettings` interface
  - Updated `loadStudioSettings()` to load photo URL
  - Updated `saveStudioSettings()` to save photo URL
  - Fixed missing header text fields in load function

### Database
- `supabase/migrations/add_navigation_content_fields.sql`
  - Added `header_about_photo` column
  - Added column comment for documentation

- `add_about_photo_column.sql`
  - Standalone migration script for easy execution
  - Includes verification query

### Styling
- `src/index.css`
  - Fixed `@import` order (moved before `@tailwind`)

## 🎨 UI/UX Improvements

### Admin Settings
**Before:**
- No photo upload option
- Only text description available

**After:**
- Photo upload field with file input
- Compact preview (320px × 192px)
- Delete button overlaid in top-right corner
- Matches portfolio photo management style
- Clear visual feedback during upload

### Booking Form About Popup
**Before:**
- Only text content
- Could be full screen height
- No outer padding

**After:**
- Photo displayed above text (max 40vh)
- Centered with subtle background
- Dialog limited to 85vh height
- 16px outer padding
- No scrolling needed for typical content
- Professional, magazine-style layout

## 🔧 Technical Details

### Photo Upload Flow
1. Admin selects image file
2. Validates file (type, size)
3. Uploads to Supabase Storage
4. Returns public URL
5. Updates settings state
6. Saves to database on "Simpan Tetapan"

### Photo Display Logic
```tsx
{aboutPhoto && (
  <div className="w-full max-h-[40vh] rounded-lg overflow-hidden flex items-center justify-center bg-muted/30">
    <img
      src={aboutPhoto}
      alt="About"
      className="max-w-full max-h-[40vh] h-auto object-contain"
    />
  </div>
)}
```

### Delete Button Style (Matching Portfolio)
```tsx
<Button
  size="icon"
  variant="ghost"
  className="absolute top-1 right-1 h-8 w-8 bg-red-600 hover:bg-red-700 text-white"
>
  <Trash className="h-4 w-4" />
</Button>
```

## 📝 Migration Instructions

### ⚠️ IMPORTANT: Apply Migration First!

**Option 1: Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run this SQL:
```sql
ALTER TABLE studios
ADD COLUMN IF NOT EXISTS header_about_photo TEXT DEFAULT '';

COMMENT ON COLUMN studios.header_about_photo IS 'Photo URL to display in About popup alongside the text';
```

**Option 2: Use Provided Script**
1. Open `add_about_photo_column.sql` in project root
2. Copy the SQL content
3. Run in Supabase SQL Editor

**Option 3: Supabase CLI** (if linked)
```bash
supabase link --project-ref <your-project-ref>
npx supabase db push
```

### Verify Migration
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'studios' 
AND column_name = 'header_about_photo';
```
Should return 1 row showing the new column.

## 🧪 Testing Checklist

### Database
- [ ] Apply migration successfully
- [ ] Verify column exists in studios table
- [ ] Check column has TEXT type and empty default

### Admin Settings
- [ ] Navigate to Admin Settings > Booking Form > Penyesuaian Borang Tempahan
- [ ] Enable About navigation
- [ ] Enter About description text
- [ ] Upload a photo (test JPEG, PNG)
- [ ] Verify photo preview appears (small, centered)
- [ ] Verify delete button appears in top-right corner
- [ ] Click delete button, verify photo is removed
- [ ] Upload new photo, verify it replaces the old one
- [ ] Click "Simpan Tetapan" and verify success message
- [ ] Refresh page, verify photo persists

### Booking Form
- [ ] Open booking form
- [ ] Click "About" in header navigation
- [ ] Verify popup opens with photo and text
- [ ] Verify photo is properly sized (not too large)
- [ ] Verify no scrolling needed
- [ ] Verify text is readable below photo
- [ ] Test on desktop (1920×1080)
- [ ] Test on tablet (768×1024)
- [ ] Test on mobile (375×667)
- [ ] Verify dialog has outer padding on all screen sizes

### Edge Cases
- [ ] Upload very large image (should be constrained)
- [ ] Upload very tall image (should be constrained to 40vh)
- [ ] Upload very wide image (should be constrained to container)
- [ ] Test with no photo (only text)
- [ ] Test with no text (only photo)
- [ ] Test with both photo and text
- [ ] Test image load failure (broken URL)

### Other Dialogs
- [ ] Verify Home dialog has same styling (85vh, padding)
- [ ] Verify Contact dialog has same styling
- [ ] All dialogs should feel consistent

## 🚀 Deployment Notes

### Prerequisites
1. **Database Migration Required**: Must run migration before deploying code
2. **Supabase Storage**: Ensure `studio-logos` bucket exists and has proper RLS policies
3. **No Breaking Changes**: Existing functionality remains unchanged

### Deployment Steps
1. Apply database migration (see Migration Instructions above)
2. Merge PR to main branch
3. Deploy frontend code
4. Verify in production environment

### Rollback Plan
If needed, remove the column:
```sql
ALTER TABLE studios DROP COLUMN IF EXISTS header_about_photo;
```

## 📊 Performance Considerations

- **Image Size**: Limited to 2MB max
- **Storage**: Uses existing `studio-logos` bucket
- **Loading**: Images lazy-loaded in dialogs (only when opened)
- **Caching**: Supabase CDN caches images (3600s cache-control)
- **Bandwidth**: Minimal impact (images only load when About is clicked)

## 🔒 Security

- ✅ File type validation (images only)
- ✅ File size validation (2MB max)
- ✅ Authenticated uploads only
- ✅ Studio-specific storage paths
- ✅ Public read access (for booking form display)
- ✅ RLS policies enforced by Supabase

## 📚 Related Files

- Migration: `supabase/migrations/add_navigation_content_fields.sql`
- Standalone SQL: `add_about_photo_column.sql`
- Upload Service: `src/services/fileUploadService.ts`
- Settings Service: `src/services/studioSettings.ts`
- Admin UI: `src/pages/admin/AdminSettings.tsx`
- Booking Header: `src/components/booking/CustomBookingHeader.tsx`
- Booking Page: `src/pages/BrandBooking.tsx`

## 🎯 Benefits

1. **Enhanced Branding**: Studios can showcase their space/team visually
2. **Better Engagement**: Visual content increases user interest
3. **Flexibility**: Optional feature (works with or without photo)
4. **Consistency**: Matches existing portfolio photo management UX
5. **Professional Look**: Magazine-style layout in popup
6. **Mobile-Friendly**: Responsive sizing on all devices

## 👥 Reviewers

Please review:
- Database migration safety
- Photo upload security
- UI/UX consistency
- Mobile responsiveness
- Error handling

---

**Branch**: `header-content-custom`
**Base**: `main`
**Type**: Feature
**Breaking Changes**: None (requires migration)
