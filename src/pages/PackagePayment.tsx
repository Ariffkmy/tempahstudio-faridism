import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { CheckCircle2, ArrowLeft, Building2, Mail, Phone, User, Copy, Check, QrCode, CreditCard, Upload, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPackageBySlug } from '@/services/packageService';
import { getPaymentSettings } from '@/services/paymentSettingsService';
import type { Package } from '@/types/database';
import type { PaymentSettings } from '@/services/paymentSettingsService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PackagePayment() {
    const [searchParams] = useSearchParams();
    const packageSlug = searchParams.get('package') || 'silver';
    const { toast } = useToast();

    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [copiedAccount, setCopiedAccount] = useState(false);

    const [formData, setFormData] = useState({
        studioName: '',
        fullName: '',
        email: '',
        phone: '',
    });

    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch package and payment settings data on mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch package
                const pkg = await getPackageBySlug(packageSlug);
                setSelectedPackage(pkg);

                // Fetch payment settings
                const paymentResult = await getPaymentSettings();
                if (paymentResult.success && paymentResult.settings) {
                    setPaymentSettings(paymentResult.settings);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load payment information',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [packageSlug, toast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleCopyAccount = () => {
        if (paymentSettings?.account_number) {
            navigator.clipboard.writeText(paymentSettings.account_number);
            setCopiedAccount(true);
            toast({
                title: 'Disalin!',
                description: 'Nombor akaun telah disalin',
            });
            setTimeout(() => setCopiedAccount(false), 2000);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setReceiptFile(e.target.files[0]);
        }
    };

    const handleDownloadQR = async () => {
        if (!paymentSettings?.qr_code_image) return;

        try {
            const response = await fetch(paymentSettings.qr_code_image);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'qr-code-pembayaran.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast({
                title: 'Berjaya',
                description: 'QR Code telah dimuat turun',
            });
        } catch (error) {
            console.error('Error downloading QR code:', error);
            toast({
                title: 'Ralat',
                description: 'Gagal memuat turun QR Code',
                variant: 'destructive',
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.studioName || !formData.fullName || !formData.email || !formData.phone) {
            toast({
                title: 'Ralat',
                description: 'Sila isi semua maklumat yang diperlukan',
                variant: 'destructive',
            });
            return;
        }

        if (!receiptFile) {
            toast({
                title: 'Resit Diperlukan',
                description: 'Sila lampirkan resit pembayaran anda sebelum menghantar',
                variant: 'destructive',
            });
            return;
        }

        if (!agreedToTerms) {
            toast({
                title: 'Persetujuan Diperlukan',
                description: 'Sila bersetuju dengan Terma & Syarat dan Dasar Privasi',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        // Simulate payment processing
        // In production, this would upload receipt and send notification
        setTimeout(() => {
            toast({
                title: 'Terima kasih!',
                description: 'Kami akan menghubungi anda tidak lama lagi untuk meneruskan pembayaran.',
            });
            setIsSubmitting(false);

            // You can redirect to a confirmation page or admin registration
            // navigate('/admin/register');
        }, 2000);
    };

    // Show loading state while fetching package
    if (loading || !selectedPackage) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Memuatkan maklumat pakej...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-24">
                <div className="max-w-3xl mx-auto">
                    {/* Back Button */}
                    <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke Halaman Utama
                    </Link>

                    <div className="space-y-8">
                        {/* Package Summary */}
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Pembayaran Pakej</h1>
                            <p className="text-muted-foreground mb-8">
                                Lengkapkan maklumat anda untuk meneruskan pembayaran
                            </p>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-2xl">{selectedPackage.name}</CardTitle>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-primary">RM {selectedPackage.price}</span>
                                    </div>
                                </CardHeader>
                            </Card>

                            {/* Payment Info */}
                            <Card className="mt-6 bg-muted/50">
                                <CardContent className="pt-6">
                                    <h3 className="font-semibold mb-3">Maklumat Pembayaran</h3>
                                    <div className="space-y-2 text-sm">
                                        <p className="flex justify-between">
                                            <span className="text-muted-foreground">Harga Pakej:</span>
                                            <span className="font-medium">RM {selectedPackage.price}</span>
                                        </p>
                                        <p className="flex justify-between">
                                            <span className="text-muted-foreground">Setup Fee:</span>
                                            <span className="font-medium text-green-600">PERCUMA</span>
                                        </p>
                                        <div className="border-t pt-2 mt-2">
                                            <p className="flex justify-between text-base font-bold">
                                                <span>Jumlah:</span>
                                                <span className="text-primary">RM {selectedPackage.price}</span>
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Payment Methods */}
                        <div>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Kaedah Pembayaran</CardTitle>
                                    <CardDescription>
                                        Pilih kaedah pembayaran yang sesuai
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Tabs defaultValue="qr" className="w-full">
                                        <TabsList className="grid w-full grid-cols-3">
                                            <TabsTrigger value="qr">
                                                <QrCode className="h-4 w-4 mr-2" />
                                                QR Code
                                            </TabsTrigger>
                                            <TabsTrigger value="transfer">
                                                <CreditCard className="h-4 w-4 mr-2" />
                                                Transfer
                                            </TabsTrigger>
                                            <TabsTrigger value="fpx" disabled={!paymentSettings?.fpx_enabled}>
                                                <CreditCard className="h-4 w-4 mr-2" />
                                                FPX
                                            </TabsTrigger>
                                        </TabsList>

                                        {/* QR Code Payment */}
                                        <TabsContent value="qr" className="space-y-4">
                                            <div className="text-center space-y-4">
                                                {paymentSettings?.qr_code_image ? (
                                                    <>
                                                        <div className="bg-muted/50 p-6 rounded-lg inline-block">
                                                            <img
                                                                src={paymentSettings.qr_code_image}
                                                                alt="QR Code Pembayaran"
                                                                className="w-64 h-64 object-contain mx-auto"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-sm text-muted-foreground">
                                                                Imbas QR code di atas untuk membuat pembayaran
                                                            </p>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={handleDownloadQR}
                                                                className="gap-2"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                                Muat Turun QR Code
                                                            </Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="bg-muted/50 p-12 rounded-lg">
                                                        <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                                        <p className="text-sm text-muted-foreground">
                                                            QR Code belum dikonfigurasi
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>

                                        {/* Direct Transfer Payment */}
                                        <TabsContent value="transfer" className="space-y-4">
                                            <div className="space-y-4">
                                                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground">Nama Bank</Label>
                                                        <p className="font-medium">{paymentSettings?.bank_name || 'Tidak ditetapkan'}</p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground">Nombor Akaun</Label>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium font-mono">{paymentSettings?.account_number || 'Tidak ditetapkan'}</p>
                                                            {paymentSettings?.account_number && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={handleCopyAccount}
                                                                    className="h-8"
                                                                >
                                                                    {copiedAccount ? (
                                                                        <Check className="h-4 w-4 text-green-500" />
                                                                    ) : (
                                                                        <Copy className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground">Nama Pemilik Akaun</Label>
                                                        <p className="font-medium">{paymentSettings?.account_owner_name || 'Tidak ditetapkan'}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Sila transfer jumlah <span className="font-semibold text-primary">RM {selectedPackage.price}</span> ke akaun di atas
                                                </p>
                                            </div>
                                        </TabsContent>

                                        {/* FPX Payment */}
                                        <TabsContent value="fpx" className="space-y-4">
                                            <div className="text-center space-y-4">
                                                <div className="bg-muted/50 p-12 rounded-lg">
                                                    <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                                    <p className="text-sm text-muted-foreground mb-4">
                                                        Pembayaran FPX akan tersedia tidak lama lagi
                                                    </p>
                                                    <Button disabled className="w-full">
                                                        Bayar dengan FPX
                                                    </Button>
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>

                                    {/* Contact Information Form */}
                                    <form onSubmit={handleSubmit} className="space-y-6 mt-6 pt-6 border-t">
                                        <div className="space-y-4">
                                            <h3 className="font-semibold">Maklumat Anda</h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="studioName">
                                                        Nama Studio <span className="text-destructive">*</span>
                                                    </Label>
                                                    <Input
                                                        id="studioName"
                                                        name="studioName"
                                                        placeholder="Studio Raya Damansara"
                                                        value={formData.studioName}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="fullName">
                                                        Nama Penuh <span className="text-destructive">*</span>
                                                    </Label>
                                                    <Input
                                                        id="fullName"
                                                        name="fullName"
                                                        placeholder="Nama penuh anda"
                                                        value={formData.fullName}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="email">
                                                        Email <span className="text-destructive">*</span>
                                                    </Label>
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        placeholder="email@example.com"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="phone">
                                                        Nombor Telefon <span className="text-destructive">*</span>
                                                    </Label>
                                                    <Input
                                                        id="phone"
                                                        name="phone"
                                                        type="tel"
                                                        placeholder="+60123456789"
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {/* Receipt Upload */}
                                            <div className="space-y-2">
                                                <Label htmlFor="receipt">
                                                    Muat Naik Resit Pembayaran <span className="text-destructive">*</span>
                                                </Label>
                                                <div className="flex items-center gap-4">
                                                    <Input
                                                        id="receipt"
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        onChange={handleFileChange}
                                                        className="flex-1"
                                                        required
                                                    />
                                                    {receiptFile && (
                                                        <div className="flex items-center gap-2 text-sm text-green-600">
                                                            <Check className="h-4 w-4" />
                                                            {receiptFile.name}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Format yang diterima: JPG, PNG, PDF (Maks 5MB)
                                                </p>
                                            </div>
                                        </div>

                                        {/* Terms and Conditions Checkbox */}
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                id="terms"
                                                checked={agreedToTerms}
                                                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                                                className="mt-1"
                                            />
                                            <label
                                                htmlFor="terms"
                                                className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
                                            >
                                                Saya bersetuju dengan{' '}
                                                {paymentSettings?.terms_pdf ? (
                                                    <a
                                                        href={paymentSettings.terms_pdf}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline"
                                                    >
                                                        Terma & Syarat
                                                    </a>
                                                ) : (
                                                    <span className="text-primary">Terma & Syarat</span>
                                                )}{' '}
                                                dan{' '}
                                                {paymentSettings?.privacy_policy_pdf ? (
                                                    <a
                                                        href={paymentSettings.privacy_policy_pdf}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline"
                                                    >
                                                        Dasar Privasi
                                                    </a>
                                                ) : (
                                                    <span className="text-primary">Dasar Privasi</span>
                                                )}
                                                <span className="text-destructive ml-1">*</span>
                                            </label>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            size="lg"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Menghantar...' : 'Hantar Maklumat & Resit'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main >

            <Footer />
        </div >
    );
}
