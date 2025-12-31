import { Link } from 'react-router-dom';
import './AboutUs.css';

const AboutUs = () => {
    return (
        <div className="about-us">
            <section className="page-hero">
                <div className="hero-overlay"></div>
                <div className="container">
                    <h1 className="page-title">Our Company</h1>
                    <div className="breadcrumb">
                        <Link to="/">Home</Link> / <span>About Us</span>
                    </div>
                </div>
            </section>

            <section className="section section-white">
                <div className="container">
                    <div className="about-content">
                        <div className="about-text">
                            <h2>Welcome to Faridism Production</h2>
                            <p>
                                Since 2014, Faridism Production has been dedicated to capturing life's most precious moments with artistry and professionalism. What started as a passion project has grown into one of Malaysia's most trusted photography and videography services.
                            </p>
                            <p>
                                With over 12 years of experience in the wedding industry, we have had the privilege of serving over 10,000 clients across Malaysia, Singapore, and Indonesia. Our journey has been shaped by the trust and feedback of the couples and families we've served.
                            </p>
                            <p>
                                At Faridism, we believe that every moment tells a story. Our mission is to preserve those stories through beautiful imagery that you'll treasure for a lifetime.
                            </p>
                        </div>
                        <div className="about-image">
                            <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80" alt="Faridism Team" />
                        </div>
                    </div>
                </div>
            </section>

            <section className="section section-gray">
                <div className="container">
                    <h2 className="section-title">Our Values</h2>
                    <div className="values-grid">
                        <div className="value-card">
                            <div className="value-icon">🎯</div>
                            <h3>Excellence</h3>
                            <p>We strive for excellence in every shot, every edit, and every interaction with our clients.</p>
                        </div>
                        <div className="value-card">
                            <div className="value-icon">💝</div>
                            <h3>Passion</h3>
                            <p>Our passion for photography drives us to capture the emotions and beauty of every moment.</p>
                        </div>
                        <div className="value-card">
                            <div className="value-icon">🤝</div>
                            <h3>Trust</h3>
                            <p>We build lasting relationships with our clients based on trust, reliability, and professionalism.</p>
                        </div>
                        <div className="value-card">
                            <div className="value-icon">✨</div>
                            <h3>Innovation</h3>
                            <p>We continuously evolve our techniques and technology to deliver the best results.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section section-white">
                <div className="container">
                    <h2 className="section-title">Why Choose Faridism?</h2>
                    <div className="why-choose-grid">
                        <div className="why-card">
                            <h3>12+ Years of Experience</h3>
                            <p>Over a decade of expertise in capturing weddings and special events across Southeast Asia.</p>
                        </div>
                        <div className="why-card">
                            <h3>100+ Professional Shooters</h3>
                            <p>A network of experienced, registered photographers and videographers ready to serve you.</p>
                        </div>
                        <div className="why-card">
                            <h3>10,000+ Happy Clients</h3>
                            <p>Thousands of satisfied couples and families who trust us with their precious memories.</p>
                        </div>
                        <div className="why-card">
                            <h3>Trusted by Major Brands</h3>
                            <p>Partnerships with Shopee, Wah Chan, Courts, and leading wedding vendors.</p>
                        </div>
                        <div className="why-card">
                            <h3>Fast Delivery</h3>
                            <p>Professional editing and delivery of your photos and videos within 3 days.</p>
                        </div>
                        <div className="why-card">
                            <h3>Hassle-Free Service</h3>
                            <p>From booking to delivery, we handle every detail so you can focus on your special day.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section section-yellow">
                <div className="container">
                    <div className="cta-content">
                        <h2>Ready to Work With Us?</h2>
                        <p>Let's create beautiful memories together</p>
                        <div className="cta-buttons">
                            <Link to="/packages" className="btn btn-primary">View Our Packages</Link>
                            <Link to="/contact-us" className="btn btn-outline">Get In Touch</Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutUs;
