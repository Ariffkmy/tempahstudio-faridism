// =============================================
// BOOKING FORM PREVIEW COMPONENT
// =============================================
// Live preview of customized booking form

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone } from 'lucide-react';
import PreviewHeader from './PreviewHeader';
import PreviewFooter from './PreviewFooter';

export interface PreviewSettings {
  enableCustomHeader: boolean;
  enableCustomFooter: boolean;
  enableWhatsappButton: boolean;
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
}

interface BookingFormPreviewProps {
  settings: PreviewSettings;
}

const BookingFormPreview = ({ settings }: BookingFormPreviewProps) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

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
          className={`h-full overflow-auto transition-all duration-300 mx-auto ${
            viewMode === 'mobile' ? 'max-w-[375px]' : 'w-full'
          }`}
          style={{
            '--brand-primary': settings.brandColorPrimary,
            '--brand-secondary': settings.brandColorSecondary,
          } as React.CSSProperties}
        >
          <div className="min-h-full flex flex-col bg-muted/20">
            {/* Custom Header (if enabled) */}
            {settings.enableCustomHeader && (
              <PreviewHeader
                logo={settings.headerLogo}
                homeEnabled={settings.headerHomeEnabled}
                homeUrl={settings.headerHomeUrl}
                aboutEnabled={settings.headerAboutEnabled}
                aboutUrl={settings.headerAboutUrl}
                portfolioEnabled={settings.headerPortfolioEnabled}
                portfolioUrl={settings.headerPortfolioUrl}
                contactEnabled={settings.headerContactEnabled}
                contactUrl={settings.headerContactUrl}
                brandColorPrimary={settings.brandColorPrimary}
                brandColorSecondary={settings.brandColorSecondary}
              />
            )}

            {/* Mock Booking Form Content */}
            <div className="flex-1 container max-w-4xl mx-auto px-4 py-8">
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold mb-2">Tempahan Studio</h2>
                    <p className="text-sm text-muted-foreground">
                      Isi maklumat dan buat pembayaran untuk tempahan slot anda.
                    </p>
                  </div>

                  {/* Mock Form Fields */}
                  <div className="space-y-3">
                    <div className="h-10 bg-muted rounded-md"></div>
                    <div className="h-10 bg-muted rounded-md"></div>
                    <div className="h-10 bg-muted rounded-md"></div>
                    <div className="h-20 bg-muted rounded-md"></div>
                  </div>

                  {/* Mock Submit Button with Brand Color */}
                  <div
                    className="h-10 rounded-md flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: settings.brandColorPrimary }}
                  >
                    Hantar Tempahan
                  </div>
                </div>
              </Card>
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
          </div>
        </div>
      </Card>

      {/* Preview Info */}
      <div className="mt-3 text-xs text-muted-foreground text-center">
        This is a preview. Actual booking form may vary slightly.
      </div>
    </div>
  );
};

export default BookingFormPreview;
