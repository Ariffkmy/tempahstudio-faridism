import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Link } from 'react-router-dom';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-primary/5">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                            Soalan Lazim
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Jawapan kepada soalan-soalan yang kerap ditanya tentang Tempah Studio
                        </p>
                    </div>
                </section>

                {/* FAQ Content */}
                <section className="py-16 md:py-20">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* General Questions */}
                        <div className="mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Umum</h2>
                            <Accordion type="single" collapsible className="w-full space-y-4">
                                <AccordionItem value="item-1" className="bg-card rounded-lg border">
                                    <AccordionTrigger className="px-6 py-4">
                                        Apakah itu Tempah Studio?
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-4 text-muted-foreground">
                                        Tempah Studio adalah sistem pengurusan tempahan studio yang direka khas untuk pemilik studio raya di Malaysia.
                                        Platform ini membolehkan anda mengurus tempahan, pembayaran, pelanggan dan kalendar dengan lebih efisien.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-2" className="bg-card rounded-lg border">
                                    <AccordionTrigger className="px-6 py-4">
                                        Siapa yang sesuai menggunakan Tempah Studio?
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-4 text-muted-foreground">
                                        Tempah Studio sesuai untuk semua saiz studio - dari studio kecil dengan 1-2 layout hingga rantai studio dengan berbilang cawangan.
                                        Sistem kami fleksibel dan boleh disesuaikan mengikut keperluan perniagaan anda.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-3" className="bg-card rounded-lg border">
                                    <AccordionTrigger className="px-6 py-4">
                                        Berapa lama masa yang diperlukan untuk setup?
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-4 text-muted-foreground">
                                        Setelah pembayaran disahkan, pasukan kami akan membantu setup sistem jika perlu.
                                        Proses setup termasuk konfigurasi studio, layout, pakej, dan latihan penggunaan sistem.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>

                        {/* Booking & Payment */}
                        <div className="mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Tempahan & Pembayaran</h2>
                            <Accordion type="single" collapsible className="w-full space-y-4">
                                <AccordionItem value="item-4" className="bg-card rounded-lg border">
                                    <AccordionTrigger className="px-6 py-4">
                                        Adakah pembayaran selamat?
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-4 text-muted-foreground">
                                        Ya, semua pembayaran diproses terus ke bank anda. Kami tidak menyimpan maklumat pembayaran pelanggan.
                                        Sistem kami hanya memudahkan proses tempahan dan pengesahan pembayaran.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-5" className="bg-card rounded-lg border">
                                    <AccordionTrigger className="px-6 py-4">
                                        Bagaimana pelanggan boleh menempah slot masa?
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-4 text-muted-foreground">
                                        Pelanggan mengisi tempahan di link tempahan studio anda, pilih tarikh dan masa yang tersedia,
                                        pilih layout studio, dan buat pembayaran secara atas talian. Sistem akan menghantar pengesahan automatik.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-6" className="bg-card rounded-lg border">
                                    <AccordionTrigger className="px-6 py-4">
                                        Adakah tempahan akan masuk ke kalendar saya?
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-4 text-muted-foreground">
                                        Ya, semua tempahan yang sah akan diperbaharui secara automatik ke Google Calendar dan sistem kalendar dalaman.
                                        Anda akan menerima notifikasi serta-merta untuk setiap tempahan baharu.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-7" className="bg-card rounded-lg border">
                                    <AccordionTrigger className="px-6 py-4">
                                        Bagaimana jika ada pembatalan tempahan?
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-4 text-muted-foreground">
                                        Sebarang pembatalan tempahan akan dikendalikan secara manual oleh pihak studio.
                                        Kami akan membantu memudahkan proses ini melalui sistem notifikasi sahaja.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>

                        {/* Technical & Support */}
                        <div className="mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Teknikal & Sokongan</h2>
                            <Accordion type="single" collapsible className="w-full space-y-4">
                                <AccordionItem value="item-8" className="bg-card rounded-lg border">
                                    <AccordionTrigger className="px-6 py-4">
                                        Berapa ramai pengguna yang boleh mendaftar akaun di bawah studio yang sama?
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-4 text-muted-foreground">
                                        Maksimum dua akaun. Sebarang permintaan untuk akaun tambahan akan dikenakan caj tambahan.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-9" className="bg-card rounded-lg border">
                                    <AccordionTrigger className="px-6 py-4">
                                        Bagaimana jika saya menghadapi masalah teknikal?
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-4 text-muted-foreground">
                                        Pasukan sokongan kami tersedia untuk membantu. Anda boleh hubungi kami melalui WhatsApp, email,
                                        atau sistem sokongan dalam dashboard admin anda.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-10" className="bg-card rounded-lg border">
                                    <AccordionTrigger className="px-6 py-4">
                                        Adakah data saya selamat?
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-4 text-muted-foreground">
                                        Ya, semua data disimpan dengan selamat dan di-backup secara berkala. Kami menggunakan teknologi enkripsi
                                        untuk melindungi maklumat sensitif anda dan pelanggan anda.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-11" className="bg-card rounded-lg border">
                                    <AccordionTrigger className="px-6 py-4">
                                        Bolehkah saya akses sistem dari telefon?
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-4 text-muted-foreground">
                                        Ya, sistem Tempah Studio adalah responsive dan boleh diakses dari mana-mana peranti - komputer, tablet, atau telefon pintar.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>

                        {/* Pricing & Packages */}
                        <div className="mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Harga & Pakej</h2>
                            <Accordion type="single" collapsible className="w-full space-y-4">
                                <AccordionItem value="item-12" className="bg-card rounded-lg border">
                                    <AccordionTrigger className="px-6 py-4">
                                        Adakah ada caj tersembunyi?
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-4 text-muted-foreground">
                                        Tidak. Harga yang tertera adalah harga sebenar. Tiada caj tambahan atau tersembunyi.
                                        Semua pakej termasuk setup percuma dan sokongan pelanggan.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-13" className="bg-card rounded-lg border">
                                    <AccordionTrigger className="px-6 py-4">
                                        Bolehkah saya tukar pakej kemudian?
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-4 text-muted-foreground">
                                        Ya, anda boleh upgrade atau downgrade pakej pada bila-bila masa mengikut keperluan perniagaan anda.
                                        Hubungi kami untuk bantuan menukar pakej.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-14" className="bg-card rounded-lg border">
                                    <AccordionTrigger className="px-6 py-4">
                                        Bagaimana cara pembayaran pakej?
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-4 text-muted-foreground">
                                        Pembayaran pakej boleh dibuat melalui pindahan bank. Setelah pembayaran dibuat, upload bukti pembayaran
                                        dan anda boleh mula untuk setup studio anda.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-15" className="bg-card rounded-lg border">
                                    <AccordionTrigger className="px-6 py-4">
                                        Adakah ada tempoh percubaan percuma?
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-4 text-muted-foreground">
                                        Hubungi kami untuk maklumat lanjut tentang tempoh percubaan atau demo sistem.
                                        Kami boleh mengaturkan sesi demo untuk tunjukkan bagaimana sistem berfungsi.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>

                        {/* CTA */}
                        <div className="text-center mt-16 p-8 bg-gradient-to-br from-primary/5 to-background rounded-xl">
                            <h3 className="text-2xl font-bold text-foreground mb-4">
                                Masih ada soalan lain?
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                Jangan ragu untuk hubungi kami. Pasukan kami sedia membantu!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a
                                    href="https://wa.me/601129947089"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                                >
                                    Hubungi Kami
                                </a>
                                <Link
                                    to="/contact-support"
                                    className="border border-border bg-background hover:bg-muted/50 px-8 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Sokongan Pelanggan
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default FAQ;
