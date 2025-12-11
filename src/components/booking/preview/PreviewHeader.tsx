// =============================================
// PREVIEW HEADER COMPONENT
// =============================================
// Preview of custom header for booking form

import { Link } from 'react-router-dom';

interface PreviewHeaderProps {
  logo: string;
  homeEnabled: boolean;
  aboutEnabled: boolean;
  portfolioEnabled: boolean;
  contactEnabled: boolean;
  brandColorPrimary: string;
  brandColorSecondary: string;
}

const PreviewHeader = ({
  logo,
  homeEnabled,
  aboutEnabled,
  portfolioEnabled,
  contactEnabled,
  brandColorPrimary,
  brandColorSecondary,
}: PreviewHeaderProps) => {
  const navItems = [
    { enabled: homeEnabled, label: 'Home' },
    { enabled: aboutEnabled, label: 'About' },
    { enabled: portfolioEnabled, label: 'Portfolio' },
    { enabled: contactEnabled, label: 'Contact' },
  ].filter(item => item.enabled);

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
                  // Fallback if image fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="text-lg font-bold">Studio Logo</div>
            )}
          </div>

          {/* Navigation */}
          {navItems.length > 0 && (
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item, index) => (
                <span
                  key={index}
                  className="text-sm font-medium hover:opacity-80 transition-opacity cursor-not-allowed"
                  style={{ color: brandColorSecondary }}
                >
                  {item.label}
                </span>
              ))}
            </nav>
          )}

          {/* Mobile Menu Icon */}
          {navItems.length > 0 && (
            <button
              className="md:hidden p-2"
              style={{ color: brandColorSecondary }}
              onClick={(e) => e.preventDefault()}
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

export default PreviewHeader;
