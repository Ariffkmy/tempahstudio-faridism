import React from 'react';
import { Link } from 'react-router-dom';
import './Packages.css';

const Packages = () => {
    const packages = [
        {
            title: 'Solemnization',
            description: 'Capture the sacred moments of your solemnization ceremony',
            image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
            link: '/packages/solemnization',
            startingPrice: 'RM 800'
        },
        {
            title: 'Wedding Reception',
            description: 'Comprehensive coverage for your wedding reception',
            image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80',
            link: '/packages/wedding-reception',
            startingPrice: 'RM 1,500'
        },
        {
            title: 'Pre/Post Wedding',
            description: 'Beautiful pre-wedding or post-wedding photo sessions',
            image: 'https://images.unsplash.com/photo-1537633552985-df8429e8e04b?w=800&q=80',
            link: '/packages/pre-wedding',
            startingPrice: 'RM 1,200'
        },
        {
            title: 'Engagement',
            description: 'Celebrate your engagement with stunning photography',
            image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80',
            link: '/packages/engagement',
            startingPrice: 'RM 600'
        },
        {
            title: 'Special Event',
            description: 'Professional coverage for corporate and special events',
            image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
            link: '/packages/special-event',
            startingPrice: 'RM 800'
        },
        {
            title: 'New Born',
            description: 'Gentle and professional newborn photography',
            image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=80',
            link: '/packages/new-born',
            startingPrice: 'RM 600'
        },
        {
            title: 'Studio',
            description: 'Professional studio photography sessions',
            image: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&q=80',
            link: '/packages/studio',
            startingPrice: 'RM 300'
        },
        {
            title: 'Graduation',
            description: 'Celebrate your academic achievement',
            image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
            link: '/packages/graduation',
            startingPrice: 'RM 250'
        },
        {
            title: 'Portraiture',
            description: 'Professional portrait photography',
            image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80',
            link: '/packages/portraiture',
            startingPrice: 'RM 200'
        }
    ];

    return (
        <div className="packages-page">
            <section className="page-hero">
                <div className="hero-overlay"></div>
                <div className="container">
                    <h1 className="page-title">Our Packages</h1>
                    <div className="breadcrumb">
                        <Link to="/">Home</Link> / <span>Our Packages</span>
                    </div>
                </div>
            </section>

            <section className="section section-white">
                <div className="container">
                    <div className="packages-intro">
                        <h2>Choose Your Perfect Package</h2>
                        <p>
                            We offer a wide range of photography and videography packages tailored to your needs.
                            Whether it's a wedding, special event, or personal portrait session, we have the perfect package for you.
                        </p>
                    </div>

                    <div className="packages-grid">
                        {packages.map((pkg, index) => (
                            <Link to={pkg.link} key={index} className="package-card-link">
                                <div className="package-card">
                                    <div className="package-image-wrapper">
                                        <img src={pkg.image} alt={pkg.title} className="package-image" />
                                        <div className="package-overlay">
                                            <span className="view-package">View Package →</span>
                                        </div>
                                    </div>
                                    <div className="package-content">
                                        <h3 className="package-title">{pkg.title}</h3>
                                        <p className="package-description">{pkg.description}</p>
                                        <div className="package-price">
                                            <span className="price-label">Starting from</span>
                                            <span className="price-value">{pkg.startingPrice}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section section-yellow">
                <div className="container">
                    <div className="cta-content">
                        <h2>Need a Custom Package?</h2>
                        <p>Contact us to create a personalized package that fits your specific requirements and budget.</p>
                        <div className="cta-buttons">
                            <Link to="/contact-us" className="btn btn-primary">Contact Us</Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Packages;
