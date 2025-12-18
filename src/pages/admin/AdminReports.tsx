import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { StudioSelector } from '@/components/admin/StudioSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Users, Clock, BarChart3, Menu, Home, CalendarDays, Cog, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveStudioId } from '@/contexts/StudioContext';
import { getDashboardStats, getStudioBookingsWithDetails } from '@/services/bookingService';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import type { BookingWithDetails } from '@/types/database';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Tempahan', href: '/admin/bookings', icon: Calendar },
  { name: 'Laporan', href: '/admin/reports', icon: BarChart3 },
  { name: 'Tetapan', href: '/admin/settings', icon: Cog },
];

const AdminReports = () => {
  const { user, studio, logout, isSuperAdmin } = useAuth();
  const { isCollapsed } = useSidebar();
  const effectiveStudioId = useEffectiveStudioId();
  const location = useLocation();
  const isMobile = useIsMobile();

  // State for real data
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [stats, setStats] = useState({
    todayBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    totalBookingsCount: 0,
    monthlyCustomers: 0,
    upcomingSlots: 0,
    tomorrowSlots: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Helper functions
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
    // You might want to add navigation to login page here
  };

  // Fetch real data from database
  useEffect(() => {
    const fetchReportsData = async () => {
      if (!effectiveStudioId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Fetch bookings and stats in parallel
        const [statsData, bookingsData] = await Promise.all([
          getDashboardStats(effectiveStudioId),
          getStudioBookingsWithDetails(effectiveStudioId),
        ]);

        setStats(statsData);
        setBookings(bookingsData);
      } catch (error) {
        console.error('Error fetching reports data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportsData();
  }, [effectiveStudioId]);

  // Compute status data from real bookings
  const statusData = [
    { status: 'confirmed', count: bookings.filter(b => b.status === 'confirmed').length, color: 'text-green-600', label: 'Disahkan' },
    { status: 'pending', count: bookings.filter(b => b.status === 'pending').length, color: 'text-yellow-600', label: 'Menunggu' },
    { status: 'cancelled', count: bookings.filter(b => b.status === 'cancelled').length, color: 'text-red-600', label: 'Dibatalkan' },
    { status: 'completed', count: bookings.filter(b => b.status === 'completed').length, color: 'text-blue-600', label: 'Selesai' },
    { status: 'no-show', count: 0, color: 'text-gray-600', label: 'Tidak Hadir' },
  ];

  // Compute layout data from real bookings
  const layoutGroup = bookings.reduce((acc, booking) => {
    const layoutName = booking.studio_layout?.name || 'Unknown';
    if (!acc[layoutName]) {
      acc[layoutName] = { count: 0, revenue: 0 };
    }
    acc[layoutName].count++;
    acc[layoutName].revenue += Number(booking.total_price) || 0;
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  const layoutData = Object.entries(layoutGroup)
    .map(([layout, data]) => ({ layout, ...data }))
    .sort((a, b) => b.count - a.count);

  // Compute time slot data
  const timeSlotGroup = bookings.reduce((acc, booking) => {
    const time = booking.start_time.substring(0, 5); // Get HH:MM
    if (!acc[time]) {
      acc[time] = 0;
    }
    acc[time]++;
    return acc;
  }, {} as Record<string, number>);

  const timeSlotData = Object.entries(timeSlotGroup)
    .map(([time, count]) => ({
      time,
      count,
      popularity: count >= 3 ? 'Tinggi' : count >= 2 ? 'Sederhana' : 'Rendah'
    }))
    .sort((a, b) => b.count - a.count);

  // Compute duration data
  const durationGroup = bookings.reduce((acc, booking) => {
    const duration = booking.duration;
    if (!acc[duration]) {
      acc[duration] = 0;
    }
    acc[duration]++;
    return acc;
  }, {} as Record<number, number>);

  const durationData = Object.entries(durationGroup)
    .map(([duration, count]) => ({
      duration: parseInt(duration),
      count,
      label: `${duration} jam`
    }))
    .sort((a, b) => b.count - a.count);

  // Compute revenue by layout with percentages
  const totalRevenue = layoutData.reduce((sum, item) => sum + item.revenue, 0);
  const revenueByLayout = layoutData.map(item => ({
    layout: item.layout,
    revenue: item.revenue,
    percentage: totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100 * 10) / 10 : 0
  }));

  const totalBookings = bookings.length;
  const averageBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

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
            <h1 className="text-xl font-bold">Laporan test</h1>
            <p className="text-muted-foreground text-sm">Analisis perniagaan dan prestasi studio</p>
          </div>

          {/* Super Admin Studio Selector */}
          {isSuperAdmin && (
            <div className="mb-4">
              <StudioSelector />
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="transition-all duration-500 ease-in-out hover:scale-110 hover:shadow-xl cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                <CardTitle className="text-xs font-medium">Jumlah Hasil</CardTitle>
                <DollarSign className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pb-3 px-3">
                <div className="text-lg font-bold">RM {totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+20.1%</p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-500 ease-in-out hover:scale-110 hover:shadow-xl cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                <CardTitle className="text-xs font-medium">Tempahan</CardTitle>
                <Calendar className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pb-3 px-3">
                <div className="text-lg font-bold">{totalBookings}</div>
                <p className="text-xs text-muted-foreground">Jumlah</p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-500 ease-in-out hover:scale-110 hover:shadow-xl cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                <CardTitle className="text-xs font-medium">Selesai Edit</CardTitle>
                <Users className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pb-3 px-3">
                <div className="text-lg font-bold">{totalBookings}</div>
                <p className="text-xs text-muted-foreground">Jumlah</p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-500 ease-in-out hover:scale-110 hover:shadow-xl cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                <CardTitle className="text-xs font-medium">Tertunggak</CardTitle>
                <Clock className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pb-3 px-3">
                <div className="text-lg font-bold">RM 0</div>
                <p className="text-xs text-muted-foreground">Jumlah</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 gap-4">
            {/* Status Pembayaran */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Status Pembayaran</CardTitle>
                <CardDescription className="text-xs">Data ringkas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {statusData.slice(0, 3).map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.color === 'text-green-600' ? 'bg-green-500' :
                        item.color === 'text-yellow-600' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                    <div className="text-sm font-semibold">{item.count}</div>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Jumlah: {statusData.reduce((sum, item) => sum + item.count, 0)} tempahan
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Layout Studio */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Layout Studio</CardTitle>
                <CardDescription className="text-xs">Data ringkas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {layoutData.slice(0, 3).map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-${['yellow', 'green', 'blue'][itemIndex]}-500`} />
                      <span className="text-xs font-medium">{item.layout}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{item.count}</div>
                      <div className="text-xs text-muted-foreground">RM {item.revenue.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Slot Masa */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Slot Masa</CardTitle>
                <CardDescription className="text-xs">Data ringkas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {timeSlotData.slice(0, 3).map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.popularity === 'Tinggi' ? 'bg-green-500' :
                        item.popularity === 'Sederhana' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                      <span className="text-xs font-medium">{item.time}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{item.count}</div>
                      <Badge variant="outline" className={`text-xs ml-2 ${item.popularity === 'Tinggi' ? 'text-green-600' :
                        item.popularity === 'Sederhana' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {item.popularity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tempoh Masa */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tempoh Masa</CardTitle>
                <CardDescription className="text-xs">Data ringkas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {durationData.slice(0, 3).map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-${['blue', 'green', 'purple'][itemIndex]}-500`} />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                    <div className="text-sm font-semibold">{item.count}</div>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Jumlah: {durationData.reduce((sum, item) => sum + item.count, 0)} tempahan
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hasil Layout */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Hasil Layout</CardTitle>
                <CardDescription className="text-xs">Data ringkas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {revenueByLayout.slice(0, 3).map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-${['yellow', 'green', 'blue'][itemIndex]}-500`} />
                      <span className="text-xs font-medium">{item.layout}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">RM {item.revenue.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Jumlah hasil: RM {revenueByLayout.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  } else {
    return (
      <div className="min-h-screen bg-background">
        <AdminSidebar />

        <main className={cn("transition-all duration-300", isCollapsed ? "pl-16" : "pl-64")}>
          <div className="p-8">


            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Laporan</h1>
              <p className="text-muted-foreground">Analisis perniagaan dan prestasi studio</p>
            </div>

            {/* Super Admin Studio Selector */}
            {isSuperAdmin && (
              <div className="mb-6">
                <StudioSelector />
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="transition-all duration-500 ease-in-out hover:scale-110 hover:shadow-xl cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Jumlah Hasil</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">RM {totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+20.1% dari bulan lalu</p>
                </CardContent>
              </Card>

              <Card className="transition-all duration-500 ease-in-out hover:scale-110 hover:shadow-xl cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Jumlah Tempahan</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalBookings}</div>
                  <p className="text-xs text-muted-foreground">Tiada data tersedia</p>
                </CardContent>
              </Card>

              <Card className="transition-all duration-500 ease-in-out hover:scale-110 hover:shadow-xl cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Jumlah Selesai Edit</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalBookings}</div>
                  <p className="text-xs text-muted-foreground">Tiada data tersedia</p>
                </CardContent>
              </Card>

              <Card className="transition-all duration-500 ease-in-out hover:scale-110 hover:shadow-xl cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bayaran Tertunggak</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">RM 0</div>
                  <p className="text-xs text-muted-foreground">Tiada data tersedia</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Payment Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Taburan Status Pembayaran</CardTitle>
                  <CardDescription>Status pembayaran semua tempahan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statusData.map((item) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={item.color}>
                            {item.label}
                          </Badge>
                        </div>
                        <div className="text-lg font-semibold">{item.count}</div>
                      </div>
                    ))}
                    <div className="pt-2 border-t">
                      <div className="text-sm text-muted-foreground">Jumlah: {statusData.reduce((sum, item) => sum + item.count, 0)} tempahan</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chart 3: Layout Popularity */}
              <Card>
                <CardHeader>
                  <CardTitle>Layout studio</CardTitle>
                  <CardDescription>Layout studio yang paling digemari</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {layoutData.map((item, index) => (
                      <div key={item.layout} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-green-500' : 'bg-blue-500'}`} />
                          <span className="text-sm font-medium">{item.layout}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">{item.count}</div>
                          <div className="text-xs text-muted-foreground">RM {item.revenue.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Chart 4: Most Popular Time Slots */}
              <Card>
                <CardHeader>
                  <CardTitle>Slot Masa</CardTitle>
                  <CardDescription>Masa yang paling banyak ditempah</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {timeSlotData.map((item, index) => (
                      <div key={item.time} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${item.popularity === 'Tinggi' ? 'bg-green-500' : item.popularity === 'Sederhana' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                          <span className="text-sm font-medium">{item.time}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">{item.count}</div>
                          <Badge variant="outline" className={`text-xs ${item.popularity === 'Tinggi' ? 'text-green-600' :
                            item.popularity === 'Sederhana' ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                            {item.popularity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Chart 5: Duration Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Tempoh Masa</CardTitle>
                  <CardDescription>Tempoh tempahan yang paling popular</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {durationData.map((item, index) => (
                      <div key={item.duration} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-green-500' : 'bg-purple-500'}`} />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <div className="text-lg font-semibold">{item.count}</div>
                      </div>
                    ))}
                    <div className="pt-2 border-t">
                      <div className="text-sm text-muted-foreground">
                        Rajah bilangan: {durationData.reduce((sum, item) => sum + item.count, 0)} tempahan
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chart 6: Revenue by Layout */}
              <Card>
                <CardHeader>
                  <CardTitle>Keuntungan Berdasarkan Layout Studio</CardTitle>
                  <CardDescription>Hasil yang dijana oleh setiap layout studio</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {revenueByLayout.map((item, index) => (
                      <div key={item.layout} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-green-500' : 'bg-blue-500'}`} />
                          <span className="text-sm font-medium">{item.layout}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-semibold">RM {item.revenue.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t">
                      <div className="text-sm text-muted-foreground">
                        Jumlah hasil: RM {revenueByLayout.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }
};

export default AdminReports;
