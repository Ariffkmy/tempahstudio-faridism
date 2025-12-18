import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/booking/DatePicker';
import { TimeSlots } from '@/components/booking/TimeSlots';
import { generateTimeSlots } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Booking } from '@/types/booking';

interface RescheduleDialogProps {
    booking: Booking | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

interface TimeSlot {
    time: string;
    available: boolean;
}

export function RescheduleDialog({
    booking,
    open,
    onOpenChange,
    onSuccess,
}: RescheduleDialogProps) {
    const { toast } = useToast();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [studioSettings, setStudioSettings] = useState<any>(null);
    const [layoutPackage, setLayoutPackage] = useState<number | null>(null);

    // Reset state and force unlock body when dialog closes
    useEffect(() => {
        if (open && booking) {
            // Set initial date to current booking date
            const currentDate = new Date(booking.date);
            setSelectedDate(currentDate);
            setSelectedTime(null);
        } else if (!open) {
            setSelectedDate(undefined);
            setSelectedTime(null);
            setTimeSlots([]);
            setLayoutPackage(null);

            // SELF-HEALING: Force unlock body whenever dialog closes
            // This handles click-outside, ESC, or X-button closures
            const timer = setTimeout(() => {
                const lingeringOverlays = document.querySelectorAll('[data-radix-dialog-overlay]');
                if (lingeringOverlays.length === 0) {
                    console.log('[RescheduleDialog] No overlays found, ensuring body is unlocked');
                    document.body.style.pointerEvents = '';
                    document.body.style.overflow = '';
                    document.body.style.paddingRight = '';
                    document.body.classList.remove('overflow-hidden');
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [open, booking]);

    // Load studio settings and layout package for duration
    useEffect(() => {
        const loadData = async () => {
            if (!booking?.studioId || !booking?.layoutId) return;

            try {
                // Fetch studio settings
                const { data: studioData, error: studioError } = await supabase
                    .from('studios')
                    .select('time_slot_gap, operating_start_time, operating_end_time')
                    .eq('id', booking.studioId)
                    .single();

                if (studioError) {
                    console.error('Error loading studio settings:', studioError);
                } else {
                    setStudioSettings(studioData);
                }

                // Fetch layout minute package
                const { data: layoutData, error: layoutError } = await supabase
                    .from('studio_layouts')
                    .select('minute_package')
                    .eq('id', booking.layoutId)
                    .single();

                if (layoutError) {
                    console.error('Error loading layout info:', layoutError);
                } else if (layoutData) {
                    console.log('[RescheduleDialog] Layout minute_package found:', layoutData.minute_package);
                    setLayoutPackage(layoutData.minute_package);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };

        if (open && booking) {
            loadData();
        }
    }, [open, booking]);

    // Fetch available time slots when date changes
    useEffect(() => {
        const fetchTimeSlots = async () => {
            if (!selectedDate || !booking) {
                setTimeSlots([]);
                return;
            }

            setIsLoading(true);

            try {
                // Format date
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                const dateString = `${year}-${month}-${day}`;

                // Fetch existing bookings for this layout and date (excluding current booking)
                const { data: bookings, error } = await supabase
                    .from('bookings')
                    .select('start_time, duration')
                    .eq('studio_id', booking.studioId)
                    .eq('layout_id', booking.layoutId)
                    .eq('date', dateString)
                    .neq('id', booking.id) // Exclude current booking
                    .not('status', 'in', '("cancelled", "no-show")');

                if (error) {
                    console.error('Error fetching bookings:', error);
                    setTimeSlots([]);
                    return;
                }

                // Extract booked time ranges
                const occupiedRanges = (bookings || []).map(b => {
                    const [h, m] = b.start_time.split(':').map(Number);
                    const startMin = h * 60 + m;
                    const duration = b.duration || 60; // Fallback to 60m
                    return {
                        start: startMin,
                        end: startMin + duration,
                        status: b.status,
                        time: b.start_time
                    };
                });

                console.log(`[RescheduleDialog] Found ${occupiedRanges.length} other bookings on this date:`, occupiedRanges);

                // We'll pass a special flag or handle the slots here to disable based on duration
                console.log('[RescheduleDialog] Occupied ranges:', occupiedRanges);

                // Generate time slots using the same function as booking page
                const intervalMinutes = studioSettings?.time_slot_gap || 60;
                const startTime = studioSettings?.operating_start_time || '09:00';
                const endTime = studioSettings?.operating_end_time || '18:00';

                console.log('[RescheduleDialog] Config:', { intervalMinutes, startTime, endTime, bookingDuration: booking.duration });

                // Use the base generateTimeSlots to get potential slots (including past-time handling)
                const baseSlots = generateTimeSlots(selectedDate, booking.layoutId, intervalMinutes, startTime, endTime, []);

                const activeDuration = layoutPackage || booking.duration || 60;
                const newBookingDuration = activeDuration;


                const [endH, endM] = endTime.split(':').map(Number);
                const operatingEndMin = endH * 60 + endM;

                const finalSlots = baseSlots.map(slot => {
                    const [h, m] = slot.time.split(':').map(Number);
                    const slotStart = h * 60 + m;
                    const slotEnd = slotStart + newBookingDuration;

                    // Check if this slot (with its duration) overlaps with any occupied range
                    const overlappingWith = occupiedRanges.find(range => {
                        // Overlap if (slotStart < range.end) && (slotEnd > range.start)
                        return (slotStart < range.end) && (slotEnd > range.start);
                    });

                    const isOverlapping = !!overlappingWith;

                    // Check if session would end after operating hours
                    const endsAfterHours = slotEnd > operatingEndMin;

                    const isAvailable = slot.available && !isOverlapping && !endsAfterHours;

                    if (isOverlapping || endsAfterHours || !slot.available) {
                        console.log(`[RescheduleDialog] Slot ${slot.time} is UNAVAILABLE:`, {
                            baseAvailable: slot.available,
                            isOverlapping,
                            overlappingWith: isOverlapping ? `${overlappingWith.time} (${overlappingWith.status})` : 'none',
                            endsAfterHours,
                            slotRange: `${slotStart}-${slotEnd}`
                        });
                    }

                    return {
                        ...slot,
                        available: isAvailable
                    };
                });

                console.log(`[RescheduleDialog] Generated ${finalSlots.length} slots, ${finalSlots.filter(s => s.available).length} available`);
                setTimeSlots(finalSlots);

            } catch (error) {
                console.error('Error fetching time slots:', error);
                setTimeSlots([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTimeSlots();
    }, [selectedDate, booking, studioSettings]);



    const handleReschedule = async () => {
        console.log('[RescheduleDialog] ========== RESCHEDULE STARTED ==========');
        if (!booking || !selectedDate || !selectedTime) {
            console.log('[RescheduleDialog] Missing required data');
            return;
        }

        console.log('[RescheduleDialog] Setting isSubmitting to true');
        setIsSubmitting(true);

        try {
            console.log('[RescheduleDialog] Formatting date...');
            // Format date
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            console.log('[RescheduleDialog] Date formatted:', dateString);

            console.log('[RescheduleDialog] Calculating end time...');
            // Calculate end time based on duration (prioritize layout package)
            const activeDuration = layoutPackage || booking.duration || 60;
            const [startHour, startMin] = selectedTime.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = startMinutes + activeDuration;
            const endHour = Math.floor(endMinutes / 60);
            const endMin = endMinutes % 60;
            const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
            console.log('[RescheduleDialog] End time calculated:', endTime, 'using duration:', activeDuration);

            console.log('[RescheduleDialog] Updating booking in database...');
            // Update booking
            const { error } = await supabase
                .from('bookings')
                .update({
                    date: dateString,
                    start_time: selectedTime,
                    end_time: endTime,
                    duration: activeDuration,
                    status: 'rescheduled',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', booking.id);

            if (error) {
                console.error('[RescheduleDialog] Database error:', error);
                throw error;
            }
            console.log('[RescheduleDialog] Database updated successfully');

            console.log('[RescheduleDialog] Showing success toast...');
            toast({
                title: 'Berjaya',
                description: 'Tempahan telah dijadualkan semula',
                duration: 2000, // Auto-dismiss after 2 seconds
            });

            console.log('[RescheduleDialog] Closing dialog and triggering success callback...');
            // Close dialog first
            onOpenChange(false);

            // Trigger success callback after a brief delay to allow onOpenChange to propagate
            setTimeout(() => {
                console.log('[RescheduleDialog] Triggering success callback...');
                onSuccess();
                console.log('[RescheduleDialog] Success callback completed');
            }, 300);

        } catch (error) {
            console.error('[RescheduleDialog] Error in reschedule:', error);
            toast({
                title: 'Ralat',
                description: 'Gagal menjadualkan semula tempahan',
                variant: 'destructive',
            });
        } finally {
            console.log('[RescheduleDialog] Setting isSubmitting to false');
            setIsSubmitting(false);
            console.log('[RescheduleDialog] ========== RESCHEDULE ENDED ==========');
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Jadualkan Semula Tempahan</DialogTitle>
                    <DialogDescription>
                        Pilih tarikh dan masa baharu untuk tempahan ini
                    </DialogDescription>
                </DialogHeader>

                {booking && (
                    <div className="space-y-6">
                        {/* Current Booking Info */}
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <h4 className="font-semibold text-sm">Maklumat Tempahan Semasa</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Rujukan:</span>
                                    <p className="font-medium">{booking.reference}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Pelanggan:</span>
                                    <p className="font-medium">{booking.customerName}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Layout:</span>
                                    <p className="font-medium">{booking.layoutName}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Tempoh:</span>
                                    <p className="font-medium">{layoutPackage || booking.duration} minit</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Tarikh Asal:</span>
                                    <p className="font-medium">{format(new Date(booking.date), 'dd MMM yyyy')}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Masa Asal:</span>
                                    <p className="font-medium">{booking.startTime} - {booking.endTime}</p>
                                </div>
                            </div>
                        </div>

                        {/* Date Selection */}
                        <DatePicker
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                        />

                        {/* Time Slot Selection */}
                        {selectedDate && (
                            isLoading ? (
                                <Card variant="outline" className="p-4">
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                    </div>
                                </Card>
                            ) : (
                                <TimeSlots
                                    slots={timeSlots}
                                    selectedTime={selectedTime}
                                    onSelectTime={setSelectedTime}
                                />
                            )
                        )}

                        {/* New Booking Summary */}
                        {selectedDate && selectedTime && (
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                                <h4 className="font-semibold text-sm text-primary">Maklumat Tempahan Baharu</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Tarikh Baharu:</span>
                                        <p className="font-medium">{format(selectedDate, 'dd MMM yyyy')}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Masa Baharu:</span>
                                        <p className="font-medium">
                                            {selectedTime} - {(() => {
                                                const activeDur = layoutPackage || booking.duration || 60;
                                                const [h, m] = selectedTime.split(':').map(Number);
                                                const totalMin = h * 60 + m + activeDur;
                                                const endH = Math.floor(totalMin / 60);
                                                const endM = totalMin % 60;
                                                return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
                                            })()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={handleReschedule}
                                disabled={!selectedDate || !selectedTime || isSubmitting}
                            >
                                {isSubmitting ? 'Memproses...' : 'Jadualkan Semula'}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
