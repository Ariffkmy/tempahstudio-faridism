import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useSidebar } from '@/contexts/SidebarContext';
import { getAllPackagePayments, updatePackagePayment, type PackagePayment } from '@/services/packagePaymentService';
import { getPackages, type Package as StudioPackage } from '@/services/packageService';
import { CreditCard, Eye, FileText, CheckCircle, XCircle, Clock, Menu, Users, DollarSign, Package as PackageIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPackagePayments() {
    const { toast } = useToast();
    const { isCollapsed } = useSidebar();
    const [payments, setPayments] = useState<PackagePayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<PackagePayment | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [availablePackages, setAvailablePackages] = useState<StudioPackage[]>([]);

    const [updateData, setUpdateData] = useState({
        status: '' as 'pending' | 'verified' | 'rejected' | 'completed',
        notes: '',
        package_name: '',
    });

    useEffect(() => {
        loadPayments();
        loadPackages();
    }, []);

    const loadPackages = async () => {
        try {
            const data = await getPackages(true); // include inactive handles
            setAvailablePackages(data);
        } catch (error) {
            console.error('Error loading packages:', error);
        }
    };

    const loadPayments = async () => {
        setLoading(true);
        try {
            const result = await getAllPackagePayments();
            if (result.success && result.payments) {
                setPayments(result.payments);
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to load payments',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error loading payments:', error);
            toast({
                title: 'Error',
                description: 'Failed to load payments',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (payment: PackagePayment) => {
        setSelectedPayment(payment);
        setUpdateData({
            status: payment.status,
            notes: payment.notes || '',
            package_name: payment.package_name,
        });
        setDialogOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!selectedPayment) return;

        setUpdating(true);
        try {
            const result = await updatePackagePayment(selectedPayment.id, {
                ...updateData,
                verified_at: new Date().toISOString(),
            });

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Payment status updated successfully',
                });
                setDialogOpen(false);
                loadPayments();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update payment',
                variant: 'destructive',
            });
        } finally {
            setUpdating(false);
        }
    };

    const handleQuickUpdateStatus = async (id: string, newStatus: any) => {
        try {
            const result = await updatePackagePayment(id, {
                status: newStatus,
                verified_at: new Date().toISOString(),
            });

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Status updated',
                });
                setPayments(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update status',
                variant: 'destructive',
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
            pending: { variant: 'secondary', icon: Clock },
            verified: { variant: 'default', icon: CheckCircle },
            rejected: { variant: 'destructive', icon: XCircle },
            completed: { variant: 'outline', icon: CheckCircle },
        };

        const config = variants[status] || variants.pending;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="gap-1">
                <Icon className="h-3 w-3" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const filteredPayments = statusFilter === 'all'
        ? payments
        : payments.filter(p => p.status === statusFilter);

    if (loading) {
        return (
            <div className="flex min-h-screen">
                <AdminSidebar />
                <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <AdminSidebar />
            </div>

            {/* Main Content */}
            <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
                <div className="container mx-auto py-8 px-4 pt-20 lg:pt-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {/* Total Paid Users */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Paid Users
                                </CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {payments.filter(p => ['verified', 'completed'].includes(p.status)).length}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Verified & Completed
                                </p>
                            </CardContent>
                        </Card>

                        {/* Total Payment */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Payment
                                </CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    RM {payments
                                        .filter(p => ['verified', 'completed'].includes(p.status))
                                        .reduce((sum, p) => sum + Number(p.package_price), 0)
                                        .toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Total revenue collected
                                </p>
                            </CardContent>
                        </Card>

                        {/* Package Selection */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Package Selection
                                </CardTitle>
                                <PackageIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1">
                                    {Object.entries(
                                        payments.reduce((acc, p) => {
                                            acc[p.package_name] = (acc[p.package_name] || 0) + 1;
                                            return acc;
                                        }, {} as Record<string, number>)
                                    ).map(([name, count]) => (
                                        <div key={name} className="flex justify-between text-sm">
                                            <span className="text-muted-foreground capitalize">{name}:</span>
                                            <span className="font-bold">{count}</span>
                                        </div>
                                    ))}
                                    {payments.length === 0 && (
                                        <div className="text-sm text-muted-foreground">No data</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pending Users */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Pending Users
                                </CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {payments.filter(p => p.status === 'pending').length}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Awaiting verification
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-6 w-6" />
                                        Package Payments
                                    </CardTitle>
                                    <CardDescription>
                                        Manage and track package payment submissions
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="verified">Verified</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredPayments.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No payments found
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Studio Name</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead>Package</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPayments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell className="text-sm">
                                                    {format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm')}
                                                </TableCell>
                                                <TableCell className="font-medium">{payment.studio_name}</TableCell>
                                                <TableCell className="text-sm">
                                                    <div>{payment.full_name}</div>
                                                    <div className="text-muted-foreground">{payment.email}</div>
                                                    <div className="text-muted-foreground">{payment.phone}</div>
                                                </TableCell>
                                                <TableCell>{payment.package_name}</TableCell>
                                                <TableCell className="font-medium">RM {payment.package_price.toFixed(2)}</TableCell>
                                                <TableCell className="capitalize">{payment.payment_method || '-'}</TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={payment.status}
                                                        onValueChange={(value) => handleQuickUpdateStatus(payment.id, value)}
                                                    >
                                                        <SelectTrigger className="w-[130px] h-8 text-xs">
                                                            <SelectValue>
                                                                {getStatusBadge(payment.status)}
                                                            </SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="pending">Pending</SelectItem>
                                                            <SelectItem value="verified">Verified</SelectItem>
                                                            <SelectItem value="rejected">Rejected</SelectItem>
                                                            <SelectItem value="completed">Completed</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleViewDetails(payment)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                const { generatePackageReceiptPDF } = require('@/utils/packageReceiptGenerator');
                                                                generatePackageReceiptPDF({
                                                                    studioName: payment.studio_name,
                                                                    fullName: payment.full_name,
                                                                    email: payment.email,
                                                                    phone: payment.phone,
                                                                    packageName: payment.package_name,
                                                                    packagePrice: payment.package_price,
                                                                    paymentMethod: payment.payment_method || undefined,
                                                                    submittedDate: format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm'),
                                                                    status: payment.status,
                                                                });
                                                            }}
                                                        >
                                                            <FileText className="h-4 w-4 mr-1" />
                                                            Receipt
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Payment Details Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Payment Details</DialogTitle>
                            <DialogDescription>
                                View and update payment information
                            </DialogDescription>
                        </DialogHeader>

                        {selectedPayment && (
                            <div className="space-y-6">
                                {/* Payment Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Studio Name</Label>
                                        <p className="font-medium">{selectedPayment.studio_name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Full Name</Label>
                                        <p className="font-medium">{selectedPayment.full_name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Email</Label>
                                        <p className="font-medium">{selectedPayment.email}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Phone</Label>
                                        <p className="font-medium">{selectedPayment.phone}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Original Package</Label>
                                        <p className="font-medium">{selectedPayment.package_name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Amount</Label>
                                        <p className="font-medium text-primary">RM {selectedPayment.package_price.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Payment Method</Label>
                                        <p className="font-medium capitalize">{selectedPayment.payment_method || '-'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Submitted</Label>
                                        <p className="font-medium">{format(new Date(selectedPayment.created_at), 'dd/MM/yyyy HH:mm')}</p>
                                    </div>
                                </div>

                                {/* Receipt */}
                                {selectedPayment.receipt_url && (
                                    <div>
                                        <Label className="text-muted-foreground mb-2 block">Receipt</Label>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => window.open(selectedPayment.receipt_url!, '_blank')}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                View Receipt
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    const { generatePackageReceiptPDF } = require('@/utils/packageReceiptGenerator');
                                                    generatePackageReceiptPDF({
                                                        studioName: selectedPayment.studio_name,
                                                        fullName: selectedPayment.full_name,
                                                        email: selectedPayment.email,
                                                        phone: selectedPayment.phone,
                                                        packageName: selectedPayment.package_name,
                                                        packagePrice: selectedPayment.package_price,
                                                        paymentMethod: selectedPayment.payment_method || undefined,
                                                        submittedDate: format(new Date(selectedPayment.created_at), 'dd/MM/yyyy HH:mm'),
                                                        status: selectedPayment.status,
                                                    });
                                                }}
                                            >
                                                <FileText className="h-4 w-4 mr-2" />
                                                Download Receipt
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Update Info */}
                                <div className="space-y-4 border-t pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="package_name">Package Name</Label>
                                        <Select
                                            value={updateData.package_name}
                                            onValueChange={(value) => setUpdateData({ ...updateData, package_name: value })}
                                        >
                                            <SelectTrigger id="package_name">
                                                <SelectValue placeholder="Select a package" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availablePackages.map((pkg) => (
                                                    <SelectItem key={pkg.id} value={pkg.name}>
                                                        {pkg.name}
                                                    </SelectItem>
                                                ))}
                                                {/* Allow manual entry if not in list by including current name */}
                                                {!availablePackages.find(p => p.name === updateData.package_name) && updateData.package_name && (
                                                    <SelectItem value={updateData.package_name}>
                                                        {updateData.package_name} (Current)
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">Update Status</Label>
                                        <Select
                                            value={updateData.status}
                                            onValueChange={(value: any) => setUpdateData({ ...updateData, status: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="verified">Verified</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Notes</Label>
                                        <Textarea
                                            id="notes"
                                            value={updateData.notes}
                                            onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                                            placeholder="Add notes about this payment..."
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateStatus} disabled={updating}>
                                {updating ? 'Updating...' : 'Update Status'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Mobile Menu */}
                <div className="lg:hidden fixed top-0 left-0 right-0 bg-background border-b border-border z-50 p-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-semibold">Package Payments</h1>
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-64 p-0">
                                <AdminSidebar />
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </div>
    );
}
