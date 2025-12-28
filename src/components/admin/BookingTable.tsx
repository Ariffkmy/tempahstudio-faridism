import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { parseDateLocal } from '@/utils/dateUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, MoreHorizontal, X, UserCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RescheduleDialog } from './RescheduleDialog';
import type { StudioStaff } from '@/types/studioStaff';
import type { Booking, BookingStatus } from '@/types/booking';

interface BookingTableProps {
  bookings: Booking[];
  photographers: StudioStaff[];
  editors: StudioStaff[];
  onViewBooking: (booking: Booking) => void;
  onStatusUpdate?: (bookingId: string, newStatus: BookingStatus) => void;
  onRescheduleSuccess?: () => void;
  onAssignmentUpdate?: (bookingId: string, photographerId?: string | null, editorId?: string | null) => void;
}

const statusVariants: Record<BookingStatus, 'success' | 'warning' | 'destructive' | 'secondary' | 'default'> = {
  'pending': 'warning',
  'confirmed': 'default',
  'done-payment': 'default',
  'done-photoshoot': 'secondary',
  'start-editing': 'warning',
  'ready-for-delivery': 'success',
  'completed': 'success',
  'rescheduled': 'warning',
  'no-show': 'destructive',
  'cancelled': 'destructive',
};

const statusLabels: Record<BookingStatus, string> = {
  'pending': 'Menunggu',
  'confirmed': 'Disahkan',
  'done-payment': 'Bayaran Selesai',
  'done-photoshoot': 'Photoshoot Selesai',
  'start-editing': 'Mula Edit',
  'ready-for-delivery': 'Sedia Hantar',
  'completed': 'Selesai',
  'rescheduled': 'Dijadual Semula',
  'no-show': 'Tidak Hadir',
  'cancelled': 'Dibatalkan',
};

export function BookingTable({
  bookings,
  photographers = [],
  editors = [],
  onViewBooking,
  onStatusUpdate,
  onRescheduleSuccess,
  onAssignmentUpdate
}: BookingTableProps) {
  const [referenceFilter, setReferenceFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [layoutFilter, setLayoutFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Reschedule dialog state
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [bookingToReschedule, setBookingToReschedule] = useState<Booking | null>(null);

  // Assignment dialog state
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [bookingToAssign, setBookingToAssign] = useState<Booking | null>(null);
  const [dialogPhotographerId, setDialogPhotographerId] = useState<string>('none');
  const [dialogEditorId, setDialogEditorId] = useState<string>('none');
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  // Assignment editing state
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [tempPhotographerId, setTempPhotographerId] = useState<string>('');
  const [tempEditorId, setTempEditorId] = useState<string>('');

  // Cleanup effect to force remove pointer-events: none from body when dialog closes
  useEffect(() => {
    if (!assignmentDialogOpen) {
      // IMMEDIATE cleanup
      document.body.style.pointerEvents = '';
      document.documentElement.style.pointerEvents = '';

      // Create a MutationObserver to watch for when Radix UI tries to re-apply pointer-events: none
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const target = mutation.target as HTMLElement;
            if (target.style.pointerEvents === 'none') {
              console.log('[BookingTable] Detected pointer-events: none being applied, removing it!');
              target.style.pointerEvents = '';
            }
          }
        });
      });

      // Start observing body element for style changes
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['style']
      });

      // DELAYED cleanup (in case Radix UI re-applies it)
      const timeoutId = setTimeout(() => {
        // Force remove pointer-events: none from body and html elements
        document.body.style.pointerEvents = '';
        document.documentElement.style.pointerEvents = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';

        // Remove any lingering Radix UI overlays from THIS dialog specifically
        const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
        overlays.forEach(overlay => {
          // Check if this overlay is from a closed dialog (has opacity 0 or is hidden)
          const style = window.getComputedStyle(overlay as Element);
          if (style.opacity === '0' || style.visibility === 'hidden' || style.display === 'none') {
            if (overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
          }
        });

        // Final safety check - if NO dialogs are open, force unlock
        const openDialogs = document.querySelectorAll('[data-state="open"][role="dialog"]');
        if (openDialogs.length === 0) {
          console.log('[BookingTable] No open dialogs detected, forcing body unlock');
          document.body.style.pointerEvents = '';
          document.documentElement.style.pointerEvents = '';
        }

        // Disconnect observer after cleanup
        observer.disconnect();
      }, 500);

      return () => {
        clearTimeout(timeoutId);
        observer.disconnect();
      };
    }
  }, [assignmentDialogOpen]);


  // Get unique layouts for filter
  const uniqueLayouts = Array.from(new Set(bookings.map(b => b.layoutName)));

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesReference = booking.reference.toLowerCase().includes(referenceFilter.toLowerCase());
    const matchesCustomer = booking.customerName.toLowerCase().includes(customerFilter.toLowerCase()) ||
      booking.customerEmail.toLowerCase().includes(customerFilter.toLowerCase());
    const matchesDate = !dateFilter || booking.date === dateFilter;
    const matchesMinPrice = !minPriceFilter || booking.totalPrice >= parseFloat(minPriceFilter);
    const matchesMaxPrice = !maxPriceFilter || booking.totalPrice <= parseFloat(maxPriceFilter);
    const matchesLayout = layoutFilter === 'all' || booking.layoutName === layoutFilter;
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

    return matchesReference && matchesCustomer && matchesDate && matchesMinPrice && matchesMaxPrice && matchesLayout && matchesStatus;
  });

  const clearAllFilters = () => {
    setReferenceFilter('');
    setCustomerFilter('');
    setDateFilter('');
    setMinPriceFilter('');
    setMaxPriceFilter('');
    setLayoutFilter('all');
    setStatusFilter('all');
  };

  const handleOpenReschedule = (booking: Booking) => {
    setBookingToReschedule(booking);
    setRescheduleDialogOpen(true);
  };

  const handleRescheduleSuccess = () => {
    console.log('[BookingTable] handleRescheduleSuccess called');
    console.log('[BookingTable] Closing dialog and resetting state');
    setRescheduleDialogOpen(false);
    setBookingToReschedule(null);
    console.log('[BookingTable] Calling parent onRescheduleSuccess');
    if (onRescheduleSuccess) {
      onRescheduleSuccess();
    }
    console.log('[BookingTable] handleRescheduleSuccess completed');
  };

  const handleStartEditAssignment = (booking: Booking) => {
    setEditingAssignmentId(booking.id);
    setTempPhotographerId(booking.photographerId || 'none');
    setTempEditorId(booking.editorId || 'none');
  };

  const handleSaveAssignment = (bookingId: string) => {
    if (onAssignmentUpdate) {
      const photographerId = tempPhotographerId === 'none' ? null : tempPhotographerId || null;
      const editorId = tempEditorId === 'none' ? null : tempEditorId || null;
      onAssignmentUpdate(bookingId, photographerId, editorId);
    }
    setEditingAssignmentId(null);
    setTempPhotographerId('none');
    setTempEditorId('none');
  };

  const handleCancelEditAssignment = () => {
    setEditingAssignmentId(null);
    setTempPhotographerId('none');
    setTempEditorId('none');
  };

  const handleOpenAssignmentDialog = (booking: Booking) => {
    setBookingToAssign(booking);
    setDialogPhotographerId(booking.photographerId || 'none');
    setDialogEditorId(booking.editorId || 'none');
    setAssignmentDialogOpen(true);
  };

  const handleSaveDialogAssignment = async () => {
    if (!bookingToAssign || !onAssignmentUpdate) return;

    setIsSavingAssignment(true);

    try {
      const photographerId = dialogPhotographerId === 'none' ? null : dialogPhotographerId || null;
      const editorId = dialogEditorId === 'none' ? null : dialogEditorId || null;

      // Wait for the assignment update to complete
      await onAssignmentUpdate(bookingToAssign.id, photographerId, editorId);

      // Reset state first
      setBookingToAssign(null);
      setDialogPhotographerId('none');
      setDialogEditorId('none');

      // Close dialog last using the controlled state
      setAssignmentDialogOpen(false);
    } catch (error) {
      console.error('Error saving assignment:', error);
      // Don't close dialog on error so user can retry
    } finally {
      setIsSavingAssignment(false);
    }
  };

  const handleCancelDialogAssignment = () => {
    // Reset all state
    setBookingToAssign(null);
    setDialogPhotographerId('none');
    setDialogEditorId('none');
    setIsSavingAssignment(false);

    // Close dialog
    setAssignmentDialogOpen(false);
  };

  const hasActiveFilters = referenceFilter || customerFilter || dateFilter || minPriceFilter || maxPriceFilter || layoutFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-2">
      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-8 px-2 lg:px-3"
          >
            <X className="h-4 w-4 mr-2" />
            Kosongkan Penapis
          </Button>
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {/* Column Headers */}
            <TableRow>
              <TableHead>Rujukan</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Tarikh & Masa</TableHead>
              <TableHead>Layout</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tugasan Oleh</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
            {/* Filter Row */}
            <TableRow className="bg-muted/50">
              <TableHead className="h-12">
                <Input
                  placeholder="Cari rujukan..."
                  value={referenceFilter}
                  onChange={(e) => setReferenceFilter(e.target.value)}
                  className="h-8 text-xs"
                />
              </TableHead>
              <TableHead className="h-12">
                <Input
                  placeholder="Cari pelanggan..."
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="h-8 text-xs"
                />
              </TableHead>
              <TableHead className="h-12">
                <div
                  className="relative cursor-pointer"
                  onClick={(e) => {
                    const input = e.currentTarget.querySelector('input');
                    input?.showPicker?.();
                  }}
                >
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="h-8 text-xs cursor-pointer"
                  />
                </div>
              </TableHead>
              <TableHead className="h-12">
                <Select value={layoutFilter} onValueChange={setLayoutFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Layout</SelectItem>
                    {uniqueLayouts.map(layout => (
                      <SelectItem key={layout} value={layout}>
                        {layout}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableHead>
              <TableHead className="h-12">
                <div className="flex gap-1">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPriceFilter}
                    onChange={(e) => setMinPriceFilter(e.target.value)}
                    className="h-8 text-xs w-[70px]"
                    min="0"
                    step="0.01"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPriceFilter}
                    onChange={(e) => setMaxPriceFilter(e.target.value)}
                    className="h-8 text-xs w-[70px]"
                    min="0"
                    step="0.01"
                  />
                </div>
              </TableHead>
              <TableHead className="h-12">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    {(Object.keys(statusLabels) as BookingStatus[]).map(status => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableHead>
              <TableHead className="h-12"></TableHead>
              <TableHead className="h-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {hasActiveFilters ? 'Tiada tempahan yang sepadan dengan penapis' : 'Tiada tempahan dijumpai'}
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-mono text-sm">{booking.reference}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{booking.customerName}</p>
                      <p className="text-xs text-muted-foreground">{booking.customerEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{format(parseDateLocal(booking.date), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.startTime} – {booking.endTime}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{booking.layoutName}</TableCell>
                  <TableCell className="font-medium">RM {booking.totalPrice.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[booking.status]}>
                      {statusLabels[booking.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {editingAssignmentId === booking.id ? (
                      <div className="space-y-2 min-w-[200px]">
                        <Select value={tempPhotographerId} onValueChange={setTempPhotographerId}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Pilih Photographer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Tiada</SelectItem>
                            {photographers?.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={tempEditorId} onValueChange={setTempEditorId}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Pilih Editor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Tiada</SelectItem>
                            {editors?.map(e => (
                              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => handleSaveAssignment(booking.id)} className="h-7 text-xs">
                            Simpan
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEditAssignment} className="h-7 text-xs">
                            Batal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                        onClick={() => handleStartEditAssignment(booking)}
                      >
                        <div className="text-xs space-y-1">
                          <div>
                            <span className="font-medium">Photographer: </span>
                            <span className={booking.photographerName ? '' : 'text-muted-foreground italic'}>
                              {booking.photographerName || 'Belum Ditetapkan'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Editor: </span>
                            <span className={booking.editorName ? '' : 'text-muted-foreground italic'}>
                              {booking.editorName || 'Belum Ditetapkan'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewBooking(booking)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Lihat Butiran
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenAssignmentDialog(booking)}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Tugasan Oleh
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onStatusUpdate?.(booking.id, 'done-photoshoot')}>Photoshoot Selesai</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenReschedule(booking)}>Dijadual Semula</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => onStatusUpdate?.(booking.id, 'no-show')}>Tidak Hadir</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => onStatusUpdate?.(booking.id, 'cancelled')}>Dibatalkan</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      {hasActiveFilters && (
        <p className="text-sm text-muted-foreground">
          Menunjukkan {filteredBookings.length} daripada {bookings.length} tempahan
        </p>
      )}

      {/* Reschedule Dialog */}
      <RescheduleDialog
        booking={bookingToReschedule}
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
        onSuccess={handleRescheduleSuccess}
      />

      {/* Assignment Dialog */}
      <Dialog
        open={assignmentDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelDialogAssignment();
          }
        }}
        modal={true}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tugasan Oleh</DialogTitle>
            <DialogDescription>
              Tetapkan photographer dan editor untuk tempahan ini.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Booking Info */}
            {bookingToAssign && (
              <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                <p className="text-sm font-medium">{bookingToAssign.customerName}</p>
                <p className="text-xs text-muted-foreground">{bookingToAssign.reference}</p>
                <p className="text-xs text-muted-foreground">
                  {format(parseDateLocal(bookingToAssign.date), 'MMM d, yyyy')} • {bookingToAssign.startTime}
                </p>
              </div>
            )}

            {/* Photographer Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Photographer</label>
              <Select value={dialogPhotographerId} onValueChange={setDialogPhotographerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Photographer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tiada</SelectItem>
                  {photographers?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Editor Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Editor</label>
              <Select value={dialogEditorId} onValueChange={setDialogEditorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Editor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tiada</SelectItem>
                  {editors?.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelDialogAssignment}
              disabled={isSavingAssignment}
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveDialogAssignment}
              disabled={isSavingAssignment}
            >
              {isSavingAssignment ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
