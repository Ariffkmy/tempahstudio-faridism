import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Settings, Menu, Home, Users, CalendarDays, BarChart3, Cog, LogOut, Key, Shield, Mail, Plus, X, FileText } from 'lucide-react';
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
  const [sendgridTemplates, setSendgridTemplates] = useState<Array<{id: string, name: string, templateId: string}>>([]);
  const [newTemplate, setNewTemplate] = useState({ name: '', templateId: '' });
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

        // Load SendGrid templates
        const savedTemplates = localStorage.getItem('sendgridTemplates');
        if (savedTemplates) {
          setSendgridTemplates(JSON.parse(savedTemplates));
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

  // Template management functions
  const addTemplate = () => {
    if (newTemplate.name && newTemplate.templateId) {
      const template = {
        id: `template-${Date.now()}`,
        name: newTemplate.name,
        templateId: newTemplate.templateId
      };

      const updatedTemplates = [...sendgridTemplates, template];
      setSendgridTemplates(updatedTemplates);
      localStorage.setItem('sendgridTemplates', JSON.stringify(updatedTemplates));
      setNewTemplate({ name: '', templateId: '' });

      toast({
        title: 'Berjaya!',
        description: 'Template telah ditambah',
      });
    }
  };

  const removeTemplate = (id: string) => {
    const updatedTemplates = sendgridTemplates.filter(template => template.id !== id);
    setSendgridTemplates(updatedTemplates);
    localStorage.setItem('sendgridTemplates', JSON.stringify(updatedTemplates));

    toast({
      title: 'Template dibuang',
      description: 'Template telah berjaya dibuang',
    });
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage for now (in production, save to backend)
      localStorage.setItem('superAdminSettings', JSON.stringify(settings));
      localStorage.setItem('sendgridTemplates', JSON.stringify(sendgridTemplates));

      toast({
        title: 'Berjaya!',
        description: 'Tetapan super admin dan templat telah disimpan',
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

            {/* SendGrid Templates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  SendGrid Templates
                </CardTitle>
                <CardDescription className="text-sm">
                  Urus templat email untuk automasi email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing Templates */}
                {sendgridTemplates.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Templat Semasa</h4>
                    <div className="space-y-2">
                      {sendgridTemplates.map((template) => (
                        <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{template.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{template.templateId}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTemplate(template.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Template */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-sm">Tambah Templat Baru</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="templateName" className="text-sm">Nama Templat</Label>
                      <Input
                        id="templateName"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="cth: Booking Confirmation"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="templateId" className="text-sm">Template ID</Label>
                      <Input
                        id="templateId"
                        value={newTemplate.templateId}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, templateId: e.target.value }))}
                        placeholder="cth: d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Dapat dari SendGrid Dashboard → Marketing → Templates
                      </p>
                    </div>
                    <Button
                      onClick={addTemplate}
                      disabled={!newTemplate.name || !newTemplate.templateId}
                      className="w-full"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Tambah Templat
                    </Button>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t">
                  <Button
                    onClick={saveSettings}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Menyimpan...' : 'Simpan Templat'}
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

              {/* SendGrid Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    SendGrid Templates
                  </CardTitle>
                  <CardDescription>
                    Urus templat email untuk automasi email di seluruh sistem
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Existing Templates */}
                  {sendgridTemplates.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Templat Semasa</h4>
                      <div className="space-y-3">
                        {sendgridTemplates.map((template) => (
                          <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <p className="font-medium">{template.name}</p>
                              <p className="text-sm text-muted-foreground font-mono">{template.templateId}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeTemplate(template.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add New Template */}
                  <div className="space-y-4 border-t pt-6">
                    <h4 className="font-medium">Tambah Templat Baru</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nama Templat</Label>
                        <Input
                          value={newTemplate.name}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="cth: Booking Confirmation"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Template ID</Label>
                        <Input
                          value={newTemplate.templateId}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, templateId: e.target.value }))}
                          placeholder="cth: d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          className="font-mono"
                        />
                        <p className="text-sm text-muted-foreground col-span-1 md:col-span-2">
                          Dapat dari SendGrid Dashboard → Marketing → Templates
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={addTemplate}
                      disabled={!newTemplate.name || !newTemplate.templateId}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Templat
                    </Button>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-6 border-t">
                    <Button
                      onClick={saveSettings}
                      disabled={isLoading}
                      size="lg"
                    >
                      {isLoading ? 'Menyimpan...' : 'Simpan Templat'}
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
