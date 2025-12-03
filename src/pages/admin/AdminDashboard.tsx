import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { StatsCard } from '@/components/admin/StatsCard';
import { BookingTable } from '@/components/admin/BookingTable';
import { mockBookings } from '@/data/mockData';
import { Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import { Booking } from '@/types/booking';

const AdminDashboard = () => {
  const handleViewBooking = (booking: Booking) => {
    console.log('View booking:', booking);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="pl-64">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Hi admin!</p>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Tempahan Hari Ini"
              value="8"
              description="3 menunggu pengesahan"
              icon={Calendar}
              
            />
            <StatsCard
              title="Hasil (Minggu Ini)"
              value="RM 4,520"
              description="Daripada 12 tempahan"
              icon={DollarSign}
              
            />
            <StatsCard
              title="Pelanggan Setakat Ini"
              value="24"
              description="Bulan ini"
              icon={Users}
              
            />
            <StatsCard
              title="Slot Akan Datang"
              value="20 Slot"
              description="4 slot esok"
              icon={TrendingUp}
              
            />
          </div>

          {/* Recent Bookings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Tempahan Terkini</h2>
              <a href="/admin/bookings" className="text-sm text-primary hover:underline">
                Lihat semua
              </a>
            </div>
            <BookingTable 
              bookings={mockBookings} 
              onViewBooking={handleViewBooking}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
