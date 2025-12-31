import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import OurTeam from './pages/OurTeam';
import Packages from './pages/Packages';
import PackagePage from './pages/PackagePage';
import ContactUs from './pages/ContactUs';
import './App.css';
import './index.css';

const LandingLayout = () => {
    const [showScrollTop, setShowScrollTop] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location]);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const renderPage = () => {
        const path = location.pathname;

        if (path === '/') return <Home />;
        if (path === '/about-us') return <AboutUs />;
        if (path === '/our-team') return <OurTeam />;
        if (path === '/packages') return <Packages />;
        if (path.startsWith('/packages/')) return <PackagePage />;
        if (path === '/contact-us') return <ContactUs />;

        return <Home />;
    };

    return (
        <div className="landing-app">
            <Navigation />
            <main className="main-content">
                {renderPage()}
            </main>
            <Footer />

            <button
                className={`scroll-top ${showScrollTop ? 'visible' : ''}`}
                onClick={scrollToTop}
                aria-label="Scroll to top"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
            </button>
        </div>
    );
};

export default LandingLayout;
