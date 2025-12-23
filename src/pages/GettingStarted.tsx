import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const GettingStarted = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-primary/5">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                            Digitalkan perniagaan studio raya anda
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Mulakan perjalanan digitalisasi studio anda dalam 3 langkah mudah
                        </p>
                    </div>
                </section>

                {/* Steps Section */}
                <section className="py-16 md:py-20">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="space-y-12">
                            {/* Step 1 */}
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="flex-shrink-0 w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold">
                                    1
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-foreground mb-3">Pilih Pakej Anda</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Pilih pakej yang sesuai dengan saiz dan keperluan studio anda. Semua pakej termasuk setup percuma dan sokongan pelanggan.
                                    </p>
                                    <Link
                                        to="/#pricing-section"
                                        className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                                    >
                                        Lihat Pakej <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="flex-shrink-0 w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold">
                                    2
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-foreground mb-3">Bayar & Daftar Akaun</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Lengkapkan pendaftaran dengan maklumat studio anda. Proses pendaftaran mengambil masa kurang dari 5 minit.
                                    </p>
                                    <ul className="space-y-2 mb-4">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-muted-foreground">Maklumat studio dan pemilik</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-muted-foreground">Pengesahan email</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-muted-foreground">Upload bukti pembayaran pakej</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="flex-shrink-0 w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold">
                                    3
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-foreground mb-3">Setup Studio & Mula Menerima Tempahan</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Setelah pembayaran disahkan, pasukan kami akan membantu anda setup sistem.
                                    </p>
                                    <ul className="space-y-2 mb-4">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-muted-foreground">Konfigurasi layout studio</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-muted-foreground">Setup pakej dan harga</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-muted-foreground">Integrasi pembayaran</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-muted-foreground">Dan pelbagai lagi</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 bg-gradient-to-br from-primary/5 to-background">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                            Bersedia untuk bermula?
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8">
                            Sertai Tempah Studio dan mula menerima tempahan anda sekarang!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/#pricing-section"
                                className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                            >
                                Lihat Pakej
                            </Link>
                            <a
                                href="https://wa.me/601129947089"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="border border-border bg-background hover:bg-muted/50 px-8 py-3 rounded-lg font-medium transition-colors"
                            >
                                Hubungi Kami
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default GettingStarted;
