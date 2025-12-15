import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { getAllPackagePayments, updatePackagePayment, type PackagePayment } from '@/services/packagePaymentService';
import { CreditCard, Eye, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPackagePayments() {
    const { toast } = useToast();
    const [payments, setPayments] = useState<PackagePayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<PackagePayment | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const [updateData, setUpdateData] = useState({
        status: '' as 'pending' | 'verified' | 'rejected' | 'completed',
        notes: '',
    });

    useEffect(() => {
        loadPayments();
    }, []);

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
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
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
                                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewDetails(payment)}
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

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
                                    <Label className="text-muted-foreground">Package</Label>
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
                                    <Button
                                        variant="outline"
                                        onClick={() => window.open(selectedPayment.receipt_url!, '_blank')}
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        View Receipt
                                    </Button>
                                </div>
                            )}

                            {/* Update Status */}
                            <div className="space-y-4 border-t pt-4">
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
        </div>
    );
}
