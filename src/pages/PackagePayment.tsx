import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
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
import { createPackagePayment, uploadReceipt } from '@/services/packagePaymentService';
import type { Package } from '@/types/database';
import type { PaymentSettings } from '@/services/paymentSettingsService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

export default function PackagePayment() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
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
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('qr');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [isResendingEmail, setIsResendingEmail] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState<string>('');

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

    // Trigger confetti when success dialog opens
    useEffect(() => {
        if (showSuccessDialog) {
            // Fire confetti from multiple angles
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

            const randomInRange = (min: number, max: number) => {
                return Math.random() * (max - min) + min;
            };

            const interval = setInterval(() => {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);

                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                });
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [showSuccessDialog]);

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

    const handleResendEmail = async () => {
        if (!registeredEmail) return;

        setIsResendingEmail(true);
        try {
            const { supabase } = await import('@/lib/supabase');
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: registeredEmail,
            });

            if (error) {
                console.error('❌ Resend email error:', error);
                toast({
                    title: 'Ralat',
                    description: 'Gagal menghantar semula emel pengesahan',
                    variant: 'destructive',
                });
            } else {
                console.log('✅ Verification email resent to:', registeredEmail);
                toast({
                    title: 'Berjaya',
                    description: 'Emel pengesahan telah dihantar semula!',
                });
            }
        } catch (error) {
            console.error('Error resending email:', error);
            toast({
                title: 'Ralat',
                description: 'Gagal menghantar semula emel',
                variant: 'destructive',
            });
        } finally {
            setIsResendingEmail(false);
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

        try {
            // Upload receipt first
            const uploadResult = await uploadReceipt(receiptFile);

            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Failed to upload receipt');
            }

            // Create payment record
            const paymentResult = await createPackagePayment({
                package_id: selectedPackage.id,
                package_name: selectedPackage.name,
                package_price: selectedPackage.price,
                studio_name: formData.studioName,
                full_name: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                payment_method: selectedPaymentMethod,
                receipt_url: uploadResult.url,
            });

            if (!paymentResult.success) {
                throw new Error(paymentResult.error || 'Failed to submit payment');
            }

            // Create account immediately with email verification required
            // Supabase will automatically send verification email
            const { supabase } = await import('@/lib/supabase');

            // Generate a temporary password that user will change after verification
            const tempPassword = `Temp${Math.random().toString(36).substring(2, 15)}!`;

            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: tempPassword,
                options: {
                    // Skip email verification since user already paid
                    // They can login immediately and set their password
                    emailRedirectTo: `${window.location.origin}/complete-registration`,
                    data: {
                        full_name: formData.fullName,
                        phone: formData.phone,
                        studio_name: formData.studioName,
                    }
                }
            });

            if (signUpError) {
                console.error('❌ SignUp Error:', signUpError);
                console.error('Error details:', {
                    message: signUpError.message,
                    status: signUpError.status,
                    name: signUpError.name
                });
                throw new Error('Gagal membuat akaun. Sila cuba lagi.');
            }

            console.log('✅ SignUp Success!');
            console.log('Auth Data:', {
                userId: authData?.user?.id,
                email: authData?.user?.email,
                emailConfirmedAt: authData?.user?.email_confirmed_at,
                identities: authData?.user?.identities,
                session: authData?.session ? 'Session created' : 'No session (email confirmation required)',
                userMetadata: authData?.user?.user_metadata
            });
            console.log('📊 Email Delivery Status:');
            console.log('  - Email sent to:', formData.email);
            console.log('  - Check Supabase Auth Logs for delivery confirmation');
            console.log('  - Log should show: event="mail.send" mail_type="confirmation"');

            // Check if email was sent or auto-confirmed
            if (authData?.user?.email_confirmed_at) {
                console.warn('⚠️ WARNING: Email was AUTO-CONFIRMED! This means:');
                console.warn('1. "Confirm email" toggle is DISABLED in Supabase Auth settings');
                console.warn('2. No verification email will be sent');
                console.warn('3. User can login immediately without verification');
            } else {
                console.log('📧 Email verification required - email should have been sent to:', formData.email);
                console.log('📝 User should check:');
                console.log('  - Inbox for verification email');
                console.log('  - Spam/Junk folder');
                console.log('  - Supabase Auth Logs for email sending status');
            }

            // Store payment data and temp password in localStorage for later
            localStorage.setItem('pendingRegistration', JSON.stringify({
                email: formData.email,
                fullName: formData.fullName,
                phone: formData.phone,
                studioName: formData.studioName,
                paymentId: paymentResult.payment?.id,
                tempPassword, // Store temp password so user can set new one
                timestamp: Date.now(),
            }));

            console.log('Account created. Verification email sent by Supabase.');

            // Store email for resend functionality
            setRegisteredEmail(formData.email);

            // Show success dialog
            setShowSuccessDialog(true);

        } catch (error: any) {
            console.error('Error submitting payment:', error);
            toast({
                title: 'Ralat',
                description: error.message || 'Gagal menghantar pembayaran. Sila cuba lagi.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
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
                                    <Badge
                                        className={`text-lg font-semibold px-4 py-2 w-fit ${selectedPackage.name.toLowerCase() === 'gold'
                                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white'
                                            : selectedPackage.name.toLowerCase() === 'silver'
                                                ? 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white'
                                                : selectedPackage.name.toLowerCase() === 'platinum'
                                                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
                                                    : 'bg-primary text-primary-foreground'
                                            }`}
                                    >
                                        {selectedPackage.name}
                                    </Badge>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-primary">RM {selectedPackage.price}</span>
                                    </div>
                                </CardHeader>
                            </Card>

                            {/* Payment Info */}
                            <Card className="mt-6 bg-white dark:bg-gray-900">
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
                                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-3">
                                        <p className="text-sm text-blue-800 dark:text-blue-200">
                                            <span className="font-semibold">Nota:</span> Pembayaran melalui QR dan Direct Bank Transfer akan memerlukan anda untuk upload bukti pembayaran
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Tabs value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod} className="w-full">
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
                                                        Dasar Privasi Tempah Studio
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

            {/* Success Dialog */}
            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent className="bg-white dark:bg-gray-900 shadow-2xl max-w-md backdrop-blur-sm">
                    <motion.div
                        className="flex flex-col items-center text-center space-y-6 py-4"
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            duration: 0.5
                        }}
                    >
                        <motion.img
                            src="/icons8-done.gif"
                            alt="Success"
                            className="w-32 h-32"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 15,
                                delay: 0.2
                            }}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <DialogHeader className="space-y-3">
                                <DialogTitle className="text-2xl font-bold">
                                    Pembayaran Berjaya!
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-2">
                                <p className="text-base text-muted-foreground">Terima kasih atas pembayaran anda.</p>
                                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-2">
                                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                                        📧 Sila Sahkan Emel Anda
                                    </p>
                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                        Kami telah menghantar emel pengesahan ke <strong>{formData.email}</strong>.
                                    </p>
                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                        Sila semak peti masuk anda dan klik pautan dalam emel untuk meneruskan pendaftaran akaun.
                                    </p>
                                    <p className="text-xs text-amber-700 dark:text-amber-300">
                                        Selepas mengesahkan emel, anda akan diarahkan untuk membuat kata laluan.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            className="w-full space-y-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Button
                                onClick={handleResendEmail}
                                variant="outline"
                                className="w-full"
                                size="lg"
                                disabled={isResendingEmail}
                            >
                                {isResendingEmail ? 'Menghantar...' : '📧 Hantar Semula Emel Pengesahan'}
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowSuccessDialog(false);
                                }}
                                className="w-full"
                                size="lg"
                            >
                                Tutup
                            </Button>
                        </motion.div>
                    </motion.div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
