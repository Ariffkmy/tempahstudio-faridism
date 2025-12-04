import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Users, Clock, BarChart3 } from 'lucide-react';

const AdminReports = () => {
  // Empty data states - will be populated from database later
  const monthlyData = [];
  const statusData = [];
  const layoutData = [];
  const timeSlotData = [];
  const durationData = [];
  const revenueByLayout = [];

  const totalRevenue = 0;
  const totalBookings = 0;
  const averageBookingValue = 0;

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
                <p className="text-xs text-muted-foreground">Tiada data tersedia</p>
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
                <div className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">Tiada data tempahan tersedia</p>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Data akan dipaparkan apabila terdapat tempahan
                  </p>
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
                <div className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">Tiada data layout tersedia</p>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Data akan dipaparkan apabila terdapat tempahan
                  </p>
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
                <div className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">Tiada data slot masa tersedia</p>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Data akan dipaparkan apabila terdapat tempahan
                  </p>
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
                <div className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">Tiada data tempoh masa tersedia</p>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Data akan dipaparkan apabila terdapat tempahan
                  </p>
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
                <div className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">Tiada data keuntungan tersedia</p>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Data akan dipaparkan apabila terdapat tempahan
                  </p>
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
