import React from 'react';
import { useParams, Link } from 'react-router-dom';
import './PackagePage.css';

const PackagePage = () => {
    const { packageType } = useParams();

    const packages = {
        'solemnization': {
            title: 'Solemnization',
            description: 'Capture the sacred moments of your solemnization ceremony with our professional photography and videography services.',
            hero: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80',
            packages: [
                {
                    name: 'Basic Package',
                    price: 'RM 800',
                    features: [
                        '1 Professional Photographer',
                        '3 Hours Coverage',
                        '100+ Edited Photos',
                        'Online Gallery',
                        'Basic Editing'
                    ]
                },
                {
                    name: 'Premium Package',
                    price: 'RM 1,500',
                    features: [
                        '2 Professional Photographers',
                        'Full Day Coverage',
                        '300+ Edited Photos',
                        'Premium Album (20 pages)',
                        'Online Gallery',
                        'Advanced Editing',
                        'Same Day Edit Video'
                    ]
                },
                {
                    name: 'Deluxe Package',
                    price: 'RM 2,500',
                    features: [
                        '2 Photographers + 1 Videographer',
                        'Full Day Coverage',
                        '500+ Edited Photos',
                        'Luxury Album (30 pages)',
                        'Online Gallery',
                        'Cinematic Highlight Video (5-7 mins)',
                        'Full Ceremony Video',
                        'Drone Coverage'
                    ]
                }
            ]
        },
        'wedding-reception': {
            title: 'Wedding Reception',
            description: 'Make your wedding reception unforgettable with our comprehensive photography and videography coverage.',
            hero: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1920&q=80',
            packages: [
                {
                    name: 'Silver Package',
                    price: 'RM 1,500',
                    features: [
                        '2 Professional Photographers',
                        '6 Hours Coverage',
                        '400+ Edited Photos',
                        'Online Gallery',
                        'Premium Editing'
                    ]
                },
                {
                    name: 'Gold Package',
                    price: 'RM 2,800',
                    features: [
                        '2 Photographers + 1 Videographer',
                        'Full Event Coverage',
                        '600+ Edited Photos',
                        'Luxury Album (40 pages)',
                        'Highlight Video (8-10 mins)',
                        'Online Gallery',
                        'Same Day Edit'
                    ]
                },
                {
                    name: 'Platinum Package',
                    price: 'RM 4,500',
                    features: [
                        '3 Photographers + 2 Videographers',
                        'Full Event Coverage',
                        '1000+ Edited Photos',
                        'Premium Album (60 pages)',
                        'Cinematic Film (15-20 mins)',
                        'Full Event Video',
                        'Drone Coverage',
                        'Photo Booth'
                    ]
                }
            ]
        },
        'pre-wedding': {
            title: 'Pre/Post Wedding',
            description: 'Create stunning pre-wedding or post-wedding photos that tell your love story in the most beautiful way.',
            hero: 'https://images.unsplash.com/photo-1537633552985-df8429e8e04b?w=1920&q=80',
            packages: [
                {
                    name: 'Studio Package',
                    price: 'RM 1,200',
                    features: [
                        '1 Professional Photographer',
                        'Studio Session (3 hours)',
                        '2 Outfit Changes',
                        '50+ Edited Photos',
                        'Online Gallery',
                        'Makeup & Styling Included'
                    ]
                },
                {
                    name: 'Outdoor Package',
                    price: 'RM 2,000',
                    features: [
                        '1 Photographer + 1 Assistant',
                        'Outdoor Location (1 location)',
                        'Full Day Session',
                        '3 Outfit Changes',
                        '100+ Edited Photos',
                        'Premium Album (20 pages)',
                        'Makeup & Styling Included'
                    ]
                },
                {
                    name: 'Destination Package',
                    price: 'RM 3,500',
                    features: [
                        '2 Photographers',
                        'Multiple Locations',
                        '2 Days Coverage',
                        'Unlimited Outfit Changes',
                        '200+ Edited Photos',
                        'Luxury Album (40 pages)',
                        'Cinematic Video',
                        'Makeup & Styling Included',
                        'Drone Coverage'
                    ]
                }
            ]
        },
        'engagement': {
            title: 'Engagement',
            description: 'Celebrate your engagement with beautiful photos that capture the joy and excitement of this special milestone.',
            hero: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1920&q=80',
            packages: [
                {
                    name: 'Basic Package',
                    price: 'RM 600',
                    features: [
                        '1 Professional Photographer',
                        '2 Hours Coverage',
                        '80+ Edited Photos',
                        'Online Gallery'
                    ]
                },
                {
                    name: 'Premium Package',
                    price: 'RM 1,200',
                    features: [
                        '2 Professional Photographers',
                        '4 Hours Coverage',
                        '150+ Edited Photos',
                        'Premium Album (15 pages)',
                        'Online Gallery',
                        'Same Day Highlights'
                    ]
                }
            ]
        },
        'special-event': {
            title: 'Special Event',
            description: 'From corporate events to birthday celebrations, we capture every special moment with professionalism and creativity.',
            hero: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1920&q=80',
            packages: [
                {
                    name: 'Half Day Package',
                    price: 'RM 800',
                    features: [
                        '1 Professional Photographer',
                        '4 Hours Coverage',
                        '200+ Edited Photos',
                        'Online Gallery'
                    ]
                },
                {
                    name: 'Full Day Package',
                    price: 'RM 1,500',
                    features: [
                        '2 Professional Photographers',
                        '8 Hours Coverage',
                        '400+ Edited Photos',
                        'Online Gallery',
                        'Highlight Video'
                    ]
                }
            ]
        },
        'new-born': {
            title: 'New Born',
            description: 'Preserve the precious early moments of your newborn with our gentle and professional photography services.',
            hero: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1920&q=80',
            packages: [
                {
                    name: 'Studio Package',
                    price: 'RM 600',
                    features: [
                        '1 Professional Photographer',
                        'Studio Session (2 hours)',
                        '30+ Edited Photos',
                        'Props Included',
                        'Online Gallery'
                    ]
                },
                {
                    name: 'Home Package',
                    price: 'RM 800',
                    features: [
                        '1 Professional Photographer',
                        'Home Session (3 hours)',
                        '50+ Edited Photos',
                        'Lifestyle Photography',
                        'Online Gallery',
                        'Premium Album (10 pages)'
                    ]
                }
            ]
        },
        'studio': {
            title: 'Studio',
            description: 'Professional studio photography for portraits, family photos, and more in our fully-equipped studio.',
            hero: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=1920&q=80',
            packages: [
                {
                    name: 'Individual Package',
                    price: 'RM 300',
                    features: [
                        '1 Professional Photographer',
                        '1 Hour Session',
                        '20+ Edited Photos',
                        '1 Outfit Change',
                        'Online Gallery'
                    ]
                },
                {
                    name: 'Family Package',
                    price: 'RM 600',
                    features: [
                        '1 Professional Photographer',
                        '2 Hours Session',
                        '40+ Edited Photos',
                        'Multiple Setups',
                        'Online Gallery',
                        'Printed Photos (10 pcs)'
                    ]
                }
            ]
        },
        'graduation': {
            title: 'Graduation',
            description: 'Celebrate your academic achievement with professional graduation photography.',
            hero: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80',
            packages: [
                {
                    name: 'Basic Package',
                    price: 'RM 250',
                    features: [
                        '1 Professional Photographer',
                        '1 Hour Session',
                        '30+ Edited Photos',
                        'Campus Location',
                        'Online Gallery'
                    ]
                },
                {
                    name: 'Premium Package',
                    price: 'RM 450',
                    features: [
                        '1 Professional Photographer',
                        '2 Hours Session',
                        '60+ Edited Photos',
                        'Multiple Locations',
                        'Online Gallery',
                        'Printed Album (15 pages)'
                    ]
                }
            ]
        },
        'portraiture': {
            title: 'Portraiture',
            description: 'Professional portrait photography for personal branding, headshots, and artistic portraits.',
            hero: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1920&q=80',
            packages: [
                {
                    name: 'Headshot Package',
                    price: 'RM 200',
                    features: [
                        '1 Professional Photographer',
                        '30 Minutes Session',
                        '10+ Edited Photos',
                        'Studio Setup',
                        'Online Gallery'
                    ]
                },
                {
                    name: 'Creative Package',
                    price: 'RM 500',
                    features: [
                        '1 Professional Photographer',
                        '2 Hours Session',
                        '40+ Edited Photos',
                        'Multiple Setups',
                        'Outfit Changes',
                        'Online Gallery',
                        'Artistic Editing'
                    ]
                }
            ]
        }
    };

    const currentPackage = packages[packageType] || packages['solemnization'];

    return (
        <div className="package-page">
            <section className="package-hero" style={{ backgroundImage: `url(${currentPackage.hero})` }}>
                <div className="hero-overlay"></div>
                <div className="container">
                    <h1 className="page-title">{currentPackage.title}</h1>
                    <div className="breadcrumb">
                        <Link to="/">Home</Link> / <Link to="/packages">Our Packages</Link> / <span>{currentPackage.title}</span>
                    </div>
                </div>
            </section>

            <section className="section section-white">
                <div className="container">
                    <div className="package-intro">
                        <h2>About This Service</h2>
                        <p>{currentPackage.description}</p>
                    </div>

                    <h2 className="section-title">Our Packages</h2>
                    <div className="packages-grid">
                        {currentPackage.packages.map((pkg, index) => (
                            <div key={index} className="package-card">
                                <h3 className="package-name">{pkg.name}</h3>
                                <div className="package-price">{pkg.price}</div>
                                <ul className="package-features">
                                    {pkg.features.map((feature, idx) => (
                                        <li key={idx}>
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                <circle cx="10" cy="10" r="10" fill="var(--color-primary)" />
                                                <path d="M6 10l3 3 5-6" stroke="black" strokeWidth="2" fill="none" />
                                            </svg>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Link to="/contact-us" className="btn btn-primary">Book Now</Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section section-yellow">
                <div className="container">
                    <div className="cta-content">
                        <h2>Ready to Book?</h2>
                        <p>Contact us to customize your package or get more information</p>
                        <div className="cta-buttons">
                            <Link to="/contact-us" className="btn btn-primary">Contact Us</Link>
                            <Link to="/packages" className="btn btn-outline">View All Packages</Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PackagePage;
