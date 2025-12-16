import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useSidebar } from '@/contexts/SidebarContext';
import { Search, Mail, Phone, Calendar, CreditCard, Package } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
}

export default function AdminCustomers() {
    const { studio } = useAuth();
    const { toast } = useToast();
    const { isCollapsed } = useSidebar();
    const [customers, setCustomers] = useState<CustomerBooking[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<CustomerBooking[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCustomers();
    }, [studio]);

    useEffect(() => {
        // Filter customers based on search query
        if (searchQuery.trim() === '') {
            setFilteredCustomers(customers);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = customers.filter(
                (customer) =>
                    customer.customer_name.toLowerCase().includes(query) ||
                    customer.customer_email.toLowerCase().includes(query) ||
                    (customer.customer_phone && customer.customer_phone.toLowerCase().includes(query))
            );
            setFilteredCustomers(filtered);
        }
    }, [searchQuery, customers]);

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
          date,
          status,
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

    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar />

            <main className={cn("transition-all duration-300", isCollapsed ? "pl-16" : "pl-64")}>
                <div className="p-8">
                    <div className="space-y-6">
                        {/* Header */}
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Pelanggan Anda</h1>
                            <p className="text-muted-foreground mt-2">
                                Senarai pelanggan yang telah membuat tempahan di studio anda
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
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left py-3 px-4 font-medium">Pelanggan</th>
                                                    <th className="text-left py-3 px-4 font-medium">Jumlah Bayaran</th>
                                                    <th className="text-left py-3 px-4 font-medium">Status Terkini</th>
                                                    <th className="text-left py-3 px-4 font-medium">Tempahan Terakhir</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredCustomers.map((customer) => (
                                                    <tr key={customer.id} className="border-b hover:bg-muted/50 transition-colors">
                                                        <td className="py-4 px-4">
                                                            <div className="space-y-1">
                                                                <p className="font-medium">{customer.customer_name}</p>
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <Mail className="h-3 w-3" />
                                                                    <span>{customer.customer_email}</span>
                                                                </div>
                                                                {customer.customer_phone && (
                                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                        <Phone className="h-3 w-3" />
                                                                        <span>{customer.customer_phone}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                                                <span className="font-medium">
                                                                    RM {customer.total_spent.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            {getStatusBadge(customer.latest_status)}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <Calendar className="h-3 w-3" />
                                                                <span>
                                                                    {format(new Date(customer.last_booking_date), 'dd/MM/yyyy')}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
