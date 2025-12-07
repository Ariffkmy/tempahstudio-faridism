import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Settings, Menu, Home, Users, CalendarDays, BarChart3, Cog, LogOut, Key, Shield, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Papan Pemuka', href: '/admin', icon: Home },
  { name: 'Tempahan', href: '/admin/bookings', icon: CalendarDays },
  { name: 'Laporan', href: '/admin/reports', icon: BarChart3 },
  { name: 'Pengurusan', href: '/admin/management', icon: Users },
  { name: 'Tetapan', href: '/admin/settings', icon: Cog },
];

const AdminSuperSettings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Super admin settings state
  const [settings, setSettings] = useState({
    googleClientId: '',
    googleClientSecret: '',
    sendgridApiKey: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load super admin settings
  useEffect(() => {
    const loadSuperAdminSettings = async () => {
      try {
        // Load from localStorage or backend in the future
        const savedSettings = localStorage.getItem('superAdminSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Error loading super admin settings:', error);
      }
    };

    loadSuperAdminSettings();
  }, []);

  const handleLogout = async () => {
    await logout();
    toast({
      title: 'Log keluar berjaya',
      description: 'Anda telah log keluar dari sistem',
    });
    navigate('/admin/login');
  };

  const handleSettingChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage for now (in production, save to backend)
      localStorage.setItem('superAdminSettings', JSON.stringify(settings));

      toast({
        title: 'Berjaya!',
        description: 'Tetapan super admin telah disimpan',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Ralat',
        description: 'Gagal menyimpan tetapan',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const getInitials = (name: string | undefined) => {
    if (!name) return 'AD';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/admin" className="flex items-center gap-2">
              <img src="/studiorayalogo.png" alt="Raya Studio Logo" style={{ width: '32px', height: '19px' }} />
              <span className="font-semibold text-sm">Raya Studio</span>
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col h-full">
                  {/* Logo & Admin Info */}
                  <div className="p-4 border-b border-border">
                    <Link to="/admin" className="flex items-center gap-2 mb-3">
                      <img src="/studiorayalogo.png" alt="Raya Studio Logo" style={{ width: '48px', height: '29px' }} />
                      <div>
                        <span className="font-semibold">Raya Studio</span>
                        <p className="text-xs text-muted-foreground">Portal Super Admin</p>
                      </div>
                    </Link>
                    {/* Super Admin Badge */}
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-purple-100 border border-purple-200 rounded-md">
                      <Shield className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-800">Super Admin</span>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex-1 p-4">
                    <nav className="space-y-1">
                      {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                              isActive
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                          >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Footer - User Info & Logout */}
                  <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {getInitials(user?.full_name)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user?.full_name || 'Super Admin'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email || 'superadmin@rayastudio.com'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-muted-foreground hover:text-destructive"
                      size="sm"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Log keluar
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="p-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold">Tetapan Super Admin</h1>
            <p className="text-muted-foreground text-sm">Konfigurasi sistem untuk super admin</p>
          </div>

          {/* Settings Form */}
          <div className="space-y-6">
            {/* Google Calendar Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Google Calendar Credentials
                </CardTitle>
                <CardDescription className="text-sm">
                  Tetapan OAuth untuk integrasi Google Calendar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="googleClientId" className="text-sm">Client ID</Label>
                  <Input
                    id="googleClientId"
                    type="password"
                    value={settings.googleClientId}
                    onChange={(e) => handleSettingChange('googleClientId', e.target.value)}
                    placeholder="Masukkan Google OAuth Client ID"
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Dapat dari Google Cloud Console
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="googleClientSecret" className="text-sm">Client Secret</Label>
                  <Input
                    id="googleClientSecret"
                    type="password"
                    value={settings.googleClientSecret}
                    onChange={(e) => handleSettingChange('googleClientSecret', e.target.value)}
                    placeholder="Masukkan Google OAuth Client Secret"
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Dapat dari Google Cloud Console
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={saveSettings}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Menyimpan...' : 'Simpan Tetapan'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SendGrid API Key Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  SendGrid API Key
                </CardTitle>
                <CardDescription className="text-sm">
                  Tetapan API untuk integrasi email melalui SendGrid
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sendgridApiKey" className="text-sm">API Key</Label>
                  <Input
                    id="sendgridApiKey"
                    type="password"
                    value={settings.sendgridApiKey}
                    onChange={(e) => handleSettingChange('sendgridApiKey', e.target.value)}
                    placeholder="SG.xxxxxxxx-xxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Dapat dari SendGrid Dashboard → Settings → API Keys
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={saveSettings}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Menyimpan...' : 'Simpan Tetapan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  } else {
    return (
      <div className="min-h-screen bg-background">
        <AdminSidebar />

        <main className="pl-64">
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Tetapan Super Admin</h1>
              <p className="text-muted-foreground">Konfigurasi sistem untuk super admin</p>
            </div>

            {/* Settings Grid */}
            <div className="max-w-4xl space-y-6">
              {/* Google Calendar Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Google Calendar Credentials
                  </CardTitle>
                  <CardDescription>
                    Tetapan OAuth untuk integrasi Google Calendar di seluruh sistem
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="googleClientId">Client ID</Label>
                      <Input
                        id="googleClientId"
                        type="password"
                        value={settings.googleClientId}
                        onChange={(e) => handleSettingChange('googleClientId', e.target.value)}
                        placeholder="Masukkan Google OAuth Client ID"
                        className="font-mono"
                      />
                      <p className="text-sm text-muted-foreground">
                        Dapat dari Google Cloud Console → APIs & Services → Credentials
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="googleClientSecret">Client Secret</Label>
                      <Input
                        id="googleClientSecret"
                        type="password"
                        value={settings.googleClientSecret}
                        onChange={(e) => handleSettingChange('googleClientSecret', e.target.value)}
                        placeholder="Masukkan Google OAuth Client Secret"
                        className="font-mono"
                      />
                      <p className="text-sm text-muted-foreground">
                        Rahsia OAuth yang berkaitan dengan Client ID
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t">
                    <Button
                      onClick={saveSettings}
                      disabled={isLoading}
                      size="lg"
                    >
                      {isLoading ? 'Menyimpan...' : 'Simpan Tetapan'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* SendGrid API Key Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    SendGrid API Key
                  </CardTitle>
                  <CardDescription>
                    Tetapan API untuk integrasi email melalui SendGrid di seluruh sistem
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="sendgridApiKeyDesktop">API Key</Label>
                    <Input
                      id="sendgridApiKeyDesktop"
                      type="password"
                      value={settings.sendgridApiKey}
                      onChange={(e) => handleSettingChange('sendgridApiKey', e.target.value)}
                      placeholder="SG.xxxxxxxx-xxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="font-mono"
                    />
                    <p className="text-sm text-muted-foreground">
                      Dapat dari SendGrid Dashboard → Settings → API Keys
                    </p>
                  </div>

                  <div className="flex justify-end pt-6 border-t">
                    <Button
                      onClick={saveSettings}
                      disabled={isLoading}
                      size="lg"
                    >
                      {isLoading ? 'Menyimpan...' : 'Simpan Tetapan'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }
};

export default AdminSuperSettings;
