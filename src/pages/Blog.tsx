import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

const Blog = () => {
    const blogPosts = [
        {
            title: '5 Cara Meningkatkan Tempahan Studio Anda',
            excerpt: 'Ketahui strategi terbaik untuk menarik lebih ramai pelanggan dan meningkatkan kadar tempahan studio raya anda.',
            date: '15 Disember 2024',
            readTime: '5 minit',
            category: 'Tips Perniagaan',
            image: '📈'
        },
        {
            title: 'Mengapa Sistem Tempahan Online Penting?',
            excerpt: 'Dalam era digital ini, sistem tempahan online bukan lagi pilihan tetapi keperluan untuk studio yang ingin berkembang.',
            date: '10 Disember 2024',
            readTime: '4 minit',
            category: 'Panduan',
            image: '💻'
        },
        {
            title: 'Cara Menguruskan Kalendar Studio dengan Efisien',
            excerpt: 'Tips dan trik untuk mengoptimumkan jadual studio anda dan mengelakkan double booking.',
            date: '5 Disember 2024',
            readTime: '6 minit',
            category: 'Tips Pengurusan',
            image: '📅'
        },
        {
            title: 'Kelebihan Integrasi Google Calendar',
            excerpt: 'Bagaimana integrasi Google Calendar dapat memudahkan pengurusan tempahan dan meningkatkan produktiviti.',
            date: '1 Disember 2024',
            readTime: '5 minit',
            category: 'Teknologi',
            image: '🔗'
        },
        {
            title: 'Strategi Harga untuk Studio Raya',
            excerpt: 'Panduan lengkap untuk menetapkan harga yang kompetitif sambil memaksimumkan keuntungan.',
            date: '25 November 2024',
            readTime: '7 minit',
            category: 'Tips Perniagaan',
            image: '💰'
        },
        {
            title: 'Kepentingan Resit Digital untuk Pelanggan',
            excerpt: 'Mengapa resit digital adalah penting untuk kepuasan pelanggan dan pengurusan rekod yang lebih baik.',
            date: '20 November 2024',
            readTime: '4 minit',
            category: 'Panduan',
            image: '🧾'
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-primary/5">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                            Blog Tempah Studio
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Tips, panduan, dan insight untuk membantu anda mengembangkan perniagaan studio raya
                        </p>
                    </div>
                </section>

                {/* Blog Posts Grid */}
                <section className="py-16 md:py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {blogPosts.map((post, index) => (
                                <article
                                    key={index}
                                    className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
                                >
                                    {/* Image Placeholder */}
                                    <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-6xl">
                                        {post.image}
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                            <span className="inline-flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {post.date}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {post.readTime}
                                            </span>
                                        </div>

                                        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full mb-3">
                                            {post.category}
                                        </span>

                                        <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                                            {post.title}
                                        </h3>

                                        <p className="text-muted-foreground mb-4">
                                            {post.excerpt}
                                        </p>

                                        <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                                            Baca Selanjutnya <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>




            </main>

            <Footer />
        </div>
    );
};

export default Blog;
