import { useState, useEffect } from 'react';
import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { MockHeroSection } from '@/components/landing/MockHeroSection';
import { Footer } from '@/components/landing/Footer';
import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from '@/lib/utils';

const Index = () => {
  // Hardcoded packages for landing page
  const packages = [
    {
      id: '1',
      name: 'Silver',
      slug: 'silver',
      price: 299,
      period: 'tahun',
      is_popular: false,
      features: [
        '🌐 Tempahan atas talian',
        '📅 Integrasi Google Calendar',
        '🔔 Notifikasi emel & Whatsapp',
        '📊 Data analitik tentang tempahan, pengguna, dan banyak lagi',
        '🧾 Resit elektronik untuk setiap tempahan',
        '👤 1 akaun admin user',
        '🎨 Disenaraikan dalam website caristudioraya.vercel.app',
        '💸 Bayaran tempahan terus ke akaun bank anda (menggunakan QR code atau transfer bank)'
      ]
    },
    {
      id: '2',
      name: 'Gold',
      slug: 'gold',
      price: 599,
      period: 'tahun',
      is_popular: true,
      features: [
        '🎯 Semua dalam Silver',
        '📲 Whatsapp blast untuk menghantar link gambar raya ke pelanggan anda (link Googledrive, Googlephoto, etc)',
        '📲 Whatsapp blast untuk menghantar link tempahan studio ke semua pelanggan lama anda',
        '👤 Tambahan admin user (2 akaun)',
        '🎨 Penyesuaian booking form mengikut branding studio anda'
      ]
    },
    {
      id: '3',
      name: 'Platinum',
      slug: 'platinum',
      price: 1199,
      period: 'tahun',
      is_popular: false,
      features: [
        '💎 Semua dalam Gold',
        '🌐 Custom domain (link tempahan menggunakan domain studio anda)',
        '💳 Payment Gateway (FPX)',
        '👥 Tambahan admin user (5 akaun)',
        '🚀 Pembangunan ciri khas'
      ]
    }
  ];


  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header />
      <main className="overflow-x-hidden">
        <Hero />
        <MockHeroSection />

        {/* Phone Mockup Section - Desktop 3x3 Grid, Mobile Single Column */}
        <section className="py-16 md:py-32 bg-background relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 md:mb-6">
                Solusi lengkap untuk studio raya anda!
              </h2>

            </div>

            {/* Responsive Grid: 2x4 on Desktop (always 8 features), Single Column on Mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-4 items-stretch">
              <div className="flex justify-center">
                <div className="w-full max-w-md lg:max-w-none bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20 min-h-[160px] lg:min-h-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mb-2 text-xl">
                    ✅
                  </div>
                  <h3 className="text-s font-semibold text-foreground mb-1">Pengesahan tempahan segera</h3>
                  <p className="text-xs text-muted-foreground">Klien anda boleh melihat mana-mana slot masa yang tersedia tanpa perlu menunggu respon anda di whatsapp</p>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-full max-w-md lg:max-w-none bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20 min-h-[160px] lg:min-h-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mb-2 text-xl">
                    🗓️
                  </div>
                  <h3 className="text-s font-semibold text-foreground mb-1">Integrasi ke Google Calendar</h3>
                  <p className="text-xs text-muted-foreground">Tempahan akan masuk ke Google Calendar dan juga kalendar sistem</p>
                </div>
              </div>


              <div className="flex justify-center">
                <div className="w-full max-w-md lg:max-w-none bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20 min-h-[160px] lg:min-h-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mb-2 text-xl">
                    💳
                  </div>
                  <h3 className="text-s font-semibold text-foreground mb-1">Proses pembayaran selamat dan pantas</h3>
                  <p className="text-xs text-muted-foreground">Pembayaran terus dibuat ke bank anda (menggunakan QR code, transfer direct ke akaun bank anda, atau FPX)</p>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-full max-w-md lg:max-w-none bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20 min-h-[160px] lg:min-h-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mb-2 text-xl">
                    📊
                  </div>
                  <h3 className="text-s font-semibold text-foreground mb-1">Data analisis</h3>
                  <p className="text-xs text-muted-foreground">Pantau tempahan, keuntungan, kecenderungan pilihan klien dan pelbagai lagi</p>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-full max-w-md lg:max-w-none bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20 min-h-[160px] lg:min-h-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mb-2 text-xl">
                    👥
                  </div>
                  <h3 className="text-s font-semibold text-foreground mb-1">Sokongan pelanggan</h3>
                  <p className="text-xs text-muted-foreground">Sentiasa bersedia untuk anda sekiranya ada masalah teknikal atau permintaan</p>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-full max-w-md lg:max-w-none bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20 min-h-[160px] lg:min-h-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mb-2 text-xl">
                    ⚙️
                  </div>
                  <h3 className="text-s font-semibold text-foreground mb-1">Konfigurasi mengikut keperluan anda</h3>
                  <p className="text-xs text-muted-foreground">Tetapan untuk T&C, Pakej, Waktu Operasi dan pelabagai lagi</p>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-full max-w-md lg:max-w-none bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20 min-h-[160px] lg:min-h-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mb-2 text-xl">
                    🧾
                  </div>
                  <h3 className="text-s font-semibold text-foreground mb-1">e-Resit untuk klien anda</h3>
                  <p className="text-xs text-muted-foreground">Resit akan di hantar melalui email selepas pembayaran dibuat</p>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-full max-w-md lg:max-w-none bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20 min-h-[160px] lg:min-h-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mb-2 text-xl">
                    🔔
                  </div>
                  <h3 className="text-s font-semibold text-foreground mb-1">Notifikasi segera</h3>
                  <p className="text-xs text-muted-foreground">Setiap tempahan, pembayaran dan perubahan akan segera dihantar ke email</p>
                </div>
              </div>

              {/* Phone Mockup - Mobile: After last feature, Desktop: Hidden */}
              <div className="flex justify-center lg:hidden">
                <img
                  src="/phonemockup.png"
                  alt="Raya Studio Mobile App"
                  className="w-full max-w-sm h-auto object-contain drop-shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Phone Mockup Showcase - Desktop Only */}
        <section className="hidden lg:block py-1 bg-background">
          <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8">

            <div className="flex justify-center">
              <img
                src="/phonemockup.png"
                alt="Raya Studio Mobile App"
                className="w-full max-w-3xl h-auto object-contain drop-shadow-2xl"
              />
            </div>


          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing-section" className="py-12 md:py-20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Pilih Pakej Sesuai Studio Anda
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Mulai dari studio kecil hingga rantai studio besar, kami ada penyelesaian untuk semua saiz perniagaan anda
              </p>
            </div>

            {/* Pricing Cards - Hardcoded */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-6 max-w-5xl mx-auto">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={cn(
                    "bg-card rounded-xl p-6 relative shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full",
                    pkg.is_popular ? "border-2 border-primary md:scale-105" : "border border-border"
                  )}
                >
                  {/* Popular Badge */}
                  {pkg.is_popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      Pilihan Berbaloi
                    </div>
                  )}

                  <div className="text-center">
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">{pkg.name}</h3>
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-1">RM {pkg.price.toFixed(0)}</div>
                    <p className="text-sm text-muted-foreground mb-6">/{pkg.period}</p>

                    <div className="space-y-3 mb-8 text-left">
                      {pkg.features.map((feature, index) => {
                        // Check if feature contains the caristudioraya.vercel.app link
                        if (feature.includes('caristudioraya.vercel.app')) {
                          const parts = feature.split('caristudioraya.vercel.app');
                          return (
                            <div key={index} className="flex items-start gap-3">
                              <span className="text-sm">
                                {parts[0]}
                                <a
                                  href="https://caristudioraya.vercel.app"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  caristudioraya.vercel.app
                                </a>
                                {parts[1]}
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div key={index} className="flex items-start gap-3">
                            <span className="text-sm">{feature}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-auto text-center">
                    <Link
                      to={`/package-payment?package=${pkg.slug}`}
                      className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors inline-block"
                    >
                      Pilih {pkg.name}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">
                Semua pakej termasuk setup percuma dan sokongan 24 jam
              </p>

            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Soalan Lazim
              </h2>

            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">


              {/* FAQ Item 2 */}
              <AccordionItem value="item-2" className="bg-card rounded-lg border">
                <AccordionTrigger className="px-6 py-4">
                  Adakah pembayaran selamat?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-muted-foreground">
                  Ya, semua pembayaran diproses terus ke bank anda.
                </AccordionContent>
              </AccordionItem>

              {/* FAQ Item 3 */}
              <AccordionItem value="item-3" className="bg-card rounded-lg border">
                <AccordionTrigger className="px-6 py-4">
                  Bagaimana pelanggan boleh menempah slot masa?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-muted-foreground">
                  Pelanggan mengisi tempahan di link tempahan studio anda, pilih tarikh dan masa yang tersedia, pilih layout studio, dan buat pembayaran secara atas talian.
                </AccordionContent>
              </AccordionItem>

              {/* FAQ Item 4 */}
              <AccordionItem value="item-4" className="bg-card rounded-lg border">
                <AccordionTrigger className="px-6 py-4">
                  Adakah tempahan akan masuk ke kalendar saya?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-muted-foreground">
                  Ya, semua tempahan yang sah akan diperbaharui secara automatik ke Google Calendar dan sistem kalendar dalaman. Anda akan menerima notifikasi serta-merta untuk setiap tempahan baharu.
                </AccordionContent>
              </AccordionItem>

              {/* FAQ Item 5 */}
              <AccordionItem value="item-5" className="bg-card rounded-lg border">
                <AccordionTrigger className="px-6 py-4">
                  Bagaimana jika ada pembatalan tempahan?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-muted-foreground">
                  Sebarang pembatalan tempahan akan dikendalikan secara manual oleh pihak studio. Kami akan membantu memudahkan proses ini melalui sistem notifikasi sahaja.
                </AccordionContent>
              </AccordionItem>


              {/* FAQ Item 7 */}
              <AccordionItem value="item-7" className="bg-card rounded-lg border">
                <AccordionTrigger className="px-6 py-4">
                  Berapa ramai pengguna yang boleh mendaftar akaun di bawah studio yang sama?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-muted-foreground">
                  Maksimum dua akaun. Sebarang permintaan untuk akaun tambahan akan dikenakan caj tambahan.
                </AccordionContent>
              </AccordionItem>

              {/* FAQ Item 8 */}
              <AccordionItem value="item-8" className="bg-card rounded-lg border">
                <AccordionTrigger className="px-6 py-4">
                  Bagaimana jika saya menghadapi masalah teknikal?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-muted-foreground">
                  Pasukan sokongan kami tersedia untuk membantu. Anda boleh hubungi kami melalui sistem atau hantaran emel.
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* CTA */}
            <div className="text-center mt-12">
              <p className="text-lg text-muted-foreground mb-6">
                Masih ada soalan lain? Jangan ragu untuk hubungi kami!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">

                <a
                  href="https://wa.me/601129947089"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-border bg-background hover:bg-muted/50 px-8 py-3 rounded-lg font-medium transition-colors text-center"
                >
                  Hubungi Kami
                </a>
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
