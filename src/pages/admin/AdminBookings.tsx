import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { BookingTable } from '@/components/admin/BookingTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Download, CalendarDays, List, Clock, User, Plus, Copy, ExternalLink } from 'lucide-react';
import { Booking } from '@/types/booking';
import { useAuth } from '@/contexts/AuthContext';
import { getStudioBookingsWithDetails } from '@/services/bookingService';
import { loadStudioSettings } from '@/services/studioSettings';
import type { BookingWithDetails } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

const AdminBookings = () => {
  const navigate = useNavigate();
  const { studio } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDayBookings, setSelectedDayBookings] = useState<Booking[]>([]);

  // State for real data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookingLink, setBookingLink] = useState('');

  // Fetch real bookings and studio settings from database
  useEffect(() => {
    const fetchData = async () => {
      if (!studio?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Fetch bookings
        const bookingsData = await getStudioBookingsWithDetails(studio.id);

        // Convert database bookings to the format expected by BookingTable
        const formattedBookings: Booking[] = bookingsData.map((b: BookingWithDetails) => ({
          id: b.id,
          reference: b.reference,
          customerId: b.customer_id,
          customerName: b.customer?.name || 'Unknown',
          customerEmail: b.customer?.email || '',
          customerPhone: b.customer?.phone || '',
          companyId: b.company_id,
          studioId: b.studio_id,
          layoutId: b.layout_id,
          layoutName: b.studio_layout?.name || 'Unknown',
          date: b.date,
          startTime: b.start_time,
          endTime: b.end_time,
          duration: b.duration,
          totalPrice: Number(b.total_price),
          status: b.status,
          notes: b.notes || undefined,
          internalNotes: b.internal_notes || undefined,
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        }));

        setBookings(formattedBookings);

        // Generate booking link for this studio
        const baseUrl = window.location.origin;
        const studioBookingLink = `${baseUrl}/book/${studio.id}`;
        setBookingLink(studioBookingLink);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [studio?.id]);

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewBooking = (booking: Booking) => {
    console.log('View booking:', booking);
  };

  // Get current month info
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const monthNames = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 
                      'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];

  const handleDayClick = (dayNumber: number) => {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNumber.toString().padStart(2, '0')}`;
    const bookingsOnThisDay = bookings.filter(booking => booking.date === dateStr);
    setSelectedDay(dayNumber);
    setSelectedDayBookings(bookingsOnThisDay);
  };

  const closeDayDialog = () => {
    setSelectedDay(null);
    setSelectedDayBookings([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <main className="pl-64">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">Tempahan</h1>
              <p className="text-muted-foreground">Urus dan lihat semua tempahan studio</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate(`/book/${studio?.id}`)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Tempahan
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Eksport CSV
              </Button>
            </div>
          </div>

          {/* Booking Link - Prominent Display */}
          {bookingLink && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-primary">Pautan Tempahan Awam</h3>
                  </div>
                  <p className="text-muted-foreground mb-3">
                    Kongsi pautan ini dengan pelanggan untuk membuat tempahan secara langsung
                  </p>
                  <div className="bg-background border rounded-md p-3">
                    <code className="text-sm font-mono break-all">{bookingLink}</code>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-6">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(bookingLink);
                      toast({
                        description: "Pautan telah disalin!",
                      });
                    }}
                    className="min-w-[120px]"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Salin
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(bookingLink, '_blank')}
                    className="min-w-[120px]"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Buka
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari mengikut nama, emel, atau rujukan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tapis mengikut status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="confirmed">Disahkan</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="list" className="space-y-4">
            <TabsList>
              <TabsTrigger value="list">
                <List className="h-4 w-4 mr-2" />
                Paparan Senarai
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <CalendarDays className="h-4 w-4 mr-2" />
                Paparan Kalendar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredBookings.length > 0 ? (
                <BookingTable 
                  bookings={filteredBookings} 
                  onViewBooking={handleViewBooking}
                />
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                  <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Tiada Tempahan</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Tiada tempahan yang sepadan dengan carian anda.'
                      : 'Belum ada tempahan untuk studio anda.'}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="calendar">
              <div className="rounded-lg border bg-card">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">{monthNames[month]} {year}</h3>
                    <div className="text-sm text-muted-foreground">
                      {bookings.length} tempahan
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'].map((day) => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for days before the 1st */}
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square"></div>
                    ))}

                    {/* Calendar days */}
                    {Array.from({ length: daysInMonth }).map((_, day) => {
                      const dayNumber = day + 1;
                      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNumber.toString().padStart(2, '0')}`;

                      // Check if there are bookings on this date
                      const bookingsOnThisDay = bookings.filter(booking => booking.date === dateStr);
                      const hasBookings = bookingsOnThisDay.length > 0;

                      return (
                        <div
                          key={dayNumber}
                          onClick={() => hasBookings && handleDayClick(dayNumber)}
                          className={`aspect-square border rounded-lg p-1 text-sm relative cursor-pointer ${
                            hasBookings
                              ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
                              : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <div className="text-center font-medium">{dayNumber}</div>
                          {hasBookings && (
                            <div className="absolute bottom-1 left-1 right-1">
                              <div className="text-xs bg-primary text-primary-foreground rounded px-1 py-0.5 text-center">
                                {bookingsOnThisDay.length} tempahan
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-6 space-y-3">
                    <p className="text-sm text-muted-foreground">Klik untuk lihat tempahan</p>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border rounded bg-primary/10 border-primary/20"></div>
                        <span>Ada tempahan</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border rounded border-border"></div>
                        <span>Tiada tempahan</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Day Bookings Dialog */}
          <Dialog open={selectedDay !== null} onOpenChange={closeDayDialog}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tempahan untuk {selectedDay} {monthNames[month]} {year}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedDayBookings.length > 0 ? (
                  selectedDayBookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{booking.customerName}</span>
                        </div>
                        <Badge variant={
                          booking.status === 'confirmed' ? 'default' :
                          booking.status === 'pending' ? 'secondary' :
                          booking.status === 'cancelled' ? 'destructive' : 'outline'
                        } className="capitalize">
                          {booking.status === 'confirmed' ? 'Disahkan' :
                           booking.status === 'pending' ? 'Menunggu' :
                           booking.status === 'cancelled' ? 'Dibatalkan' : 'Selesai'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.startTime} – {booking.endTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.duration} jam</span>
                        </div>
                      </div>

                      <div className="text-sm">
                        <span className="font-medium">Layout:</span> {booking.layoutName}
                      </div>

                      <div className="text-sm">
                        <span className="font-medium">Rujukan:</span> {booking.reference}
                      </div>

                      {booking.notes && (
                        <div className="text-sm">
                          <span className="font-medium">Catatan:</span> {booking.notes}
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Jumlah:</span> RM {booking.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Tiada tempahan pada tarikh ini.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

export default AdminBookings;
