import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { Layouts } from '@/components/landing/Layouts';
import { Features } from '@/components/landing/Features';
import { Footer } from '@/components/landing/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Layouts />
        <Features />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
