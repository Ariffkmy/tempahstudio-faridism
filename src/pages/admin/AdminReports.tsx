import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Users, Clock, BarChart3 } from 'lucide-react';

const AdminReports = () => {
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
};

export default AdminReports;
