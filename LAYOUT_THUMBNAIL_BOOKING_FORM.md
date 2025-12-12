# Layout Thumbnail Display in Booking Form

## Overview
Updated the booking form to display layout thumbnail photos instead of the legacy `image` field, providing a better visual representation of studio layouts to customers.

## Changes Made

### 1. Updated Booking Type Definition
**File**: `src/types/booking.ts`

Added `thumbnail_photo` field to the `StudioLayout` interface:
```typescript
export interface StudioLayout {
  id: string;
  name: string;
  description: string;
  capacity: number;
  pricePerHour: number;
  image?: string;
  thumbnail_photo?: string;  // NEW
  amenities?: string[];
}
```

### 2. Updated LayoutSelector Component
**File**: `src/components/booking/LayoutSelector.tsx`

Changed the image source to prioritize `thumbnail_photo`:
```tsx
// Before
<img src={layout.image || '/placeholder.svg'} />

// After
<img src={layout.thumbnail_photo || layout.image || '/placeholder.svg'} />
```

**Priority order**:
1. `thumbnail_photo` - The selected thumbnail from layout photos
2. `image` - Legacy single image field (fallback)
3. `/placeholder.svg` - Default placeholder

### 3. Updated BrandBooking Page
**File**: `src/pages/BrandBooking.tsx`

Added `thumbnail_photo` to the layout data mapping (line 211):
```typescript
const formattedLayouts = (layoutsData || []).map(layout => ({
  id: layout.id,
  name: layout.name,
  description: layout.description,
  capacity: layout.capacity,
  pricePerHour: Number(layout.price_per_hour),
  image: layout.image,
  thumbnail_photo: layout.thumbnail_photo,  // NEW
  amenities: layout.amenities || [],
}));
```

### 4. Updated NewBooking Page
**File**: `src/pages/NewBooking.tsx`

Added `thumbnail_photo` to the layout data mapping (line 133):
```typescript
const formattedLayouts = (layoutsData || []).map(layout => ({
  id: layout.id,
  name: layout.name,
  description: layout.description,
  capacity: layout.capacity,
  pricePerHour: Number(layout.price_per_hour),
  image: layout.image,
  thumbnail_photo: layout.thumbnail_photo,  // NEW
  amenities: layout.amenities || [],
}));
```

## How It Works

### Data Flow
1. **Admin uploads photos** in Admin Settings > Pakej tab
2. **Admin selects thumbnail** by clicking the image icon on a photo
3. **Admin saves settings** - `thumbnail_photo` URL saved to database
4. **Customer visits booking form** - Layout data loaded from database
5. **LayoutSelector displays thumbnail** - Shows the selected thumbnail photo

### Visual Display
- **Size**: 24x24 (96px x 96px) square thumbnail
- **Position**: Left side of each layout card
- **Fallback**: Uses legacy `image` field if no thumbnail set
- **Default**: Shows placeholder if no images available

## Benefits

1. ✅ **Better visual representation** - Admin-selected thumbnail shows best view
2. ✅ **Consistent display** - All layouts show same aspect ratio
3. ✅ **Backward compatible** - Falls back to legacy `image` field
4. ✅ **Professional appearance** - Curated thumbnails look more polished
5. ✅ **Easy to update** - Admin can change thumbnail anytime

## User Experience

### For Admins
1. Upload up to 5 photos per layout
2. Select the best photo as thumbnail
3. Thumbnail automatically appears in booking form
4. Can change thumbnail anytime

### For Customers
1. See professional thumbnail for each layout
2. Better understanding of studio spaces
3. Make informed layout selection
4. Improved booking experience

## Testing Checklist

- [x] Thumbnail displays in BrandBooking page
- [x] Thumbnail displays in NewBooking page
- [x] Fallback to `image` field works
- [x] Placeholder shows when no images
- [x] Thumbnail updates when changed in admin
- [x] Multiple layouts display correctly
- [x] Responsive on mobile devices

## Migration Notes

**Existing layouts without thumbnails**:
- Will fall back to the `image` field
- No data migration needed
- Admins can add thumbnails gradually

**New layouts**:
- Should upload photos and select thumbnail
- Thumbnail will be used automatically

## Future Enhancements

1. **Photo gallery modal** - Click thumbnail to view all layout photos
2. **Multiple thumbnails** - Different thumbnails for different views
3. **Auto-thumbnail** - Automatically select first photo as thumbnail
4. **Image optimization** - Compress and resize thumbnails for faster loading
5. **Lazy loading** - Load thumbnails only when visible
