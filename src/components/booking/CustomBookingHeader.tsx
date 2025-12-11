// =============================================
// CUSTOM BOOKING HEADER COMPONENT
// =============================================
// Production header for booking form with logo and navigation

interface CustomBookingHeaderProps {
  logo: string;
  homeEnabled: boolean;
  aboutEnabled: boolean;
  portfolioEnabled: boolean;
  contactEnabled: boolean;
  brandColorPrimary: string;
  brandColorSecondary: string;
}

const CustomBookingHeader = ({
  logo,
  homeEnabled,
  aboutEnabled,
  portfolioEnabled,
  contactEnabled,
  brandColorPrimary,
  brandColorSecondary,
}: CustomBookingHeaderProps) => {
  const navItems = [
    { enabled: homeEnabled, label: 'Home' },
    { enabled: aboutEnabled, label: 'About' },
    { enabled: portfolioEnabled, label: 'Portfolio' },
    { enabled: contactEnabled, label: 'Contact' },
  ];

  const filteredNavItems = navItems.filter(item => item.enabled);

  return (
    <header
      className="sticky top-0 z-10 shadow-sm"
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

          {/* Navigation */}
          {filteredNavItems.length > 0 && (
            <nav className="hidden md:flex items-center gap-6">
              {filteredNavItems.map((item, index) => (
                <span
                  key={index}
                  className="text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ color: brandColorSecondary }}
                >
                  {item.label}
                </span>
              ))}
            </nav>
          )}

          {/* Mobile Menu Icon */}
          {filteredNavItems.length > 0 && (
            <button
              className="md:hidden p-2"
              style={{ color: brandColorSecondary }}
              onClick={() => {
                // Toggle mobile menu - implement if needed
              }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default CustomBookingHeader;
