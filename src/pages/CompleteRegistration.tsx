import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function CompleteRegistration() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { register, login } = useAuth();

    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [studioName, setStudioName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        const checkVerification = async () => {
            const { supabase } = await import('@/lib/supabase');

            // Check if we have a session from email verification
            // Supabase adds hash params when redirecting from email
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const error = hashParams.get('error');
            const errorCode = hashParams.get('error_code');
            const errorDescription = hashParams.get('error_description');

            // Check if there's an error in the URL (like OTP expired)
            if (error) {
                console.warn('Email verification link error:', {
                    error,
                    errorCode,
                    errorDescription
                });

                // Check if user is already verified despite the error
                const { data: { user } } = await supabase.auth.getUser();

                if (user && user.email_confirmed_at) {
                    console.log('✅ User is already verified, proceeding with registration');
                    // Clear the error from URL
                    window.history.replaceState(null, '', window.location.pathname);

                    // Get pending registration data
                    const pendingData = localStorage.getItem('pendingRegistration');
                    if (pendingData) {
                        const registrationData = JSON.parse(pendingData);
                        setEmail(registrationData.email);
                        setFullName(registrationData.fullName);
                        setPhone(registrationData.phone || '');
                        setStudioName(registrationData.studioName);
                        setIsVerified(true);

                        toast({
                            title: 'Emel Telah Disahkan',
                            description: 'Sila buat kata laluan untuk akaun anda.',
                        });
                        return;
                    }
                }

                // If user is not verified, show error
                toast({
                    title: 'Pautan Tidak Sah',
                    description: errorCode === 'otp_expired'
                        ? 'Pautan pengesahan telah tamat tempoh. Sila minta pautan baharu.'
                        : 'Pautan pengesahan tidak sah. Sila cuba lagi.',
                    variant: 'destructive',
                });

                // Clear the error from URL
                window.history.replaceState(null, '', window.location.pathname);
                return;
            }

            if (accessToken) {
                // Set the session from the hash params
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: hashParams.get('refresh_token') || '',
                });

                if (sessionError) {
                    console.error('Failed to set session:', sessionError);
                    toast({
                        title: 'Ralat',
                        description: 'Gagal mengesahkan sesi. Sila cuba lagi.',
                        variant: 'destructive',
                    });
                    return;
                }

                // Clear the hash from URL
                window.history.replaceState(null, '', window.location.pathname);
            }

            // Get pending registration data from localStorage
            const pendingData = localStorage.getItem('pendingRegistration');

            if (!pendingData) {
                toast({
                    title: 'Ralat',
                    description: 'Tiada data pendaftaran dijumpai. Sila buat pembayaran terlebih dahulu.',
                    variant: 'destructive',
                });
                navigate('/package-payment');
                return;
            }

            const registrationData = JSON.parse(pendingData);

            // Check if data is not expired (24 hours)
            const dataAge = Date.now() - registrationData.timestamp;
            if (dataAge > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('pendingRegistration');
                toast({
                    title: 'Ralat',
                    description: 'Pautan pendaftaran telah tamat tempoh. Sila buat pembayaran semula.',
                    variant: 'destructive',
                });
                navigate('/package-payment');
                return;
            }

            // Check if user is authenticated
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // User is not logged in, but they might be verified
                // Try to auto-login with temp password if available
                const tempPassword = registrationData.tempPassword;

                if (tempPassword) {
                    console.log('🔐 Attempting auto-login with temp password...');
                    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                        email: registrationData.email,
                        password: tempPassword,
                    });

                    if (loginError) {
                        console.error('Auto-login failed:', loginError);
                        toast({
                            title: 'Sila Log Masuk',
                            description: 'Emel anda telah disahkan. Sila log masuk untuk meneruskan.',
                        });
                        // Redirect to login with email pre-filled
                        navigate(`/admin/login?email=${encodeURIComponent(registrationData.email)}`);
                        return;
                    }

                    console.log('✅ Auto-login successful');
                    // Continue with the flow
                } else {
                    toast({
                        title: 'Ralat',
                        description: 'Sila klik pautan pengesahan dalam emel anda terlebih dahulu.',
                        variant: 'destructive',
                    });
                    return;
                }
            }

            // Re-fetch user after potential auto-login
            const { data: { user: currentUser } } = await supabase.auth.getUser();

            if (!currentUser) {
                toast({
                    title: 'Ralat',
                    description: 'Gagal mendapatkan maklumat pengguna. Sila cuba lagi.',
                    variant: 'destructive',
                });
                return;
            }

            if (!currentUser.email_confirmed_at) {
                toast({
                    title: 'Emel Belum Disahkan',
                    description: 'Sila sahkan emel anda terlebih dahulu dengan mengklik pautan dalam emel.',
                    variant: 'destructive',
                });
                return;
            }

            // Pre-fill form data
            setEmail(registrationData.email);
            setFullName(registrationData.fullName);
            setPhone(registrationData.phone || '');
            setStudioName(registrationData.studioName);
            setIsVerified(true);
        };

        checkVerification();
    }, [navigate, toast]);

    const validateForm = (): string | null => {
        if (!email.trim()) {
            return 'Sila masukkan emel';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return 'Sila masukkan emel yang sah';
        }
        if (password.length < 6) {
            return 'Kata laluan mestilah sekurang-kurangnya 6 aksara';
        }
        if (password !== confirmPassword) {
            return 'Kata laluan tidak sepadan';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            toast({
                title: 'Ralat Pengesahan',
                description: validationError,
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const { supabase } = await import('@/lib/supabase');

            // Small delay to ensure session is fully set
            await new Promise(resolve => setTimeout(resolve, 500));

            // Update user's password (they're already logged in from email verification)
            const { error: passwordError } = await supabase.auth.updateUser({
                password: password,
            });

            if (passwordError) {
                console.error('Password update error:', passwordError);
                throw new Error(`Gagal menetapkan kata laluan: ${passwordError.message}`);
            }

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('Sesi tamat tempoh. Sila cuba lagi.');
            }

            // Get pending registration data to get studio name
            const pendingData = localStorage.getItem('pendingRegistration');
            const registrationData = pendingData ? JSON.parse(pendingData) : null;

            // Fetch package_name from package_payments table
            let packageName = null;
            try {
                const { data: paymentData } = await supabase
                    .from('package_payments')
                    .select('package_name')
                    .eq('email', email)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (paymentData) {
                    packageName = paymentData.package_name;
                    console.log('Found package from payment:', packageName);
                }
            } catch (err) {
                console.error('Error looking up package payment during registration:', err);
            }

            // Step 1: Create the studio first
            const DEFAULT_COMPANY_ID = 'a0000000-0000-0000-0000-000000000001';

            const { data: newStudio, error: studioError } = await supabase
                .from('studios')
                .insert({
                    company_id: DEFAULT_COMPANY_ID,
                    name: studioName,
                    email: email, // Store email for package lookup fallback
                    is_active: true,
                    package_name: packageName, // Set the package name from payment
                })
                .select()
                .single();

            if (studioError || !newStudio) {
                console.error('Failed to create studio:', studioError);
                throw new Error('Gagal membuat studio. Sila cuba lagi.');
            }

            console.log('Studio created successfully:', newStudio.id, 'with package:', packageName);

            // Step 2: Create admin_users record with studio_id
            const { error: dbError } = await supabase
                .from('admin_users')
                .insert({
                    auth_user_id: user.id,
                    studio_id: newStudio.id, // Link to the newly created studio
                    email: email,
                    full_name: fullName,
                    phone: phone || null,
                    role: 'admin',
                    onboarding_completed: false,
                });

            if (dbError) {
                console.error('Failed to create admin_users record:', dbError);
                // Rollback: Delete the created studio
                await supabase.from('studios').delete().eq('id', newStudio.id);
                throw new Error('Gagal menyimpan maklumat admin. Sila cuba lagi.');
            }

            console.log('Admin user created and linked to studio successfully');

            // Clear pending registration data
            localStorage.removeItem('pendingRegistration');

            toast({
                title: 'Pendaftaran Berjaya!',
                description: 'Anda akan dialihkan ke dashboard.',
            });

            // Redirect to dashboard (user is already logged in)
            setTimeout(() => {
                navigate('/admin');
            }, 1000);

        } catch (error: any) {
            console.error('Registration error:', error);
            toast({
                title: 'Ralat',
                description: error.message || 'Gagal mendaftar. Sila cuba lagi.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isVerified) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Memuatkan...</CardTitle>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Lengkapkan Pendaftaran</CardTitle>
                    <CardDescription className="text-base mt-2">
                        Emel anda telah disahkan. Sila buat kata laluan untuk akaun anda.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email (Read-only) */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Emel</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                Emel telah disahkan ✓
                            </p>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Kata Laluan *</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Sekurang-kurangnya 6 aksara
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Sahkan Kata Laluan *</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Mendaftar...' : 'Lengkapkan Pendaftaran'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        <p>Sudah mempunyai akaun?{' '}
                            <a href="/admin/login" className="text-primary hover:underline">
                                Log Masuk
                            </a>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
