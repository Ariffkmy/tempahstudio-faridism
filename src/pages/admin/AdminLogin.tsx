import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { requestPasswordReset } from '@/services/adminAuth';
import { Eye, EyeOff } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/lib/supabase';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const isMobile = useIsMobile();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password reset state
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (isAuthenticated && !authLoading) {
        console.log('🔍 AdminLogin useEffect: Checking onboarding status...');

        // Check if user has completed onboarding
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          console.log('👤 AdminLogin useEffect: User ID:', user.id);

          const { data: userData, error } = await supabase
            .from('admin_users')
            .select('onboarding_completed')
            .eq('auth_user_id', user.id)
            .single();

          console.log('📊 AdminLogin useEffect: User data:', userData);
          console.log('❌ AdminLogin useEffect: Error:', error);
          console.log('✅ AdminLogin useEffect: onboarding_completed =', userData?.onboarding_completed);

          if (userData && !userData.onboarding_completed) {
            // User hasn't completed onboarding, redirect to onboarding
            console.log('➡️ AdminLogin useEffect: Redirecting to /onboarding (not completed)');
            navigate('/onboarding');
          } else {
            // User has completed onboarding, go to dashboard
            console.log('➡️ AdminLogin useEffect: Redirecting to /admin (completed)');
            navigate('/admin');
          }
        }
      }
    };

    checkOnboardingStatus();
  }, [isAuthenticated, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({
        title: 'Ralat',
        description: 'Sila masukkan emel dan kata laluan',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const result = await login({ email, password });

    setIsSubmitting(false);

    if (result.success) {
      console.log('🔍 AdminLogin handleLogin: Login successful, checking onboarding status...');

      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        console.log('👤 AdminLogin handleLogin: User ID:', user.id);

        const { data: userData, error } = await supabase
          .from('admin_users')
          .select('onboarding_completed')
          .eq('auth_user_id', user.id)
          .single();

        console.log('📊 AdminLogin handleLogin: User data:', userData);
        console.log('❌ AdminLogin handleLogin: Error:', error);
        console.log('✅ AdminLogin handleLogin: onboarding_completed =', userData?.onboarding_completed);

        if (userData && !userData.onboarding_completed) {
          // User hasn't completed onboarding, redirect to onboarding
          console.log('➡️ AdminLogin handleLogin: Redirecting to /onboarding (not completed)');
          toast({
            title: 'Selamat kembali!',
            description: 'Mari teruskan setup studio anda...',
          });
          navigate('/onboarding');
        } else {
          // User has completed onboarding, go to dashboard
          console.log('➡️ AdminLogin handleLogin: Redirecting to /admin (completed)');
          toast({
            title: 'Selamat kembali!',
            description: 'Mengalihkan ke papan pemuka...',
          });
          navigate('/admin');
        }
      }
    } else {
      toast({
        title: 'Log Masuk Gagal',
        description: result.error || 'Emel atau kata laluan tidak sah',
        variant: 'destructive',
      });
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail.trim()) {
      toast({
        title: 'Ralat',
        description: 'Sila masukkan emel anda',
        variant: 'destructive',
      });
      return;
    }

    setIsResetting(true);

    const result = await requestPasswordReset(resetEmail);

    setIsResetting(false);

    if (result.success) {
      toast({
        title: 'Emel Dihantar',
        description: 'Sila semak emel anda untuk pautan tetapan semula kata laluan',
      });
      setShowResetForm(false);
      setResetEmail('');
    } else {
      toast({
        title: 'Gagal',
        description: result.error || 'Gagal menghantar emel tetapan semula',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        {/* Logo & Header */}
        <div className={`text-center ${isMobile ? 'mb-6' : 'mb-8'}`}>
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <img
              src="/studiorayalogo.png"
              alt="Raya Studio Logo"
              style={{ width: isMobile ? '65px' : '77px', height: isMobile ? '37px' : '44px' }}
            />
          </Link>
          <h1 className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`}>Selamat Datang</h1>
          <p className="text-muted-foreground text-sm">Log masuk untuk mengurus studio raya anda</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{showResetForm ? 'Lupa Kata Laluan' : 'Log Masuk'}</CardTitle>
            <CardDescription>
              {showResetForm
                ? 'Masukkan emel anda untuk menerima pautan tetapan semula'
                : 'Masukkan emel dan kata laluan anda untuk log masuk'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showResetForm ? (
              // Login Form
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Emel</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@rayastudio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Kata Laluan</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
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

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Log masuk...' : 'Log Masuk'}
                </Button>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setShowResetForm(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Lupa kata laluan?
                  </button>
                </div>
              </form>
            ) : (
              // Password Reset Form
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Emel</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="admin@rayastudio.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isResetting}>
                  {isResetting ? 'Menghantar...' : 'Hantar Pautan Tetapan Semula'}
                </Button>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetForm(false);
                      setResetEmail('');
                    }}
                    className="text-sm text-primary hover:underline"
                  >
                    Kembali ke log masuk
                  </button>
                </div>
              </form>
            )}

            {/* Registration Link */}
            {!showResetForm && (
              <div className="mt-6 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Belum mempunyai akaun?
                </p>

              </div>
            )}
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

export default AdminLogin;
