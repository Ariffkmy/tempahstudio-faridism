import { useState, useEffect } from 'react';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Link } from 'react-router-dom';
import { getPackages } from '@/services/packageService';
import type { Package } from '@/types/database';
import { cn } from '@/lib/utils';

const Pricing = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loadingPackages, setLoadingPackages] = useState(true);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const data = await getPackages();
                setPackages(data);
            } catch (error) {
                console.error('Error fetching packages:', error);
            } finally {
                setLoadingPackages(false);
            }
        };

        fetchPackages();
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-primary/5">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                            Harga Pakej
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Pilih pakej yang sesuai dengan saiz dan keperluan studio anda. Semua pakej termasuk setup percuma dan sokongan pelanggan.
                        </p>
                    </div>
                </section>

                {/* Pricing Cards */}
                <section className="py-16 md:py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {loadingPackages ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : packages.length > 0 ? (
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
                                                {pkg.features.map((feature, index) => (
                                                    <div key={index} className="flex items-start gap-3">
                                                        <span className="text-sm">{feature}</span>
                                                    </div>
                                                ))}
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
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>Tiada pakej tersedia buat masa ini.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Features Comparison */}
                <section className="py-16 bg-muted/30">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
                            Semua Pakej Termasuk
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-3">
                                <span className="text-primary text-xl">✓</span>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Setup Percuma</h3>
                                    <p className="text-sm text-muted-foreground">Pasukan kami akan bantu setup sistem anda</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-primary text-xl">✓</span>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Sokongan 24/7</h3>
                                    <p className="text-sm text-muted-foreground">Bantuan teknikal bila-bila masa diperlukan</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-primary text-xl">✓</span>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Kemaskini Percuma</h3>
                                    <p className="text-sm text-muted-foreground">Akses kepada semua feature baharu</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-primary text-xl">✓</span>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Latihan Pengguna</h3>
                                    <p className="text-sm text-muted-foreground">Panduan lengkap cara guna sistem</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-primary text-xl">✓</span>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Backup Data</h3>
                                    <p className="text-sm text-muted-foreground">Data anda selamat dan di-backup secara berkala</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-primary text-xl">✓</span>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Jaminan Keselamatan Data Anda & Data Pelanggan</h3>
                                    <p className="text-sm text-muted-foreground">Kami menggunankan teknologi terkini untuk melindungi data anda</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
                            Soalan Lazim Tentang Harga
                        </h2>
                        <div className="space-y-6">
                            <div className="bg-card border border-border rounded-lg p-6">
                                <h3 className="font-semibold text-foreground mb-2">Adakah ada caj tersembunyi?</h3>
                                <p className="text-muted-foreground">Tidak. Harga yang tertera adalah harga sebenar. Tiada caj tambahan atau tersembunyi.</p>
                            </div>
                            <div className="bg-card border border-border rounded-lg p-6">
                                <h3 className="font-semibold text-foreground mb-2">Bolehkah saya tukar pakej kemudian?</h3>
                                <p className="text-muted-foreground">Ya, anda boleh upgrade atau downgrade pakej pada bila-bila masa. Hubungi kami untuk bantuan.</p>
                            </div>
                            <div className="bg-card border border-border rounded-lg p-6">
                                <h3 className="font-semibold text-foreground mb-2">Bagaimana cara pembayaran?</h3>
                                <p className="text-muted-foreground">Pembayaran boleh dibuat melalui pindahan bank. Resit akan dihantar selepas pembayaran disahkan.</p>
                            </div>
                            <div className="bg-card border border-border rounded-lg p-6">
                                <h3 className="font-semibold text-foreground mb-2">Adakah ada tempoh percubaan?</h3>
                                <p className="text-muted-foreground">Hubungi kami untuk maklumat lanjut tentang tempoh percubaan atau demo sistem.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 bg-gradient-to-br from-primary/5 to-background">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                            Masih tidak pasti pakej mana yang sesuai?
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8">
                            Hubungi kami dan kami akan bantu anda pilih pakej yang terbaik untuk studio anda
                        </p>
                        <a
                            href="https://wa.me/601129947089"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors inline-block"
                        >
                            Hubungi Kami
                        </a>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Pricing;
