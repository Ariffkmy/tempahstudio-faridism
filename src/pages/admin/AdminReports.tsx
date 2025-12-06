import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Users, Clock, BarChart3, Menu, Home, CalendarDays, Cog, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Papan Pemuka', href: '/admin', icon: Home },
  { name: 'Tempahan', href: '/admin/bookings', icon: Calendar },
  { name: 'Laporan', href: '/admin/reports', icon: BarChart3 },
  { name: 'Tetapan', href: '/admin/settings', icon: Cog },
];

const AdminReports = () => {
  const { user, studio, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

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

  // Dummy data based on mock bookings
  const statusData = [
    { status: 'confirmed', count: 5, color: 'text-green-600', label: 'Disahkan' },
    { status: 'pending', count: 3, color: 'text-yellow-600', label: 'Menunggu' },
    { status: 'cancelled', count: 0, color: 'text-red-600', label: 'Dibatalkan' },
    { status: 'completed', count: 0, color: 'text-blue-600', label: 'Selesai' },
    { status: 'no-show', count: 0, color: 'text-gray-600', label: 'Tidak Hadir' },
  ];

  const layoutData = [
    { layout: 'Studio Minimalist', count: 3, revenue: 3360 },
    { layout: 'Studio Klasik', count: 3, revenue: 1200 },
    { layout: 'Studio Moden', count: 2, revenue: 1200 },
  ];

  const timeSlotData = [
    { time: '10:00', count: 3, popularity: 'Tinggi' },
    { time: '14:00', count: 2, popularity: 'Sederhana' },
    { time: '13:00', count: 1, popularity: 'Rendah' },
    { time: '09:00', count: 1, popularity: 'Rendah' },
  ];

  const durationData = [
    { duration: 4, count: 3, label: '4 jam' },
    { duration: 3, count: 3, label: '3 jam' },
    { duration: 5, count: 2, label: '5 jam' },
  ];

  const revenueByLayout = [
    { layout: 'Studio Minimalist', revenue: 3360, percentage: 56 },
    { layout: 'Studio Klasik', revenue: 1300, percentage: 21.7 },
    { layout: 'Studio Moden', revenue: 1280, percentage: 21.3 },
  ];

  const monthlyData = [
    { month: 'Nov 2024', bookings: 8, revenue: 4740 },
    { month: 'Dec 2024', bookings: 0, revenue: 0 },
  ];

  const totalRevenue = 4740;
  const totalBookings = 8;
  const averageBookingValue = Math.round(totalRevenue / totalBookings);

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
            <h1 className="text-xl font-bold">Laporan</h1>
            <p className="text-muted-foreground text-sm">Analisis perniagaan dan prestasi studio</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                <CardTitle className="text-xs font-medium">Jumlah Hasil</CardTitle>
                <DollarSign className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pb-3 px-3">
                <div className="text-lg font-bold">RM {totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+20.1%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                <CardTitle className="text-xs font-medium">Tempahan</CardTitle>
                <Calendar className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pb-3 px-3">
                <div className="text-lg font-bold">{totalBookings}</div>
                <p className="text-xs text-muted-foreground">Jumlah</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                <CardTitle className="text-xs font-medium">Selesai Edit</CardTitle>
                <Users className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pb-3 px-3">
                <div className="text-lg font-bold">{totalBookings}</div>
                <p className="text-xs text-muted-foreground">Jumlah</p>
              </CardContent>
            </Card>

            <Card>
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
                      <div className={`w-2 h-2 rounded-full ${
                        item.color === 'text-green-600' ? 'bg-green-500' :
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
                      <div className={`w-2 h-2 rounded-full ${
                        item.popularity === 'Tinggi' ? 'bg-green-500' :
                        item.popularity === 'Sederhana' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="text-xs font-medium">{item.time}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{item.count}</div>
                      <Badge variant="outline" className={`text-xs ml-2 ${
                        item.popularity === 'Tinggi' ? 'text-green-600' :
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

        <main className="pl-64">
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Laporan</h1>
              <p className="text-muted-foreground">Analisis perniagaan dan prestasi studio</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Jumlah Hasil</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">RM {totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+20.1% dari bulan lalu</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Jumlah Tempahan</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalBookings}</div>
                  <p className="text-xs text-muted-foreground">Tiada data tersedia</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Jumlah Selesai Edit</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalBookings}</div>
                  <p className="text-xs text-muted-foreground">Tiada data tersedia</p>
                </CardContent>
              </Card>

              <Card>
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
                          <Badge variant="outline" className={`text-xs ${
                            item.popularity === 'Tinggi' ? 'text-green-600' :
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
