import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { StudioSelector } from '@/components/admin/StudioSelector';
import { BookingTable } from '@/components/admin/BookingTable';
import { BookingDetailModal } from '@/components/admin/BookingDetailModal';
import { RescheduleDialog } from '@/components/admin/RescheduleDialog';
import { AdminCreateBookingDialog } from '@/components/admin/AdminCreateBookingDialog';
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CalendarDays,
  Plus,
  Download,
  Menu,
  Building2,
  LogOut,
  LayoutDashboard,
  Users,
  Calendar,
  Package,
  BarChart3,
  Cog,
  Send,
  List,
  MoreHorizontal,
  Eye,
  Clock,
  User,
  Copy,
  ExternalLink,
  Home,
} from 'lucide-react';
import { Booking } from '@/types/booking';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveStudioId } from '@/contexts/StudioContext';
import { getStudioBookingsWithDetails, updateBookingStatus } from '@/services/bookingService';
import { getActivePhotographers, getActiveEditors } from '@/services/studioStaffService';
import { loadStudioSettings } from '@/services/studioSettings';
import type { BookingWithDetails } from '@/types/database';
import type { StudioStaff } from '@/types/studioStaff';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ms } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { parseDateLocal } from '@/utils/dateUtils';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Tempahan', href: '/admin/bookings', icon: CalendarDays },
  { name: 'Whatsapp Blaster', href: '/admin/whatsapp-blaster', icon: Send },
  { name: 'Laporan', href: '/admin/reports', icon: BarChart3 },
  { name: 'Tetapan', href: '/admin/settings', icon: Cog },
];

const AdminBookings = () => {
  const navigate = useNavigate();
  const { studio, user, logout, isSuperAdmin } = useAuth();
  const effectiveStudioId = useEffectiveStudioId();
  const location = useLocation();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDayBookings, setSelectedDayBookings] = useState<Booking[]>([]);

  // State for real data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookingLink, setBookingLink] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Reschedule dialog state
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [bookingToReschedule, setBookingToReschedule] = useState<Booking | null>(null);

  // Create booking dialog state
  const [createBookingDialogOpen, setCreateBookingDialogOpen] = useState(false);

  // Staff data state
  const [photographers, setPhotographers] = useState<StudioStaff[]>([]);
  const [editors, setEditors] = useState<StudioStaff[]>([]);

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
    toast({
      title: 'Log keluar berjaya',
      description: 'Anda telah log keluar dari sistem',
    });
    navigate('/admin/login');
  };

  // Fetch real bookings and studio settings from database
  const fetchData = async () => {
    if (!effectiveStudioId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch bookings and staff data in parallel
      const [bookingsData, photographersData, editorsData] = await Promise.all([
        getStudioBookingsWithDetails(effectiveStudioId),
        getActivePhotographers(effectiveStudioId),
        getActiveEditors(effectiveStudioId),
      ]);

      // Convert database bookings to the format expected by BookingTable
      const formattedBookings: Booking[] = bookingsData.map((b: BookingWithDetails) => ({
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
        photographerId: b.photographer_id || undefined,
        editorId: b.editor_id || undefined,
        photographerName: (b as any).photographer?.name || undefined,
        editorName: (b as any).editor?.name || undefined,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
      }));

      setBookings(formattedBookings);
      setPhotographers(photographersData);
      setEditors(editorsData);

      // Fetch studio slug for cleaner booking link
      const { data: studioData } = await supabase
        .from('studios')
        .select('slug')
        .eq('id', effectiveStudioId)
        .single();

      // Generate booking link for this studio - use slug if available
      const baseUrl = window.location.origin;
      const studioBookingLink = studioData?.slug
        ? `${baseUrl}/${studioData.slug}`
        : `${baseUrl}/book/${effectiveStudioId}`;
      setBookingLink(studioBookingLink);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [effectiveStudioId]);

  // Refresh bookings without full loading state
  const refreshBookings = useCallback(async () => {
    console.log('[AdminBookings] refreshBookings started');
    if (!effectiveStudioId) {
      console.log('[AdminBookings] No effectiveStudioId, returning');
      return;
    }

    try {
      console.log('[AdminBookings] Fetching bookings data...');
      const bookingsData = await getStudioBookingsWithDetails(effectiveStudioId);
      console.log('[AdminBookings] Bookings data fetched:', bookingsData.length);

      const formattedBookings: Booking[] = bookingsData.map((b: BookingWithDetails) => ({
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
        photographerId: b.photographer_id || undefined,
        editorId: b.editor_id || undefined,
        photographerName: (b as any).photographer?.name || undefined,
        editorName: (b as any).editor?.name || undefined,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
      }));

      console.log('[AdminBookings] Setting bookings state...');
      setBookings(formattedBookings);
      console.log('[AdminBookings] Bookings state updated successfully');
    } catch (error) {
      console.error('[AdminBookings] Error refreshing bookings:', error);
    }
  }, [effectiveStudioId]);



  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleOpenReschedule = (booking: Booking) => {
    setBookingToReschedule(booking);
    setRescheduleDialogOpen(true);
  };

  const handleRescheduleSuccess = () => {
    console.log('[AdminBookings] handleRescheduleSuccess called');
    setRescheduleDialogOpen(false);
    setBookingToReschedule(null);
    console.log('[AdminBookings] Calling refreshBookings');
    refreshBookings();
    console.log('[AdminBookings] refreshBookings called');
  };

  const handleExportCSV = () => {
    // Prepare CSV headers
    const headers = ['Rujukan', 'Nama Pelanggan', 'Email', 'Telefon', 'Tarikh', 'Masa Mula', 'Masa Tamat', 'Tempoh (Jam)', 'Layout', 'Jumlah (RM)', 'Status', 'Catatan'];

    // Prepare CSV rows
    const rows = bookings.map(booking => [
      booking.reference,
      booking.customerName,
      booking.customerEmail,
      booking.customerPhone || '-',
      parseDateLocal(booking.date).toLocaleDateString('ms-MY'),
      booking.startTime,
      booking.endTime,
      booking.duration.toString(),
      booking.layoutName,
      booking.totalPrice.toFixed(2),
      booking.status === 'done-payment' ? 'Bayaran Selesai' :
        booking.status === 'done-photoshoot' ? 'Photoshoot Selesai' :
          booking.status === 'start-editing' ? 'Mula Edit' :
            booking.status === 'ready-for-delivery' ? 'Sedia Hantar' :
              booking.status === 'completed' ? 'Selesai' :
                booking.status === 'rescheduled' ? 'Dijadual Semula' :
                  booking.status === 'no-show' ? 'Tidak Hadir' :
                    booking.status === 'cancelled' ? 'Dibatalkan' : booking.status,
      booking.notes || '-'
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `tempahan_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Eksport Berjaya',
      description: `${bookings.length} tempahan telah dieksport ke CSV`,
    });
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      const result = await updateBookingStatus(bookingId, newStatus);

      if (result.success) {
        // Refresh bookings list
        const bookingsData = await getStudioBookingsWithDetails(effectiveStudioId!);
        const formattedBookings: Booking[] = bookingsData.map((b: any) => ({
          id: b.id,
          reference: b.reference,
          customerName: b.customer?.name || 'Unknown',
          customerEmail: b.customer?.email || '',
          customerPhone: b.customer?.phone || '',
          date: b.date,
          startTime: b.start_time,
          endTime: b.end_time,
          duration: b.duration,
          layoutName: b.studio_layout?.name || 'Unknown Layout',
          totalPrice: Number(b.total_price),
          status: b.status,
          notes: b.notes || undefined,
          internalNotes: b.internal_notes || undefined,
          customerId: b.customer_id,
          companyId: b.company_id,
          studioId: b.studio_id,
          layoutId: b.layout_id,
          photographerId: b.photographer_id || undefined,
          editorId: b.editor_id || undefined,
          photographerName: (b as any).photographer?.name || undefined,
          editorName: (b as any).editor?.name || undefined,
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        }));
        setBookings(formattedBookings);

        toast({
          title: 'Status Dikemaskini',
          description: 'Status tempahan berjaya dikemaskini',
        });
      } else {
        toast({
          title: 'Ralat',
          description: result.error || 'Gagal mengemaskini status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Ralat',
        description: 'Gagal mengemaskini status tempahan',
        variant: 'destructive',
      });
    }
  };

  const handleAssignmentUpdate = async (bookingId: string, photographerId?: string | null, editorId?: string | null) => {
    try {
      const { updateBookingAssignment } = await import('@/services/bookingService');
      const result = await updateBookingAssignment(bookingId, photographerId, editorId);

      if (result.success) {
        // Refresh bookings to show updated assignments
        await refreshBookings();

        toast({
          title: 'Tugasan Dikemaskini',
          description: 'Tugasan photographer dan editor berjaya dikemaskini',
        });
      } else {
        toast({
          title: 'Ralat',
          description: result.error || 'Gagal mengemaskini tugasan',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: 'Ralat',
        description: 'Gagal mengemaskini tugasan',
        variant: 'destructive',
      });
    }
  };

  // Get current month info
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const monthNames = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];

  const handleDayClick = (dayNumber: number) => {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNumber.toString().padStart(2, '0')}`;
    const bookingsOnThisDay = bookings.filter(booking => booking.date === dateStr);
    setSelectedDay(dayNumber);
    setSelectedDayBookings(bookingsOnThisDay);
  };

  const closeDayDialog = () => {
    setSelectedDay(null);
    setSelectedDayBookings([]);
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/admin" className="flex items-center gap-2">
              <img src="/tempahstudiologo.png" alt="Tempah Studio Logo" style={{ width: '32px', height: '19px' }} />
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
                      <img src="/tempahstudiologo.png" alt="Tempah Studio Logo" style={{ width: '48px', height: '29px' }} />
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
            <h1 className="text-xl font-bold">Tempahan</h1>
            <p className="text-muted-foreground text-sm">Urus dan lihat semua tempahan studio</p>
            <div className="flex flex-col gap-2 mt-4">
              <Button onClick={() => setCreateBookingDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Tempahan
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Eksport CSV
              </Button>
            </div>
          </div>

          {/* Booking Link - Mobile Layout */}
          {bookingLink && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-primary">Pautan Tempahan Awam</h3>
              </div>
              <p className="text-muted-foreground text-xs mb-3">
                Kongsi pautan ini dengan pelanggan untuk membuat tempahan secara langsung
              </p>
              <div className="bg-background border rounded-md p-2 mb-3">
                <code className="text-xs font-mono break-all">{bookingLink}</code>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(bookingLink);
                    toast({
                      description: "Pautan telah disalin!",
                    });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Salin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(bookingLink, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Buka
                </Button>
              </div>
            </div>
          )}



          {/* Tabs */}
          <Tabs defaultValue="list" className="space-y-4">
            <TabsList className="w-full">
              <TabsTrigger value="list" className="flex-1">
                <List className="h-4 w-4 mr-2" />
                Senarai
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex-1">
                <CalendarDays className="h-4 w-4 mr-2" />
                Kalendar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : bookings.length > 0 ? (
                <div className="space-y-3">
                  {bookings.slice(0, 10).map((booking) => (
                    <div key={booking.id} className="bg-card border border-border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium">{booking.customerName}</p>
                          <p className="text-xs text-muted-foreground">{booking.layoutName}</p>
                        </div>
                        <Badge variant={
                          booking.status === 'done-payment' ? 'default' :
                            booking.status === 'done-photoshoot' ? 'secondary' :
                              booking.status === 'completed' ? 'default' :
                                booking.status === 'cancelled' ? 'destructive' :
                                  booking.status === 'no-show' ? 'destructive' : 'secondary'
                        }>
                          {booking.status === 'done-payment' ? 'Bayaran Selesai' :
                            booking.status === 'done-photoshoot' ? 'Photoshoot Selesai' :
                              booking.status === 'start-editing' ? 'Mula Edit' :
                                booking.status === 'ready-for-delivery' ? 'Sedia Hantar' :
                                  booking.status === 'completed' ? 'Selesai' :
                                    booking.status === 'rescheduled' ? 'Dijadual Semula' :
                                      booking.status === 'no-show' ? 'Tidak Hadir' :
                                        booking.status === 'cancelled' ? 'Dibatalkan' : booking.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                        <span>{parseDateLocal(booking.date).toLocaleDateString('ms-MY')}</span>
                        <span>{booking.startTime} - {booking.endTime}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span>{booking.reference}</span>
                        <span className="font-medium">RM {booking.totalPrice.toFixed(2)}</span>
                      </div>

                      {/* Status Update Dropdown */}
                      <div className="pt-2 border-t mt-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full h-7 text-xs">
                              <MoreHorizontal className="h-3 w-3 mr-1" />
                              Tukar Status
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewBooking(booking)}>
                              <Eye className="h-3 w-3 mr-2" />
                              Lihat Butiran
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusUpdate(booking.id, 'done-photoshoot')}>Photoshoot Selesai</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenReschedule(booking)}>Dijadual Semula</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleStatusUpdate(booking.id, 'no-show')}>Tidak Hadir</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleStatusUpdate(booking.id, 'cancelled')}>Dibatalkan</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed">
                  <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <h3 className="text-sm font-medium mb-1">Tiada Tempahan</h3>
                  <p className="text-muted-foreground text-xs">
                    Belum ada tempahan untuk studio anda.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="calendar">
              <div className="rounded-lg border bg-card">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">{monthNames[month]} {year}</h3>
                    <div className="text-xs text-muted-foreground">
                      {bookings.length} tempahan
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'].map((day) => (
                      <div key={day} className="p-2 text-center text-sm font-semibold text-muted-foreground">
                        {day.substring(0, 2)}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for days before the 1st */}
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square"></div>
                    ))}

                    {/* Calendar days */}
                    {Array.from({ length: daysInMonth }).map((_, day) => {
                      const dayNumber = day + 1;
                      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNumber.toString().padStart(2, '0')}`;

                      // Check if there are bookings on this date
                      const bookingsOnThisDay = bookings.filter(booking => booking.date === dateStr);
                      const hasBookings = bookingsOnThisDay.length > 0;

                      return (
                        <div
                          key={dayNumber}
                          onClick={() => hasBookings && handleDayClick(dayNumber)}
                          className={`aspect-square border rounded-md p-2 text-sm relative cursor-pointer transition-colors ${hasBookings
                            ? 'bg-primary/10 border-primary/30 text-primary font-semibold hover:bg-primary/20'
                            : 'border-border hover:bg-muted/50'
                            }`}
                        >
                          <div className="text-center font-medium">{dayNumber}</div>
                          {hasBookings && (
                            <div className="absolute bottom-1 left-0 right-0">
                              <div className="text-[10px] bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center mx-auto font-bold">
                                {bookingsOnThisDay.length}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 text-center">
                    <p className="text-xs text-muted-foreground"> Klik untuk lihat tempahan</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Day Bookings Dialog */}
          <Dialog open={selectedDay !== null} onOpenChange={closeDayDialog}>
            <DialogContent className="max-w-sm mx-4 max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-sm">
                  Tempahan untuk {selectedDay} {monthNames[month]} {year}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {selectedDayBookings.length > 0 ? (
                  selectedDayBookings.map((booking) => (
                    <div key={booking.id} className="border rounded-md p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">{booking.customerName}</span>
                        </div>
                        <Badge variant={
                          booking.status === 'done-payment' ? 'default' :
                            booking.status === 'done-photoshoot' ? 'secondary' :
                              booking.status === 'start-editing' ? 'secondary' :
                                booking.status === 'ready-for-delivery' ? 'default' :
                                  booking.status === 'completed' ? 'default' :
                                    booking.status === 'rescheduled' ? 'secondary' :
                                      booking.status === 'no-show' ? 'destructive' :
                                        booking.status === 'cancelled' ? 'destructive' : 'outline'
                        } className="text-xs">
                          {booking.status === 'done-payment' ? 'Bayaran Selesai' :
                            booking.status === 'done-photoshoot' ? 'Photoshoot Selesai' :
                              booking.status === 'start-editing' ? 'Mula Edit' :
                                booking.status === 'ready-for-delivery' ? 'Sedia Hantar' :
                                  booking.status === 'completed' ? 'Selesai' :
                                    booking.status === 'rescheduled' ? 'Dijadual Semula' :
                                      booking.status === 'no-show' ? 'Tidak Hadir' :
                                        booking.status === 'cancelled' ? 'Dibatalkan' : booking.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 gap-1 text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{booking.startTime} – {booking.endTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 text-muted-foreground" />
                          <span>{booking.duration} minit</span>
                        </div>
                      </div>

                      <div className="text-xs">
                        <span className="font-medium">Layout:</span> {booking.layoutName}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Jumlah:</span> RM {booking.totalPrice.toFixed(2)}
                      </div>

                      {/* Status Update Dropdown */}
                      <div className="pt-2 border-t">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full h-7 text-xs">
                              <MoreHorizontal className="h-3 w-3 mr-1" />
                              Tukar Status
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewBooking(booking)}>
                              <Eye className="h-3 w-3 mr-2" />
                              Lihat Butiran
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusUpdate(booking.id, 'done-photoshoot')}>Photoshoot Selesai</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenReschedule(booking)}>Dijadual Semula</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleStatusUpdate(booking.id, 'no-show')}>Tidak Hadir</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleStatusUpdate(booking.id, 'cancelled')}>Dibatalkan</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-2">
                    Tiada tempahan pada tarikh ini.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold">Tempahan</h1>
                <p className="text-muted-foreground">Urus dan lihat semua tempahan studio</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setCreateBookingDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Tempahan
                </Button>
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Eksport CSV
                </Button>
              </div>
            </div>

            {/* Super Admin Studio Selector */}
            {isSuperAdmin && (
              <div className="mb-6">
                <StudioSelector />
              </div>
            )}

            {/* Booking Link - Prominent Display */}
            {bookingLink && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-primary">Pautan Tempahan Awam</h3>
                    </div>
                    <p className="text-muted-foreground mb-3">
                      Kongsi pautan ini dengan pelanggan untuk membuat tempahan secara langsung
                    </p>
                    <div className="bg-background border rounded-md p-3">
                      <code className="text-sm font-mono break-all">{bookingLink}</code>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-6">
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(bookingLink);
                        toast({
                          description: "Pautan telah disalin!",
                        });
                      }}
                      className="min-w-[120px]"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Salin
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(bookingLink, '_blank')}
                      className="min-w-[120px]"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Buka
                    </Button>
                  </div>
                </div>
              </div>
            )}



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
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : bookings.length > 0 ? (
                  <BookingTable
                    bookings={bookings}
                    photographers={photographers}
                    editors={editors}
                    onViewBooking={handleViewBooking}
                    onStatusUpdate={handleStatusUpdate}
                    onRescheduleSuccess={refreshBookings}
                    onAssignmentUpdate={handleAssignmentUpdate}
                  />
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                    <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Tiada Tempahan</h3>
                    <p className="text-muted-foreground">
                      Belum ada tempahan untuk studio anda.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="calendar">
                <div className="rounded-lg border bg-card">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold">{monthNames[month]} {year}</h3>
                      <div className="text-sm text-muted-foreground">
                        {bookings.length} tempahan
                      </div>
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
                      {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square"></div>
                      ))}

                      {/* Calendar days */}
                      {Array.from({ length: daysInMonth }).map((_, day) => {
                        const dayNumber = day + 1;
                        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNumber.toString().padStart(2, '0')}`;

                        // Check if there are bookings on this date
                        const bookingsOnThisDay = bookings.filter(booking => booking.date === dateStr);
                        const hasBookings = bookingsOnThisDay.length > 0;

                        return (
                          <div
                            key={dayNumber}
                            onClick={() => hasBookings && handleDayClick(dayNumber)}
                            className={`aspect-square border rounded-lg p-1 text-sm relative cursor-pointer ${hasBookings
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
                  <DialogTitle>Tempahan untuk {selectedDay} {monthNames[month]} {year}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {selectedDayBookings.length > 0 ? (
                    selectedDayBookings.map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{booking.customerName}</span>
                          </div>
                          <Badge variant={
                            booking.status === 'done-payment' ? 'default' :
                              booking.status === 'done-photoshoot' ? 'secondary' :
                                booking.status === 'start-editing' ? 'secondary' :
                                  booking.status === 'ready-for-delivery' ? 'default' :
                                    booking.status === 'completed' ? 'default' :
                                      booking.status === 'rescheduled' ? 'secondary' :
                                        booking.status === 'no-show' ? 'destructive' :
                                          booking.status === 'cancelled' ? 'destructive' : 'outline'
                          }>
                            {booking.status === 'done-payment' ? 'Bayaran Selesai' :
                              booking.status === 'done-photoshoot' ? 'Photoshoot Selesai' :
                                booking.status === 'start-editing' ? 'Mula Edit' :
                                  booking.status === 'ready-for-delivery' ? 'Sedia Hantar' :
                                    booking.status === 'completed' ? 'Selesai' :
                                      booking.status === 'rescheduled' ? 'Dijadual Semula' :
                                        booking.status === 'no-show' ? 'Tidak Hadir' :
                                          booking.status === 'cancelled' ? 'Dibatalkan' : booking.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.startTime} – {booking.endTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.duration} minit</span>
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

                        {/* Status Update Dropdown */}
                        <div className="pt-3 border-t mt-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full">
                                <MoreHorizontal className="h-4 w-4 mr-2" />
                                Tukar Status
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewBooking(booking)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Lihat Butiran
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleStatusUpdate(booking.id, 'done-photoshoot')}>Photoshoot Selesai</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenReschedule(booking)}>Dijadual Semula</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleStatusUpdate(booking.id, 'no-show')}>Tidak Hadir</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleStatusUpdate(booking.id, 'cancelled')}>Dibatalkan</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      Tiada tempahan pada tarikh ini.
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>

        {/* Booking Detail Modal */}
        <BookingDetailModal
          booking={selectedBooking}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />

        {/* Create Booking Dialog */}
        <AdminCreateBookingDialog
          open={createBookingDialogOpen}
          onOpenChange={setCreateBookingDialogOpen}
          studioId={effectiveStudioId || ''}
          onSuccess={refreshBookings}
        />

        {/* Reschedule Dialog */}
        <RescheduleDialog
          booking={bookingToReschedule}
          open={rescheduleDialogOpen}
          onOpenChange={setRescheduleDialogOpen}
          onSuccess={handleRescheduleSuccess}
        />
      </div>
    );
  }
};

export default AdminBookings;
