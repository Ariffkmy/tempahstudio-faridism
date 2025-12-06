import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { StatsCard } from '@/components/admin/StatsCard';
import { BookingTable } from '@/components/admin/BookingTable';
import { Calendar, DollarSign, Users, TrendingUp, Menu, Home, BarChart3, BookOpen, Cog, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getDashboardStats, getStudioBookingsWithDetails, type DashboardStats } from '@/services/bookingService';
import type { BookingWithDetails } from '@/types/database';
import type { Booking } from '@/types/booking';
import { useIsMobile } from '@/hooks/use-mobile';

const navigation = [
  { name: 'Papan Pemuka', href: '/admin', icon: Home },
  { name: 'Tempahan', href: '/admin/bookings', icon: Calendar },
  { name: 'Laporan', href: '/admin/reports', icon: BarChart3 },
  { name: 'Tetapan', href: '/admin/settings', icon: Cog },
];

const AdminDashboard = () => {
  const { user, studio, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

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

  // Get user initials for avatar
  const getInitials = (name: string | undefined) => {
    if (!name) return 'AD';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: 'Log keluar berjaya',
      description: 'Anda telah log keluar dari sistem',
    });
    navigate('/admin/login');
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/admin" className="flex items-center gap-2">
              <img src="/studiorayalogo.png" alt="Raya Studio Logo" style={{ width: '32px', height: '19px' }} />
              <span className="font-semibold text-sm">Raya Studio</span>
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col h-full">
                  {/* Logo & Studio Info */}
                  <div className="p-4 border-b border-border">
                    <Link to="/admin" className="flex items-center gap-2 mb-3">
                      <img src="/studiorayalogo.png" alt="Raya Studio Logo" style={{ width: '48px', height: '29px' }} />
                      <div>
                        <span className="font-semibold">Raya Studio</span>
                        <p className="text-xs text-muted-foreground">Portal Admin</p>
                      </div>
                    </Link>
                    {/* Current Studio Badge */}
                    {studio && (
                      <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/50 rounded-md">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{studio.name}</p>
                          {studio.location && (
                            <p className="text-[10px] text-muted-foreground truncate">{studio.location}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex-1 p-4">
                    <nav className="space-y-1">
                      {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                              isActive
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                          >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Footer - User Info & Logout */}
                  <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {getInitials(user?.full_name)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user?.full_name || 'Admin'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email || 'admin@rayastudio.com'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-muted-foreground hover:text-destructive"
                      size="sm"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Log keluar
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="p-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Selamat datang, {user?.full_name || 'Admin'}!
            </p>
            {studio && (
              <div className="mt-2">
                <Badge variant="outline" className="mb-1">
                  {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'staff' ? 'Staff' : 'Admin'}
                </Badge>
                <p className="text-xs font-medium">{studio.name}</p>
                {studio.location && (
                  <p className="text-[10px] text-muted-foreground">{studio.location}</p>
                )}
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-3 mb-6">
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
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">Tempahan Terkini</h2>
              <Link to="/admin/bookings" className="text-xs text-primary hover:underline">
                Lihat semua
              </Link>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : recentBookings.length > 0 ? (
              <div className="space-y-2">
                {recentBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="bg-card border border-border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium">{booking.customerName}</p>
                        <p className="text-xs text-muted-foreground">{booking.layoutName}</p>
                      </div>
                      <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                        {booking.status === 'confirmed' ? 'Disahkan' : booking.status === 'pending' ? 'Menunggu' : booking.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{new Date(booking.date).toLocaleDateString('ms-MY')}</span>
                      <span>{booking.startTime} - {booking.endTime}</span>
                      <span>{formatCurrency(booking.totalPrice)}</span>
                    </div>
                  </div>
                ))}
                {recentBookings.length > 5 && (
                  <Link to="/admin/bookings" className="block text-center text-sm text-primary hover:underline mt-2">
                    Lihat lebih banyak
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed">
                <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-sm font-medium mb-1">Tiada Tempahan</h3>
                <p className="text-muted-foreground text-xs">
                  Belum ada tempahan untuk studio anda.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  } else {
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
  }
};

export default AdminDashboard;
