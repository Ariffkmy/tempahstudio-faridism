import React from 'react';
import { Link } from 'react-router-dom';
import './OurTeam.css';

const OurTeam = () => {
    const team = [
        {
            name: 'Farid',
            role: 'Founder & Lead Photographer',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
            bio: 'With over 12 years of experience, Farid has captured thousands of beautiful moments.'
        },
        {
            name: 'Sarah',
            role: 'Senior Photographer',
            image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
            bio: 'Specializing in wedding photography with a keen eye for candid moments.'
        },
        {
            name: 'Ahmad',
            role: 'Videographer',
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
            bio: 'Expert in cinematic storytelling and creating emotional wedding films.'
        },
        {
            name: 'Nurul',
            role: 'Portrait Photographer',
            image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
            bio: 'Passionate about capturing personalities and creating stunning portraits.'
        },
        {
            name: 'Zaki',
            role: 'Event Photographer',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
            bio: 'Specializes in corporate events and special occasions photography.'
        },
        {
            name: 'Lisa',
            role: 'Editor & Retoucher',
            image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80',
            bio: 'Transforms raw photos into stunning masterpieces with expert editing.'
        }
    ];

    return (
        <div className="our-team">
            <section className="page-hero">
                <div className="hero-overlay"></div>
                <div className="container">
                    <h1 className="page-title">Our Team</h1>
                    <div className="breadcrumb">
                        <Link to="/">Home</Link> / <Link to="/about-us">About Us</Link> / <span>Our Team</span>
                    </div>
                </div>
            </section>

            <section className="section section-white">
                <div className="container">
                    <div className="team-intro">
                        <h2>Meet Our Talented Team</h2>
                        <p>
                            Our team consists of passionate and experienced photographers, videographers, and editors who are dedicated to capturing your special moments. Each member brings unique skills and creativity to ensure your memories are preserved beautifully.
                        </p>
                    </div>

                    <div className="team-grid">
                        {team.map((member, index) => (
                            <div key={index} className="team-card">
                                <div className="team-image-wrapper">
                                    <img src={member.image} alt={member.name} className="team-image" />
                                    <div className="team-overlay">
                                        <p className="team-bio">{member.bio}</p>
                                    </div>
                                </div>
                                <div className="team-info">
                                    <h3 className="team-name">{member.name}</h3>
                                    <p className="team-role">{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section section-yellow">
                <div className="container">
                    <div className="join-team">
                        <h2>Join Our Team</h2>
                        <p>Are you a talented photographer or videographer? We're always looking for passionate professionals to join our growing team.</p>
                        <Link to="/contact-us" className="btn btn-primary">Get In Touch</Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default OurTeam;
