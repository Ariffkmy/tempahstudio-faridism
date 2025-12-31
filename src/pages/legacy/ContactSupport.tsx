import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Mail, MessageCircle, Clock, HelpCircle } from 'lucide-react';

const ContactSupport = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-primary/5">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                            Sokongan Pelanggan
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Kami sedia membantu anda. Hubungi kami melalui mana-mana saluran di bawah.
                        </p>
                    </div>
                </section>

                {/* Contact Methods */}
                <section className="py-16 md:py-20">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                            {/* WhatsApp */}
                            <a
                                href="https://wa.me/601129947089"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-shadow group"
                            >
                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                                    <MessageCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-3">WhatsApp</h3>
                                <p className="text-muted-foreground mb-4">
                                    Cara paling pantas untuk mendapat bantuan. Kami biasanya membalas dalam masa beberapa minit.
                                </p>
                                <div className="text-primary font-medium group-hover:underline">
                                    +60 11-2994 7089
                                </div>
                            </a>

                            {/* Email */}
                            <a
                                href="mailto:support@rayastudio.com"
                                className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-shadow group"
                            >
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                    <Mail className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-3">Email</h3>
                                <p className="text-muted-foreground mb-4">
                                    Hantar email kepada kami untuk pertanyaan yang lebih terperinci. Kami akan membalas dalam masa 24 jam.
                                </p>
                                <div className="text-primary font-medium group-hover:underline">
                                    admin@tempahstudio.com
                                </div>
                            </a>
                        </div>

                        {/* Support Hours */}
                        <div className="bg-gradient-to-br from-primary/5 to-background rounded-xl p-8 mb-16">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">Waktu Sokongan</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Pasukan sokongan kami sedia membantu pada waktu berikut:
                                    </p>
                                    <div className="space-y-2 text-muted-foreground">
                                        <p><strong className="text-foreground">Isnin - Ahad:</strong> 9:00 AM - 10:00 PM</p>

                                    </div>
                                    <p className="text-sm text-muted-foreground mt-4">
                                        * Untuk isu kritikal di luar waktu operasi, sila hubungi melalui WhatsApp dan kami akan cuba membantu secepat mungkin.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* FAQ Link */}
                        <div className="bg-card border border-border rounded-xl p-8 text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <HelpCircle className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-3">
                                Cuba Cari Jawapan di FAQ
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                Mungkin soalan anda sudah dijawab dalam seksyen Soalan Lazim kami
                            </p>
                            <a
                                href="/faq"
                                className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                            >
                                Lihat FAQ
                            </a>
                        </div>
                    </div>
                </section>

                {/* Common Issues */}
                <section className="py-16 bg-muted/30">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
                            Isu Biasa & Penyelesaian Pantas
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-card border border-border rounded-lg p-6">
                                <h3 className="font-semibold text-foreground mb-2">Lupa Kata Laluan</h3>
                                <p className="text-sm text-muted-foreground">
                                    Klik "Lupa Kata Laluan" di halaman login dan ikuti arahan untuk reset kata laluan anda.
                                </p>
                            </div>
                            <div className="bg-card border border-border rounded-lg p-6">
                                <h3 className="font-semibold text-foreground mb-2">Tempahan Tidak Muncul</h3>
                                <p className="text-sm text-muted-foreground">
                                    Pastikan pelanggan telah lengkapkan pembayaran. Semak juga folder spam untuk email pengesahan.
                                </p>
                            </div>
                            <div className="bg-card border border-border rounded-lg p-6">
                                <h3 className="font-semibold text-foreground mb-2">Masalah Google Calendar</h3>
                                <p className="text-sm text-muted-foreground">
                                    Cuba disconnect dan connect semula Google Calendar di bahagian Settings.
                                </p>
                            </div>
                            <div className="bg-card border border-border rounded-lg p-6">
                                <h3 className="font-semibold text-foreground mb-2">Pembayaran Tidak Disahkan</h3>
                                <p className="text-sm text-muted-foreground">
                                    Hubungi kami dengan bukti pembayaran dan kami akan sahkan secepat mungkin.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Form Section (Coming Soon) */}
                <section className="py-16">
                    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-gradient-to-br from-primary/5 to-background rounded-xl p-8 text-center">
                            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                Borang Hubungi Kami
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Borang hubungi kami akan tersedia tidak lama lagi. Buat masa ini, sila gunakan WhatsApp atau email untuk menghubungi kami.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a
                                    href="https://wa.me/601129947089"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                                >
                                    WhatsApp Kami
                                </a>
                                <a
                                    href="mailto:support@rayastudio.com"
                                    className="border border-border bg-background hover:bg-muted/50 px-8 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Email Kami
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

export default ContactSupport;
