import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Building2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const AdminRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const isMobile = useIsMobile();

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studioName, setStudioName] = useState('');
  const [studioLocation, setStudioLocation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/admin');
    }
  }, [isAuthenticated, authLoading, navigate]);

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
      toast({
        title: 'Pendaftaran Berjaya!',
        description: 'Akaun anda telah dibuat. Sila semak emel untuk pengesahan.',
      });
      // Navigate to email verification page with email in state
      navigate('/admin/verify-email', { state: { email } });
    } else {
      toast({
        title: 'Pendaftaran Gagal',
        description: result.error || 'Sila cuba lagi',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className={`text-center ${isMobile ? 'mb-6' : 'mb-8'}`}>
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <img
              src="/studiorayalogo.png"
              alt="Raya Studio Logo"
              style={{ width: isMobile ? '65px' : '77px', height: isMobile ? '37px' : '44px' }}
            />
          </Link>
          <h1 className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`}>Daftar Akaun Admin</h1>
          <p className="text-muted-foreground text-sm">Daftar untuk mengurus studio anda</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pendaftaran Admin</CardTitle>
            <CardDescription>
              Lengkapkan maklumat di bawah untuk mendaftar sebagai admin studio
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Mendaftar...' : 'Daftar Akaun'}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Sudah mempunyai akaun?
              </p>
              <Link
                to="/admin/login"
                className="text-sm text-primary hover:underline font-medium"
              >
                Log masuk di sini
              </Link>
            </div>
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

export default AdminRegister;
