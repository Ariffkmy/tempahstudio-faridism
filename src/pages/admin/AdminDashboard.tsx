import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { StatsCard } from '@/components/admin/StatsCard';
import { BookingTable } from '@/components/admin/BookingTable';
import { Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { getDashboardStats, getStudioBookingsWithDetails, type DashboardStats } from '@/services/bookingService';
import type { BookingWithDetails } from '@/types/database';
import type { Booking } from '@/types/booking';

const AdminDashboard = () => {
  const { user, studio } = useAuth();
  
  // State for real data
  const [stats, setStats] = useState<DashboardStats>({
    todayBookings: 0,
    pendingBookings: 0,
    weeklyRevenue: 0,
    weeklyBookingsCount: 0,
    monthlyCustomers: 0,
    upcomingSlots: 0,
    tomorrowSlots: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real data from database
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!studio?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
        // Fetch stats and bookings in parallel
        const [statsData, bookingsData] = await Promise.all([
          getDashboardStats(studio.id),
          getStudioBookingsWithDetails(studio.id),
        ]);

        setStats(statsData);
        
        // Convert database bookings to the format expected by BookingTable
        const formattedBookings: Booking[] = bookingsData.slice(0, 10).map((b: BookingWithDetails) => ({
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

        setRecentBookings(formattedBookings);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [studio?.id]);

  const handleViewBooking = (booking: Booking) => {
    console.log('View booking:', booking);
    // TODO: Open booking detail modal
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="pl-64">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                  Selamat datang, {user?.full_name || 'Admin'}!
                </p>
              </div>
              {studio && (
                <div className="text-right">
                  <Badge variant="outline" className="mb-1">
                    {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'staff' ? 'Staff' : 'Admin'}
                  </Badge>
                  <p className="text-sm font-medium">{studio.name}</p>
                  {studio.location && (
                    <p className="text-xs text-muted-foreground">{studio.location}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Tempahan Hari Ini"
              value={isLoading ? '...' : stats.todayBookings.toString()}
              description={isLoading ? 'Memuatkan...' : `${stats.pendingBookings} menunggu pengesahan`}
              icon={Calendar}
            />
            <StatsCard
              title="Hasil (Minggu Ini)"
              value={isLoading ? '...' : formatCurrency(stats.weeklyRevenue)}
              description={isLoading ? 'Memuatkan...' : `Daripada ${stats.weeklyBookingsCount} tempahan`}
              icon={DollarSign}
            />
            <StatsCard
              title="Pelanggan Setakat Ini"
              value={isLoading ? '...' : stats.monthlyCustomers.toString()}
              description="Bulan ini"
              icon={Users}
            />
            <StatsCard
              title="Slot Akan Datang"
              value={isLoading ? '...' : `${stats.upcomingSlots} Slot`}
              description={isLoading ? 'Memuatkan...' : `${stats.tomorrowSlots} slot esok`}
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
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : recentBookings.length > 0 ? (
              <BookingTable 
                bookings={recentBookings} 
                onViewBooking={handleViewBooking}
              />
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Tiada Tempahan</h3>
                <p className="text-muted-foreground">
                  Belum ada tempahan untuk studio anda. Tempahan akan dipaparkan di sini.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
