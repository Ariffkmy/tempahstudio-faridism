import { useState } from 'react';
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
import { Booking, BookingStatus } from '@/types/booking';
import { Eye, MoreHorizontal, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RescheduleDialog } from './RescheduleDialog';

interface BookingTableProps {
  bookings: Booking[];
  onViewBooking: (booking: Booking) => void;
  onStatusUpdate?: (bookingId: string, newStatus: BookingStatus) => void;
  onRescheduleSuccess?: () => void;
}

const statusVariants: Record<BookingStatus, 'success' | 'warning' | 'destructive' | 'secondary' | 'default'> = {
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
  'done-payment': 'Bayaran Selesai',
  'done-photoshoot': 'Photoshoot Selesai',
  'start-editing': 'Mula Edit',
  'ready-for-delivery': 'Sedia Hantar',
  'completed': 'Selesai',
  'rescheduled': 'Dijadual Semula',
  'no-show': 'Tidak Hadir',
  'cancelled': 'Dibatalkan',
};

export function BookingTable({ bookings, onViewBooking, onStatusUpdate, onRescheduleSuccess }: BookingTableProps) {
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
    </div>
  );
}
