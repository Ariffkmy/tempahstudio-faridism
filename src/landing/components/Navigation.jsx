import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Set scrolled state
      setIsScrolled(currentScrollY > 50);

      // Hide/show based on scroll direction - hide immediately when scrolling down
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down & past 50px - hide immediately
        setIsHidden(true);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show
        setIsHidden(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location]);

  const toggleDropdown = (menu) => {
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  return (
    <nav className={`navigation ${isScrolled ? 'scrolled' : ''} ${isHidden ? 'hidden' : ''}`}>
      <div className="container">
        <div className="nav-wrapper">
          <Link to="/" className="nav-logo">
            <img src="/image.png" alt="Faridism Production" className="logo-image" />
          </Link>

          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <ul className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
            <li className="nav-item">
              <Link to="/" className="nav-link">Home</Link>
            </li>

            <li
              className="nav-item has-dropdown"
              onMouseEnter={() => toggleDropdown('about')}
              onMouseLeave={() => toggleDropdown(null)}
            >
              <span className="nav-link">
                About Us
                <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor">
                  <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </span>
              <ul className={`dropdown-menu ${activeDropdown === 'about' ? 'active' : ''}`}>
                <li><Link to="/about-us" className="dropdown-link">Our Company</Link></li>
                <li><Link to="/our-team" className="dropdown-link">Our Team</Link></li>
              </ul>
            </li>

            <li
              className="nav-item has-dropdown"
              onMouseEnter={() => toggleDropdown('packages')}
              onMouseLeave={() => toggleDropdown(null)}
            >
              <span className="nav-link">
                Our Packages
                <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor">
                  <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </span>
              <ul className={`dropdown-menu ${activeDropdown === 'packages' ? 'active' : ''}`}>
                <li><Link to="/packages/solemnization" className="dropdown-link">Solemnization</Link></li>
                <li><Link to="/packages/wedding-reception" className="dropdown-link">Wedding Reception</Link></li>
                <li><Link to="/packages/pre-wedding" className="dropdown-link">Pre/Post Wedding</Link></li>
                <li><Link to="/packages/engagement" className="dropdown-link">Engagement</Link></li>
                <li><Link to="/packages/portraiture" className="dropdown-link">Portraiture</Link></li>
                <li><Link to="/packages/graduation" className="dropdown-link">Graduation</Link></li>
                <li><Link to="/packages/special-event" className="dropdown-link">Special Event</Link></li>
                <li><Link to="/packages/new-born" className="dropdown-link">New Born</Link></li>
                <li><Link to="/packages/studio" className="dropdown-link">Studio</Link></li>
              </ul>
            </li>

            <li className="nav-item">
              <Link to="/contact-us" className="nav-link">Contact Us</Link>
            </li>

            <li className="nav-item">
              <Link to="/admin" className="nav-link admin-login-btn">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: '0.5rem' }}>
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
                </svg>
                Login as Admin
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
