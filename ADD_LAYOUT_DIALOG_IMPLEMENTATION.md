# Add Layout Dialog Implementation

## Overview
Converted the inline "Add New Layout" form into a popup dialog for a cleaner, more modern user experience.

## Changes Made

### 1. Added Dialog Import
**File**: `src/pages/admin/AdminSettings.tsx`

Added Dialog components to imports:
```tsx
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
```

### 2. Added Dialog State
Added state to control dialog open/close:
```tsx
const [isAddLayoutDialogOpen, setIsAddLayoutDialogOpen] = useState(false);
```

### 3. Updated `addNewLayout` Function
Enhanced the function to:
- Close the dialog after successful addition
- Show success toast notification
- Show error toast if required fields are missing
- Validate that name and description are filled

### 4. Replaced Inline Form with Dialog
**Before**: Inline form always visible in the Pakej tab
**After**: Clean button that opens a popup dialog

#### Dialog Features:
- **Trigger**: Large button with "Tambah Pilihan Layout" text
- **Modal**: Centered popup with max-width of 2xl
- **Scrollable**: Max height of 90vh with overflow scroll
- **Form Fields**:
  - Nama Layout (required) - with placeholder
  - Kapasiti - number input with min value
  - Harga per Jam - number input with step of 10
  - Perihal (required) - textarea with 4 rows
- **Info Note**: Helpful message explaining photos can be added after creating the layout
- **Actions**:
  - "Batal" button - closes dialog and resets form
  - "Tambah Layout" button - validates and adds layout

## User Experience Improvements

### Before
- Form always visible, taking up vertical space
- No clear separation between viewing and adding
- No validation feedback

### After
- Clean interface with just a button
- Dialog provides focused context for adding
- Clear validation with toast messages
- Better visual hierarchy
- Cancel option to abandon changes
- Form automatically resets on cancel or success

## User Flow

1. **Open Dialog**: Click "Tambah Pilihan Layout" button
2. **Fill Form**: Enter layout details
   - Name (required)
   - Capacity (default: 1)
   - Price per hour (default: 100)
   - Description (required)
3. **Submit**: Click "Tambah Layout"
   - If valid: Layout added, dialog closes, success toast shown
   - If invalid: Error toast shown, dialog stays open
4. **Add Photos**: After layout is created, expand it and upload photos

## Validation

The dialog validates:
- ✅ Name is not empty
- ✅ Description is not empty
- ✅ Capacity is a valid number (min: 1)
- ✅ Price is a valid number (min: 0)

## Toast Notifications

### Success
```
Title: "Layout ditambah"
Description: "Layout baru telah ditambah. Jangan lupa untuk simpan tetapan."
```

### Error
```
Title: "Maklumat tidak lengkap"
Description: "Sila isi nama dan perihal layout"
Variant: destructive
```

## Technical Details

### Dialog Configuration
- **Max Width**: 2xl (672px)
- **Max Height**: 90vh
- **Overflow**: Auto scroll
- **Controlled**: State-controlled open/close
- **Responsive**: Full width on mobile, auto width on desktop

### Form Reset
Form is reset in two scenarios:
1. After successful addition
2. When clicking "Batal" button

Reset values:
```tsx
{
  name: '',
  description: '',
  capacity: 1,
  price_per_hour: 100
}
```

## Benefits

1. **Cleaner UI**: Less visual clutter in the main view
2. **Better Focus**: Dialog provides dedicated space for adding
3. **Improved UX**: Clear actions and feedback
4. **Validation**: Immediate feedback on missing fields
5. **Flexibility**: Easy to add more fields in the future
6. **Accessibility**: Proper dialog semantics and keyboard navigation
7. **Mobile Friendly**: Responsive design works on all screen sizes

## Future Enhancements

Potential improvements:
1. Add photo upload directly in the dialog
2. Add image preview before saving
3. Add more validation rules (e.g., price range)
4. Add duplicate name detection
5. Add rich text editor for description
6. Add amenities selection in dialog
7. Add time slots configuration in dialog
