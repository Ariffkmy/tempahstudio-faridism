import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailRedirect() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Mengesahkan emel anda...');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                // Get pending registration data from localStorage
                const pendingData = localStorage.getItem('pendingRegistration');

                if (!pendingData) {
                    setStatus('error');
                    setMessage('Tiada data pendaftaran dijumpai. Sila cuba lagi.');
                    return;
                }

                const registrationData = JSON.parse(pendingData);

                // Check if data is not expired (24 hours)
                const dataAge = Date.now() - registrationData.timestamp;
                if (dataAge > 24 * 60 * 60 * 1000) {
                    localStorage.removeItem('pendingRegistration');
                    setStatus('error');
                    setMessage('Pautan pendaftaran telah tamat tempoh. Sila cuba lagi.');
                    return;
                }

                setStatus('success');
                setMessage('Emel berjaya disahkan! Sila lengkapkan pendaftaran akaun anda.');

                // Redirect to account creation after 2 seconds
                setTimeout(() => {
                    navigate('/onboarding', {
                        state: {
                            fullName: registrationData.fullName,
                            email: registrationData.email,
                            phone: registrationData.phone,
                            studioName: registrationData.studioName,
                            emailVerified: true,
                        }
                    });
                }, 2000);

            } catch (error) {
                console.error('Verification error:', error);
                setStatus('error');
                setMessage('Ralat mengesahkan emel. Sila cuba lagi.');
            }
        };

        verifyEmail();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        {status === 'verifying' && (
                            <Loader2 className="h-16 w-16 text-primary animate-spin" />
                        )}
                        {status === 'success' && (
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                        )}
                        {status === 'error' && (
                            <XCircle className="h-16 w-16 text-destructive" />
                        )}
                    </div>
                    <CardTitle className="text-2xl">
                        {status === 'verifying' && 'Mengesahkan Emel'}
                        {status === 'success' && 'Emel Disahkan!'}
                        {status === 'error' && 'Ralat Pengesahan'}
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                        {message}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {status === 'success' && (
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                            <p className="text-sm text-green-800 dark:text-green-200">
                                Anda akan dialihkan ke halaman pendaftaran akaun dalam beberapa saat...
                            </p>
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="space-y-4">
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                                <p className="text-sm text-destructive">
                                    Sila hubungi sokongan jika masalah berterusan.
                                </p>
                            </div>
                            <Button
                                onClick={() => navigate('/package-payment')}
                                className="w-full"
                            >
                                Kembali ke Halaman Pembayaran
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
