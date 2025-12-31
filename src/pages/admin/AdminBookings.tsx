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
  ChevronLeft,
  ChevronRight,
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
  const [calendarView, setCalendarView] = useState<'month' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());

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
      // Fetch bookings first (critical)
      const bookingsData = await getStudioBookingsWithDetails(effectiveStudioId);

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
        layoutName: b.booking_type === 'wedding' ? 'Wedding Reception' : (b.studio_layout?.name || 'Unknown'),
        bookingType: b.booking_type as 'studio' | 'wedding',
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

      // Fetch staff data separately (non-blocking)
      // If studio_staff table doesn't exist, this won't block the booking link
      try {
        const photographersData = await getActivePhotographers(effectiveStudioId);
        setPhotographers(photographersData);
      } catch (staffError) {
        console.warn('Could not fetch photographers (table may not exist):', staffError);
        setPhotographers([]);
      }

      try {
        const editorsData = await getActiveEditors(effectiveStudioId);
        setEditors(editorsData);
      } catch (staffError) {
        console.warn('Could not fetch editors (table may not exist):', staffError);
        setEditors([]);
      }

      // Fetch studio slug for cleaner booking link
      const baseUrl = window.location.origin;
      let studioBookingLink = `${baseUrl}/book/${effectiveStudioId}`; // Default fallback

      try {
        const { data: studioData, error: slugError } = await supabase
          .from('studios')
          .select('slug')
          .eq('id', effectiveStudioId)
          .single();

        if (slugError) {
          console.error('Error fetching studio slug:', slugError);
        }

        // Generate booking link for this studio - use slug if available
        if (studioData?.slug) {
          studioBookingLink = `${baseUrl}/${studioData.slug}`;
          console.log('Using slug-based booking link:', studioBookingLink);
        } else {
          console.log('Using ID-based booking link:', studioBookingLink);
        }
      } catch (slugFetchError) {
        console.error('Exception fetching studio slug:', slugFetchError);
      }

      setBookingLink(studioBookingLink);
      console.log('Booking link set to:', studioBookingLink);
    } catch (error) {
      console.error('Error fetching data:', error);

      // Even if bookings fetch fails, still try to set the booking link
      const baseUrl = window.location.origin;
      const fallbackLink = `${baseUrl}/book/${effectiveStudioId}`;
      setBookingLink(fallbackLink);
      console.log('Fallback booking link set to:', fallbackLink);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [effectiveStudioId]);

  // Debug: Log when bookingLink changes
  useEffect(() => {
    console.log('BookingLink state changed:', bookingLink);
    console.log('BookingLink is truthy:', !!bookingLink);
  }, [bookingLink]);


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
        layoutName: b.booking_type === 'wedding' ? 'Wedding Reception' : (b.studio_layout?.name || 'Unknown'),
        bookingType: b.booking_type as 'studio' | 'wedding',
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
    // Show confirmation for critical status changes
    const criticalStatuses: Booking['status'][] = ['no-show', 'cancelled', 'done-photoshoot'];

    if (criticalStatuses.includes(newStatus)) {
      const statusMessages = {
        'no-show': 'Adakah anda pasti untuk menandakan tempahan ini sebagai "Tidak Hadir"?',
        'cancelled': 'Adakah anda pasti untuk membatalkan tempahan ini?',
        'done-photoshoot': 'Adakah anda pasti untuk menandakan tempahan ini sebagai "Photoshoot Selesai"?'
      };

      const confirmed = window.confirm(statusMessages[newStatus] || 'Adakah anda pasti untuk mengemaskini status ini?');

      if (!confirmed) {
        return; // User cancelled the action
      }
    }

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
          layoutName: b.booking_type === 'wedding' ? 'Wedding Reception' : (b.studio_layout?.name || 'Unknown Layout'),
          bookingType: b.booking_type as 'studio' | 'wedding',
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
    const bookingsOnThisDay = bookings
      .filter(booking => booking.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)); // Sort by start time ascending
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
              <img src="/image.png" alt="Tempah Studio Logo" style={{ height: '24px', width: 'auto' }} />
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
                      <img src="/image.png" alt="Tempah Studio Logo" style={{ height: '36px', width: 'auto' }} />
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
                      <div key={`empty-${i}`} className="min-h-[80px] border border-transparent"></div>
                    ))}

                    {/* Calendar days */}
                    {Array.from({ length: daysInMonth }).map((_, day) => {
                      const dayNumber = day + 1;
                      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNumber.toString().padStart(2, '0')}`;

                      // Check if there are bookings on this date
                      const bookingsOnThisDay = bookings
                        .filter(booking => booking.date === dateStr)
                        .sort((a, b) => a.startTime.localeCompare(b.startTime)); // Sort by start time ascending
                      const hasBookings = bookingsOnThisDay.length > 0;

                      return (
                        <div
                          key={dayNumber}
                          onClick={() => hasBookings && handleDayClick(dayNumber)}
                          className={`min-h-[80px] border rounded-md p-1 text-sm relative cursor-pointer transition-colors ${hasBookings
                            ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                            : 'border-border hover:bg-muted/50'
                            }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="text-center font-medium flex-1">{dayNumber}</div>
                            {hasBookings && (
                              <div className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                                {bookingsOnThisDay.length}
                              </div>
                            )}
                          </div>
                          {hasBookings && (
                            <div className="space-y-0.5 px-0.5">
                              {bookingsOnThisDay.slice(0, 3).map((booking, idx) => {
                                const statusColor =
                                  booking.status === 'done-payment' ? 'bg-blue-500' :
                                    booking.status === 'done-photoshoot' ? 'bg-purple-500' :
                                      booking.status === 'completed' ? 'bg-green-500' :
                                        booking.status === 'cancelled' ? 'bg-red-500' :
                                          booking.status === 'no-show' ? 'bg-gray-500' : 'bg-orange-500';

                                const initials = booking.customerName
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')
                                  .substring(0, 2)
                                  .toUpperCase();

                                return (
                                  <div
                                    key={booking.id}
                                    className={`${statusColor} text-white text-[9px] px-1 py-0.5 rounded truncate font-medium`}
                                    title={`${booking.customerName} - ${booking.startTime}`}
                                  >
                                    {initials}
                                  </div>
                                );
                              })}
                              {bookingsOnThisDay.length > 3 && (
                                <div className="text-[9px] text-muted-foreground text-center font-medium">
                                  +{bookingsOnThisDay.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-muted-foreground text-center">Klik untuk lihat tempahan</p>
                    <div className="flex flex-wrap items-center justify-center gap-2 text-[10px]">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-blue-500"></div>
                        <span>Bayaran Selesai</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-purple-500"></div>
                        <span>Photoshoot Selesai</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-green-500"></div>
                        <span>Selesai</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-red-500"></div>
                        <span>Dibatalkan</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-gray-500"></div>
                        <span>Tidak Hadir</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-orange-500"></div>
                        <span>Lain-lain</span>
                      </div>
                    </div>
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
              <div className="space-y-0">
                {selectedDayBookings.length > 0 ? (
                  <>
                    {/* Timeline view */}
                    {Array.from({ length: 18 }, (_, i) => {
                      const hour = i + 7; // Start from 7am
                      const timeLabel = hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;
                      const hourStr = hour.toString().padStart(2, '0');

                      // Find bookings that start in this hour
                      const bookingsInHour = selectedDayBookings.filter(booking => {
                        const bookingHour = parseInt(booking.startTime.split(':')[0]);
                        return bookingHour === hour;
                      });

                      return (
                        <div key={hour} className="flex gap-2 border-b border-border/50 py-2">
                          {/* Time column */}
                          <div className="w-16 flex-shrink-0 text-xs font-medium text-muted-foreground pt-1">
                            {timeLabel}
                          </div>

                          {/* Bookings column */}
                          <div className="flex-1 space-y-2">
                            {bookingsInHour.length > 0 ? (
                              bookingsInHour.map((booking) => (
                                <div key={booking.id} className="border rounded-md p-2 space-y-1.5 shadow-md bg-card">
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                      <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                      <span className="text-xs font-medium truncate">{booking.customerName}</span>
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
                                    } className="text-[9px] px-1.5 py-0">
                                      {booking.status === 'done-payment' ? 'Bayaran' :
                                        booking.status === 'done-photoshoot' ? 'Photoshoot' :
                                          booking.status === 'start-editing' ? 'Edit' :
                                            booking.status === 'ready-for-delivery' ? 'Sedia' :
                                              booking.status === 'completed' ? 'Selesai' :
                                                booking.status === 'rescheduled' ? 'Dijadual' :
                                                  booking.status === 'no-show' ? 'X' :
                                                    booking.status === 'cancelled' ? 'Batal' : booking.status}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <Clock className="h-2.5 w-2.5" />
                                    <span>{booking.startTime} – {booking.endTime}</span>
                                    <span className="mx-1">•</span>
                                    <span>{booking.duration}m</span>
                                  </div>

                                  <div className="text-[10px]">
                                    <span className="font-medium">Layout:</span> {booking.layoutName}
                                  </div>

                                  <div className="text-[10px] text-muted-foreground">
                                    <span className="font-medium">RM {booking.totalPrice.toFixed(2)}</span>
                                  </div>

                                  {/* Status Update Dropdown */}
                                  <div className="pt-1.5 border-t">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="default" size="sm" className="w-full h-6 text-[10px]">
                                          <MoreHorizontal className="h-2.5 w-2.5 mr-1" />
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
                              <div className="h-8"></div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-8">
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
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold">
                          {calendarView === 'month' ? `${monthNames[month]} ${year}` : selectedDate.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </h3>
                        <div className="flex items-center gap-1 border rounded-md p-1">
                          <Button
                            variant={calendarView === 'month' ? 'default' : 'ghost'}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setCalendarView('month')}
                          >
                            Bulan
                          </Button>
                          <Button
                            variant={calendarView === 'day' ? 'default' : 'ghost'}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setCalendarView('day')}
                          >
                            Hari
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {bookings.length} tempahan
                      </div>
                    </div>

                    {calendarView === 'month' ? (
                      <>
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
                            <div key={`empty-${i}`} className="min-h-[120px] border border-transparent"></div>
                          ))}

                          {/* Calendar days */}
                          {Array.from({ length: daysInMonth }).map((_, day) => {
                            const dayNumber = day + 1;
                            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNumber.toString().padStart(2, '0')}`;

                            // Check if there are bookings on this date
                            const bookingsOnThisDay = bookings
                              .filter(booking => booking.date === dateStr)
                              .sort((a, b) => a.startTime.localeCompare(b.startTime)); // Sort by start time ascending
                            const hasBookings = bookingsOnThisDay.length > 0;

                            return (
                              <div
                                key={dayNumber}
                                onClick={() => hasBookings && handleDayClick(dayNumber)}
                                className={`min-h-[120px] border rounded-lg p-2 text-sm relative cursor-pointer transition-colors ${hasBookings
                                  ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                                  : 'border-border hover:bg-muted/50'
                                  }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="text-center font-medium flex-1">{dayNumber}</div>
                                  {hasBookings && (
                                    <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                                      {bookingsOnThisDay.length}
                                    </div>
                                  )}
                                </div>
                                {hasBookings && (
                                  <div className="space-y-1">
                                    {bookingsOnThisDay.slice(0, 4).map((booking) => {
                                      const statusColor =
                                        booking.status === 'done-payment' ? 'bg-blue-500' :
                                          booking.status === 'done-photoshoot' ? 'bg-purple-500' :
                                            booking.status === 'completed' ? 'bg-green-500' :
                                              booking.status === 'cancelled' ? 'bg-red-500' :
                                                booking.status === 'no-show' ? 'bg-gray-500' : 'bg-orange-500';

                                      const initials = booking.customerName
                                        .split(' ')
                                        .map(n => n[0])
                                        .join('')
                                        .substring(0, 2)
                                        .toUpperCase();

                                      return (
                                        <div
                                          key={booking.id}
                                          className={`${statusColor} text-white text-[10px] px-1.5 py-1 rounded truncate font-medium flex items-center justify-between gap-1`}
                                          title={`${booking.customerName} - ${booking.startTime}`}
                                        >
                                          <span className="truncate">{initials}</span>
                                          <span className="text-[9px] opacity-90">{booking.startTime.substring(0, 5)}</span>
                                        </div>
                                      );
                                    })}
                                    {bookingsOnThisDay.length > 4 && (
                                      <div className="text-[10px] text-muted-foreground text-center font-medium bg-muted/50 rounded py-0.5">
                                        +{bookingsOnThisDay.length - 4} lagi
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Legend */}
                        <div className="mt-6 space-y-3">
                          <p className="text-sm text-muted-foreground">Klik untuk lihat tempahan</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded bg-blue-500"></div>
                              <span>Bayaran Selesai</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded bg-purple-500"></div>
                              <span>Photoshoot Selesai</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded bg-green-500"></div>
                              <span>Selesai</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded bg-red-500"></div>
                              <span>Dibatalkan</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded bg-gray-500"></div>
                              <span>Tidak Hadir</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded bg-orange-500"></div>
                              <span>Lain-lain</span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Day View - Timeline */}
                        <div className="flex items-center justify-between mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newDate = new Date(selectedDate);
                              newDate.setDate(newDate.getDate() - 1);
                              setSelectedDate(newDate);
                            }}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Hari Sebelum
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDate(new Date())}
                          >
                            Hari Ini
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newDate = new Date(selectedDate);
                              newDate.setDate(newDate.getDate() + 1);
                              setSelectedDate(newDate);
                            }}
                          >
                            Hari Seterusnya
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Timeline */}
                        <div className="space-y-0">
                          {(() => {
                            // Format date as YYYY-MM-DD in local timezone
                            const year = selectedDate.getFullYear();
                            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                            const day = String(selectedDate.getDate()).padStart(2, '0');
                            const dateStr = `${year}-${month}-${day}`;

                            const dayBookings = bookings
                              .filter(booking => booking.date === dateStr)
                              .sort((a, b) => a.startTime.localeCompare(b.startTime));

                            return (
                              <>
                                {Array.from({ length: 18 }, (_, i) => {
                                  const hour = i + 7;
                                  const timeLabel = hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;

                                  const bookingsInHour = dayBookings.filter(booking => {
                                    const bookingHour = parseInt(booking.startTime.split(':')[0]);
                                    return bookingHour === hour;
                                  });

                                  return (
                                    <div key={hour} className="flex gap-3 border-b border-border/50 py-3">
                                      <div className="w-20 flex-shrink-0 text-sm font-semibold text-muted-foreground pt-1">
                                        {timeLabel}
                                      </div>

                                      <div className="flex-1 space-y-3">
                                        {bookingsInHour.length > 0 ? (
                                          bookingsInHour.map((booking) => {
                                            // Determine color based on status
                                            const statusColor =
                                              booking.status === 'done-payment' ? 'bg-blue-50 border-l-4 border-l-blue-500' :
                                                booking.status === 'done-photoshoot' ? 'bg-purple-50 border-l-4 border-l-purple-500' :
                                                  booking.status === 'completed' ? 'bg-green-50 border-l-4 border-l-green-500' :
                                                    booking.status === 'cancelled' ? 'bg-red-50 border-l-4 border-l-red-500' :
                                                      booking.status === 'no-show' ? 'bg-gray-50 border-l-4 border-l-gray-500' :
                                                        'bg-orange-50 border-l-4 border-l-orange-500';

                                            return (
                                              <div
                                                key={booking.id}
                                                className={`border rounded-lg p-3 space-y-2 shadow-md cursor-pointer hover:shadow-lg transition-shadow ${statusColor}`}
                                                onClick={() => handleViewBooking(booking)}
                                              >
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{booking.customerName}</span>
                                                  </div>
                                                  <Badge variant={
                                                    booking.status === 'done-payment' ? 'default' :
                                                      booking.status === 'done-photoshoot' ? 'secondary' :
                                                        booking.status === 'completed' ? 'default' :
                                                          booking.status === 'cancelled' ? 'destructive' :
                                                            booking.status === 'no-show' ? 'destructive' : 'outline'
                                                  }>
                                                    {booking.status === 'done-payment' ? 'Bayaran Selesai' :
                                                      booking.status === 'done-photoshoot' ? 'Photoshoot Selesai' :
                                                        booking.status === 'completed' ? 'Selesai' :
                                                          booking.status === 'cancelled' ? 'Dibatalkan' :
                                                            booking.status === 'no-show' ? 'Tidak Hadir' : booking.status}
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

                                                <div className="text-sm text-muted-foreground">
                                                  <span className="font-medium">Jumlah:</span> RM {booking.totalPrice.toFixed(2)}
                                                </div>
                                              </div>
                                            );
                                          })
                                        ) : (
                                          <div className="h-10"></div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                                {dayBookings.length === 0 && (
                                  <div className="text-center py-12 text-muted-foreground">
                                    Tiada tempahan pada hari ini
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </>
                    )}
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
                <div className="space-y-0">
                  {selectedDayBookings.length > 0 ? (
                    <>
                      {/* Timeline view */}
                      {Array.from({ length: 18 }, (_, i) => {
                        const hour = i + 7; // Start from 7am
                        const timeLabel = hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;

                        // Find bookings that start in this hour
                        const bookingsInHour = selectedDayBookings.filter(booking => {
                          const bookingHour = parseInt(booking.startTime.split(':')[0]);
                          return bookingHour === hour;
                        });

                        return (
                          <div key={hour} className="flex gap-3 border-b border-border/50 py-3">
                            {/* Time column */}
                            <div className="w-20 flex-shrink-0 text-sm font-semibold text-muted-foreground pt-1">
                              {timeLabel}
                            </div>

                            {/* Bookings column */}
                            <div className="flex-1 space-y-3">
                              {bookingsInHour.length > 0 ? (
                                bookingsInHour.map((booking) => (
                                  <div key={booking.id} className="border rounded-lg p-3 space-y-2 shadow-md bg-card">
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
                                          <Button variant="default" size="sm" className="w-full">
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
                                <div className="h-10"></div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
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
