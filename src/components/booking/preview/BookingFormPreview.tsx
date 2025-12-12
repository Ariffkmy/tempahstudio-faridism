// =============================================
// BOOKING FORM PREVIEW COMPONENT
// =============================================
// Live preview of customized booking form

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Monitor, Smartphone, Users, Check, Calendar, Clock } from 'lucide-react';
import PreviewHeader from './PreviewHeader';
import PreviewFooter from './PreviewFooter';
import PreviewWhatsAppButton from './PreviewWhatsAppButton';

export interface PreviewSettings {
  enableCustomHeader: boolean;
  enableCustomFooter: boolean;
  enableWhatsappButton: boolean;
  studioLogo: string;
  headerLogo: string;
  headerHomeEnabled: boolean;
  headerHomeUrl: string;
  headerAboutEnabled: boolean;
  headerAboutUrl: string;
  headerPortfolioEnabled: boolean;
  headerPortfolioUrl: string;
  headerContactEnabled: boolean;
  headerContactUrl: string;
  footerWhatsappLink: string;
  footerFacebookLink: string;
  footerInstagramLink: string;
  whatsappMessage: string;
  whatsappPhoneNumber: string;
  brandColorPrimary: string;
  brandColorSecondary: string;
  bookingTitleText?: string;
  bookingSubtitleText?: string;
  bookingTitleFont?: string;
  bookingTitleSize?: string;
  bookingSubtitleFont?: string;
  bookingSubtitleSize?: string;
}

interface BookingFormPreviewProps {
  settings: PreviewSettings;
}

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
  return sizeMap[size || 'xl'] || 'text-xl';
};

const getFontFamilyClass = (font: string): string => {
  const fontMap: Record<string, string> = {
    'default': '',
    'sans': 'font-sans',
    'serif': 'font-serif',
    'mono': 'font-mono'
  };
  return fontMap[font || 'default'] || '';
};

const BookingFormPreview = ({ settings }: BookingFormPreviewProps) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Mock data for preview
  const mockLayouts = [
    { id: '1', name: 'Studio A', description: 'Perfect for portraits and product photography', capacity: 5, price: 150 },
    { id: '2', name: 'Studio B', description: 'Spacious studio for group sessions', capacity: 10, price: 200 },
  ];

  const mockTimeSlots = ['09:00', '11:00', '13:00', '15:00', '17:00'];

  return (
    <div className="h-full flex flex-col">
      {/* Preview Controls */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Live Preview</h3>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('desktop')}
          >
            <Monitor className="h-4 w-4 mr-1" />
            Desktop
          </Button>
          <Button
            variant={viewMode === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('mobile')}
          >
            <Smartphone className="h-4 w-4 mr-1" />
            Mobile
          </Button>
        </div>
      </div>

      {/* Preview Frame */}
      <Card className="flex-1 overflow-hidden">
        <div
          className={`h-full overflow-auto transition-all duration-300 mx-auto ${viewMode === 'mobile' ? 'max-w-[375px]' : 'w-full'
            }`}
          style={{
            '--brand-primary': settings.brandColorPrimary,
            '--brand-secondary': settings.brandColorSecondary,
          } as React.CSSProperties}
        >
          <div className="min-h-full flex flex-col bg-muted/20 relative">
            {/* Custom Header (if enabled) */}
            {settings.enableCustomHeader && (
              <PreviewHeader
                logo={settings.headerLogo}
                homeEnabled={settings.headerHomeEnabled}
                aboutEnabled={settings.headerAboutEnabled}
                portfolioEnabled={settings.headerPortfolioEnabled}
                contactEnabled={settings.headerContactEnabled}
                brandColorPrimary={settings.brandColorPrimary}
                brandColorSecondary={settings.brandColorSecondary}
              />
            )}

            {/* Booking Form Content */}
            <div className="flex-1 container max-w-4xl mx-auto px-4 py-8">
              {/* Studio Info - always visible */}
              <div className="text-center mb-6">
                {/* Show logo if available */}
                {settings.studioLogo && (
                  <img
                    src={settings.studioLogo}
                    alt="Studio Logo"
                    className="mx-auto h-16 w-auto object-contain mb-2"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                {/* Show studio name only if custom header is enabled */}
                {settings.enableCustomHeader && (
                  <h2 className="text-lg font-bold">Raya Studio</h2>
                )}
              </div>

              {/* Customizable Booking Title */}
              <div className="text-center space-y-2 mb-6">
                <h1
                  className={`font-bold mb-2 ${getFontSizeClass(settings.bookingTitleSize || 'xl')} ${getFontFamilyClass(settings.bookingTitleFont || 'default')}`}
                >
                  {settings.bookingTitleText || 'Tempahan Studio'}
                </h1>
                <p
                  className={`text-muted-foreground ${getFontSizeClass(settings.bookingSubtitleSize || 'base')} ${getFontFamilyClass(settings.bookingSubtitleFont || 'default')}`}
                >
                  {settings.bookingSubtitleText || 'Isi maklumat dan buat pembayaran untuk tempahan slot anda.'}
                </p>
              </div>

              <div className="space-y-6">
                {/* Layout Selection */}
                <Card variant="outline" className="p-4">
                  <h3 className="font-semibold mb-4 text-sm">Pilih Layout Studio</h3>
                  <div className="space-y-3">
                    {mockLayouts.map((layout, idx) => (
                      <Card
                        key={layout.id}
                        variant="outline"
                        className={`p-3 cursor-pointer transition-all ${idx === 0 ? 'border-primary ring-2 ring-primary/20 bg-accent/30' : ''
                          }`}
                      >
                        <div className="flex gap-3">
                          <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm">{layout.name}</h4>
                                  {idx === 0 && (
                                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{layout.description}</p>
                                <Badge variant="secondary" className="text-xs">
                                  <Users className="h-2.5 w-2.5 mr-1" />
                                  {layout.capacity}
                                </Badge>
                              </div>
                              <div className="text-right ml-3">
                                <p className="font-bold text-sm" style={{ color: settings.brandColorPrimary }}>RM {layout.price}</p>
                                <p className="text-xs text-muted-foreground">/jam</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>

                {/* Contact Form */}
                <Card variant="outline" className="p-4">
                  <h3 className="font-semibold mb-4 text-sm">Maklumat Pelanggan</h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nama Penuh</Label>
                      <Input placeholder="Nama anda" className="h-9 text-sm" disabled />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Emel</Label>
                      <Input type="email" placeholder="email@example.com" className="h-9 text-sm" disabled />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">No. Telefon</Label>
                      <Input placeholder="+60123456789" className="h-9 text-sm" disabled />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Catatan (Pilihan)</Label>
                      <Textarea placeholder="Catatan tambahan..." className="text-sm resize-none" rows={3} disabled />
                    </div>
                  </div>
                </Card>

                {/* Date Picker */}
                <Card variant="outline" className="p-4">
                  <h3 className="font-semibold mb-4 text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Pilih Tarikh
                  </h3>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Calendar preview</p>
                  </div>
                </Card>

                {/* Time Slots */}
                <Card variant="outline" className="p-4">
                  <h3 className="font-semibold mb-4 text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Pilih Masa
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {mockTimeSlots.map((time, idx) => (
                      <Button
                        key={time}
                        variant={idx === 2 ? 'default' : 'outline'}
                        size="sm"
                        className="h-9 text-sm"
                        style={idx === 2 ? { backgroundColor: settings.brandColorPrimary } : {}}
                        disabled
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    size="lg"
                    className="min-w-[200px]"
                    style={{ backgroundColor: settings.brandColorPrimary }}
                    disabled
                  >
                    Hantar Tempahan
                  </Button>
                </div>
              </div>
            </div>

            {/* Custom Footer (if enabled) */}
            {settings.enableCustomFooter && (
              <PreviewFooter
                whatsappLink={settings.footerWhatsappLink}
                facebookLink={settings.footerFacebookLink}
                instagramLink={settings.footerInstagramLink}
                brandColorPrimary={settings.brandColorPrimary}
                brandColorSecondary={settings.brandColorSecondary}
              />
            )}

            {/* WhatsApp Button (if enabled) */}
            {settings.enableWhatsappButton && (
              <PreviewWhatsAppButton
                message={settings.whatsappMessage}
                phoneNumber={settings.footerWhatsappLink}
                brandColorPrimary={settings.brandColorPrimary}
              />
            )}
          </div>
        </div>
      </Card>

      {/* Preview Info */}
      <div className="mt-3 text-xs text-muted-foreground text-center">
        Live preview - Interactive elements are disabled
      </div>
    </div>
  );
};

export default BookingFormPreview;
