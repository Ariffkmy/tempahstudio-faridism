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
import type { StudioLayout } from '@/types/booking';
import { createPublicBooking } from '@/services/bookingService';

const BrandBooking = () => {
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
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Studio-specific state
  const [studio, setStudio] = useState<Studio | null>(null);
  const [layouts, setLayouts] = useState<StudioLayout[]>([]);
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
    headerAboutEnabled: false,
    headerAboutUrl: '',
    headerPortfolioEnabled: false,
    headerPortfolioUrl: '',
    headerContactEnabled: false,
    headerContactUrl: '',
    footerWhatsappLink: '',
    footerFacebookLink: '',
    footerInstagramLink: '',
    whatsappMessage: 'Hubungi kami',
    brandColorPrimary: '#000000',
    brandColorSecondary: '#ffffff',
    termsConditionsType: 'none' as 'none' | 'text' | 'pdf',
    termsConditionsText: '',
    termsConditionsPdf: ''
  });

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
          headerAboutEnabled: studioData.header_about_enabled || false,
          headerAboutUrl: studioData.header_about_url || '',
          headerPortfolioEnabled: studioData.header_portfolio_enabled || false,
          headerPortfolioUrl: studioData.header_portfolio_url || '',
          headerContactEnabled: studioData.header_contact_enabled || false,
          headerContactUrl: studioData.header_contact_url || '',
          footerWhatsappLink: studioData.footer_whatsapp_link || '',
          footerFacebookLink: studioData.footer_facebook_link || '',
          footerInstagramLink: studioData.footer_instagram_link || '',
          whatsappMessage: studioData.whatsapp_message || 'Hubungi kami',
          brandColorPrimary: studioData.brand_color_primary || '#000000',
          brandColorSecondary: studioData.brand_color_secondary || '#ffffff',
          termsConditionsType: ((studioData as any).terms_conditions_type || 'none') as 'none' | 'text' | 'pdf',
          termsConditionsText: (studioData as any).terms_conditions_text || '',
          termsConditionsPdf: (studioData as any).terms_conditions_pdf || ''
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
            amenities: layout.amenities || [],
          }));
          setLayouts(formattedLayouts);
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
    <div
      className="min-h-screen bg-muted/20"
      style={customization.enableCustomHeader ? {
        backgroundColor: customization.brandColorPrimary ? `${customization.brandColorPrimary}03` : '#00000003'
      } : {}}
    >
      {/* Custom Header */}
      {customization.enableCustomHeader && (
        <CustomBookingHeader
          logo={customization.headerLogo}
          homeEnabled={customization.headerHomeEnabled}
          aboutEnabled={customization.headerAboutEnabled}
          portfolioEnabled={customization.headerPortfolioEnabled}
          contactEnabled={customization.headerContactEnabled}
          brandColorPrimary={customization.brandColorPrimary}
          brandColorSecondary={customization.brandColorSecondary}
        />
      )}

      <main className="pt-8 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-8">
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

            <h1 className="text-xl font-bold mb-2">Tempahan Studio</h1>
            <p className="text-muted-foreground">
              Isi maklumat dan buat pembayaran untuk tempahan slot anda.
            </p>
          </div>

          <div className="space-y-6">
            {/* Layout Selection */}
            <Card variant="outline" className="p-4">
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
            <ContactForm
              formData={formData}
              onFormChange={handleFormChange}
            />

            {/* Payment Selection */}
            <PaymentSelector
              selectedPayment={selectedPayment}
              onSelectPayment={setSelectedPayment}
              onFileUpload={handleFileUpload}
            />

            {/* Date Selection */}
            <DatePicker
              selected={selectedDate}
              onSelect={setSelectedDate}
            />

            {/* Time Selection */}
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
    </div>
  );
};

export default BrandBooking;
