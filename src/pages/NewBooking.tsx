import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LayoutSelector } from '@/components/booking/LayoutSelector';
import { DatePicker } from '@/components/booking/DatePicker';
import { TimeSlots } from '@/components/booking/TimeSlots';
import { ContactForm } from '@/components/booking/ContactForm';
import { PaymentSelector } from '@/components/booking/PaymentSelector';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { generateTimeSlots } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, ArrowRight, Loader2, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Studio } from '@/types/database';
import type { StudioLayout } from '@/types/booking';
import { createPublicBooking } from '@/services/bookingService';
import { loadStudioSettings } from '@/services/studioSettings';

// Inline styles for scroll animations
const scrollAnimationStyles = `
  .scroll-animate {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s ease-out, transform 0.8s ease-out;
  }

  .scroll-animate.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .delay-100 { transition-delay: 0.1s; }
  .delay-200 { transition-delay: 0.2s; }
  .delay-300 { transition-delay: 0.3s; }
  .delay-400 { transition-delay: 0.4s; }
  .delay-500 { transition-delay: 0.5s; }
  .delay-600 { transition-delay: 0.6s; }
  .delay-700 { transition-delay: 0.7s; }
  .delay-800 { transition-delay: 0.8s; }
`;

const NewBooking = () => {
  const navigate = useNavigate();
  const { studioId, studioSlug } = useParams<{ studioId?: string; studioSlug?: string }>();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState({
    receipt: null as File | null,
    proof: null as File | null,
  });

  // Studio-specific state
  const [studio, setStudio] = useState<Studio | null>(null);
  const [layouts, setLayouts] = useState<StudioLayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Portfolio photo upload state
  // Portfolio photos state (for display, not upload)
  const [studioPortfolioEnabled, setStudioPortfolioEnabled] = useState(false);
  const [studioPortfolioPhotos, setStudioPortfolioPhotos] = useState<string[]>([]);
  const [portfolioUploadInstructions, setPortfolioUploadInstructions] = useState('');
  const [portfolioMaxFileSize, setPortfolioMaxFileSize] = useState(10);
  const [timeInterval, setTimeInterval] = useState(60); // Default to 60 minutes
  const [operatingStartTime, setOperatingStartTime] = useState('09:00');
  const [operatingEndTime, setOperatingEndTime] = useState('18:00');
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);

  // Debug: Component mounted
  console.log('🚀 NewBooking component mounted/rendered');



  const layout = layouts.find((l) => l.id === selectedLayout) || null;

  // Load studio data and layouts
  useEffect(() => {
    const loadStudioData = async () => {
      if (!studioId && !studioSlug) {
        toast({
          title: "Error",
          description: "Studio tidak dijumpai",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      try {
        // Load studio information - by ID or by slug
        let query = supabase
          .from('studios')
          .select('*')
          .eq('is_active', true);

        if (studioId) {
          query = query.eq('id', studioId);
        } else if (studioSlug) {
          query = query.eq('slug', studioSlug);
        }

        const { data: studioData, error: studioError } = await query.single();

        if (studioError || !studioData) {
          toast({
            title: "Error",
            description: "Studio tidak dijumpai",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setStudio(studioData);

        const actualStudioId = studioData.id;

        // Load studio settings
        const studioSettings = await loadStudioSettings(actualStudioId);
        if (studioSettings) {
          setStudioPortfolioEnabled(studioSettings.headerPortfolioEnabled);
          setTimeInterval(studioSettings.timeSlotGap || 60); // Default to 60 minutes if not set
          setOperatingStartTime(studioSettings.operatingStartTime || '09:00');
          setOperatingEndTime(studioSettings.operatingEndTime || '18:00');
          setDepositEnabled(studioSettings.depositEnabled || false);
          setDepositAmount(studioSettings.depositAmount || 0);
        }

        // Load portfolio photos
        const { loadStudioPortfolioPhotos } = await import('@/services/studioSettings');
        const portfolioPhotos = await loadStudioPortfolioPhotos(actualStudioId);
        setStudioPortfolioPhotos(portfolioPhotos);

        // Load studio layouts
        const { data: layoutsData, error: layoutsError } = await supabase
          .from('studio_layouts')
          .select('*')
          .eq('studio_id', actualStudioId)
          .eq('is_active', true)
          .order('name');

        if (layoutsError) {
          console.error('Error loading layouts:', layoutsError);
          toast({
            title: "Error",
            description: "Gagal memuatkan layout studio",
            variant: "destructive",
          });
        } else {
          // Convert database format to booking format
          const formattedLayouts = (layoutsData || []).map(layout => ({
            id: layout.id,
            name: layout.name,
            description: layout.description,
            capacity: layout.capacity,
            pricePerHour: Number(layout.price_per_hour),
            minute_package: layout.minute_package || 60,
            image: layout.image,
            thumbnail_photo: layout.thumbnail_photo,
            amenities: layout.amenities || [],
          }));
          setLayouts(formattedLayouts);

          // Debug logging
          console.log('Loaded layouts for studio', actualStudioId, ':', formattedLayouts);
        }
      } catch (error) {
        console.error('Error loading studio data:', error);
        toast({
          title: "Error",
          description: "Gagal memuatkan data studio",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadStudioData();
  }, [studioId, studioSlug, navigate, toast]);

  // Scroll animation effect with logging
  useEffect(() => {
    console.log('🎬 Setting up scroll animations... isLoading=', isLoading);

    if (isLoading) {
      console.log('⏳ Skipping - still loading');
      return;
    }

    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -100px 0px'
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        console.log('👀 Element observed:', {
          target: entry.target.className,
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio
        });

        if (entry.isIntersecting) {
          console.log('✅ Element entering viewport, adding visible class');
          entry.target.classList.add('visible');
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    // Wait a bit for DOM to be ready
    setTimeout(() => {
      const animatedElements = document.querySelectorAll('.scroll-animate');
      console.log(`📦 Found ${animatedElements.length} elements to animate`);

      animatedElements.forEach((element, index) => {
        console.log(`🔗 Observing element ${index + 1}:`, element.className);
        observer.observe(element);
      });
    }, 100);

    return () => {
      console.log('🧹 Cleaning up scroll animation observer');
      observer.disconnect();
    };
  }, [isLoading]);

  // Fetch booked times for selected layout and date
  useEffect(() => {
    const fetchBookedTimes = async () => {
      if (!selectedDate || !selectedLayout || !studio?.id) {
        setBookedTimes([]);
        return;
      }

      try {
        const dateString = selectedDate.toISOString().split('T')[0];

        // Fetch bookings for this specific layout and date
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select('start_time')
          .eq('studio_id', studio.id)
          .eq('layout_id', selectedLayout)
          .eq('date', dateString)
          .in('status', ['done-payment', 'done-photoshoot', 'start-editing', 'ready-for-delivery', 'completed']);

        if (error) {
          console.error('Error fetching booked times:', error);
          setBookedTimes([]);
          return;
        }

        // Extract start times
        const times = bookings?.map(b => b.start_time) || [];
        setBookedTimes(times);
        console.log(`📅 Booked times for layout ${selectedLayout} on ${dateString}:`, times);
      } catch (error) {
        console.error('Error fetching booked times:', error);
        setBookedTimes([]);
      }
    };

    fetchBookedTimes();
  }, [selectedDate, selectedLayout, studio?.id]);

  const isFormValid = Boolean(
    selectedLayout &&
    selectedDate &&
    selectedTime &&
    selectedPayment &&
    formData.name.trim() &&
    formData.email.trim() &&
    formData.phone.trim() &&
    (selectedPayment === 'cash' ||
      (selectedPayment === 'qr' && uploadedFiles.receipt) ||
      (selectedPayment === 'bank' && uploadedFiles.proof))
  );

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (type: 'receipt' | 'proof', file: File | null) => {
    setUploadedFiles((prev) => ({ ...prev, [type]: file }));
  };

  const handleSubmit = async () => {
    if (!isFormValid || !studio?.id || !selectedLayout || !selectedDate || !selectedTime) return;

    setIsSubmitting(true);

    try {
      // Use selected layout's minute_package for duration (store in minutes as integer)
      const durationInMinutes = layout.minute_package || 60; // Duration in minutes from layout's package
      const startDateTime = new Date(`${selectedDate.toDateString()} ${selectedTime}`);
      const endDateTime = new Date(startDateTime.getTime() + (durationInMinutes * 60 * 1000));
      const endTime = endDateTime.toTimeString().slice(0, 5);

      // Calculate total price based on duration in hours
      const durationInHours = durationInMinutes / 60;
      const totalPrice = layout.pricePerHour * durationInHours;

      const bookingData = {
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        studioId: studio.id,
        layoutId: selectedLayout,
        date: selectedDate.toISOString().split('T')[0],
        startTime: selectedTime,
        endTime: endTime,
        duration: durationInMinutes,
        totalPrice: totalPrice,
        notes: formData.notes,
        paymentMethod: selectedPayment,
      };

      const result = await createPublicBooking(bookingData);

      if (result.success && result.booking) {
        toast({
          title: "Tempahan Berjaya",
          description: `Tempahan anda telah dihantar untuk pengesahan. Rujukan: ${result.booking.reference}`,
        });

        // Navigate to confirmation page with booking details
        setTimeout(() => {
          navigate('/booking/confirmation', {
            state: {
              booking: result.booking,
              reference: result.booking.reference
            }
          });
        }, 1500);
      } else {
        toast({
          title: "Ralat",
          description: result.error || "Gagal membuat tempahan. Sila cuba lagi.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast({
        title: "Ralat",
        description: "Ralat tidak dijangka berlaku. Sila cuba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Memuatkan...</span>
        </div>
      </div>
    );
  }

  if (!studio) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Studio tidak dijumpai</h2>
          <p className="text-muted-foreground">Studio yang anda cari tidak wujud atau tidak aktif.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Inject scroll animation styles */}
      <style>{scrollAnimationStyles}</style>

      <main className="pt-8 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-8 scroll-animate delay-100">
            <div className="text-center mb-6">
              <img src="/studiorayalogo.png" alt="logo studio" className="mx-auto h-16 w-auto mb-2" />
              <p className="text-sm text-muted-foreground">Studio Fotografi Profesional</p>
              <h2 className="text-xl font-bold">{studio.name}</h2>
              {studio.location && (
                <p className="text-sm text-muted-foreground">{studio.location}</p>
              )}
            </div>
            <h1 className="text-xl font-bold mb-2">Tempahan Studio</h1>
            <p className="text-muted-foreground">
              Isi maklumat dan buat pembayaran untuk tempahan slot anda.
            </p>
          </div>

          <div className="space-y-6">
            {/* Layout Selection */}
            <Card variant="outline" className="p-4 scroll-animate delay-200">
              <h3 className="font-semibold mb-4">Pilih Layout Studio</h3>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Memuatkan layout studio...</p>
                </div>
              ) : layouts.length > 0 ? (
                <LayoutSelector
                  layouts={layouts}
                  selectedLayout={selectedLayout}
                  onSelectLayout={setSelectedLayout}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Tiada layout studio tersedia untuk studio ini</p>
                  <p className="text-sm mt-2">Sila hubungi pentadbir studio untuk menambah layout</p>
                  <p className="text-xs mt-2 text-muted-foreground">Studio: {studio?.slug || studio?.id}</p>
                </div>
              )}
            </Card>

            {/* Contact Form */}
            <div className="scroll-animate delay-300">
              <ContactForm
                formData={formData}
                onFormChange={handleFormChange}
              />
            </div>

            {/* Payment Selection */}
            <div className="scroll-animate delay-400">
              <PaymentSelector
                selectedPayment={selectedPayment}
                onSelectPayment={setSelectedPayment}
                onFileUpload={handleFileUpload}
              />
            </div>

            {/* Date Selection */}
            <div className="scroll-animate delay-500">
              <DatePicker
                selected={selectedDate}
                onSelect={setSelectedDate}
              />
            </div>

            {/* Time Selection */}
            <div className="scroll-animate delay-600">
              {selectedDate ? (
                <TimeSlots
                  slots={generateTimeSlots(selectedDate, selectedLayout, timeInterval, operatingStartTime, operatingEndTime, bookedTimes)}
                  selectedTime={selectedTime}
                  onSelectTime={setSelectedTime}
                />
              ) : (
                <Card variant="outline" className="p-4">
                  <h3 className="font-semibold mb-4">Pilih Masa</h3>
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Sila pilih tarikh terlebih dahulu untuk melihat slot masa yang tersedia</p>
                  </div>
                </Card>
              )}
            </div>

            {/* Portfolio Showcase */}
            {studioPortfolioEnabled && studioPortfolioPhotos.length > 0 && (
              <Card variant="outline" className="p-4 scroll-animate delay-700">
                <h3 className="font-semibold mb-4">Portfolio Gallery</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Take a look at some of our recent work and photography styles
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {studioPortfolioPhotos.map((photoUrl, index) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={photoUrl}
                        alt={`Portfolio photo ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                        onClick={() => {
                          // Optional: Open full-size modal or lightbox
                        }}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Summary Card */}
            {layout && (
              <Card variant="outline" className="p-4 scroll-animate delay-800">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Ringkasan Tempahan
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Layout:</span>
                    <span className="font-medium">{layout.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Kaedah Pembayaran:</span>
                    <span className="font-medium">
                      {selectedPayment === 'cash' ? 'Bayar melalui cash/QR di studio' :
                        selectedPayment === 'qr' ? 'Bayar melalui QR sekarang' :
                          selectedPayment === 'bank' ? 'Pemindahan Bank' : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pelanggan:</span>
                    <span className="font-medium">{formData.name || '-'}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Form Validation Status */}
            {!isFormValid && (
              <Card variant="outline" className="p-4 border-yellow-200 bg-yellow-50 scroll-animate delay-800">
                <h4 className="font-medium text-yellow-800 mb-2">Sila lengkapkan maklumat berikut:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {!selectedLayout && <li>• Pilih layout studio</li>}
                  {!selectedDate && <li>• Pilih tarikh tempahan</li>}
                  {!selectedTime && <li>• Pilih masa mula</li>}
                  {!selectedPayment && <li>• Pilih kaedah pembayaran</li>}
                  {!formData.name.trim() && <li>• Masukkan nama penuh</li>}
                  {!formData.email.trim() && <li>• Masukkan alamat emel</li>}
                  {!formData.phone.trim() && <li>• Masukkan nombor telefon</li>}
                  {selectedPayment === 'qr' && !uploadedFiles.receipt && <li>• Muat naik resit pembayaran</li>}
                  {selectedPayment === 'bank' && !uploadedFiles.proof && <li>• Muat naik bukti pembayaran</li>}
                </ul>
              </Card>
            )}

            {/* Submit Button */}
            <div className="flex justify-end scroll-animate delay-800">
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                size="lg"
                className="min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sila tunggu, tempahan anda sedang dibuat
                  </>
                ) : (
                  <>
                    Hantar Tempahan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Full-screen loading overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 shadow-2xl flex flex-col items-center space-y-4 max-w-sm mx-4">
            <img
              src="/loader.gif"
              alt="Loading"
              className="w-16 h-16"
            />
            <p className="text-lg font-medium text-gray-800 text-center">
              Sila tunggu, tempahan anda sedang dibuat
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewBooking;
