import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Link } from 'react-router-dom';
import { Calendar, Users, TrendingUp, Clock, Bell, FileText } from 'lucide-react';

const UseCases = () => {
    const useCases = [
        {
            icon: Calendar,
            title: 'Pengurusan Tempahan Automatik',
            description: 'Sistem kalendar yang membolehkan pelanggan melihat slot tersedia dan membuat tempahan secara automatik tanpa perlu menunggu pengesahan manual.',
            benefits: [
                'Kurangkan masa respons kepada pelanggan',
                'Elakkan double booking',
                'Tempahan 24/7 tanpa had masa',
                'Tempahan boleh dijadualkan',
                'Tempahan akan masuk terus ke sistem anda',
                'Integrasi dengan WhatsApp & Google Calendar'
            ]
        },
        {
            icon: Users,
            title: 'Pengurusan Pelanggan',
            description: 'Simpan dan urus maklumat pelanggan dengan mudah. Lihat sejarah tempahan, keutamaan, dan data pelanggan dalam satu tempat.',
            benefits: [
                'Profil pelanggan lengkap',
                'Sejarah tempahan dan pembayaran'
            ]
        },
        {
            icon: TrendingUp,
            title: 'Laporan & Analisis',
            description: 'Dashboard analitik yang memberikan insight tentang prestasi studio anda. Pantau pendapatan, trend tempahan, dan buat keputusan berdasarkan data.',
            benefits: [
                'Laporan pendapatan bulanan',
                'Analisis waktu puncak',
                'Trend layout popular'
            ]
        },
        {
            icon: Clock,
            title: 'Pengurusan Waktu Operasi',
            description: 'Tetapkan waktu operasi studio dengan fleksibel. Urus waktu rehat, cuti umum, dan tutup sementara dengan mudah.',
            benefits: [
                'Tetapan waktu operasi fleksibel',
                'Pengurusan waktu rehat',
                'Block tarikh untuk maintenance'
            ]
        },
        {
            icon: Bell,
            title: 'Notifikasi Automatik',
            description: 'Terima notifikasi segera untuk setiap tempahan baharu, pembayaran, atau perubahan. Pelanggan juga menerima pengesahan automatik.',
            benefits: [
                'Notifikasi segera',
                'Pengesahan tempahan automatik',
                'Reminder untuk pelanggan'
            ]
        },
        {
            icon: FileText,
            title: 'Resit Digital',
            description: 'Sistem menjana resit digital secara automatik untuk setiap pembayaran. Pelanggan menerima resit melalui email dengan segera.',
            benefits: [
                'Resit PDF',
                'Hantar automatik ke email dan WhatsApp',
                'Rekod pembayaran lengkap'
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-primary/5">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                            Kegunaan Tempah Studio
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Lihat bagaimana Tempah Studio dapat membantu mengembangkan perniagaan studio anda
                        </p>
                    </div>
                </section>

                {/* Use Cases Grid */}
                <section className="py-16 md:py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {useCases.map((useCase, index) => {
                                const Icon = useCase.icon;
                                return (
                                    <div
                                        key={index}
                                        className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
                                    >
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                            <Icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground mb-3">
                                            {useCase.title}
                                        </h3>
                                        <p className="text-muted-foreground mb-4">
                                            {useCase.description}
                                        </p>
                                        <ul className="space-y-2">
                                            {useCase.benefits.map((benefit, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                    <span className="text-primary mt-1">✓</span>
                                                    <span>{benefit}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Who Is It For Section */}
                <section className="py-16 bg-muted/30">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
                            Sesuai Untuk
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="text-4xl mb-4">🏢</div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">Studio Kecil</h3>
                                <p className="text-muted-foreground">
                                    Studio dengan 1-2 layout yang ingin mengautomasi proses tempahan
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl mb-4">🏪</div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">Studio Sederhana</h3>
                                <p className="text-muted-foreground">
                                    Studio dengan pelbagai layout dan keperluan pengurusan yang lebih kompleks
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl mb-4">🏛️</div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">Rantai Studio</h3>
                                <p className="text-muted-foreground">
                                    Pemilik berbilang cawangan studio yang memerlukan pengurusan berpusat
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 bg-gradient-to-br from-primary/5 to-background">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                            Bersedia untuk mencuba?
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8">
                            Mulakan transformasi digital studio anda hari ini
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/#pricing-section"
                                className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                            >
                                Lihat Pakej
                            </Link>
                            <Link
                                to="/getting-started"
                                className="border border-border bg-background hover:bg-muted/50 px-8 py-3 rounded-lg font-medium transition-colors"
                            >
                                Cara Bermula
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default UseCases;
