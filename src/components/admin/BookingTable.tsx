import { format } from 'date-fns';
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
import { Booking, BookingStatus } from '@/types/booking';
import { Eye, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BookingTableProps {
  bookings: Booking[];
  onViewBooking: (booking: Booking) => void;
}

const statusVariants: Record<BookingStatus, 'success' | 'warning' | 'destructive' | 'secondary' | 'pending'> = {
  confirmed: 'success',
  pending: 'warning',
  cancelled: 'destructive',
  completed: 'secondary',
  'no-show': 'pending',
};

export function BookingTable({ bookings, onViewBooking }: BookingTableProps) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Layout</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No bookings found
              </TableCell>
            </TableRow>
          ) : (
            bookings.map((booking) => (
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
                    <p className="font-medium">{format(new Date(booking.date), 'MMM d, yyyy')}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.startTime} – {booking.endTime}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{booking.layoutName}</TableCell>
                <TableCell className="font-medium">RM {booking.totalPrice.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariants[booking.status]} className="capitalize">
                    {booking.status}
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
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Confirm</DropdownMenuItem>
                      <DropdownMenuItem>Cancel</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Refund</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
