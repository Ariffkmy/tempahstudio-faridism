import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Building2, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface OnboardingStep2Props {
    onComplete: () => void;
    initialData?: {
        fullName?: string;
        email?: string;
        phone?: string;
        studioName?: string;
    } | null;
}

export default function OnboardingStep2({ onComplete, initialData }: OnboardingStep2Props) {
    const { toast } = useToast();
    const { register } = useAuth();

    // Form state - pre-fill with payment data if available
    const [fullName, setFullName] = useState(initialData?.fullName || '');
    const [email, setEmail] = useState(initialData?.email || '');
    const [phone, setPhone] = useState(initialData?.phone || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [studioName, setStudioName] = useState(initialData?.studioName || '');
    const [studioLocation, setStudioLocation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEmailDialog, setShowEmailDialog] = useState(false);

    // Form validation
    const validateForm = (): string | null => {
        if (!fullName.trim()) {
            return 'Sila masukkan nama penuh';
        }
        if (!email.trim()) {
            return 'Sila masukkan emel';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return 'Sila masukkan emel yang sah';
        }
        if (!studioName.trim()) {
            return 'Sila masukkan nama studio';
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

        // Validate form
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

        const result = await register({
            email,
            password,
            full_name: fullName,
            phone: phone || undefined,
            studio_name: studioName,
            studio_location: studioLocation || undefined,
        });

        setIsSubmitting(false);

        if (result.success) {
            // Show email verification dialog
            setShowEmailDialog(true);
        } else {
            toast({
                title: 'Pendaftaran Gagal',
                description: result.error || 'Sila cuba lagi',
                variant: 'destructive',
            });
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                    <Label htmlFor="fullName">Nama Penuh *</Label>
                    <Input
                        id="fullName"
                        type="text"
                        placeholder="Ahmad bin Abdullah"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                    />
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email">Emel *</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="admin@rayastudio.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                    <Label htmlFor="phone">No. Telefon</Label>
                    <Input
                        id="phone"
                        type="tel"
                        placeholder="+601129947089"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </div>

                {/* Studio Name */}
                <div className="space-y-2">
                    <Label htmlFor="studioName">Nama Studio *</Label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="studioName"
                            type="text"
                            placeholder="Contoh: Studio Fotografi ABC"
                            value={studioName}
                            onChange={(e) => setStudioName(e.target.value)}
                            className="pl-10"
                            required
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Masukkan nama studio anda. Studio baru akan dibuat dengan nama ini.
                    </p>
                </div>

                {/* Studio Location */}
                <div className="space-y-2">
                    <Label htmlFor="studioLocation">Lokasi Studio</Label>
                    <Input
                        id="studioLocation"
                        type="text"
                        placeholder="Contoh: Kuala Lumpur, Malaysia"
                        value={studioLocation}
                        onChange={(e) => setStudioLocation(e.target.value)}
                    />
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
                    {isSubmitting ? 'Mendaftar...' : 'Daftar \u0026 Teruskan'}
                </Button>
            </form>

            {/* Email Verification Dialog */}
            <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex justify-center mb-4">
                            <div className="rounded-full bg-primary/10 p-3">
                                <Mail className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <DialogTitle className="text-center text-2xl">Semak Email Anda</DialogTitle>
                        <DialogDescription className="text-center space-y-3 pt-2">
                            <p>
                                Kami telah menghantar email pengesahan ke <strong>{email}</strong>
                            </p>
                            <p>
                                Sila semak inbox anda dan klik pautan pengesahan untuk mengaktifkan akaun anda.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Selepas mengesahkan email, anda boleh log masuk dan meneruskan setup studio anda.
                            </p>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 mt-4">
                        <Button
                            onClick={() => {
                                setShowEmailDialog(false);
                                // User needs to verify email and login again
                                window.location.href = '/admin/login';
                            }}
                            className="w-full"
                        >
                            Pergi ke Log Masuk
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                            Tidak menerima email? Semak folder spam anda.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
