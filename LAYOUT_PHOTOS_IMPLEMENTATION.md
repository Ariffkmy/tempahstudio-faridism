# Layout Photos Feature Implementation

## Overview
This document describes the implementation of the layout photos feature that allows users to upload up to 5 photos for each studio layout (pakej) with thumbnail selection capability.

## Database Changes

### Migration 018: Add Layout Photos Columns
**File**: `supabase/migrations/018_add_layout_photos.sql`

Added two new columns to the `studio_layouts` table:
- `layout_photos` (TEXT[]): Array to store up to 5 photo URLs
- `thumbnail_photo` (TEXT): URL of the photo to be shown as thumbnail in the booking form

### Migration 019: Create Storage Bucket
**File**: `supabase/migrations/019_create_layout_photos_bucket.sql`

Created a new Supabase Storage bucket `studio-layout-photos` with the following RLS policies:
- Authenticated users can upload photos
- Public can view photos
- Authenticated users can delete/update their studio's photos

## Backend Changes

### File Upload Service
**File**: `src/services/fileUploadService.ts`

Added the following:
1. **Constants**:
   - `LAYOUT_PHOTOS_BUCKET`: Bucket name for layout photos
   - `MAX_LAYOUT_PHOTO_SIZE`: 10MB maximum file size

2. **Functions**:
   - `uploadLayoutPhoto(file, layoutId, studioId)`: Uploads a layout photo to storage
   - `deleteLayoutPhoto(url)`: Deletes a layout photo from storage

### Type Definitions
**File**: `src/types/database.ts`

Updated `StudioLayout` interface to include:
```typescript
layout_photos?: string[] | null;
thumbnail_photo?: string | null;
```

## Frontend Changes

### Admin Settings Component
**File**: `src/pages/admin/AdminSettings.tsx`

#### State Management
Added state for tracking upload and delete operations:
```typescript
const [uploadingLayoutPhoto, setUploadingLayoutPhoto] = useState<{ [layoutId: string]: boolean }>({});
const [deletingLayoutPhoto, setDeletingLayoutPhoto] = useState<{ [key: string]: boolean }>({});
```

#### Handler Functions
1. **`handleUploadLayoutPhoto(layoutIndex, file)`**:
   - Validates maximum 5 photos limit
   - Uploads photo to storage
   - Updates layout with new photo URL
   - Automatically sets first photo as thumbnail
   - Shows success/error toast notifications

2. **`handleDeleteLayoutPhoto(layoutIndex, photoUrl)`**:
   - Deletes photo from storage
   - Removes photo from layout array
   - Updates thumbnail if deleted photo was the thumbnail
   - Shows success/error toast notifications

3. **`handleSetThumbnail(layoutIndex, photoUrl)`**:
   - Sets the selected photo as the thumbnail
   - Shows success toast notification

#### UI Components
Added comprehensive photo management UI in the Pakej tab for each layout:

1. **Upload Section**:
   - File input (hidden) for selecting images
   - Upload button with loading state
   - Photo counter badge (e.g., "3 / 5")
   - Disabled when 5 photos reached

2. **Photos Grid**:
   - Responsive grid layout (2-5 columns based on screen size)
   - Each photo shows:
     - Image preview
     - "Thumbnail" badge if it's the selected thumbnail
     - Primary ring border for thumbnail
     - Hover overlay with action buttons:
       - "Set as thumbnail" button (if not already thumbnail)
       - Delete button with loading state

## User Flow

### Uploading Photos
1. User navigates to Admin Settings > Pakej tab
2. Selects a layout to edit
3. Clicks "Muat Naik Foto" button
4. Selects an image file
5. Photo is uploaded and added to the grid
6. First photo is automatically set as thumbnail

### Managing Photos
1. **Set Thumbnail**: Hover over any photo and click the image icon
2. **Delete Photo**: Hover over any photo and click the trash icon
3. **View Photos**: All photos are displayed in a grid with the thumbnail highlighted

### Constraints
- Maximum 5 photos per layout
- Maximum 10MB per photo
- Supported formats: JPEG, PNG, WebP, GIF
- At least one photo must be marked as thumbnail (auto-selected)

## Technical Details

### Photo Storage Structure
Photos are stored in Supabase Storage with the following path structure:
```
studio-layout-photos/
  {studioId}/
    {layoutId}/
      {layoutId}_{timestamp}.{ext}
```

### Data Flow
1. User selects file → `handleUploadLayoutPhoto` called
2. File validated (size, type)
3. File uploaded to Supabase Storage
4. Public URL generated
5. URL added to `layout_photos` array
6. If first photo, set as `thumbnail_photo`
7. Layout state updated
8. Changes saved when user clicks "Simpan Tetapan"

### Error Handling
- File size validation
- File type validation
- Maximum photos limit check
- Upload failure handling
- Delete failure handling
- Network error handling
- All errors shown via toast notifications

## Future Enhancements
1. Image cropping/editing before upload
2. Drag-and-drop reordering
3. Bulk upload
4. Image optimization/compression
5. Preview modal for full-size images
6. Photo captions/descriptions

## Testing Checklist
- [ ] Upload single photo
- [ ] Upload multiple photos (up to 5)
- [ ] Attempt to upload 6th photo (should be blocked)
- [ ] Set different photos as thumbnail
- [ ] Delete non-thumbnail photo
- [ ] Delete thumbnail photo (should auto-select new thumbnail)
- [ ] Delete all photos
- [ ] Upload large file (>10MB, should fail)
- [ ] Upload unsupported format (should fail)
- [ ] Save settings with photos
- [ ] Verify photos persist after page reload
- [ ] Verify thumbnail is displayed in booking form

## Migration Instructions
To apply these changes to your Supabase instance:

1. Run the database migrations:
   ```sql
   -- Run in Supabase SQL Editor
   -- Migration 018
   -- Migration 019
   ```

2. Verify the storage bucket was created:
   - Go to Supabase Dashboard > Storage
   - Check for `studio-layout-photos` bucket
   - Verify it's set to public

3. Test the feature in the admin panel

## Notes
- Photos are stored in public storage for easy access in the booking form
- The thumbnail photo will be used in the booking form to represent each layout
- All photos can be viewed in a gallery on the booking form (if implemented)
- Photos are not deleted from storage when a layout is deleted (consider implementing cleanup)
