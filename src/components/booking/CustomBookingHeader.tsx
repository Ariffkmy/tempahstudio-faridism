// =============================================
// CUSTOM BOOKING HEADER COMPONENT
// =============================================
// Production header for booking form with logo and navigation
// Mobile: Hidden header with floating hamburger button
// Desktop: Traditional horizontal navigation

import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Menu, X, MapPin, Phone, Mail } from 'lucide-react';

interface CustomBookingHeaderProps {
  logo: string;
  homeEnabled: boolean;
  aboutEnabled: boolean;
  portfolioEnabled: boolean;
  contactEnabled: boolean;
  homeUrl?: string;
  aboutUrl?: string;
  portfolioUrl?: string;
  contactUrl?: string;
  homeText?: string;
  aboutText?: string;
  aboutPhoto?: string;
  contactAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
  brandColorPrimary: string;
  brandColorSecondary: string;
  onPortfolioClick?: () => void;
}

const CustomBookingHeader = ({
  logo,
  homeEnabled,
  aboutEnabled,
  portfolioEnabled,
  contactEnabled,
  homeUrl,
  aboutUrl,
  portfolioUrl,
  contactUrl,
  homeText,
  aboutText,
  aboutPhoto,
  contactAddress,
  contactPhone,
  contactEmail,
  brandColorPrimary,
  brandColorSecondary,
  onPortfolioClick,
}: CustomBookingHeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [homeDialogOpen, setHomeDialogOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  const navItems = [
    { enabled: homeEnabled, label: 'Home', url: homeUrl },
    { enabled: aboutEnabled, label: 'About', url: aboutUrl },
    { enabled: portfolioEnabled, label: 'Raya Portfolio', url: portfolioUrl },
    { enabled: contactEnabled, label: 'Contact', url: contactUrl },
  ];

  const filteredNavItems = navItems.filter(item => item.enabled);

  const handleNavClick = (label: string, url?: string) => {
    // Close mobile menu first
    setMobileMenuOpen(false);

    // Handle different navigation items
    if (label === 'Home') {
      if (homeText) {
        // Show popup if text is configured
        setHomeDialogOpen(true);
      } else if (url) {
        // Otherwise open URL if provided
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    if (label === 'About') {
      if (aboutText) {
        // Show popup if text is configured
        setAboutDialogOpen(true);
      } else if (url) {
        // Otherwise open URL if provided
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    if (label === 'Raya Portfolio' && onPortfolioClick) {
      // Use callback for portfolio
      onPortfolioClick();
      return;
    }

    if (label === 'Contact') {
      if (contactAddress || contactPhone || contactEmail) {
        // Show popup if contact info is configured
        setContactDialogOpen(true);
      } else if (url) {
        // Otherwise open URL if provided
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    // Default: open URL if provided
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {/* Desktop Header - Hidden on Mobile */}
      <header
        className="hidden md:block sticky top-0 z-50 shadow-md"
        style={{
          backgroundColor: brandColorPrimary,
          color: brandColorSecondary,
        }}
      >
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center py-3 gap-3">
            {/* Logo */}
            {logo && (
              <div className="flex items-center">
                <img
                  src={logo}
                  alt="Studio Logo"
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Desktop Navigation */}
            {filteredNavItems.length > 0 && (
              <nav className="flex items-center gap-12">
                {filteredNavItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleNavClick(item.label, item.url)}
                    className="text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ color: brandColorSecondary }}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Floating Menu Button - Only on Mobile */}
      {filteredNavItems.length > 0 && (
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="absolute top-4 right-4 z-50 p-2 transition-all text-gray-700 hover:text-gray-900"
                aria-label="Open menu"
              >
                <Menu className="w-7 h-7" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {logo ? (
                    <img
                      src={logo}
                      alt="Studio Logo"
                      className="h-8 w-auto object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>Menu</span>
                  )}
                </SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col gap-1 mt-8">
                {filteredNavItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleNavClick(item.label, item.url)}
                    className="px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left w-full font-medium"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Close button at bottom */}
              <div className="absolute bottom-6 left-6 right-6">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors font-medium"
                >
                  <X className="h-4 w-4" />
                  Tutup Menu
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Home Dialog */}
      <Dialog open={homeDialogOpen} onOpenChange={setHomeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto m-4">
          <DialogHeader>
            <DialogTitle className="text-2xl">Home</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-base whitespace-pre-wrap leading-relaxed">{homeText}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* About Dialog */}
      <Dialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto m-4">
          <DialogHeader>
            <DialogTitle className="text-2xl">About</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {aboutPhoto && (
              <div className="w-full max-h-[40vh] rounded-lg overflow-hidden flex items-center justify-center bg-muted/30">
                <img
                  src={aboutPhoto}
                  alt="About"
                  className="max-w-full max-h-[40vh] h-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            {aboutText && (
              <p className="text-base whitespace-pre-wrap leading-relaxed">{aboutText}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto m-4">
          <DialogHeader>
            <DialogTitle className="text-2xl">Contact Us</DialogTitle>
            <DialogDescription>Get in touch with us</DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-4">
            {contactAddress && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-muted-foreground mb-1">Address</p>
                  <p className="text-base whitespace-pre-wrap">{contactAddress}</p>
                </div>
              </div>
            )}

            {contactPhone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-muted-foreground mb-1">Phone</p>
                  <a
                    href={`tel:${contactPhone}`}
                    className="text-base hover:underline text-primary"
                  >
                    {contactPhone}
                  </a>
                </div>
              </div>
            )}

            {contactEmail && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-muted-foreground mb-1">Email</p>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-base hover:underline text-primary"
                  >
                    {contactEmail}
                  </a>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomBookingHeader;
