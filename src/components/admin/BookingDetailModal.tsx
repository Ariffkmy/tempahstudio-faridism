import { useState } from 'react';
import { Booking } from '@/types/booking';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Calendar,
    Clock,
    User,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    FileText,
    MessageCircle,
    Building2,
    Send
} from 'lucide-react';
import { format } from 'date-fns';
import { parseDateLocal } from '@/utils/dateUtils';

interface BookingDetailModalProps {
    booking: Booking | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BookingDetailModal({ booking, open, onOpenChange }: BookingDetailModalProps) {
    const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);
    const [whatsappMessage, setWhatsappMessage] = useState('');

    console.log('[BookingDetailModal] Render - open:', open, 'showWhatsAppPreview:', showWhatsAppPreview);

    // Utility to clean up any lingering overlays
    const cleanupOverlays = () => {
        console.log('[BookingDetailModal] Cleaning up overlays');
        // Check for any dialog overlays in the DOM
        const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
        console.log('[BookingDetailModal] Found overlays:', overlays.length);

        // Remove body scroll lock
        document.body.style.pointerEvents = '';
        document.body.style.overflow = '';

        // Log overlay details
        overlays.forEach((overlay, index) => {
            console.log(`[BookingDetailModal] Overlay ${index}:`, {
                display: (overlay as HTMLElement).style.display,
                pointerEvents: (overlay as HTMLElement).style.pointerEvents,
                zIndex: (overlay as HTMLElement).style.zIndex
            });
        });
    };

    // Reset WhatsApp preview state when main modal closes
    const handleMainModalChange = (isOpen: boolean) => {
        console.log('[BookingDetailModal] handleMainModalChange called - isOpen:', isOpen);
        if (!isOpen) {
            console.log('[BookingDetailModal] Closing main modal - resetting WhatsApp preview state');
            setShowWhatsAppPreview(false);
            setWhatsappMessage('');

            // Clean up any lingering overlays after a delay
            setTimeout(() => {
                cleanupOverlays();
            }, 200);
        }
        onOpenChange(isOpen);
        console.log('[BookingDetailModal] onOpenChange called with:', isOpen);
    };

    if (!booking && !open) {
        console.log('[BookingDetailModal] No booking data and dialog closed, returning null');
        return null;
    }

    if (!booking) {
        console.log('[BookingDetailModal] No booking data but dialog is open, returning empty dialog');
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tiada Data</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground">Tiada maklumat tempahan untuk dipaparkan.</p>
                </DialogContent>
            </Dialog>
        );
    }

    const getDefaultWhatsAppMessage = () => {
        return `Hai ${booking.customerName},\n\n` +
            `Terima kasih atas tempahan anda!\n\n` +
            `📋 *Butiran Tempahan*\n` +
            `Rujukan: ${booking.reference}\n` +
            `Tarikh: ${format(parseDateLocal(booking.date), 'dd/MM/yyyy')}\n` +
            `Masa: ${booking.startTime} - ${booking.endTime}\n` +
            `Layout: ${booking.layoutName}\n` +
            `Jumlah: RM ${booking.totalPrice.toFixed(2)}\n\n` +
            `Jika ada sebarang pertanyaan, sila hubungi kami.`;
    };

    const handleWhatsAppClick = () => {
        console.log('[BookingDetailModal] WhatsApp button clicked');
        // Set default message and show preview
        setWhatsappMessage(getDefaultWhatsAppMessage());
        setShowWhatsAppPreview(true);
        console.log('[BookingDetailModal] WhatsApp preview opened');
    };

    const handleSendWhatsApp = () => {
        console.log('[BookingDetailModal] Send WhatsApp clicked');
        // Format phone number - remove any non-digit characters
        const phoneNumber = booking.customerPhone.replace(/\D/g, '');

        // Encode the message
        const message = encodeURIComponent(whatsappMessage);

        // Open WhatsApp with the message
        // Use international format - add 60 for Malaysia if not present
        const formattedPhone = phoneNumber.startsWith('60') ? phoneNumber : `60${phoneNumber}`;
        console.log('[BookingDetailModal] Opening WhatsApp for:', formattedPhone);
        window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');

        // Close WhatsApp preview first, then main modal
        console.log('[BookingDetailModal] Closing WhatsApp preview');
        setShowWhatsAppPreview(false);
        setWhatsappMessage('');
        // Use setTimeout to ensure preview dialog closes before main modal
        setTimeout(() => {
            console.log('[BookingDetailModal] Closing main modal after timeout');
            onOpenChange(false);
        }, 100);
    };

    const handleWhatsAppPreviewClose = (isOpen: boolean) => {
        console.log('[BookingDetailModal] WhatsApp preview onOpenChange called - isOpen:', isOpen);
        setShowWhatsAppPreview(isOpen);
        if (!isOpen) {
            console.log('[BookingDetailModal] WhatsApp preview closed, clearing message');
            setWhatsappMessage('');
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'default'> = {
            'done-payment': 'default',
            'done-photoshoot': 'secondary',
            'start-editing': 'warning',
            'ready-for-delivery': 'success',
            'completed': 'success',
            'rescheduled': 'warning',
            'no-show': 'destructive',
            'cancelled': 'destructive',
        };

        const labels: Record<string, string> = {
            'done-payment': 'Bayaran Selesai',
            'done-photoshoot': 'Photoshoot Selesai',
            'start-editing': 'Mula Edit',
            'ready-for-delivery': 'Sedia Hantar',
            'completed': 'Selesai',
            'rescheduled': 'Dijadual Semula',
            'no-show': 'Tidak Hadir',
            'cancelled': 'Dibatalkan',
        };

        return (
            <Badge variant={variants[status] || 'default'}>
                {labels[status] || status}
            </Badge>
        );
    };

    return (
        <>
            {/* Main Booking Detail Dialog */}
            <Dialog open={open} onOpenChange={handleMainModalChange}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Butiran Tempahan</DialogTitle>
                        <DialogDescription>
                            Rujukan: <span className="font-mono font-semibold">{booking.reference}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Status */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Status</span>
                            {getStatusBadge(booking.status)}
                        </div>

                        <Separator />

                        {/* Customer Information */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Maklumat Pelanggan
                            </h3>
                            <div className="space-y-3 pl-6">
                                <div className="flex items-start gap-3">
                                    <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Nama</p>
                                        <p className="font-medium">{booking.customerName}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="font-medium">{booking.customerEmail}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Telefon</p>
                                        <p className="font-medium">{booking.customerPhone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Booking Information */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Maklumat Tempahan
                            </h3>
                            <div className="space-y-3 pl-6">
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Tarikh</p>
                                        <p className="font-medium">{format(parseDateLocal(booking.date), 'EEEE, dd MMMM yyyy')}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Masa</p>
                                        <p className="font-medium">{booking.startTime} - {booking.endTime}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{booking.duration} minit</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Layout Studio</p>
                                        <p className="font-medium">{booking.layoutName}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Jumlah Bayaran</p>
                                        <p className="font-medium text-lg">RM {booking.totalPrice.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {(booking.notes || booking.internalNotes) && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Nota
                                    </h3>
                                    <div className="space-y-3 pl-6">
                                        {booking.notes && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Nota Pelanggan</p>
                                                <p className="text-sm bg-muted/50 p-3 rounded-md">{booking.notes}</p>
                                            </div>
                                        )}
                                        {booking.internalNotes && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Nota Dalaman</p>
                                                <p className="text-sm bg-muted/50 p-3 rounded-md">{booking.internalNotes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        <Separator />

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button
                                onClick={handleWhatsAppClick}
                                className="flex-1 bg-[#25D366] hover:bg-[#20BA5A] text-white"
                            >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                WhatsApp Pelanggan
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleMainModalChange(false)}
                                className="flex-1"
                            >
                                Tutup
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* WhatsApp Message Preview Dialog */}
            <Dialog open={showWhatsAppPreview} onOpenChange={handleWhatsAppPreviewClose}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-[#25D366]" />
                            Pratonton Mesej WhatsApp
                        </DialogTitle>
                        <DialogDescription>
                            Semak dan edit mesej sebelum menghantar kepada {booking.customerName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp-message">Mesej</Label>
                            <Textarea
                                id="whatsapp-message"
                                value={whatsappMessage}
                                onChange={(e) => setWhatsappMessage(e.target.value)}
                                rows={12}
                                className="font-mono text-sm resize-none"
                                placeholder="Tulis mesej anda di sini..."
                            />
                            <p className="text-xs text-muted-foreground">
                                Anda boleh edit mesej ini sebelum menghantar
                            </p>
                        </div>

                        <div className="bg-muted/50 p-3 rounded-md">
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Hantar kepada:</span>
                                <span>{booking.customerPhone}</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => handleWhatsAppPreviewClose(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleSendWhatsApp}
                            className="bg-[#25D366] hover:bg-[#20BA5A] text-white"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Hantar WhatsApp
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
