import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LayoutSelector } from '@/components/booking/LayoutSelector';
import { DatePicker } from '@/components/booking/DatePicker';
import { TimeSlots } from '@/components/booking/TimeSlots';
import { ContactForm } from '@/components/booking/ContactForm';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createPublicBooking } from '@/services/bookingService';
import { useToast } from '@/hooks/use-toast';
import { generateTimeSlots } from '@/data/mockData';
import type { StudioLayout } from '@/types/booking';

interface AdminCreateBookingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studioId: string;
    onSuccess: () => void;
}

export function AdminCreateBookingDialog({
    open,
    onOpenChange,
    studioId,
    onSuccess,
}: AdminCreateBookingDialogProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [layouts, setLayouts] = useState<StudioLayout[]>([]);
    const [addonPackages, setAddonPackages] = useState<any[]>([]);
    const [bookedTimes, setBookedTimes] = useState<string[]>([]);
    const [ignoreAvailability, setIgnoreAvailability] = useState(false);

    // Form State
    const [selectedLayout, setSelectedLayout] = useState<string | null>(null);
    const [selectedAddon, setSelectedAddon] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [numberOfPax, setNumberOfPax] = useState<number>(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        notes: '',
    });

    // Studio Settings (Intervals, etc.)
    const [settings, setSettings] = useState({
        timeSlotGap: 60,
        operatingStartTime: '09:00',
        operatingEndTime: '18:00',
    });

    // Load Layouts and Studio Settings
    useEffect(() => {
        if (open && studioId) {
            loadData();
        }
    }, [open, studioId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load Studio Settings
            const { data: studio, error: studioError } = await supabase
                .from('studios')
                .select('*')
                .eq('id', studioId)
                .single();

            if (studio && !studioError) {
                setSettings({
                    timeSlotGap: (studio as any).time_slot_gap || 60,
                    operatingStartTime: (studio as any).operating_start_time || '09:00',
                    operatingEndTime: (studio as any).operating_end_time || '18:00',
                });
            }

            // Load Layouts
            const { data: layoutsData, error: layoutsError } = await supabase
                .from('studio_layouts')
                .select('*')
                .eq('studio_id', studioId)
                .eq('is_active', true)
                .order('name');

            if (!layoutsError && layoutsData) {
                const formattedLayouts = layoutsData.map(l => ({
                    id: l.id,
                    name: l.name,
                    description: l.description,
                    capacity: l.capacity,
                    pricePerHour: Number(l.price_per_hour),
                    minute_package: l.minute_package || 60,
                    image: l.image,
                    thumbnail_photo: l.thumbnail_photo,
                    amenities: l.amenities || [],
                    layout_photos: l.layout_photos || [],
                }));
                setLayouts(formattedLayouts);
            }

            // Load Addon Packages
            const { data: addonData, error: addonError } = await supabase
                .from('addon_packages')
                .select('*')
                .eq('studio_id', studioId)
                .eq('is_active', true)
                .order('price');

            if (!addonError && addonData) {
                setAddonPackages(addonData);
            }
        } catch (error) {
            console.error('Error loading data for admin booking:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch booked times for selected layout and date
    useEffect(() => {
        const fetchBookedTimes = async () => {
            if (!selectedDate || !selectedLayout || !studioId) {
                setBookedTimes([]);
                return;
            }

            try {
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                const dateString = `${year}-${month}-${day}`;

                const { data: bookings, error } = await supabase
                    .from('bookings')
                    .select('start_time')
                    .eq('studio_id', studioId)
                    .eq('layout_id', selectedLayout)
                    .eq('date', dateString)
                    .in('status', ['done-payment', 'done-photoshoot', 'start-editing', 'ready-for-delivery', 'completed', 'rescheduled']);

                if (!error) {
                    setBookedTimes(bookings?.map(b => b.start_time.substring(0, 5)) || []);
                }
            } catch (error) {
                console.error('Error fetching booked times:', error);
            }
        };

        fetchBookedTimes();
    }, [selectedDate, selectedLayout, studioId]);

    const handleFormChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const selectedLayoutData = layouts.find(l => l.id === selectedLayout);
    const selectedAddonData = addonPackages.find(p => p.id === selectedAddon);

    // Price Calculations
    const durationInMinutes = selectedLayoutData?.minute_package || 60;
    const basePrice = selectedLayoutData?.pricePerHour || 0;
    const addonPrice = selectedAddonData?.price || 0;
    const totalPrice = basePrice + addonPrice;

    const isFormValid = Boolean(
        selectedLayout &&
        selectedDate &&
        selectedTime &&
        formData.name.trim() &&
        formData.email.trim() &&
        formData.phone.trim()
    );

    const handleSubmit = async () => {
        if (!isFormValid || !selectedLayoutData || !selectedDate || !selectedTime) return;

        setIsSubmitting(true);
        try {
            const startDateTime = new Date(`${selectedDate.toDateString()} ${selectedTime}`);
            const endDateTime = new Date(startDateTime.getTime() + (durationInMinutes * 60 * 1000));
            const endTime = endDateTime.toTimeString().slice(0, 5);

            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            const bookingData = {
                customerName: formData.name,
                customerEmail: formData.email,
                customerPhone: formData.phone,
                studioId: studioId,
                layoutId: selectedLayout,
                date: formattedDate,
                startTime: selectedTime,
                endTime: endTime,
                duration: durationInMinutes,
                totalPrice: totalPrice,
                balanceDue: 0,
                numberOfPax: numberOfPax,
                notes: formData.notes,
                paymentType: 'full',
                paymentMethod: 'cash', // Default to cash for admin manual booking
                addonPackageId: selectedAddon || undefined,
                status: 'done-payment', // Admins create bookings with full payment assumed/confirmed
            };

            const result = await createPublicBooking(bookingData);

            if (result.success) {
                toast({
                    title: "Tempahan Berjaya",
                    description: "Tempahan manual telah dicipta.",
                });
                onSuccess();
                onOpenChange(false);
                // Reset form
                setSelectedLayout(null);
                setSelectedAddon(null);
                setSelectedDate(undefined);
                setSelectedTime(null);
                setFormData({ name: '', email: '', phone: '', notes: '' });
            } else {
                toast({
                    title: "Ralat",
                    description: result.error || "Gagal membuat tempahan.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error creating admin booking:', error);
            toast({
                title: "Ralat",
                description: "Ralat tidak dijangka berlaku.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Tambah Tempahan Manual</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Memuatkan data studio...</span>
                    </div>
                ) : (
                    <div className="space-y-8 py-4">
                        {/* Layout Selector */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">1. Pilih Layout</h3>
                            <LayoutSelector
                                layouts={layouts}
                                selectedLayout={selectedLayout}
                                onSelectLayout={setSelectedLayout}
                            />
                        </div>

                        <div className="space-y-8">
                            {/* Date & Time */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold">2. Tarikh & Masa</h3>
                                    <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                id="ignore-availability"
                                                checked={ignoreAvailability}
                                                onCheckedChange={setIgnoreAvailability}
                                            />
                                            <Label htmlFor="ignore-availability" className="text-[10px] font-medium cursor-pointer uppercase tracking-wider">
                                                Abaikan Slot Penuh
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                                <DatePicker
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                />
                                {selectedDate ? (
                                    <TimeSlots
                                        slots={generateTimeSlots(
                                            selectedDate,
                                            selectedLayout,
                                            settings.timeSlotGap,
                                            settings.operatingStartTime,
                                            settings.operatingEndTime,
                                            ignoreAvailability ? [] : bookedTimes
                                        )}
                                        selectedTime={selectedTime}
                                        onSelectTime={setSelectedTime}
                                    />
                                ) : (
                                    <div className="p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
                                        Sila pilih tarikh
                                    </div>
                                )}

                                {ignoreAvailability && (
                                    <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-600 text-[10px]">
                                        <AlertCircle className="h-3 w-3" />
                                        <span>Mod override aktif: Anda boleh memilih slot yang telah penuh atau waktu lampau.</span>
                                    </div>
                                )}
                            </div>

                            {/* Customer Info */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">3. Maklumat Pelanggan</h3>
                                <ContactForm
                                    formData={formData}
                                    onFormChange={handleFormChange}
                                />
                                <div className="space-y-2 pt-2">
                                    <Label htmlFor="numberOfPax">Bilangan Pax</Label>
                                    <Input
                                        id="numberOfPax"
                                        type="number"
                                        min="1"
                                        value={numberOfPax}
                                        onChange={(e) => setNumberOfPax(parseInt(e.target.value) || 1)}
                                    />
                                </div>

                                {/* Addons Selection */}
                                {addonPackages.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Pakej Tambahan (Pilihan)</Label>
                                        <div className="grid grid-cols-1 gap-2">
                                            <Button
                                                variant={selectedAddon === null ? 'default' : 'outline'}
                                                className="justify-between h-auto py-2 px-3 text-left font-normal"
                                                onClick={() => setSelectedAddon(null)}
                                            >
                                                <div>
                                                    <div className="font-medium text-xs">Tiada Tambahan</div>
                                                </div>
                                                <div className="text-xs">RM 0</div>
                                            </Button>
                                            {addonPackages.map((pkg) => (
                                                <Button
                                                    key={pkg.id}
                                                    variant={selectedAddon === pkg.id ? 'default' : 'outline'}
                                                    className="justify-between h-auto py-2 px-3 text-left font-normal"
                                                    onClick={() => setSelectedAddon(pkg.id)}
                                                >
                                                    <div>
                                                        <div className="font-medium text-xs">{pkg.name}</div>
                                                        <div className="text-[10px] opacity-70">{pkg.description.substring(0, 40)}...</div>
                                                    </div>
                                                    <div className="text-xs">RM {pkg.price}</div>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedAddonData && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{selectedAddonData.name}:</span>
                                        <span>RM {selectedAddonData.price}</span>
                                    </div>
                                )}
                                <div className="pt-2 border-t flex justify-between font-bold">
                                    <span>Jumlah Bayaran:</span>
                                    <span className="text-primary text-xl">RM {totalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="sm:justify-between items-center gap-4">
                    <div className="text-xs text-muted-foreground">
                        * Tempahan akan dicipta dengan status <span className="font-semibold text-foreground">Confirmed</span> dan bayaran penuh dikesan.
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Cipta Tempahan (RM {totalPrice.toFixed(2)})
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
