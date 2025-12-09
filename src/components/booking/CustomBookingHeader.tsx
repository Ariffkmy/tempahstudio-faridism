// =============================================
// CUSTOM BOOKING HEADER COMPONENT
// =============================================
// Production header for booking form with logo and navigation

interface CustomBookingHeaderProps {
  logo: string;
  homeEnabled: boolean;
  homeUrl: string;
  aboutEnabled: boolean;
  aboutUrl: string;
  portfolioEnabled: boolean;
  portfolioUrl: string;
  contactEnabled: boolean;
  contactUrl: string;
  brandColorPrimary: string;
  brandColorSecondary: string;
}

const CustomBookingHeader = ({
  logo,
  homeEnabled,
  homeUrl,
  aboutEnabled,
  aboutUrl,
  portfolioEnabled,
  portfolioUrl,
  contactEnabled,
  contactUrl,
  brandColorPrimary,
  brandColorSecondary,
}: CustomBookingHeaderProps) => {
  const navItems = [
    { enabled: homeEnabled, label: 'Home', url: homeUrl },
    { enabled: aboutEnabled, label: 'About', url: aboutUrl },
    { enabled: portfolioEnabled, label: 'Portfolio', url: portfolioUrl },
    { enabled: contactEnabled, label: 'Contact', url: contactUrl },
  ].filter(item => item.enabled && item.url);

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
          {navItems.length > 0 && (
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item, index) => (
                <a
                  key={index}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:opacity-80 transition-opacity"
                  style={{ color: brandColorSecondary }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}

          {/* Mobile Menu Icon */}
          {navItems.length > 0 && (
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
