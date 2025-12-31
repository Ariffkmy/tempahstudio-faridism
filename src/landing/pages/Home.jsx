import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const [scrollY, setScrollY] = useState(0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Hero carousel images from public/hero-carousel folder
    const heroImages = [
        '/hero-carousel/Ceremony.jpg',
        '/hero-carousel/green-and-blush-malay-wedding-015.jpg',
        '/hero-carousel/liliboom-kl-1283-1-2048x1363.jpg',
        '/hero-carousel/258156151_228862859316818_3243221244854330125_nfull.jpg',
        '/hero-carousel/258885224_1272849403184636_2317251282886767189_nfull.jpg'
    ];

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Carousel effect - change image every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) =>
                (prevIndex + 1) % heroImages.length
            );
        }, 5000);

        return () => clearInterval(interval);
    }, [heroImages.length]);

    const services = [
        {
            title: 'Solemnization',
            image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
            link: '/packages/solemnization'
        },
        {
            title: 'Wedding Reception',
            image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80',
            link: '/packages/wedding-reception'
        },
        {
            title: 'Pre/Post Wedding',
            image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80',
            link: '/packages/pre-wedding'
        },
        {
            title: 'Portraiture',
            image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80',
            link: '/packages/portraiture'
        },
        {
            title: 'Studio',
            image: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&q=80',
            link: '/packages/studio'
        }
    ];

    const reviews = [
        {
            name: 'Ahmad Shahrulnizan Sohor',
            year: '2025',
            text: 'We are truly grateful to Faridism Production for their outstanding videography and photography service on our wedding day. From the very beginning, the team was professional, approachable, and attentive to every detail.'
        },
        {
            name: 'nrl irarara27',
            year: '2025',
            text: 'Thankkkk youuu faridism, saya & pasangan sangat in lurveee dgn hasil kerja dari segi album gambar perkahwinan kami & layanan yg sangat memuaskan. Terbaikkk !!!💓🫶🏼✨'
        },
        {
            name: 'ahmdammar',
            year: '2025',
            text: 'The Faridism team is incredibly professional and friendly. They were easy to communicate with and gave their full cooperation throughout the process. Highly recommended'
        },
        {
            name: 'Nur Alia Roslan',
            year: '2025',
            text: "I'm really happy with the service provided. The team was professional and friendly, and they made the whole experience very comfortable. All the photos and videos turned out beautiful!"
        },
        {
            name: 'Muhd Ruslan',
            year: '2025',
            text: 'Thank you farah & abang wan photographer bagi service terbaik semasa hari bahagia kami berdua. Gambar from faridism memang terbaik, tak menyesal pilih faridism!'
        }
    ];

    return (
        <div className="home">
            {/* Hero Section with Carousel */}
            <section className="hero">
                {heroImages.map((image, index) => (
                    <div
                        key={index}
                        className={`hero-background ${index === currentImageIndex ? 'active' : ''}`}
                        style={{ backgroundImage: `url(${image})` }}
                    />
                ))}
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1 className="hero-title fade-in">
                        Make Your <span className="text-highlight">Moment</span> Memorable
                    </h1>
                    <p className="hero-subtitle fade-in">Book a professional photographer for any moment you wish!</p>
                    <Link to="/packages" className="btn btn-primary fade-in">
                        BOOK NOW
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 0L6.59 1.41 12.17 7H0v2h12.17l-5.58 5.59L8 16l8-8z" />
                        </svg>
                    </Link>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="section section-white">
                <div className="container">
                    <h2 className="section-title">Photography for Every Moment</h2>
                    <div className="services-grid">
                        {services.map((service, index) => (
                            <Link to={service.link} key={index} className="service-card card">
                                <div className="service-image-wrapper">
                                    <img src={service.image} alt={service.title} className="service-image" />
                                    <div className="service-overlay">
                                        <h3 className="service-title">{service.title}</h3>
                                        <span className="service-link-text">View Our Package</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                        <Link to="/packages" className="service-card card browse-all">
                            <div className="browse-content">
                                <h3>Browse All Categories</h3>
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
                                    <path d="M16 0L13.18 2.82 24.36 14H0v4h24.36L13.18 29.18 16 32l16-16z" />
                                </svg>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* USP Section */}
            <section className="section section-gray">
                <div className="container">
                    <h2 className="section-title">Making memory just got easier</h2>
                    <p className="section-subtitle">That's why our client love us!</p>

                    <div className="usp-grid">
                        <div className="usp-card">
                            <img src="/quote.png" alt="Quote" className="quote-mark" />
                            <h3 className="usp-title">12 Years Experiences</h3>
                            <p className="usp-text">
                                Faridism over 12 years of experiences in the wedding industry & served over 10 thousands client all around Malaysia, Singapore & Indonesia.
                            </p>
                        </div>

                        <div className="usp-card">
                            <img src="/quote.png" alt="Quote" className="quote-mark" />
                            <h3 className="usp-title">Trained Crew</h3>
                            <p className="usp-text">
                                Faridism works with more than 100 experienced, registered professional shooters across Malaysia, supported by a dedicated 30-member management team.
                            </p>
                        </div>

                        <div className="usp-card">
                            <img src="/quote.png" alt="Quote" className="quote-mark" />
                            <h3 className="usp-title">Trusted By Vendor and Big Brands</h3>
                            <p className="usp-text">
                                Faridism has had the privilege of working with major brands such as Shopee, Wah Chan, and Courts, as well as leading wedding vendors.
                            </p>
                        </div>

                        <div className="usp-card">
                            <img src="/quote.png" alt="Quote" className="quote-mark" />
                            <h3 className="usp-title">Hassle Free</h3>
                            <p className="usp-text">
                                At Faridism, we make your wedding journey truly hassle-free. From booking to final delivery, our team handles every detail with care.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section className="section section-white">
                <div className="container">
                    <h2 className="section-title">Great photo as easy as 1 2 3...</h2>

                    <div className="process-grid">
                        <div className="process-step">
                            <div className="step-number">1</div>
                            <h3 className="step-title">Book</h3>
                            <p className="step-text">
                                Discuss with us the requirements of your shoot, your proposed moodboard, storyboard and script. We will tailor-make the best quotation for you.
                            </p>
                        </div>

                        <div className="process-step">
                            <div className="step-number">2</div>
                            <h3 className="step-title">Shoot</h3>
                            <p className="step-text">
                                Enjoy your photo or video shoot day with peace of mind, knowing that you are in the hands of a professional.
                            </p>
                        </div>

                        <div className="process-step">
                            <div className="step-number">3</div>
                            <h3 className="step-title">Deliver</h3>
                            <p className="step-text">
                                Our team of editors will enhance your photos or videos before delivering them to you in just 3 days after the shoot.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Reviews Section */}
            <section className="section section-yellow">
                <div className="container">
                    <h2 className="section-title">Read our 5/5 Reviews</h2>
                    <p className="section-subtitle">Your Feedback Shapes Our Journey</p>
                    <p className="reviews-intro">
                        From the very beginning in 2014, we've grown not just through experience, but through the trust and feedback of the couples and families we've served. We value every message and every suggestion because they help us understand what truly matters to you.
                    </p>

                    <div className="reviews-grid">
                        {reviews.map((review, index) => (
                            <div key={index} className="review-card">
                                <p className="review-text">"{review.text}"</p>
                                <div className="review-author">
                                    <strong>{review.name}</strong> - {review.year} (Google Review)
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="review-links">
                        <a href="https://www.instagram.com/faridismreview/" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                            Instagram Reviews
                        </a>
                        <a href="https://www.google.com/search?q=faridism" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                            Google Reviews
                        </a>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section section-white cta-section">
                <div className="container">
                    <h2 className="section-title">Ready to make your life memorable?</h2>
                    <p className="section-subtitle">Book NOW! or contact our team to customize your package</p>

                    <div className="cta-buttons">
                        <Link to="/packages" className="btn btn-primary">View Our Package</Link>
                        <Link to="/contact-us" className="btn btn-outline" style={{ color: 'var(--color-black)', borderColor: 'var(--color-black)' }}>Contact Our Team</Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
