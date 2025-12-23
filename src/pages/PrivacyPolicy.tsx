import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-primary/5">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                            Dasar Privasi Tempah Studio
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Kemas kini terakhir: 23 Disember 2025
                        </p>
                    </div>
                </section>

                {/* Content */}
                <section className="py-16 md:py-20">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="prose prose-lg max-w-none">
                            {/* Introduction */}
                            <div className="mb-12">
                                <p className="text-muted-foreground leading-relaxed">
                                    Tempah Studio komited untuk melindungi privasi anda. Dasar Privasi ini menerangkan bagaimana kami mengumpul,
                                    menggunakan, dan melindungi maklumat peribadi anda apabila anda menggunakan platform kami.
                                </p>
                            </div>

                            {/* Section 1 */}
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                    1. Maklumat Yang Kami Kumpul
                                </h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>Kami mengumpul maklumat berikut:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li><strong className="text-foreground">Maklumat Akaun:</strong> Nama, alamat email, nombor telefon, dan maklumat studio</li>
                                        <li><strong className="text-foreground">Maklumat Tempahan:</strong> Tarikh, masa, layout, dan butiran pembayaran</li>
                                        <li><strong className="text-foreground">Maklumat Pelanggan:</strong> Nama pelanggan, email, dan nombor telefon untuk tujuan tempahan</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Section 2 */}
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                    2. Bagaimana Kami Menggunakan Maklumat Anda
                                </h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>Maklumat yang dikumpul digunakan untuk:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Menyediakan dan menguruskan perkhidmatan platform</li>
                                        <li>Memproses tempahan dan pembayaran</li>
                                        <li>Menghantar notifikasi dan pengesahan</li>
                                        <li>Meningkatkan pengalaman pengguna</li>
                                        <li>Menyediakan sokongan pelanggan</li>
                                        <li>Menganalisis penggunaan platform untuk penambahbaikan</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Section 3 */}
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                    3. Perkongsian Maklumat
                                </h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>Kami tidak akan menjual atau menyewa maklumat peribadi anda kepada pihak ketiga. Maklumat hanya dikongsi dalam keadaan berikut:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Dengan penyedia perkhidmatan yang membantu operasi platform (contoh: hos pelayan, pemproses pembayaran)</li>
                                        <li>Apabila dikehendaki oleh undang-undang atau proses perundangan</li>
                                        <li>Untuk melindungi hak, harta, atau keselamatan Tempah Studio dan pengguna kami</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Section 4 */}
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                    4. Keselamatan Data
                                </h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>
                                        Kami menggunakan langkah keselamatan yang sesuai untuk melindungi maklumat peribadi anda daripada akses,
                                        pengubahsuaian, pendedahan, atau pemusnahan yang tidak dibenarkan. Ini termasuk:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Enkripsi data semasa penghantaran dan penyimpanan</li>
                                        <li>Akses terhad kepada maklumat peribadi</li>
                                        <li>Backup data secara berkala</li>
                                        <li>Pemantauan keselamatan berterusan</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Section 5 */}
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                    5. Hak Anda
                                </h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>Anda mempunyai hak untuk:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Mengakses maklumat peribadi yang kami simpan tentang anda</li>
                                        <li>Meminta pembetulan maklumat yang tidak tepat</li>
                                        <li>Meminta pemadaman maklumat peribadi anda</li>
                                        <li>Membantah pemprosesan maklumat peribadi anda</li>
                                        <li>Meminta pemindahan data anda</li>
                                    </ul>
                                    <p className="mt-4">
                                        Untuk melaksanakan hak-hak ini, sila hubungi kami di <a href="mailto:admin@tempahstudio.com" className="text-primary hover:underline">admin@tempahstudio.com</a>
                                    </p>
                                </div>
                            </div>

                            {/* Section 6 */}
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                    6. Cookies dan Teknologi Penjejakan
                                </h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>
                                        Kami menggunakan cookies dan teknologi penjejakan yang serupa untuk meningkatkan pengalaman anda di platform kami.
                                        Anda boleh mengawal penggunaan cookies melalui tetapan pelayar anda.
                                    </p>
                                </div>
                            </div>

                            {/* Section 7 */}
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                    7. Perubahan kepada Dasar Privasi
                                </h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>
                                        Kami mungkin mengemaskini Dasar Privasi ini dari semasa ke semasa. Sebarang perubahan akan dipaparkan di halaman ini
                                        dengan tarikh "Kemas kini terakhir" yang dikemaskini. Kami menggalakkan anda untuk menyemak dasar ini secara berkala.
                                    </p>
                                </div>
                            </div>

                            {/* Section 8 */}
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                    8. Hubungi Kami
                                </h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>
                                        Jika anda mempunyai sebarang soalan atau kebimbangan mengenai Dasar Privasi ini, sila hubungi kami:
                                    </p>
                                    <div className="bg-muted/50 rounded-lg p-6 mt-4">
                                        <p><strong className="text-foreground">Email:</strong> admin@tempahstudio.com</p>
                                        <p><strong className="text-foreground">WhatsApp:</strong> +60 11-2994 7089</p>
                                        <p><strong className="text-foreground">SSM:</strong> 003795517-T</p>
                                    </div>
                                </div>
                            </div>

                            {/* Acknowledgment */}
                            <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
                                <p className="text-sm text-muted-foreground">
                                    Dengan menggunakan platform Tempah Studio, anda bersetuju dengan Dasar Privasi ini.
                                    Jika anda tidak bersetuju dengan dasar ini, sila jangan gunakan perkhidmatan kami.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
