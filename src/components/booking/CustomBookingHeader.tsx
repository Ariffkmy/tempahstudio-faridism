// =============================================
// CUSTOM BOOKING HEADER COMPONENT
// =============================================
// Production header for booking form with logo and navigation
// Mobile: Hidden header with floating hamburger button
// Desktop: Traditional horizontal navigation

import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';

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
  brandColorPrimary: string;
  brandColorSecondary: string;
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
  brandColorPrimary,
  brandColorSecondary,
}: CustomBookingHeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { enabled: homeEnabled, label: 'Home', url: homeUrl },
    { enabled: aboutEnabled, label: 'About', url: aboutUrl },
    { enabled: portfolioEnabled, label: 'Portfolio', url: portfolioUrl },
    { enabled: contactEnabled, label: 'Contact', url: contactUrl },
  ];

  const filteredNavItems = navItems.filter(item => item.enabled);

  const handleNavClick = (url?: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    setMobileMenuOpen(false);
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
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <div className="flex items-center">
              {logo ? (
                <img
                  src={logo}
                  alt="Studio Logo"
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="text-lg font-bold">Studio</div>
              )}
            </div>

            {/* Desktop Navigation */}
            {filteredNavItems.length > 0 && (
              <nav className="flex items-center gap-6">
                {filteredNavItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleNavClick(item.url)}
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
                    onClick={() => handleNavClick(item.url)}
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
    </>
  );
};

export default CustomBookingHeader;
