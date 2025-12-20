import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Building2 } from 'lucide-react';

interface OnboardingStep1Props {
    onComplete: () => void;
    initialData?: {
        fullName?: string;
        email?: string;
        phone?: string;
        studioName?: string;
    } | null;
}

export default function OnboardingStep1({ onComplete, initialData }: OnboardingStep1Props) {
    const { toast } = useToast();
    const { register, login } = useAuth();

    // Debug: Log initialData
    console.log('OnboardingStep1 initialData:', initialData);

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


        if (result.success) {
            console.log('✅ Registration successful, attempting auto-login...');
            // Auto-login after successful registration
            const loginResult = await login({ email, password });

            console.log('🔐 Login result:', loginResult);

            setIsSubmitting(false);

            if (loginResult.success) {
                console.log('✅ Login successful, calling onComplete()');
                toast({
                    title: 'Akaun Berjaya Dibuat!',
                    description: 'Sila teruskan dengan setup studio anda.',
                });
                // Move to next step
                onComplete();
            } else {
                console.log('❌ Login failed:', loginResult.error);
                toast({
                    title: 'Pendaftaran Berjaya',
                    description: 'Sila log masuk untuk meneruskan.',
                });
            }
        } else {
            console.log('❌ Registration failed:', result.error);
            setIsSubmitting(false);
            toast({
                title: 'Pendaftaran Gagal',
                description: result.error || 'Sila cuba lagi',
                variant: 'destructive',
            });
        }
    };

    return (
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
                    disabled={!!initialData?.email}
                />
                {initialData?.email && (
                    <p className="text-xs text-muted-foreground">
                        Email dari maklumat pembayaran
                    </p>
                )}
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
                {isSubmitting ? 'Mendaftar...' : 'Daftar & Teruskan'}
            </Button>
        </form>
    );
}
