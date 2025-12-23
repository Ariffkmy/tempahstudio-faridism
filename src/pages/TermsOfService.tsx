import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-primary/5">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                            Terma Perkhidmatan
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
                                    Selamat datang ke Tempah Studio. Dengan mengakses dan menggunakan platform kami, anda bersetuju untuk mematuhi
                                    dan terikat dengan Terma Perkhidmatan berikut. Sila baca dengan teliti sebelum menggunakan perkhidmatan kami.
                                </p>
                            </div>

                            {/* Section 1 */}
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                    1. Penerimaan Terma
                                </h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>
                                        Dengan mendaftar dan menggunakan Tempah Studio, anda bersetuju untuk terikat dengan terma dan syarat ini.
                                        Jika anda tidak bersetuju dengan mana-mana bahagian terma ini, anda tidak boleh menggunakan perkhidmatan kami.
                                    </p>
                                </div>
                            </div>

                            {/* Section 2 */}
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                    2. Perihalan Perkhidmatan
                                </h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>
                                        Tempah Studio menyediakan platform pengurusan tempahan studio yang membolehkan pemilik studio:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Mengurus tempahan dan kalendar studio</li>
                                        <li>Memproses pembayaran pelanggan</li>
                                        <li>Mengurus maklumat pelanggan</li>
                                        <li>Menerima notifikasi dan laporan</li>
                                        <li>Integrasi dengan Google Calendar</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Section 3 */}
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                    3. Pendaftaran Akaun
                                </h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>Untuk menggunakan perkhidmatan kami, anda mesti:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Menyediakan maklumat yang tepat dan lengkap semasa pendaftaran</li>
                                        <li>Mengekalkan keselamatan kata laluan akaun anda</li>
                                        <li>Memberitahu kami dengan segera jika terdapat penggunaan akaun yang tidak dibenarkan</li>
                                        <li>Bertanggungjawab untuk semua aktiviti yang berlaku di bawah akaun anda</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Section 4 */}
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                    4. Pembayaran dan Bayaran
                                </h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>Terma pembayaran:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Pembayaran dibuat melalui pindahan bank</li>
                                        <li>Akaun akan diaktifkan selepas pembayaran disahkan</li>
                                        <li>Tiada bayaran balik untuk pembayaran yang telah dibuat</li>
                                        <li>Harga pakej boleh berubah dengan notis terlebih dahulu</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Section 5 */}
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                    5. Penggunaan Platform
                                </h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>Anda bersetuju untuk TIDAK:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Menggunakan platform untuk tujuan yang menyalahi undang-undang</li>
                                        <li>Cuba mengakses bahagian platform yang tidak dibenarkan</li>
                                        <li>Mengganggu atau merosakkan operasi platform</li>
                                        <li>Menyalin, mengubah suai, atau mengedarkan kandungan platform tanpa kebenaran</li>
                                        <li>Menggunakan platform untuk menghantar spam atau kandungan berbahaya</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Section 6 */}
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                    6. Hak Harta Intelek
                                </h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>
                                        Semua kandungan, ciri, dan fungsi platform Tempah Studio adalah hak milik eksklusif kami dan dilindungi
                                        oleh undang-undang hak cipta, tanda dagangan, dan hak harta intelek lain.
                                    </p>
                                </div>
                            </div>

                            {/* Section 7 */}
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                    7. Penafian WhatsApp
                                </h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>
                                        Tempah Studio adalah platform pengurusan tempahan studio yang bebas dan tidak berafiliasi dengan,
                                        disahkan oleh, atau ditaja oleh WhatsApp atau Meta Platforms, Inc. Sebarang integrasi dengan WhatsApp
                                        adalah melalui API rasmi dan tertakluk kepada terma perkhidmatan WhatsApp.
                                    </p>
                                </div>
                            </div>

                            {/* Section 8 */}
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                    8. Had Liabiliti
                                </h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>
                                        Tempah Studio tidak bertanggungjawab untuk:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Kehilangan data akibat kegagalan teknikal</li>
                                        <li>Gangguan perkhidmatan yang di luar kawalan kami</li>
                                        <li>Kerugian perniagaan atau kehilangan keuntungan</li>
                                        <li>Tindakan atau kelalaian pihak ketiga</li>
                                    </ul>
                                    <p className="mt-4">
                                        Platform disediakan "sebagaimana adanya" tanpa sebarang jaminan, sama ada tersurat atau tersirat.
                                    </p>
                                </div>
                            </div>

                            {/* Section 9 */}
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                    9. Penamatan
                                </h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>
                                        Kami berhak untuk menggantung atau menamatkan akaun anda jika:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Anda melanggar mana-mana terma perkhidmatan ini</li>
                                        <li>Pembayaran tidak dibuat mengikut jadual</li>
                                        <li>Terdapat aktiviti yang mencurigakan atau penipuan</li>
                                        <li>Atas permintaan anda sendiri</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Section 10 */}
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                    10. Perubahan kepada Terma
                                </h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>
                                        Kami berhak untuk mengubah suai terma ini pada bila-bila masa. Perubahan akan berkuat kuasa sebaik sahaja
                                        dipaparkan di halaman ini. Penggunaan berterusan platform selepas perubahan bermakna anda menerima terma yang dikemaskini.
                                    </p>
                                </div>
                            </div>

                            {/* Section 11 */}
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                    11. Undang-undang yang Mengawal
                                </h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>
                                        Terma Perkhidmatan ini dikawal oleh dan ditafsirkan mengikut undang-undang Malaysia.
                                        Sebarang pertikaian akan diselesaikan di mahkamah Malaysia.
                                    </p>
                                </div>
                            </div>

                            {/* Section 12 */}
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                                    12. Hubungi Kami
                                </h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>
                                        Jika anda mempunyai sebarang soalan mengenai Terma Perkhidmatan ini, sila hubungi kami:
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
                                    Dengan menggunakan platform Tempah Studio, anda mengakui bahawa anda telah membaca, memahami,
                                    dan bersetuju untuk terikat dengan Terma Perkhidmatan ini.
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

export default TermsOfService;
