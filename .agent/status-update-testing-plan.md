# Testing Plan - Booking Status Updates

## Test Scenarios

### 1. Mobile List View
**Location:** Admin Bookings → List Tab (Mobile)

**Steps:**
1. Open admin bookings page on mobile device/view
2. Navigate to "List" tab
3. Find any booking card
4. Click "Tukar Status" dropdown button
5. Select any status option (e.g., "Photoshoot Selesai")

**Expected Results:**
- ✅ Status updates in database
- ✅ Booking list refreshes automatically
- ✅ Toast notification shows "Status Dikemaskini"
- ✅ Customer receives email notification
- ✅ Badge shows new status

### 2. Mobile Calendar View
**Location:** Admin Bookings → Calendar Tab → Day Dialog (Mobile)

**Steps:**
1. Open admin bookings page on mobile device/view
2. Navigate to "Calendar" tab
3. Click on a day with bookings
4. In the dialog, find a booking
5. Click "Tukar Status" dropdown
6. Select any status option

**Expected Results:**
- ✅ Status updates in database
- ✅ Dialog closes and calendar refreshes
- ✅ Toast notification appears
- ✅ Email sent to customer

### 3. Desktop Table View
**Location:** Admin Bookings → List Tab (Desktop)

**Steps:**
1. Open admin bookings page on desktop
2. Navigate to "Paparan Senarai" tab
3. Find any booking row in the table
4. Click the "..." (More) button in the last column
5. Select any status option from dropdown

**Expected Results:**
- ✅ Status updates in database
- ✅ Table refreshes with new status
- ✅ Badge color updates appropriately
- ✅ Toast notification confirms update
- ✅ Email notification sent

### 4. Desktop Calendar View
**Location:** Admin Bookings → Calendar Tab → Day Dialog (Desktop)

**Steps:**
1. Open admin bookings page on desktop
2. Navigate to "Paparan Kalendar" tab
3. Click on a day with bookings
4. In the dialog, find a booking
5. Click "Tukar Status" dropdown
6. Select any status option

**Expected Results:**
- ✅ Status updates in database
- ✅ Dialog remains open, booking updates
- ✅ Toast notification shows success
- ✅ Customer email sent

## Status Options to Test

Test each of these status transitions:
- ✅ Photoshoot Selesai (done-photoshoot)
- ✅ Dijadual Semula (rescheduled)
- ✅ Tidak Hadir (no-show)
- ✅ Dibatalkan (cancelled)

## Error Scenarios

### Network Error
**Steps:**
1. Disconnect from network
2. Try to update status
3. Reconnect

**Expected:**
- ❌ Error toast appears
- ❌ Status does NOT change
- ✅ Original status remains

### Database Error
**Steps:**
1. Update status with invalid booking ID
2. Check response

**Expected:**
- ❌ Error toast with message
- ✅ Graceful error handling

## Verification Checklist

After each status update, verify:

1. **Database Check:**
   - [ ] Open Supabase dashboard
   - [ ] Check `bookings` table
   - [ ] Verify `status` field is updated
   - [ ] Check `updated_at` timestamp changed

2. **Email Check:**
   - [ ] Check customer's email inbox
   - [ ] Verify status update email received
   - [ ] Confirm email contains correct status

3. **UI Check:**
   - [ ] Badge shows correct status
   - [ ] Badge has correct color variant
   - [ ] Status label is in Malay
   - [ ] Booking list/calendar updated

4. **Console Check:**
   - [ ] No errors in browser console
   - [ ] No TypeScript errors
   - [ ] Network request successful (200 OK)

## Regression Testing

Ensure existing functionality still works:

- [ ] Viewing booking details (eye icon)
- [ ] Filtering bookings by status
- [ ] Searching bookings
- [ ] Exporting to CSV
- [ ] Creating new bookings
- [ ] Calendar navigation

## Performance Testing

- [ ] Status update completes within 2 seconds
- [ ] No UI freezing during update
- [ ] Multiple rapid updates handled gracefully
- [ ] Large booking lists (100+) update smoothly

## Browser Compatibility

Test on:
- [ ] Chrome (Desktop & Mobile)
- [ ] Safari (Desktop & Mobile)
- [ ] Firefox (Desktop)
- [ ] Edge (Desktop)

## Notes

- All status updates should use the `updateBookingStatus` service
- Email notifications are optional (won't fail update if email fails)
- Toast notifications should appear for both success and error
- Status changes should be reflected immediately in UI
