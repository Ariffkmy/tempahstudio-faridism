import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Star, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion } from "framer-motion";
import { HeroHighlight, Highlight } from "@/components/ui/hero-highlight";
import { useIsMobile } from '@/hooks/use-mobile';

export function Hero() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/admin');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({
        title: 'Ralat',
        description: 'Sila masukkan emel dan kata laluan',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await login({ email, password });
      if (result.success) {
        toast({
          title: 'Selamat kembali!',
          description: 'Mengalihkan ke papan pemuka...',
        });
        // Let the useEffect handle the redirect after auth state updates
      } else {
        toast({
          title: 'Log Masuk Gagal',
          description: result.error || 'Emel atau kata laluan tidak sah',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    } catch (error) {
      toast({
        title: 'Ralat',
        description: 'Ralat tidak dijangka berlaku. Sila cuba lagi.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <section
      className="relative min-h-screen flex items-center pt-16"
      style={{
        backgroundImage: isMobile ? 'none' : 'url(/rayahero.png)',
        backgroundSize: isMobile ? 'none' : 'auto calc(100vh - 4rem)',
        backgroundPosition: isMobile ? 'none' : 'right bottom',
        backgroundRepeat: isMobile ? 'none' : 'no-repeat',
        marginTop: '4rem',
      }}
    >
      {/* Overlay gradient */}
      <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(to bottom right, rgba(0,126,110,0.4), rgba(115,175,111,0.3), rgba(215,192,151,0.2), rgba(203,243,187,0.4))" }} />

      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-[0.015] -z-10" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
        backgroundSize: '40px 40px',
      }} />

      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero text */}
          <div className="max-w-3xl md:mt-0 mt-40">
            {/*
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6 animate-fade-in">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>Dipegang oleh lebih 500 pencipta di KL</span>
            </div>
            */}

            <motion.h1
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: [20, -5, 0],
              }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0.0, 0.2, 1],
              }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-center lg:text-left mb-6"
            >
              Platform mengurus tempahan <span className="inline-block whitespace-nowrap"><Highlight className="mt-2">studio raya anda</Highlight> 📆</span>
            </motion.h1>

            <p className="text-s sm:text-s max-w-xl mb-8 text-center lg:text-left animate-slide-up stagger-1">
              Sistem tempahan studio raya yang cepat dan mudah untuk pelanggan anda. Urus slot, pakej, pembayaran dan banyak lagi dalam satu platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-slide-up stagger-2">
              <Button variant="hero" size="xl" asChild>
                <Link to="/book">
                  Mula Tempah
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>

          </div>

          {/* Right side - Login/Signup form */}
          <div className="w-full max-w-md mx-auto relative mb-12 lg:mb-0">
            <Card className="border-0 bg-background/95 backdrop-blur-sm" style={{ boxShadow: "rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px" }}>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Selamat Datang</CardTitle>
                <CardDescription>
                  Masuk atau daftar untuk akses studio anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Masukkan email anda"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Kata Laluan</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Masukkan kata laluan"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sila tunggu...' : 'Masuk'}
                  </Button>

                  <div className="text-center pt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Belum mempunyai akaun?
                    </p>
                    <Button variant="hero-outline" size="lg" asChild>
                      <Link to="/admin/register">
                        Daftar Sekarang
                      </Link>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
