import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { MockHeroSection } from '@/components/landing/MockHeroSection';
import { Features } from '@/components/landing/Features';
import { Footer } from '@/components/landing/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <MockHeroSection />
        <Features />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
