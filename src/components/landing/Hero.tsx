import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Star, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export function Hero() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login({ email, password });
      if (result.success) {
        // Redirect to admin dashboard or show success message
        window.location.href = '/admin';
      } else {
        alert(result.error || 'Login failed');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center pt-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/50 via-background to-background -z-10" />
      
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-[0.015] -z-10" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
        backgroundSize: '40px 40px',
      }} />

      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero text */}
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6 animate-fade-in">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>Dipegang oleh lebih 500 pencipta di KL</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance mb-6 animate-slide-up">
              Tempah ruang studio
              <span className="text-primary"> sempurna anda</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mb-8 animate-slide-up stagger-1">
              Studio fotografi dan video profesional di Kuala Lumpur.
              Tempahan lancar, peralatan premium, hasil yang tidak dapat dilupakan.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-slide-up stagger-2">
              <Button variant="hero" size="xl" asChild>
                <Link to="/book">
                  Mula Tempah
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild>
                <Link to="/studios">Lihat Studio</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground animate-fade-in stagger-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Kuala Lumpur, Malaysia</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>9 AM – 9 PM Setiap Hari</span>
              </div>
            </div>
          </div>

          {/* Right side - Login/Signup form */}
          <div className="w-full max-w-md mx-auto">
            <Card className="shadow-xl border-0 bg-background/95 backdrop-blur-sm">
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
                    <Button variant="outline" size="sm" asChild>
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
