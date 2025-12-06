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

        {/* Phone Mockup Section - Desktop Only */}
        <section className="hidden lg:block py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-12 items-center">
              {/* Phone Mockup Image */}
              <div className="flex justify-center">
                <div className="relative">
                  <img
                    src="/phonemockup.png"
                    alt="Raya Studio Mobile App"
                    className="w-full max-w-md h-auto object-contain"
                  />
                </div>
              </div>

              {/* Marketing Text */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    Book Your Perfect Studio Session
                  </h2>
                  <p className="text-lg text-muted-foreground mb-4">
                    Experience the ease of booking your ideal studio space with our mobile application.
                    Browse layouts, check availability, and reserve your creative session in just a few taps.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-foreground font-medium">Instant booking confirmation</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-foreground font-medium">Real-time availability</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-foreground font-medium">Secure payment processing</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-foreground font-medium">24/7 customer support</span>
                  </div>
                </div>

                <div className="pt-4">
                  <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                    Download Our App
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
