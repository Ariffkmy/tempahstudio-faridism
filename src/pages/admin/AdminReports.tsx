import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockBookings } from '@/data/mockData';
import { TrendingUp, TrendingDown, Calendar, DollarSign, Users, Clock } from 'lucide-react';

const AdminReports = () => {
  // Calculate monthly data for the last 6 months
  const getMonthlyData = () => {
    const months = [];
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' });
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const monthBookings = mockBookings.filter(booking =>
        booking.date.startsWith(yearMonth)
      );

      const revenue = monthBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
      const bookingCount = monthBookings.length;

      months.push({
        month: monthName,
        bookings: bookingCount,
        revenue: revenue
      });
    }
    return months;
  };

  // Calculate payment status distribution
  const getStatusData = () => {
    // Simulate payment statuses with monetary values
    const fullPaidCount = Math.floor(mockBookings.length * 0.7);
    const depositOnlyCount = Math.floor(mockBookings.length * 0.2);
    const notFullyPaidCount = mockBookings.length - fullPaidCount - depositOnlyCount;

    // Calculate monetary values (assuming different payment amounts for each status)
    const fullPaidRevenue = mockBookings
      .slice(0, fullPaidCount)
      .reduce((sum, booking) => sum + booking.totalPrice, 0);

    const depositOnlyRevenue = mockBookings
      .slice(fullPaidCount, fullPaidCount + depositOnlyCount)
      .reduce((sum, booking) => sum + (booking.totalPrice * 0.3), 0); // 30% deposit

    const notFullyPaidRevenue = mockBookings
      .slice(fullPaidCount + depositOnlyCount)
      .reduce((sum, booking) => sum + (booking.totalPrice * 0.1), 0); // 10% partial payment

    const paymentStatuses = [
      {
        status: 'Sudah Bayar Penuh',
        count: fullPaidCount,
        amount: fullPaidRevenue,
        color: 'success'
      },
      {
        status: 'Bayar Deposit Sahaja',
        count: depositOnlyCount,
        amount: depositOnlyRevenue,
        color: 'warning'
      },
      {
        status: 'Belum Bayar Sepenuhnya',
        count: notFullyPaidCount,
        amount: notFullyPaidRevenue,
        color: 'destructive'
      }
    ];

    return paymentStatuses.map(item => ({
      status: item.status,
      count: item.count,
      amount: item.amount,
      percentage: ((item.count / mockBookings.length) * 100).toFixed(1),
      color: item.color
    }));
  };

  // Calculate layout popularity
  const getLayoutData = () => {
    const layoutCount = mockBookings.reduce((acc, booking) => {
      acc[booking.layoutName] = (acc[booking.layoutName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(layoutCount)
      .map(([layout, count]) => ({ layout, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Calculate time slot popularity
  const getTimeSlotData = () => {
    const timeSlots = mockBookings.reduce((acc, booking) => {
      const slot = `${booking.startTime} - ${booking.endTime}`;
      acc[slot] = (acc[slot] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(timeSlots)
      .map(([slot, count]) => ({ slot, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  // Calculate duration preferences
  const getDurationData = () => {
    const durationCount = mockBookings.reduce((acc, booking) => {
      acc[booking.duration] = (acc[booking.duration] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(durationCount)
      .map(([duration, count]) => ({ duration: parseInt(duration), count }))
      .sort((a, b) => a.duration - b.duration);
  };

  // Calculate revenue by layout
  const getRevenueByLayout = () => {
    const revenueByLayout = mockBookings.reduce((acc, booking) => {
      acc[booking.layoutName] = (acc[booking.layoutName] || 0) + booking.totalPrice;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(revenueByLayout)
      .map(([layout, revenue]) => ({ layout, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  };

  const monthlyData = getMonthlyData();
  const statusData = getStatusData();
  const layoutData = getLayoutData();
  const timeSlotData = getTimeSlotData();
  const durationData = getDurationData();
  const revenueByLayout = getRevenueByLayout();

  const totalRevenue = mockBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
  const totalBookings = mockBookings.length;
  const averageBookingValue = totalRevenue / totalBookings;

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
                
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jumlah Tempahan</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalBookings}</div>
                
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jumlah Selesai Edit</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bayaran Tertunggak</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">RM 2000</div>
                
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
                {/* Pie Chart */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      {statusData.map((item, index) => {
                        const previousPercentages = statusData.slice(0, index).reduce((sum, d) => sum + parseFloat(d.percentage), 0);
                        const startAngle = (previousPercentages / 100) * 360;
                        const endAngle = ((previousPercentages + parseFloat(item.percentage)) / 100) * 360;
                        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

                        const startX = 18 + 18 * Math.cos((startAngle * Math.PI) / 180);
                        const startY = 18 + 18 * Math.sin((startAngle * Math.PI) / 180);
                        const endX = 18 + 18 * Math.cos((endAngle * Math.PI) / 180);
                        const endY = 18 + 18 * Math.sin((endAngle * Math.PI) / 180);

                        const pathData = `M 18 18 L ${startX} ${startY} A 18 18 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

                        return (
                          <path
                            key={item.status}
                            d={pathData}
                            fill={`hsl(var(--${item.color === 'success' ? 'success' : item.color === 'warning' ? 'warning' : 'destructive'}))`}
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-lg font-bold">{statusData.length}</div>
                        <div className="text-xs text-muted-foreground">Status</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="space-y-3">
                  {statusData.map((item) => (
                    <div key={item.status} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded ${
                          item.color === 'success' ? 'bg-success' :
                          item.color === 'warning' ? 'bg-warning' :
                          'bg-destructive'
                        }`}></div>
                        <div>
                          <div className="font-medium text-sm">{item.status}</div>
                          <div className="text-xs text-muted-foreground">{item.count} tempahan</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">RM {item.amount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                      </div>
                    </div>
                  ))}

                  {/* Summary */}
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Jumlah Bayaran Diterima</span>
                      <span className="font-bold text-success">
                        RM {statusData.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                      </span>
                    </div>
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
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium">{item.layout}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{item.count}</div>
                        <div className="text-xs text-muted-foreground">tempahan</div>
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
                    <div key={item.slot} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium">{item.slot}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{item.count}</div>
                        <div className="text-xs text-muted-foreground">tempahan</div>
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
                  {durationData.map((item) => (
                    <div key={item.duration} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">1 jam</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">100</div>
                        <div className="text-xs text-muted-foreground">tempahan</div>
                      </div>
                    </div>
                  ))}
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
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium">{item.layout}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">RM {item.revenue.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {((item.revenue / totalRevenue) * 100).toFixed(1)}% daripada jumlah
                        </div>
                      </div>
                    </div>
                  ))}
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
