import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2, Calendar, Users, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createPublicBooking } from '@/services/bookingService';
import { DatePicker } from '@/components/booking/DatePicker';
import { PaymentSelector } from '@/components/booking/PaymentSelector';
import { CreateBookingData } from '@/services/bookingService';
import { loadStudioSettings } from '@/services/studioSettings';
import Navigation from '../landing/components/Navigation';
import Footer from '../landing/components/Footer';
import { Link } from 'react-router-dom';
import '../landing/App.css';
import '../landing/index.css';
import '../landing/pages/AboutUs.css';
import '../landing/pages/PackagePage.css';

const WeddingBooking = () => {
    const navigate = useNavigate();
    const { packageId } = useParams<{ packageId?: string }>();
    const [searchParams] = useSearchParams();
    const { toast } = useToast();

    // Get package info from URL params
    const packageName = searchParams.get('name') || 'Wedding Reception Package';
    const packagePrice = searchParams.get('price') || '0';

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedPayment, setSelectedPayment] = useState<string>('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        numberOfGuests: '',
        venue: '',
        notes: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [studioId, setStudioId] = useState<string | null>(null);
    const [studioSettings, setStudioSettings] = useState<any>(null);
    const [uploadedFiles, setUploadedFiles] = useState({
        receipt: null as File | null,
        proof: null as File | null,
    });

    // Tiered Studio Identification
    useEffect(() => {
        const loadStudio = async () => {
            try {
                let currentStudioId = searchParams.get('studioId');
                const envSlug = import.meta.env.VITE_STUDIO_SLUG;
                const envId = import.meta.env.VITE_STUDIO_ID;

                // Priority 1: URL Parameter ?studioId=
                if (currentStudioId) {
                    // Just use it
                }
                // Priority 2: Environment Variable
                else if (envId || envSlug) {
                    const query = supabase.from('studios').select('id').eq('is_active', true);
                    if (envId) query.eq('id', envId);
                    else query.eq('slug', envSlug);

                    const { data } = await query.single();
                    if (data) currentStudioId = data.id;
                }

                // Priority 3: Fallback to first active studio
                if (!currentStudioId) {
                    const { data } = await supabase
                        .from('studios')
                        .select('id')
                        .eq('is_active', true)
                        .limit(1)
                        .single();
                    if (data) currentStudioId = data.id;
                }

                if (!currentStudioId) {
                    toast({
                        title: "Error",
                        description: "Failed to load studio information",
                        variant: "destructive",
                    });
                    return;
                }

                setStudioId(currentStudioId);

                // Load studio settings for payment info
                const settings = await loadStudioSettings(currentStudioId);
                setStudioSettings(settings);
            } catch (error) {
                console.error('Error loading studio context:', error);
            }
        };

        loadStudio();
    }, [searchParams, toast]);

    const handleFileUpload = (type: 'receipt' | 'proof', file: File | null) => {
        setUploadedFiles(prev => ({ ...prev, [type]: file }));
    };

    const handleFormChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const isFormValid =
        formData.name &&
        formData.email &&
        formData.phone &&
        formData.numberOfGuests &&
        selectedDate &&
        selectedPayment;

    const handleSubmit = async () => {
        if (!isFormValid || !studioId) return;

        setIsSubmitting(true);

        try {
            // For wedding bookings, we don't need to fetch a specific layoutId
            // We can just proceed with basic validation
            if (!studioId) {
                toast({
                    title: "Error",
                    description: "Studio information not loaded yet",
                    variant: "destructive",
                });
                setIsSubmitting(false);
                return;
            }

            const bookingData: CreateBookingData = {
                customerName: formData.name,
                customerEmail: formData.email,
                customerPhone: formData.phone,
                studioId: studioId,
                date: selectedDate.toISOString().split('T')[0],
                startTime: '00:00', // Wedding bookings don't use time slots
                endTime: '23:59',
                duration: 1440, // Full day in minutes
                totalPrice: parseFloat(packagePrice),
                numberOfPax: parseInt(formData.numberOfGuests),
                notes: `Wedding Reception Booking\nPackage: ${packageName}\nAdditional Notes: ${formData.notes || 'None'}`,
                paymentMethod: selectedPayment,
                bookingType: 'wedding' as const,
            };

            const result = await createPublicBooking(bookingData);

            if (result.success && result.booking) {
                toast({
                    title: "Tempahan Berjaya",
                    description: `Tempahan majlis anda telah berjaya dihantar. Rujukan: ${result.booking.reference}`,
                });

                setTimeout(() => {
                    navigate('/booking/confirmation', {
                        state: {
                            booking: result.booking,
                            reference: result.booking.reference,
                            packageName: packageName
                        }
                    });
                }, 1500);
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to create booking. Please try again.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error submitting wedding booking:', error);
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="landing-app">
            <Navigation />
            <main className="main-content">
                <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/30 py-0 px-0">
                    <style>{scrollAnimationStyles}</style>

                    {/* Hero Header */}
                    <section className="page-hero" style={{
                        backgroundImage: `url(https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1920&q=80)`,
                        marginBottom: '40px'
                    }}>
                        <div className="hero-overlay"></div>
                        <div className="container">
                            <h1 className="page-title">Tempahan Majlis Perkahwinan</h1>
                            <div className="breadcrumb">
                                <Link to="/">Laman Utama</Link> / <Link to="/packages">Pakej Kami</Link> / <Link to="/packages/wedding-reception">Majlis Perkahwinan</Link> / <span>Tempahan</span>
                            </div>
                        </div>
                    </section>

                    <div className="max-w-4xl mx-auto px-4 pb-12">
                        {/* Header Section (Simplified since we have Hero) */}
                        <div className="text-center mb-8 scroll-animate">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tempahan Majlis Perkahwinan</h2>
                            <p className="text-lg text-muted-foreground">
                                Lengkapkan butiran untuk tempahan majlis anda
                            </p>
                        </div>

                        {/* Package Info Card */}
                        <Card className="mb-8 scroll-animate delay-100">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-primary" />
                                    Pakej Pilihan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-lg">{packageName}</p>
                                        <p className="text-sm text-muted-foreground">Liputan perkahwinan profesional</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-primary">RM {parseFloat(packagePrice).toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Booking Form */}
                        <Card className="scroll-animate delay-200">
                            <CardHeader>
                                <CardTitle>Butiran Tempahan</CardTitle>
                                <CardDescription>Sila lengkapkan maklumat anda untuk membuat tempahan</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Contact Information */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg">Maklumat Perhubungan</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nama Penuh *</Label>
                                            <Input
                                                id="name"
                                                placeholder="Masukkan nama penuh anda"
                                                value={formData.name}
                                                onChange={(e) => handleFormChange('name', e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Emel *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="nama@contoh.com"
                                                value={formData.email}
                                                onChange={(e) => handleFormChange('email', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">No. Telefon *</Label>
                                        <Input
                                            id="phone"
                                            placeholder="+60 12-345 6789"
                                            value={formData.phone}
                                            onChange={(e) => handleFormChange('phone', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Event Details */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-primary" />
                                        Butiran Majlis
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Tarikh Majlis *</Label>
                                            <DatePicker
                                                selected={selectedDate}
                                                onSelect={setSelectedDate}
                                                disabled={(date) => {
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);
                                                    return date < today;
                                                }}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="guests" className="flex items-center gap-2">
                                                <Users className="h-4 w-4" />
                                                Bilangan Tetamu *
                                            </Label>
                                            <Input
                                                id="guests"
                                                type="number"
                                                placeholder="Contoh: 200"
                                                value={formData.numberOfGuests}
                                                onChange={(e) => handleFormChange('numberOfGuests', e.target.value)}
                                            />
                                        </div>
                                    </div>


                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Nota Tambahan</Label>
                                        <Textarea
                                            id="notes"
                                            placeholder="Sebarang permintaan khas atau maklumat tambahan..."
                                            value={formData.notes}
                                            onChange={(e) => handleFormChange('notes', e.target.value)}
                                            rows={4}
                                        />
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg">Kaedah Pembayaran</h3>
                                    <PaymentSelector
                                        selectedPayment={selectedPayment}
                                        onSelectPayment={setSelectedPayment}
                                        onFileUpload={handleFileUpload}
                                        enabledMethods={studioSettings?.paymentMethods}
                                        generalQrCode={studioSettings?.generalQrCode}
                                        tngQrCode={studioSettings?.tngQrCode}
                                        bankAccountNumber={studioSettings?.bankAccountNumber}
                                        accountOwnerName={studioSettings?.accountOwnerName}
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="pt-6">
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!isFormValid || isSubmitting}
                                        className="w-full h-12 text-lg"
                                        size="lg"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="mr-2 h-5 w-5" />
                                                Sahkan Tempahan
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-sm text-muted-foreground text-center mt-4">
                                        By confirming, you agree to our terms and conditions
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

// Scroll animation styles
const scrollAnimationStyles = `
  .scroll-animate {
    opacity: 0;
    transform: translateY(30px);
    animation: fadeInUp 0.6s ease-out forwards;
  }

  .delay-100 { animation-delay: 0.1s; }
  .delay-200 { animation-delay: 0.2s; }

  @keyframes fadeInUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export default WeddingBooking;
