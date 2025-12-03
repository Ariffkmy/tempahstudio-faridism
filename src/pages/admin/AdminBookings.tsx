import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { BookingTable } from '@/components/admin/BookingTable';
import { mockBookings } from '@/data/mockData';
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
import { Search, Download, CalendarDays, List, Clock, User, Plus } from 'lucide-react';
import { Booking } from '@/types/booking';

const AdminBookings = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDayBookings, setSelectedDayBookings] = useState<Booking[]>([]);

  const filteredBookings = mockBookings.filter((booking) => {
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

  const handleDayClick = (dayNumber: number) => {
    const dateStr = `2025-12-${dayNumber.toString().padStart(2, '0')}`;
    const bookingsOnThisDay = mockBookings.filter(booking => booking.date === dateStr);
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
              <Button onClick={() => navigate('/new-booking')}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Tempahan
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Eksport CSV
              </Button>
            </div>
          </div>

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
              <BookingTable 
                bookings={filteredBookings} 
                onViewBooking={handleViewBooking}
              />
            </TabsContent>

            <TabsContent value="calendar">
              <div className="rounded-lg border bg-card">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Disember 2025</h3>
                    <div className="text-sm text-muted-foreground">Tempahan untuk bulan ini</div>
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
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square"></div>
                    ))}

                    {/* Calendar days */}
                    {Array.from({ length: 31 }).map((_, day) => {
                      const dayNumber = day + 1;
                      const dateStr = `2025-12-${dayNumber.toString().padStart(2, '0')}`;

                      // Check if there are bookings on this date
                      const bookingsOnThisDay = mockBookings.filter(booking => booking.date === dateStr);
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
                <DialogTitle>Tempahan untuk {selectedDay} Disember 2025</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedDayBookings.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{booking.customerName}</span>
                      </div>
                      <Badge variant={
                        booking.status === 'confirmed' ? 'success' :
                        booking.status === 'pending' ? 'warning' :
                        booking.status === 'cancelled' ? 'destructive' : 'secondary'
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
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

export default AdminBookings;
