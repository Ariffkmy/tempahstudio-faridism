import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/lib/supabase';

const AdminResetPassword = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const isMobile = useIsMobile();

    // Form state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [hasValidToken, setHasValidToken] = useState(false);

    // Check if we have a valid recovery token
    useEffect(() => {
        const checkRecoveryToken = async () => {
            try {
                // Get the session which should contain the recovery token
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error || !session) {
                    toast({
                        title: 'Pautan Tidak Sah',
                        description: 'Pautan tetapan semula kata laluan tidak sah atau telah tamat tempoh. Sila minta pautan baharu.',
                        variant: 'destructive',
                    });
                    setTimeout(() => navigate('/admin/login'), 3000);
                    return;
                }

                setHasValidToken(true);
            } catch (error) {
                console.error('Error checking recovery token:', error);
                toast({
                    title: 'Ralat',
                    description: 'Gagal mengesahkan pautan tetapan semula kata laluan',
                    variant: 'destructive',
                });
                setTimeout(() => navigate('/admin/login'), 3000);
            }
        };

        checkRecoveryToken();
    }, [navigate, toast]);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!newPassword.trim() || !confirmPassword.trim()) {
            toast({
                title: 'Ralat',
                description: 'Sila masukkan kata laluan baharu dan pengesahan',
                variant: 'destructive',
            });
            return;
        }

        if (newPassword.length < 6) {
            toast({
                title: 'Ralat',
                description: 'Kata laluan mestilah sekurang-kurangnya 6 aksara',
                variant: 'destructive',
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: 'Ralat',
                description: 'Kata laluan tidak sepadan',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Update the password
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                throw error;
            }

            setIsSuccess(true);
            toast({
                title: 'Berjaya!',
                description: 'Kata laluan anda telah berjaya ditukar',
            });

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/admin/login');
            }, 2000);
        } catch (error: any) {
            console.error('Password reset error:', error);
            toast({
                title: 'Gagal',
                description: error.message || 'Gagal menukar kata laluan. Sila cuba lagi.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!hasValidToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
                <div className="w-full max-w-sm">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Mengesahkan pautan...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
                <div className="w-full max-w-sm">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center space-y-4">
                                <div className="flex justify-center">
                                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Kata Laluan Ditukar!</h3>
                                    <p className="text-muted-foreground text-sm">
                                        Kata laluan anda telah berjaya ditukar. Anda akan dialihkan ke halaman log masuk...
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-sm">
                {/* Logo & Header */}
                <div className={`text-center ${isMobile ? 'mb-6' : 'mb-8'}`}>
                    <Link to="/" className="inline-flex items-center gap-2 mb-4">
                        <img
                            src="/image.png"
                            alt="Raya Studio Logo"
                            style={{ width: isMobile ? '65px' : '77px', height: isMobile ? '37px' : '44px' }}
                        />
                    </Link>
                    <h1 className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`}>Tetapkan Semula Kata Laluan</h1>
                    <p className="text-muted-foreground text-sm">Masukkan kata laluan baharu anda</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Kata Laluan Baharu</CardTitle>
                        <CardDescription>
                            Pilih kata laluan yang kuat dengan sekurang-kurangnya 6 aksara
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            {/* New Password */}
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Kata Laluan Baharu</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Sahkan Kata Laluan</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        autoComplete="new-password"
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

                            {/* Password Requirements */}
                            <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-xs text-muted-foreground mb-2 font-medium">Keperluan kata laluan:</p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                    <li className="flex items-center gap-2">
                                        <span className={newPassword.length >= 6 ? 'text-green-600' : ''}>
                                            {newPassword.length >= 6 ? '✓' : '○'}
                                        </span>
                                        Sekurang-kurangnya 6 aksara
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className={newPassword === confirmPassword && newPassword.length > 0 ? 'text-green-600' : ''}>
                                            {newPassword === confirmPassword && newPassword.length > 0 ? '✓' : '○'}
                                        </span>
                                        Kata laluan sepadan
                                    </li>
                                </ul>
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? 'Menukar Kata Laluan...' : 'Tukar Kata Laluan'}
                            </Button>

                            <div className="mt-4 text-center">
                                <Link
                                    to="/admin/login"
                                    className="text-sm text-primary hover:underline"
                                >
                                    Kembali ke log masuk
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Back to Home */}
                <p className="text-center text-sm text-muted-foreground mt-6">
                    <Link to="/" className="hover:text-foreground transition-colors">
                        ← Kembali ke laman utama
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default AdminResetPassword;
