# Terms & Conditions - Checkbox with Accept/Reject Options

## ✅ Final Design

The Terms & Conditions component now uses **two checkbox options** allowing users to explicitly accept or reject the terms.

## 🎨 Design Features

### **Two Checkbox Options**

#### **Option 1: Accept (Bersetuju)**
- ✅ Green checkmark icon
- Text: "Saya telah membaca dan **bersetuju** dengan Terma & Syarat yang dinyatakan di atas"
- When selected:
  - White background
  - Green border (2px, #22c55e)
  - Green text
  - Shadow effect
  - Background changes to light green gradient

#### **Option 2: Reject (Tidak Bersetuju)**
- ❌ Red X icon
- Text: "Saya **tidak bersetuju** dengan Terma & Syarat yang dinyatakan di atas"
- When selected:
  - White background
  - Red border (2px, #ef4444)
  - Red text
  - Shadow effect
  - Background changes to light red gradient

### **Visual States**

#### **1. Nothing Selected (Initial State)**
- Gray gradient background
- Both options have gray borders
- Icons are gray/muted
- Helper text visible: "* Anda perlu bersetuju dengan Terma & Syarat untuk meneruskan tempahan"

#### **2. Accepted State**
- Light green gradient background (green-50 to emerald-50)
- Accept option highlighted with green border
- Reject option remains gray/unselected
- Helper text hidden (user has accepted)

#### **3. Rejected State**
- Light red gradient background (red-50 to rose-50)
- Reject option highlighted with red border
- Accept option remains gray/unselected
- Helper text still visible (user cannot proceed)

## 🎯 User Experience

### **How It Works**
1. User reads the Terms & Conditions
2. User sees instruction: "Sila pilih salah satu:"
3. User clicks on one of the two options:
   - **Accept**: Allows form submission
   - **Reject**: Blocks form submission
4. Visual feedback is immediate:
   - Background color changes
   - Selected option is highlighted
   - Icons change color

### **Mutual Exclusivity**
- Only ONE option can be selected at a time
- Clicking one automatically deselects the other
- Acts like a radio button group but with checkbox styling

### **Form Validation**
- Form can only be submitted if user selects **"Bersetuju"** (Accept)
- Selecting **"Tidak Bersetuju"** (Reject) keeps submit button disabled
- Validation message shows if not accepted

## 🎨 Design Highlights

### **Interactive Cards**
- Each option is a clickable card
- Hover effects on unselected options
- Smooth transitions between states
- Clear visual feedback

### **Color Coding**
- **Green**: Positive, acceptance, proceed
- **Red**: Negative, rejection, cannot proceed
- **Gray**: Neutral, unselected state

### **Icons**
- ✅ **CheckCircle2**: Represents acceptance
- ❌ **XCircle**: Represents rejection
- Icons change color based on selection state

## 📱 Mobile Friendly

- Large touch targets (full card is clickable)
- Clear spacing between options
- Readable text at all sizes
- Responsive layout

## 🔧 Technical Details

### **State Management**
```typescript
// accepted can be: true, false, or null (nothing selected)
accepted: boolean;
onAcceptChange: (accepted: boolean) => void;
```

### **Click Handlers**
- Clicking accept card: `onAcceptChange(true)`
- Clicking reject card: `onAcceptChange(false)`
- Entire card is clickable for better UX

### **Conditional Styling**
```typescript
// Background changes based on selection
accepted === true ? 'green gradient' 
  : accepted === false ? 'red gradient' 
  : 'gray gradient'
```

## ✨ Advantages

### **Compared to Single Checkbox**:
✅ **Explicit Choice**: User must make a conscious decision
✅ **Clear Intent**: No ambiguity about user's choice
✅ **Better UX**: Users can see both options clearly
✅ **Visual Feedback**: Immediate color-coded response
✅ **Accessibility**: Larger click areas, clearer labels

### **Compared to Buttons**:
✅ **Familiar Pattern**: Users understand checkboxes
✅ **Less Aggressive**: Doesn't force immediate action
✅ **Cleaner Look**: More compact than large buttons
✅ **Standard UI**: Follows common form patterns

## 📋 Form Validation Logic

```javascript
// Form is valid only if:
✅ All other fields are filled
✅ accepted === true (user selected "Bersetuju")

// Form is invalid if:
❌ accepted === false (user selected "Tidak Bersetuju")
❌ accepted === null (user hasn't selected anything)
```

## 🎯 User Flow Example

1. **User scrolls to T&C section**
   - Sees terms content
   - Sees two checkbox options

2. **User clicks "Saya tidak bersetuju"**
   - Red border appears
   - Background turns light red
   - Submit button stays disabled
   - Helper text remains visible

3. **User changes mind, clicks "Saya bersetuju"**
   - Green border appears
   - Background turns light green
   - Submit button becomes enabled
   - Helper text disappears

4. **User can now submit the form**
   - All validations pass
   - Booking is submitted

## 🎨 Visual Mockup

Check the image above to see all three states:
- Left: Nothing selected
- Middle: Accepted (green)
- Right: Rejected (red)

Perfect! The feature is now complete and ready to use. 🚀
