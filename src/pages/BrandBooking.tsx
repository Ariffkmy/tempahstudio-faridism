// =============================================
// BRAND BOOKING PAGE
// =============================================
// Production booking page with full customizations enabled

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LayoutSelector } from '@/components/booking/LayoutSelector';
import { DatePicker } from '@/components/booking/DatePicker';
import { TimeSlots } from '@/components/booking/TimeSlots';
import { ContactForm } from '@/components/booking/ContactForm';
import { PaymentSelector } from '@/components/booking/PaymentSelector';
import { TermsAndConditions } from '@/components/booking/TermsAndConditions';
import CustomBookingHeader from '@/components/booking/CustomBookingHeader';
import CustomBookingFooter from '@/components/booking/CustomBookingFooter';
import FloatingWhatsAppButton from '@/components/booking/FloatingWhatsAppButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { generateTimeSlots } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Studio } from '@/types/database';
import type { StudioLayout, AddonPackage } from '@/types/booking';
import { createPublicBooking } from '@/services/bookingService';
import { PortfolioGallery } from '@/components/booking/PortfolioGallery';

// Helper functions for font styling
const getFontSizeClass = (size: string): string => {
  const sizeMap: Record<string, string> = {
    'xs': 'text-xs',
    'sm': 'text-sm',
    'base': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl'
  };
  return sizeMap[size] || 'text-xl';
};

const getFontFamilyClass = (font: string): string => {
  const fontMap: Record<string, string> = {
    'default': '',
    'sans': 'font-sans',
    'serif': 'font-serif',
    'mono': 'font-mono'
  };
  return fontMap[font] || '';
};

// Inline styles for scroll animations
const scrollAnimationStyles = `
  .scroll-animate {
    opacity: 0;
    transform: scale(0.85) translateY(20px);
    transition: opacity 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
                transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .scroll-animate.visible {
    opacity: 1;
    transform: scale(1) translateY(0);
  }

  .delay-100 { transition-delay: 0.05s; }
  .delay-200 { transition-delay: 0.1s; }
  .delay-300 { transition-delay: 0.15s; }
  .delay-400 { transition-delay: 0.2s; }
  .delay-500 { transition-delay: 0.25s; }
  .delay-600 { transition-delay: 0.3s; }
  .delay-700 { transition-delay: 0.35s; }
  .delay-800 { transition-delay: 0.4s; }
`;

const BrandBooking = () => {
  const navigate = useNavigate();
  const { studioId, studioSlug } = useParams<{ studioId?: string; studioSlug?: string }>();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'deposit' | 'full'>('full');
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
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Studio-specific state
  const [studio, setStudio] = useState<Studio | null>(null);
  const [layouts, setLayouts] = useState<StudioLayout[]>([]);
  const [addonPackages, setAddonPackages] = useState<AddonPackage[]>([]);
  const [selectedAddon, setSelectedAddon] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customization state
  const [customization, setCustomization] = useState({
    enableCustomHeader: false,
    enableCustomFooter: false,
    enableWhatsappButton: false,
    showStudioName: false,
    headerLogo: '',
    headerHomeEnabled: false,
    headerHomeUrl: '',
    headerHomeText: '',
    headerAboutEnabled: false,
    headerAboutUrl: '',
    headerAboutText: '',
    headerAboutPhoto: '',
    headerPortfolioEnabled: false,
    headerPortfolioUrl: '',
    headerContactEnabled: false,
    headerContactUrl: '',
    headerContactAddress: '',
    headerContactPhone: '',
    headerContactEmail: '',
    footerWhatsappLink: '',
    footerFacebookLink: '',
    footerInstagramLink: '',
    whatsappMessage: 'Hubungi kami',
    brandColorPrimary: '#000000',
    brandColorSecondary: '#ffffff',
    termsConditionsType: 'none' as 'none' | 'text' | 'pdf',
    termsConditionsText: '',
    termsConditionsPdf: '',
    bookingTitleText: 'Tempahan Studio',
    bookingSubtitleText: 'Isi maklumat dan buat pembayaran untuk tempahan slot anda.',
    bookingTitleFont: 'default',
    bookingTitleSize: 'xl',
    bookingSubtitleFont: 'default',
    bookingSubtitleSize: 'base'
  });

  // Debug: Component mounted
  console.log('🚀 BrandBooking component mounted/rendered');

  // Portfolio gallery state
  const [portfolioGalleryOpen, setPortfolioGalleryOpen] = useState(false);
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>([]);

  const layout = layouts.find((l) => l.id === selectedLayout) || null;

  // Load studio data, layouts and customizations
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

        // Load studio customizations (will be conditionally rendered)
        setCustomization({
          enableCustomHeader: studioData.enable_custom_header || false,
          enableCustomFooter: studioData.enable_custom_footer || false,
          enableWhatsappButton: studioData.enable_whatsapp_button || false,
          showStudioName: (studioData as any).show_studio_name || false,
          headerLogo: studioData.header_logo || '',
          headerHomeEnabled: studioData.header_home_enabled || false,
          headerHomeUrl: studioData.header_home_url || '',
          headerHomeText: (studioData as any).header_home_text || '',
          headerAboutEnabled: studioData.header_about_enabled || false,
          headerAboutUrl: studioData.header_about_url || '',
          headerAboutText: (studioData as any).header_about_text || '',
          headerAboutPhoto: (studioData as any).header_about_photo || '',
          headerPortfolioEnabled: studioData.header_portfolio_enabled || false,
          headerPortfolioUrl: studioData.header_portfolio_url || '',
          headerContactEnabled: studioData.header_contact_enabled || false,
          headerContactUrl: studioData.header_contact_url || '',
          headerContactAddress: (studioData as any).header_contact_address || '',
          headerContactPhone: (studioData as any).header_contact_phone || '',
          headerContactEmail: (studioData as any).header_contact_email || '',
          footerWhatsappLink: studioData.footer_whatsapp_link || '',
          footerFacebookLink: studioData.footer_facebook_link || '',
          footerInstagramLink: studioData.footer_instagram_link || '',
          whatsappMessage: studioData.whatsapp_message || 'Hubungi kami',
          brandColorPrimary: studioData.brand_color_primary || '#000000',
          brandColorSecondary: studioData.brand_color_secondary || '#ffffff',
          termsConditionsType: ((studioData as any).terms_conditions_type || 'none') as 'none' | 'text' | 'pdf',
          termsConditionsText: (studioData as any).terms_conditions_text || '',
          termsConditionsPdf: (studioData as any).terms_conditions_pdf || '',
          bookingTitleText: (studioData as any).booking_title_text || 'Tempahan Studio',
          bookingSubtitleText: (studioData as any).booking_subtitle_text || 'Isi maklumat dan buat pembayaran untuk tempahan slot anda.',
          bookingTitleFont: (studioData as any).booking_title_font || 'default',
          bookingTitleSize: (studioData as any).booking_title_size || 'xl',
          bookingSubtitleFont: (studioData as any).booking_subtitle_font || 'default',
          bookingSubtitleSize: (studioData as any).booking_subtitle_size || 'base'
        });

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
            image: layout.image,
            thumbnail_photo: layout.thumbnail_photo,
            amenities: layout.amenities || [],
            layout_photos: layout.layout_photos || [],
          }));
          setLayouts(formattedLayouts);

          console.log('📸 Loaded layouts with photos:', formattedLayouts.map(l => ({
            name: l.name,
            photoCount: l.layout_photos?.length || 0
          })));
        }

        // Load portfolio photos
        const { loadStudioPortfolioPhotos } = await import('@/services/studioSettings');
        const photos = await loadStudioPortfolioPhotos(actualStudioId);
        setPortfolioPhotos(photos);
        console.log('🖼️ Loaded portfolio photos:', photos.length);

        // Load add-on packages
        const { data: addonData, error: addonError } = await supabase
          .from('addon_packages')
          .select('*')
          .eq('studio_id', actualStudioId)
          .eq('is_active', true)
          .order('price');

        if (!addonError && addonData) {
          setAddonPackages(addonData);
          console.log('📦 Loaded addon packages:', addonData.length);
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

    console.log('✅ Not loading, setting up animations...');

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
    const timeoutId = setTimeout(() => {
      console.log('⏰ Searching for .scroll-animate elements...');
      const animatedElements = document.querySelectorAll('.scroll-animate');
      console.log(`📦 Found ${animatedElements.length} elements to animate`);

      if (animatedElements.length === 0) {
        console.warn('⚠️ WARNING: No .scroll-animate elements found in DOM!');
      }

      animatedElements.forEach((element, index) => {
        console.log(`🔗 Observing element ${index + 1}:`, element.className);
        observer.observe(element);
      });
    }, 200);

    return () => {
      console.log('🧹 Cleaning up scroll animation observer');
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [isLoading]);

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
      (selectedPayment === 'bank' && uploadedFiles.proof)) &&
    // Terms acceptance is only required if T&C is configured
    (customization.termsConditionsType === 'none' || termsAccepted)
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
      // For now, assume 2-hour booking (this should be configurable)
      const duration = 2; // hours
      const startDateTime = new Date(`${selectedDate.toDateString()} ${selectedTime}`);
      const endDateTime = new Date(startDateTime.getTime() + (duration * 60 * 60 * 1000));
      const endTime = endDateTime.toTimeString().slice(0, 5);

      // Calculate total price
      const totalPrice = layout.pricePerHour * duration;

      const bookingData = {
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        studioId: studio.id,
        layoutId: selectedLayout,
        date: selectedDate.toISOString().split('T')[0],
        startTime: selectedTime,
        endTime: endTime,
        duration: duration,
        totalPrice: totalPrice,
        notes: formData.notes,
        paymentMethod: selectedPayment,
        addonPackageId: selectedAddon || undefined,
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

  // Check if studio is operational
  const isStudioOperational = (studio as any).is_operational !== false;

  if (!isStudioOperational) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="p-8 text-center shadow-2xl border-2">
            <div className="mb-6">
              <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-6xl">😔</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Maaf
              </h2>
              <p className="text-lg text-gray-700 mb-2">
                {studio.name} tidak menerima sebarang tempahan buat masa ini
              </p>
              <p className="text-sm text-muted-foreground">
                Sila hubungi kami untuk maklumat lanjut
              </p>
            </div>

            {(studio.email || studio.phone) && (
              <div className="mt-6 pt-6 border-t space-y-2">
                <p className="text-sm text-muted-foreground mb-3">Hubungi kami:</p>
                {studio.email && (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-muted-foreground">📧</span>
                    <p className="text-sm font-medium">{studio.email}</p>
                  </div>
                )}
                {studio.phone && (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-muted-foreground">📱</span>
                    <p className="text-sm font-medium">{studio.phone}</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-muted/20"
      style={customization.enableCustomHeader ? {
        backgroundColor: customization.brandColorPrimary ? `${customization.brandColorPrimary}03` : '#00000003'
      } : {}}
    >
      {/* Inject scroll animation styles */}
      <style>{scrollAnimationStyles}</style>
      {/* Custom Header */}
      {customization.enableCustomHeader && (
        <CustomBookingHeader
          logo={customization.headerLogo}
          homeEnabled={customization.headerHomeEnabled}
          aboutEnabled={customization.headerAboutEnabled}
          portfolioEnabled={customization.headerPortfolioEnabled}
          contactEnabled={customization.headerContactEnabled}
          homeUrl={customization.headerHomeUrl}
          aboutUrl={customization.headerAboutUrl}
          portfolioUrl={customization.headerPortfolioUrl}
          contactUrl={customization.headerContactUrl}
          homeText={customization.headerHomeText}
          aboutText={customization.headerAboutText}
          aboutPhoto={customization.headerAboutPhoto}
          contactAddress={customization.headerContactAddress}
          contactPhone={customization.headerContactPhone}
          contactEmail={customization.headerContactEmail}
          brandColorPrimary={customization.brandColorPrimary}
          brandColorSecondary={customization.brandColorSecondary}
          onPortfolioClick={() => setPortfolioGalleryOpen(true)}
        />
      )}

      <main className="pt-8 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-8 scroll-animate delay-100">
            {/* Studio branding - always visible */}
            <div className="text-center mb-6">
              {/* Show logo if available */}
              {studio.studio_logo && (
                <img
                  src={studio.studio_logo}
                  alt="Studio Logo"
                  className="mx-auto h-20 w-auto object-contain mb-2"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              {/* Show studio name only if showStudioName is enabled */}
              {customization.showStudioName && (
                <h2 className="text-xl font-bold">{studio.name}</h2>
              )}
            </div>

            {/* Customizable Booking Title */}
            <div className="text-center space-y-2">
              <h1
                className={`font-bold mb-2 ${getFontSizeClass(customization.bookingTitleSize)} ${getFontFamilyClass(customization.bookingTitleFont)}`}
              >
                {customization.bookingTitleText}
              </h1>
              <p
                className={`text-muted-foreground ${getFontSizeClass(customization.bookingSubtitleSize)} ${getFontFamilyClass(customization.bookingSubtitleFont)}`}
              >
                {customization.bookingSubtitleText}
              </p>
            </div>
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

            {/* Add-on Packages Selection */}
            {addonPackages.length > 0 && (
              <Card variant="outline" className="p-4 scroll-animate delay-350">
                <h3 className="font-semibold mb-4">Pakej Tambahan (Pilihan)</h3>
                <div className="space-y-3">
                  {/* No addon option */}
                  <label
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedAddon === null
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="addon"
                      checked={selectedAddon === null}
                      onChange={() => setSelectedAddon(null)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Tiada Pakej Tambahan</div>
                      <div className="text-sm text-muted-foreground">Tempahan asas sahaja</div>
                    </div>
                    <div className="font-semibold text-primary">RM 0</div>
                  </label>

                  {/* Addon packages */}
                  {addonPackages.map((pkg) => (
                    <label
                      key={pkg.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedAddon === pkg.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                        }`}
                    >
                      <input
                        type="radio"
                        name="addon"
                        checked={selectedAddon === pkg.id}
                        onChange={() => setSelectedAddon(pkg.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{pkg.name}</div>
                        <div className="text-sm text-muted-foreground">{pkg.description}</div>
                      </div>
                      <div className="font-semibold text-primary">RM {pkg.price}</div>
                    </label>
                  ))}
                </div>
              </Card>
            )}

            {/* Payment Type Selection */}
            <Card variant="outline" className="p-4 scroll-animate delay-375">
              <h3 className="font-semibold mb-4">Jenis Pembayaran</h3>
              <div className="grid gap-3">
                <label
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentType === 'full'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                    }`}
                >
                  <input
                    type="radio"
                    name="paymentType"
                    value="full"
                    checked={paymentType === 'full'}
                    onChange={() => setPaymentType('full')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Bayaran Penuh</div>
                    <div className="text-sm text-muted-foreground">
                      Bayar keseluruhan jumlah tempahan
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentType === 'deposit'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                    }`}
                >
                  <input
                    type="radio"
                    name="paymentType"
                    value="deposit"
                    checked={paymentType === 'deposit'}
                    onChange={() => setPaymentType('deposit')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Deposit Sahaja</div>
                    <div className="text-sm text-muted-foreground">
                      Bayar deposit terlebih dahulu, baki kemudian
                    </div>
                  </div>
                </label>
              </div>
            </Card>

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
                  slots={generateTimeSlots(selectedDate, selectedLayout)}
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

            {/* Summary Card */}
            {layout && (
              <Card variant="outline" className="p-4">
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
                    <span className="text-muted-foreground">Jenis Pembayaran:</span>
                    <span className="font-medium">
                      {paymentType === 'full' ? 'Bayaran Penuh' : 'Deposit Sahaja'}
                    </span>
                  </div>
                  {selectedAddon && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Pakej Tambahan:</span>
                      <span className="font-medium">
                        {addonPackages.find(p => p.id === selectedAddon)?.name}
                        <span className="text-primary ml-2">
                          +RM {addonPackages.find(p => p.id === selectedAddon)?.price}
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pelanggan:</span>
                    <span className="font-medium">{formData.name || '-'}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Terms and Conditions - Moved to last section */}
            <TermsAndConditions
              type={customization.termsConditionsType}
              textContent={customization.termsConditionsText}
              pdfUrl={customization.termsConditionsPdf}
              accepted={termsAccepted}
              onAcceptChange={setTermsAccepted}
            />

            {/* Form Validation Status */}
            {!isFormValid && (
              <Card variant="outline" className="p-4 border-yellow-200 bg-yellow-50">
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
                  {customization.termsConditionsType !== 'none' && !termsAccepted && <li>• Bersetuju dengan Terma & Syarat</li>}
                </ul>
              </Card>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
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

      {/* Custom Footer */}
      {customization.enableCustomFooter && (
        <CustomBookingFooter
          whatsappLink={customization.footerWhatsappLink}
          facebookLink={customization.footerFacebookLink}
          instagramLink={customization.footerInstagramLink}
          brandColorPrimary={customization.brandColorPrimary}
          brandColorSecondary={customization.brandColorSecondary}
        />
      )}

      {/* Floating WhatsApp Button */}
      {customization.enableWhatsappButton && (
        <FloatingWhatsAppButton
          message={customization.whatsappMessage}
          phoneNumber={customization.footerWhatsappLink}
          brandColorPrimary={customization.brandColorPrimary}
        />
      )}

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

      {/* Portfolio Gallery Modal */}
      <PortfolioGallery
        open={portfolioGalleryOpen}
        onOpenChange={setPortfolioGalleryOpen}
        photos={portfolioPhotos}
        studioName={studio?.name}
      />
    </div>
  );
};

export default BrandBooking;
