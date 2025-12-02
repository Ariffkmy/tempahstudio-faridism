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
            <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Today's Bookings"
              value="8"
              description="3 pending confirmation"
              icon={Calendar}
              trend={{ value: 12, positive: true }}
            />
            <StatsCard
              title="Revenue (This Week)"
              value="RM 4,520"
              description="From 12 bookings"
              icon={DollarSign}
              trend={{ value: 8, positive: true }}
            />
            <StatsCard
              title="New Customers"
              value="24"
              description="This month"
              icon={Users}
              trend={{ value: 5, positive: true }}
            />
            <StatsCard
              title="Utilization Rate"
              value="78%"
              description="Across all studios"
              icon={TrendingUp}
              trend={{ value: 3, positive: true }}
            />
          </div>

          {/* Recent Bookings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Bookings</h2>
              <a href="/admin/bookings" className="text-sm text-primary hover:underline">
                View all
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
