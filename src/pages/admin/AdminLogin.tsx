import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('emailanda@email.com');
  const [password, setPassword] = useState('abcd1234');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Skip validation and navigate directly to dashboard
    setTimeout(() => {
      toast({
        title: "Selamat kembali!",
        description: "Mengalihkan ke papan pemuka...",
      });
      navigate('/admin');
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <img src="/studiorayalogo.png" alt="Raya Studio Logo" style={{ width: '77px', height: '44px' }} />
          </Link>
          <h1 className="text-2xl font-bold">Selamat Datang</h1>
          <p className="text-muted-foreground">Log masuk untuk mengurus studio raya anda</p>
        </div>

        <Card>
          <CardHeader>
          <CardTitle>Log Masuk</CardTitle>
          <CardDescription>
            Tekan butang log masuk untuk masuk ke portal admin
          </CardDescription>
          </CardHeader>
          <CardContent>
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Kata Laluan</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Log masuk...' : 'Log Masuk'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <a href="#" className="text-sm text-primary hover:underline">
                Lupa kata laluan?
              </a>
            </div>
          </CardContent>
        </Card>

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
