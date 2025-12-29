import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useSidebar } from '@/contexts/SidebarContext';
import { Search, Mail, Phone, Calendar, CreditCard, Package, Eye, X, FileText, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface CustomerBooking {
    id: string;
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    total_bookings: number;
    total_spent: number;
    last_booking_date: string;
    latest_status: string;
    latest_payment_method: string | null;
    latest_payment_verification: string | null;
    latest_booking_id: string;
    latest_balance_due: number;
    latest_payment_type: string | null;
    latest_number_of_pax: number | null;
}

interface BookingDetail {
    id: string;
    reference: string;
    date: string;
    start_time: string;
    end_time: string;
    total_price: number;
    status: string;
    payment_method: string | null;
    notes: string | null;
    receipt_url: string | null;
    payment_proof_url: string | null;
}

export default function AdminCustomers() {
    const { studio } = useAuth();
    const { toast } = useToast();
    const { isCollapsed } = useSidebar();
    const [customers, setCustomers] = useState<CustomerBooking[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<CustomerBooking[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [nameFilter, setNameFilter] = useState('');
    const [emailFilter, setEmailFilter] = useState('');
    const [minSpentFilter, setMinSpentFilter] = useState('');
    const [maxSpentFilter, setMaxSpentFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
    const [verificationFilter, setVerificationFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerBooking | null>(null);
    const [customerBookings, setCustomerBookings] = useState<BookingDetail[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [generatingReceipt, setGeneratingReceipt] = useState<Record<string, boolean>>({});
    const [generatingInvoice, setGeneratingInvoice] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchCustomers();
    }, [studio]);

    // Real-time subscription for booking updates (e.g., AI validation)
    useEffect(() => {
        if (!studio) return;

        const channel = supabase
            .channel('bookings-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'bookings',
                    filter: `studio_id=eq.${studio.id}`,
                },
                (payload) => {
                    console.log('🔄 Booking updated, refreshing customers...', payload);
                    // Refresh the customer list when any booking is updated
                    fetchCustomers();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [studio]);

    useEffect(() => {
        if (customers.length > 0) {
            const filtered = customers.filter((customer) => {
                const matchesSearch = searchQuery === '' ||
                    customer.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    customer.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (customer.customer_phone && customer.customer_phone.toLowerCase().includes(searchQuery.toLowerCase()));

                const matchesName = nameFilter === '' ||
                    customer.customer_name.toLowerCase().includes(nameFilter.toLowerCase());

                const matchesEmail = emailFilter === '' ||
                    customer.customer_email.toLowerCase().includes(emailFilter.toLowerCase());

                const matchesMinSpent = minSpentFilter === '' ||
                    customer.total_spent >= parseFloat(minSpentFilter);

                const matchesMaxSpent = maxSpentFilter === '' ||
                    customer.total_spent <= parseFloat(maxSpentFilter);

                const matchesStatus = statusFilter === 'all' ||
                    customer.latest_status === statusFilter;

                const matchesDate = dateFilter === '' ||
                    customer.last_booking_date === dateFilter;

                const matchesPaymentMethod = paymentMethodFilter === 'all' ||
                    customer.latest_payment_method === paymentMethodFilter;

                const matchesVerification = verificationFilter === 'all' ||
                    customer.latest_payment_verification === verificationFilter;

                return matchesSearch && matchesName && matchesEmail && matchesMinSpent &&
                    matchesMaxSpent && matchesStatus && matchesDate && matchesPaymentMethod &&
                    matchesVerification;
            });
            setFilteredCustomers(filtered);
        }
    }, [searchQuery, nameFilter, emailFilter, minSpentFilter, maxSpentFilter, statusFilter,
        dateFilter, paymentMethodFilter, verificationFilter, customers]);

    const fetchCustomers = async () => {
        if (!studio) return;

        setIsLoading(true);
        try {
            // Fetch all bookings for this studio with customer details
            const { data: bookingsData, error } = await supabase
                .from('bookings')
                .select(`
          id,
          customer_id,
          total_price,
          balance_due,
          payment_type,
          number_of_pax,
          date,
          status,
          payment_method,
          payment_verification,
          customer:customers (
            id,
            name,
            email,
            phone
          )
        `)
                .eq('studio_id', studio.id)
                .order('date', { ascending: false });

            if (error) throw error;

            // Group bookings by customer
            const customerMap = new Map<string, CustomerBooking>();

            bookingsData?.forEach((booking: any) => {
                const customerId = booking.customer_id;
                const customer = booking.customer;

                if (!customer) return;

                if (customerMap.has(customerId)) {
                    const existing = customerMap.get(customerId)!;
                    existing.total_bookings += 1;
                    existing.total_spent += Number(booking.total_price) || 0;

                    // Update last booking date if this one is more recent
                    if (new Date(booking.date) > new Date(existing.last_booking_date)) {
                        existing.last_booking_date = booking.date;
                        existing.latest_status = booking.status;
                        existing.latest_payment_method = booking.payment_method;
                        existing.latest_payment_verification = booking.payment_verification;
                        existing.latest_booking_id = booking.id;
                        existing.latest_balance_due = Number(booking.balance_due) || 0;
                        existing.latest_payment_type = booking.payment_type || null;
                        existing.latest_number_of_pax = booking.number_of_pax || null;
                    }
                } else {
                    customerMap.set(customerId, {
                        id: customerId,
                        customer_id: customerId,
                        customer_name: customer.name,
                        customer_email: customer.email,
                        customer_phone: customer.phone,
                        total_bookings: 1,
                        total_spent: Number(booking.total_price) || 0,
                        last_booking_date: booking.date,
                        latest_status: booking.status,
                        latest_payment_method: booking.payment_method,
                        latest_payment_verification: booking.payment_verification,
                        latest_booking_id: booking.id,
                        latest_balance_due: Number(booking.balance_due) || 0,
                        latest_payment_type: booking.payment_type || null,
                        latest_number_of_pax: booking.number_of_pax || null,
                    });
                }
            });

            const customersArray = Array.from(customerMap.values());
            setCustomers(customersArray);
            setFilteredCustomers(customersArray);
        } catch (error: any) {
            console.error('Error fetching customers:', error);
            toast({
                title: 'Ralat',
                description: 'Gagal memuatkan data pelanggan',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
            'done-payment': { label: 'Bayaran Selesai', variant: 'default' },
            'done-photoshoot': { label: 'Photoshoot Selesai', variant: 'secondary' },
            'start-editing': { label: 'Mula Edit', variant: 'secondary' },
            'ready-for-delivery': { label: 'Sedia Hantar', variant: 'default' },
            'completed': { label: 'Selesai', variant: 'outline' },
            'rescheduled': { label: 'Dijadual Semula', variant: 'secondary' },
            'no-show': { label: 'Tidak Hadir', variant: 'destructive' },
            'cancelled': { label: 'Dibatalkan', variant: 'destructive' },
        };

        const config = statusConfig[status] || { label: status, variant: 'outline' };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getPaymentMethodBadge = (method: string | null) => {
        if (!method) return <span className="text-muted-foreground text-sm">-</span>;

        const methodConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
            'qr': { label: 'QR', variant: 'outline' },
            'bank': { label: 'Bank Transfer', variant: 'outline' },
            'fpx': { label: 'FPX', variant: 'default' },
            'cash': { label: 'Tunai', variant: 'secondary' },
        };

        const config = methodConfig[method.toLowerCase()] || { label: method, variant: 'outline' };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getVerificationBadge = (verification: string | null) => {
        if (!verification) return <span className="text-muted-foreground text-sm">-</span>;

        const verificationConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
            'disahkan': { label: 'Disahkan', variant: 'default' },
            'belum_disahkan': { label: 'Belum Disahkan', variant: 'secondary' },
            'diragui': { label: 'Diragui', variant: 'destructive' },
            'disahkan_oleh_ai': { label: '🤖 Disahkan oleh AI', variant: 'default' },
            'diragui_oleh_ai': { label: '⚠️ Diragui oleh AI', variant: 'destructive' },
        };

        const config = verificationConfig[verification] || { label: verification, variant: 'secondary' };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const fetchCustomerBookings = async (customerId: string) => {
        if (!studio) return;

        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    id,
                    reference,
                    date,
                    start_time,
                    end_time,
                    total_price,
                    status,
                    notes,
                    payment_method,
                    receipt_url,
                    payment_proof_url
                `)
                .eq('studio_id', studio.id)
                .eq('customer_id', customerId)
                .order('date', { ascending: false });

            if (error) throw error;

            setCustomerBookings(data || []);
        } catch (error: any) {
            console.error('Error fetching customer bookings:', error);
            toast({
                title: 'Ralat',
                description: 'Gagal memuatkan tempahan pelanggan',
                variant: 'destructive',
            });
        }
    };

    const handleViewDetails = async (customer: CustomerBooking) => {
        setSelectedCustomer(customer);
        await fetchCustomerBookings(customer.customer_id);
        setIsDialogOpen(true);
    };

    const handleUpdateVerification = async (customerId: string, bookingId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ payment_verification: newStatus })
                .eq('id', bookingId);

            if (error) throw error;

            // Update local state optimistically
            setCustomers(prevCustomers =>
                prevCustomers.map(customer =>
                    customer.customer_id === customerId
                        ? { ...customer, latest_payment_verification: newStatus }
                        : customer
                )
            );

            toast({
                title: 'Berjaya',
                description: 'Status pengesahan pembayaran telah dikemaskini',
            });
        } catch (error: any) {
            console.error('Error updating verification status:', error);
            toast({
                title: 'Ralat',
                description: 'Gagal mengemaskini status pengesahan',
                variant: 'destructive',
            });
        }
    };

    const handleGenerateReceipt = async (booking: BookingDetail) => {
        if (!studio || !selectedCustomer) return;

        setGeneratingReceipt(prev => ({ ...prev, [booking.id]: true }));

        try {
            console.log('\n========================================');
            console.log('📄 MANUAL RECEIPT GENERATION (CLIENT-SIDE)');
            console.log('========================================');
            console.log('Booking ID:', booking.id);
            console.log('Reference:', booking.reference);
            console.log('Customer:', selectedCustomer.customer_name);

            // Get full booking details with layout info
            const { data: fullBooking, error: bookingError } = await supabase
                .from('bookings')
                .select(`
                    *,
                    studio_layout:studio_layouts(name),
                    customer:customers(*)
                `)
                .eq('id', booking.id)
                .single();

            if (bookingError || !fullBooking) {
                throw new Error('Gagal mendapatkan maklumat tempahan');
            }

            console.log('✓ Full booking details retrieved');

            // Import PDF generator
            const { generateReceiptPDF } = await import('@/utils/receiptGenerator');

            console.log('✓ Generating PDF...');

            // Generate and download PDF
            generateReceiptPDF({
                reference: fullBooking.reference,
                customerName: selectedCustomer.customer_name,
                customerEmail: selectedCustomer.customer_email,
                customerPhone: selectedCustomer.customer_phone || undefined,
                date: fullBooking.date,
                startTime: fullBooking.start_time,
                endTime: fullBooking.end_time,
                studioName: studio.name,
                layoutName: fullBooking.studio_layout?.name || 'N/A',
                duration: fullBooking.duration || 0,
                totalPrice: fullBooking.total_price,
                paymentMethod: fullBooking.payment_method || undefined,
                paymentType: fullBooking.payment_type || undefined,
                balanceDue: fullBooking.balance_due || undefined,
            });

            console.log('✅ Receipt generated and downloaded successfully!');
            console.log('========================================\n');

            toast({
                title: 'Berjaya',
                description: `Resit ${fullBooking.reference} telah dimuat turun`,
            });
        } catch (error: any) {
            console.error('❌ Error generating receipt:', error);
            console.log('========================================\n');
            toast({
                title: 'Ralat',
                description: error.message || 'Gagal menjana resit',
                variant: 'destructive',
            });
        } finally {
            setGeneratingReceipt(prev => ({ ...prev, [booking.id]: false }));
        }
    };

    const handleGenerateInvoice = async (booking: BookingDetail) => {
        if (!studio || !selectedCustomer) return;

        setGeneratingInvoice(prev => ({ ...prev, [booking.id]: true }));

        try {
            console.log('\n========================================')
            console.log('📄 MANUAL INVOICE GENERATION (CLIENT-SIDE)');
            console.log('========================================');
            console.log('Booking ID:', booking.id);
            console.log('Reference:', booking.reference);
            console.log('Customer:', selectedCustomer.customer_name);

            // Get full booking details with layout info
            const { data: fullBooking, error: bookingError } = await supabase
                .from('bookings')
                .select(`
                    *,
                    studio_layout:studio_layouts(name),
                    customer:customers(*)
                `)
                .eq('id', booking.id)
                .single();

            if (bookingError || !fullBooking) {
                throw new Error('Gagal mendapatkan maklumat tempahan');
            }

            console.log('✓ Full booking details retrieved');

            // Import PDF generator
            const { generateInvoicePDF } = await import('@/utils/invoiceGenerator');

            console.log('✓ Generating Invoice PDF...');

            // Calculate deposit amount if payment type is deposit
            const depositAmount = fullBooking.payment_type === 'deposit'
                ? fullBooking.total_price - (fullBooking.balance_due || 0)
                : undefined;

            // Generate and download PDF
            generateInvoicePDF({
                reference: fullBooking.reference,
                customerName: selectedCustomer.customer_name,
                customerEmail: selectedCustomer.customer_email,
                customerPhone: selectedCustomer.customer_phone || undefined,
                date: fullBooking.date,
                startTime: fullBooking.start_time,
                endTime: fullBooking.end_time,
                studioName: studio.name,
                layoutName: fullBooking.studio_layout?.name || 'N/A',
                duration: fullBooking.duration || 0,
                totalPrice: fullBooking.total_price,
                paymentMethod: fullBooking.payment_method || undefined,
                paymentType: fullBooking.payment_type || undefined,
                balanceDue: fullBooking.balance_due || undefined,
                depositAmount: depositAmount,
            });

            console.log('✅ Invoice generated and downloaded successfully!');
            console.log('========================================\n');

            toast({
                title: 'Berjaya',
                description: `Invois ${fullBooking.reference} telah dimuat turun`,
            });
        } catch (error: any) {
            console.error('❌ Error generating invoice:', error);
            console.log('========================================\n');
            toast({
                title: 'Ralat',
                description: error.message || 'Gagal menjana invois',
                variant: 'destructive',
            });
        } finally {
            setGeneratingInvoice(prev => ({ ...prev, [booking.id]: false }));
        }
    };

    const clearAllFilters = () => {
        setNameFilter('');
        setEmailFilter('');
        setMinSpentFilter('');
        setMaxSpentFilter('');
        setStatusFilter('all');
        setDateFilter('');
        setPaymentMethodFilter('all');
        setVerificationFilter('all');
    };

    const hasActiveFilters = nameFilter || emailFilter || minSpentFilter || maxSpentFilter ||
        statusFilter !== 'all' || dateFilter || paymentMethodFilter !== 'all' || verificationFilter !== 'all';

    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar />

            <main className={cn("transition-all duration-300", isCollapsed ? "pl-16" : "pl-64")}>
                <div className="p-8">
                    <div className="space-y-6">
                        {/* Header */}
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Pembayaran</h1>
                            <p className="text-muted-foreground mt-2">
                                Senarai pembayaran daripada tempahan pelanggan di studio anda
                            </p>
                        </div>

                        {/* Search Bar */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Cari Pelanggan</CardTitle>
                                <CardDescription>
                                    Cari mengikut nama, emel atau telefon
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari pelanggan..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Customers Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Senarai Pelanggan ({filteredCustomers.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                        <p className="text-muted-foreground mt-4">Memuatkan data...</p>
                                    </div>
                                ) : filteredCustomers.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground">
                                            {searchQuery ? 'Tiada pelanggan dijumpai' : 'Belum ada pelanggan'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {/* Clear Filters Button */}
                                        {hasActiveFilters && (
                                            <div className="flex justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={clearAllFilters}
                                                    className="h-8 px-2 lg:px-3"
                                                >
                                                    <X className="h-4 w-4 mr-2" />
                                                    Kosongkan Penapis
                                                </Button>
                                            </div>
                                        )}

                                        <div className="rounded-lg border bg-card overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    {/* Column Headers */}
                                                    <TableRow>
                                                        <TableHead>Pelanggan</TableHead>
                                                        <TableHead>Jumlah Bayaran</TableHead>
                                                        <TableHead>Baki</TableHead>
                                                        <TableHead>Jenis Bayaran</TableHead>
                                                        <TableHead>Bil. Pax</TableHead>
                                                        <TableHead>Status Terkini</TableHead>
                                                        <TableHead>Tempahan Terakhir</TableHead>
                                                        <TableHead>Kaedah Bayaran</TableHead>
                                                        <TableHead>Pengesahan Pembayaran</TableHead>
                                                        <TableHead className="w-[70px]"></TableHead>
                                                    </TableRow>
                                                    {/* Filter Row */}
                                                    <TableRow className="bg-muted/50">
                                                        <TableHead className="h-12">
                                                            <Input
                                                                placeholder="Cari nama/email..."
                                                                value={nameFilter}
                                                                onChange={(e) => setNameFilter(e.target.value)}
                                                                className="h-8 text-xs"
                                                            />
                                                        </TableHead>
                                                        <TableHead className="h-12">
                                                            <div className="flex gap-1">
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Min"
                                                                    value={minSpentFilter}
                                                                    onChange={(e) => setMinSpentFilter(e.target.value)}
                                                                    className="h-8 text-xs w-[70px]"
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Max"
                                                                    value={maxSpentFilter}
                                                                    onChange={(e) => setMaxSpentFilter(e.target.value)}
                                                                    className="h-8 text-xs w-[70px]"
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="h-12"></TableHead>
                                                        <TableHead className="h-12"></TableHead>
                                                        <TableHead className="h-12"></TableHead>
                                                        <TableHead className="h-12">
                                                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                                                <SelectTrigger className="h-8 text-xs">
                                                                    <SelectValue placeholder="Semua" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="all">Semua Status</SelectItem>
                                                                    <SelectItem value="done-payment">Bayaran Selesai</SelectItem>
                                                                    <SelectItem value="done-photoshoot">Photoshoot Selesai</SelectItem>
                                                                    <SelectItem value="start-editing">Mula Edit</SelectItem>
                                                                    <SelectItem value="ready-for-delivery">Sedia Hantar</SelectItem>
                                                                    <SelectItem value="completed">Selesai</SelectItem>
                                                                    <SelectItem value="rescheduled">Dijadual Semula</SelectItem>
                                                                    <SelectItem value="no-show">Tidak Hadir</SelectItem>
                                                                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </TableHead>
                                                        <TableHead className="h-12">
                                                            <div
                                                                className="relative cursor-pointer"
                                                                onClick={(e) => {
                                                                    const input = e.currentTarget.querySelector('input');
                                                                    input?.showPicker?.();
                                                                }}
                                                            >
                                                                <Input
                                                                    type="date"
                                                                    value={dateFilter}
                                                                    onChange={(e) => setDateFilter(e.target.value)}
                                                                    className="h-8 text-xs cursor-pointer"
                                                                />
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="h-12">
                                                            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                                                                <SelectTrigger className="h-8 text-xs">
                                                                    <SelectValue placeholder="Semua" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="all">Semua Kaedah</SelectItem>
                                                                    <SelectItem value="qr">QR</SelectItem>
                                                                    <SelectItem value="bank">Bank Transfer</SelectItem>
                                                                    <SelectItem value="fpx">FPX</SelectItem>
                                                                    <SelectItem value="cash">Tunai</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </TableHead>
                                                        <TableHead className="h-12">
                                                            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                                                                <SelectTrigger className="h-8 text-xs">
                                                                    <SelectValue placeholder="Semua" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="all">Semua</SelectItem>
                                                                    <SelectItem value="disahkan">Disahkan</SelectItem>
                                                                    <SelectItem value="belum_disahkan">Belum Disahkan</SelectItem>
                                                                    <SelectItem value="diragui">Diragui</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </TableHead>
                                                        <TableHead className="h-12"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredCustomers.map((customer) => (
                                                        <TableRow key={customer.id}>
                                                            <TableCell>
                                                                <div>
                                                                    <p className="font-medium">{customer.customer_name}</p>
                                                                    <p className="text-xs text-muted-foreground">{customer.customer_email}</p>
                                                                    {customer.customer_phone && (
                                                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                            <Phone className="h-3 w-3" />
                                                                            {customer.customer_phone}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="font-medium">
                                                                        RM {customer.total_spent.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {customer.latest_balance_due && customer.latest_balance_due > 0 ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium text-orange-600">
                                                                            RM {customer.latest_balance_due.toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted-foreground text-sm">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {customer.latest_payment_type === 'deposit' ? (
                                                                    <Badge variant="secondary">Deposit</Badge>
                                                                ) : customer.latest_payment_type === 'full' ? (
                                                                    <Badge variant="default">Penuh</Badge>
                                                                ) : (
                                                                    <span className="text-muted-foreground text-sm">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {customer.latest_number_of_pax ? (
                                                                    <span className="font-medium">{customer.latest_number_of_pax} orang</span>
                                                                ) : (
                                                                    <span className="text-muted-foreground text-sm">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {getStatusBadge(customer.latest_status)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <Calendar className="h-3 w-3" />
                                                                    <span>
                                                                        {format(new Date(customer.last_booking_date), 'dd/MM/yyyy')}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {getPaymentMethodBadge(customer.latest_payment_method)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Select
                                                                    value={customer.latest_payment_verification || 'belum_disahkan'}
                                                                    onValueChange={(value) => handleUpdateVerification(
                                                                        customer.customer_id,
                                                                        customer.latest_booking_id,
                                                                        value
                                                                    )}
                                                                >
                                                                    <SelectTrigger className="w-[180px]">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="disahkan">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                                                Disahkan
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="belum_disahkan">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                                                                Belum Disahkan
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="diragui">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                                                Diragui
                                                                            </div>
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon-sm"
                                                                    onClick={() => handleViewDetails(customer)}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Results count */}
                                        {hasActiveFilters && (
                                            <p className="text-sm text-muted-foreground">
                                                Menunjukkan {filteredCustomers.length} daripada {customers.length} pelanggan
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>


            {/* Payment Proof Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Bukti Pembayaran</DialogTitle>
                        <DialogDescription>
                            {selectedCustomer && `${selectedCustomer.customer_name} - ${selectedCustomer.customer_email}`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                        {customerBookings.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">Tiada tempahan dijumpai</p>
                        ) : (
                            <div className="space-y-8">
                                {customerBookings.map((booking) => (
                                    <div key={booking.id} className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-4 pb-3 border-b">
                                            <div>
                                                <p className="font-semibold text-lg">{booking.reference}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(new Date(booking.date), 'dd/MM/yyyy')} • {booking.start_time} - {booking.end_time} • RM {booking.total_price.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(booking.status)}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleGenerateReceipt(booking)}
                                                    disabled={generatingReceipt[booking.id]}
                                                    className="ml-2"
                                                >
                                                    {generatingReceipt[booking.id] ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                                                            Menjana...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FileText className="h-4 w-4 mr-2" />
                                                            Muat Turun Resit
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleGenerateInvoice(booking)}
                                                    disabled={generatingInvoice[booking.id]}
                                                >
                                                    {generatingInvoice[booking.id] ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                                                            Menjana...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Receipt className="h-4 w-4 mr-2" />
                                                            Muat Turun Invois
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        {(booking.receipt_url || booking.payment_proof_url) ? (
                                            <div className="space-y-4">
                                                {booking.receipt_url && (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium">Resit QR Pembayaran</p>
                                                            <a
                                                                href={booking.receipt_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-primary hover:underline flex items-center gap-1"
                                                            >
                                                                Buka Tab Baru
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                </svg>
                                                            </a>
                                                        </div>
                                                        {booking.receipt_url.toLowerCase().endsWith('.pdf') ? (
                                                            <iframe
                                                                src={booking.receipt_url}
                                                                className="w-full h-[600px] rounded-lg border"
                                                                title="Resit QR Pembayaran"
                                                            />
                                                        ) : (
                                                            <div className="rounded-lg border overflow-hidden bg-muted/30">
                                                                <img
                                                                    src={booking.receipt_url}
                                                                    alt="Resit Pembayaran"
                                                                    className="w-full h-auto max-h-[600px] object-contain"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {booking.payment_proof_url && (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium">Bukti Transfer Bank</p>
                                                            <a
                                                                href={booking.payment_proof_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-primary hover:underline flex items-center gap-1"
                                                            >
                                                                Buka Tab Baru
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                </svg>
                                                            </a>
                                                        </div>
                                                        {booking.payment_proof_url.toLowerCase().endsWith('.pdf') ? (
                                                            <iframe
                                                                src={booking.payment_proof_url}
                                                                className="w-full h-[600px] rounded-lg border"
                                                                title="Bukti Transfer Bank"
                                                            />
                                                        ) : (
                                                            <div className="rounded-lg border overflow-hidden bg-muted/30">
                                                                <img
                                                                    src={booking.payment_proof_url}
                                                                    alt="Bukti Pembayaran"
                                                                    className="w-full h-auto max-h-[600px] object-contain"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-muted/30 rounded-lg">
                                                <svg className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="text-sm text-muted-foreground">Tiada bukti pembayaran dimuat naik</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog >
        </div >
    );
}
