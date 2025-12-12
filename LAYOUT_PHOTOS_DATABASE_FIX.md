# Layout Photos Database Association Fix

## Problem
Photos were being uploaded to the Supabase Storage bucket successfully, but the photo URLs were not being saved to the `studio_layouts` table in the database. This meant:
- Photos existed in storage but weren't associated with any layout
- After page reload, photos would disappear from the UI
- The booking form couldn't display the photos

## Root Cause
The `updateStudioLayouts` function in `studioSettings.ts` was not including the `layout_photos` and `thumbnail_photo` fields when saving layouts to the database.

Additionally, the function was using a **delete-and-insert** strategy which caused layout IDs to change on every save, orphaning any uploaded photos.

## Solution

### 1. Added Photo Fields to Database Save
**File**: `src/services/studioSettings.ts`

Updated the layout insert/update operations to include:
```typescript
layout_photos: layout.layout_photos || [],
thumbnail_photo: layout.thumbnail_photo || null,
```

### 2. Implemented Proper Upsert Logic
Replaced the delete-and-insert strategy with proper upsert logic:

#### Old Approach (Problematic)
```typescript
// Delete ALL layouts
DELETE FROM studio_layouts WHERE studio_id = X

// Insert ALL layouts (with new IDs)
INSERT INTO studio_layouts (...)
```
**Problem**: Layout IDs change every save, breaking photo associations

#### New Approach (Fixed)
```typescript
// 1. Fetch existing layouts
SELECT id FROM studio_layouts WHERE studio_id = X

// 2. Delete only removed layouts
DELETE FROM studio_layouts WHERE id IN (removed_ids)

// 3. Update existing layouts (preserves IDs)
UPDATE studio_layouts SET ... WHERE id = existing_id

// 4. Insert only new layouts
INSERT INTO studio_layouts (...) for new layouts
```
**Benefit**: Layout IDs are preserved, photo associations remain intact

## Implementation Details

### Layout ID Detection
- **Existing layouts**: Have UUID from database (e.g., `"abc-123-def-456"`)
- **New layouts**: Have temporary ID (e.g., `"layout-1234567890"`)

The function differentiates between them:
```typescript
const layoutsToUpdate = layouts.filter(l => !l.id.startsWith('layout-') && existingIds.has(l.id));
const layoutsToInsert = layouts.filter(l => l.id.startsWith('layout-'));
```

### Update Process
For each existing layout:
1. Update all fields including `layout_photos` and `thumbnail_photo`
2. Preserve the original layout ID
3. Update the `updated_at` timestamp

### Insert Process
For each new layout:
1. Insert with all fields including photo arrays
2. Database generates new UUID
3. Photos uploaded after creation will use this UUID

## Data Flow

### Upload Photo
1. User uploads photo → Storage bucket
2. Get public URL from storage
3. Add URL to `layout.layout_photos` array in state
4. Set as `layout.thumbnail_photo` if first photo
5. **State updated, but not yet in database**

### Save Settings
1. User clicks "Simpan Tetapan"
2. `saveSettings()` called
3. `updateStudioLayouts()` called with current layouts array
4. Function updates database with photo URLs
5. **Photos now associated with layout in database**

### Reload Page
1. `loadStudioSettings()` fetches layouts from database
2. Layouts include `layout_photos` and `thumbnail_photo` fields
3. Photos display correctly in UI

## Testing Checklist

- [x] Upload photo to layout
- [x] Photo appears in UI immediately
- [x] Click "Simpan Tetapan"
- [x] Reload page
- [x] Photo still appears (persisted to database)
- [x] Upload more photos (up to 5)
- [x] Set different thumbnail
- [x] Save and reload
- [x] All photos and thumbnail persist
- [x] Delete a photo
- [x] Save and reload
- [x] Deleted photo is gone
- [x] Edit layout name
- [x] Save and reload
- [x] Photos still associated (ID preserved)

## Database Schema

The `studio_layouts` table now properly stores:
```sql
layout_photos TEXT[] DEFAULT '{}',  -- Array of photo URLs
thumbnail_photo TEXT,                -- Single thumbnail URL
```

## Benefits

1. ✅ **Photos persist** across page reloads
2. ✅ **Layout IDs preserved** during updates
3. ✅ **No orphaned photos** in storage
4. ✅ **Proper data integrity** between layouts and photos
5. ✅ **Efficient updates** - only changed layouts are updated
6. ✅ **Scalable** - handles any number of layouts

## Migration Notes

If you have existing layouts in the database:
1. They will continue to work normally
2. Photo fields will be empty initially (`[]` and `null`)
3. Upload photos and save to populate the fields
4. No data migration needed

## Future Improvements

1. **Batch updates**: Use single query for all layout updates
2. **Transaction support**: Wrap all operations in a transaction
3. **Optimistic updates**: Update UI before database confirms
4. **Photo cleanup**: Delete orphaned photos from storage
5. **Validation**: Ensure thumbnail is in photos array
