import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Plus, X, Upload, MapPin, Phone, Mail, CreditCard, User, Link as LinkIcon, Copy, Loader2, Menu, Home, CalendarDays, BarChart3, Cog, LogOut, Building2 } from 'lucide-react';
import { loadStudioSettings, saveStudioSettings, updateStudioLayouts, saveGoogleCredentials, initiateGoogleAuth, exchangeGoogleCode } from '@/services/studioSettings';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { StudioLayout } from '@/types/database';


const navigation = [
  { name: 'Papan Pemuka', href: '/admin', icon: Home },
  { name: 'Tempahan', href: '/admin/bookings', icon: CalendarDays },
  { name: 'Laporan', href: '/admin/reports', icon: BarChart3 },
  { name: 'Tetapan', href: '/admin/settings', icon: Cog },
];

const AdminSettings = () => {
  const { user, studio } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    studioName: '',
    studioLocation: '',
    googleMapsLink: '',
    wazeLink: '',
    ownerName: '',
    ownerPhone: '',
    studioEmail: '',
    bankAccountNumber: '',
    accountOwnerName: '',
    qrCode: '',
    bookingLink: '',
    googleCalendarEnabled: false,
    googleCalendarId: 'primary',
    googleClientId: '',
    googleClientSecret: '',
    googleClientIdConfigured: false,
    googleRefreshTokenConfigured: false
  });

  const [layouts, setLayouts] = useState<StudioLayout[]>([]);

  const [newLayout, setNewLayout] = useState({
    name: '',
    description: '',
    capacity: 1,
    price_per_hour: 100
  });

  // Helper functions
  const getInitials = (name: string | undefined) => {
    if (!name) return 'AD';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    // You might want to add navigation to login page here
  };

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await loadStudioSettings();
        if (data) {
          setSettings({
            studioName: data.studioName,
            studioLocation: data.studioLocation,
            googleMapsLink: data.googleMapsLink,
            wazeLink: data.wazeLink,
            ownerName: data.ownerName,
            ownerPhone: data.ownerPhone,
            studioEmail: data.studioEmail,
            bankAccountNumber: data.bankAccountNumber,
            accountOwnerName: data.accountOwnerName,
            qrCode: data.qrCode,
            bookingLink: data.bookingLink,
            googleCalendarEnabled: data.googleCalendarEnabled,
            googleCalendarId: data.googleCalendarId,
            googleClientId: data.googleClientId,
            googleClientSecret: data.googleClientSecret,
            googleClientIdConfigured: data.googleClientIdConfigured,
            googleRefreshTokenConfigured: data.googleRefreshTokenConfigured
          });
          setLayouts(data.layouts);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast({
          title: "Error",
          description: "Failed to load settings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  // Handle OAuth callback on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);

      const handleOAuthCallback = async () => {
        try {
          // Get client credentials
          const clientId = settings.googleClientId || sessionStorage.getItem('googleClientId');
          const clientSecret = settings.googleClientSecret || sessionStorage.getItem('googleClientSecret');

          if (!clientId || !clientSecret) {
            toast({
              title: "Configuration Error",
              description: "Client credentials not found. Please refresh and try again.",
              variant: "destructive",
            });
            return;
          }

          // Exchange code for tokens
          toast({
            title: "Processing...",
            description: "Exchanging authorization code for tokens...",
          });

          const result = await exchangeGoogleCode(code, clientId, clientSecret);

          if (result.success) {
            toast({
              title: "Success!",
              description: "Google Calendar authorization completed. Integration is now active.",
            });

            // Clear session storage
            sessionStorage.removeItem('googleClientId');
            sessionStorage.removeItem('googleClientSecret');

            // Reload settings to reflect new state
            const data = await loadStudioSettings();
            if (data) {
              setSettings(prev => ({
                ...prev,
                googleClientId: data.googleClientId,
                googleClientSecret: data.googleClientSecret,
                googleClientIdConfigured: data.googleClientIdConfigured,
                googleRefreshTokenConfigured: data.googleRefreshTokenConfigured
              }));
            }
          } else {
            toast({
              title: "Authorization Failed",
              description: result.error || "Unknown error occurred",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('OAuth callback error:', error);
          toast({
            title: "OAuth Error",
            description: "Failed to complete Google Calendar authorization",
            variant: "destructive",
          });
        }
      };

      handleOAuthCallback();
    }
  }, [settings.googleClientId, settings.googleClientSecret, toast]);

  const handleSettingChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLayoutChange = (index: number, field: string, value: string | number | boolean) => {
    setLayouts(prev => prev.map((layout, i) =>
      i === index ? { ...layout, [field]: value } : layout
    ));
  };

  const addNewLayout = () => {
    if (newLayout.name && newLayout.description) {
      const layout: StudioLayout = {
        id: `layout-${Date.now()}`,
        studio_id: '', // Will be set when saving
        name: newLayout.name,
        description: newLayout.description,
        capacity: newLayout.capacity,
        price_per_hour: newLayout.price_per_hour,
        image: '/placeholder.svg',
        amenities: [],
        configured_time_slots: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setLayouts(prev => [...prev, layout]);
      setNewLayout({
        name: '',
        description: '',
        capacity: 1,
        price_per_hour: 100
      });
    }
  };

  const removeLayout = (index: number) => {
    setLayouts(prev => prev.filter((_, i) => i !== index));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Save settings
      const settingsResult = await saveStudioSettings(settings, layouts);
      if (!settingsResult.success) {
        toast({
          title: "Error",
          description: settingsResult.error || "Failed to save settings",
          variant: "destructive",
        });
        return;
      }

      // Save layouts separately
      const layoutsResult = await updateStudioLayouts(layouts);
      if (!layoutsResult.success) {
        toast({
          title: "Warning",
          description: "Settings saved but layouts update failed: " + layoutsResult.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Settings saved successfully!",
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {isMobile ? null : <AdminSidebar />}
        <main className={isMobile ? "" : "pl-64"}>
          <div className={isMobile ? "p-4" : "p-8"}>
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading settings...</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
                  {/* Logo & Studio Info */}
                  <div className="p-4 border-b border-border">
                    <Link to="/admin" className="flex items-center gap-2 mb-3">
                      <img src="/studiorayalogo.png" alt="Raya Studio Logo" style={{ width: '48px', height: '29px' }} />
                      <div>
                        <span className="font-semibold">Raya Studio</span>
                        <p className="text-xs text-muted-foreground">Portal Admin</p>
                      </div>
                    </Link>
                    {/* Current Studio Badge */}
                    {studio && (
                      <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/50 rounded-md">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{studio.name}</p>
                          {studio.location && (
                            <p className="text-[10px] text-muted-foreground truncate">{studio.location}</p>
                          )}
                        </div>
                      </div>
                    )}
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
                          {user?.full_name || 'Admin'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email || 'admin@rayastudio.com'}
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
            <h1 className="text-xl font-bold">Tetapan</h1>
            <p className="text-muted-foreground text-sm">Konfigurasi studio dan maklumat perniagaan</p>
          </div>

          {/* Settings Form */}
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Maklumat Asas Studio</CardTitle>
                <CardDescription className="text-sm">Maklumat umum tentang studio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studioName" className="text-sm">Nama Studio</Label>
                  <Input
                    id="studioName"
                    value={settings.studioName}
                    onChange={(e) => handleSettingChange('studioName', e.target.value)}
                    placeholder="Masukkan nama studio"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studioEmail" className="text-sm">Emel Studio</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="studioEmail"
                      type="email"
                      value={settings.studioEmail}
                      onChange={(e) => handleSettingChange('studioEmail', e.target.value)}
                      placeholder="info@studio.com"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studioLocation" className="text-sm">Lokasi Studio</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="studioLocation"
                      value={settings.studioLocation}
                      onChange={(e) => handleSettingChange('studioLocation', e.target.value)}
                      placeholder="Alamat studio"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="googleMapsLink" className="text-sm">Pautan Google Maps</Label>
                  <Input
                    id="googleMapsLink"
                    value={settings.googleMapsLink}
                    onChange={(e) => handleSettingChange('googleMapsLink', e.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wazeLink" className="text-sm">Pautan Waze</Label>
                  <Input
                    id="wazeLink"
                    value={settings.wazeLink}
                    onChange={(e) => handleSettingChange('wazeLink', e.target.value)}
                    placeholder="https://waze.com/..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Owner Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Maklumat Pemilik</CardTitle>
                <CardDescription className="text-sm">Maklumat hubungan pemilik studio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerName" className="text-sm">Nama Pemilik</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ownerName"
                      value={settings.ownerName}
                      onChange={(e) => handleSettingChange('ownerName', e.target.value)}
                      placeholder="Nama penuh pemilik"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerPhone" className="text-sm">No Telefon Pemilik</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ownerPhone"
                      value={settings.ownerPhone}
                      onChange={(e) => handleSettingChange('ownerPhone', e.target.value)}
                      placeholder="+60123456789"
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Banking Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Maklumat Perbankan</CardTitle>
                <CardDescription className="text-sm">Maklumat akaun bank untuk pembayaran</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber" className="text-sm">No Akaun Bank</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="bankAccountNumber"
                      value={settings.bankAccountNumber}
                      onChange={(e) => handleSettingChange('bankAccountNumber', e.target.value)}
                      placeholder="1234567890"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountOwnerName" className="text-sm">Nama Pemilik Akaun</Label>
                  <Input
                    id="accountOwnerName"
                    value={settings.accountOwnerName}
                    onChange={(e) => handleSettingChange('accountOwnerName', e.target.value)}
                    placeholder="Nama pada akaun bank"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qrCode" className="text-sm">Kod QR</Label>
                  <Input
                    id="qrCode"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleSettingChange('qrCode', file.name);
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* OAuth Credentials */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Google OAuth</CardTitle>
                <CardDescription className="text-sm">API credentials from Google Cloud Console</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="googleClientId" className="text-sm">Client ID</Label>
                  <Input
                    id="googleClientId"
                    type="password"
                    value={settings.googleClientId}
                    onChange={(e) => handleSettingChange('googleClientId', e.target.value)}
                    placeholder="Your Google OAuth Client ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="googleClientSecret" className="text-sm">Client Secret</Label>
                  <Input
                    id="googleClientSecret"
                    type="password"
                    value={settings.googleClientSecret}
                    onChange={(e) => handleSettingChange('googleClientSecret', e.target.value)}
                    placeholder="Your Google OAuth Client Secret"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={async () => {
                    if (!settings.googleClientId || !settings.googleClientSecret) {
                      toast({
                        title: "Error",
                        description: "Please enter both Client ID and Client Secret first",
                        variant: "destructive",
                      });
                      return;
                    }

                    try {
                      const result = await saveGoogleCredentials(settings.googleClientId, settings.googleClientSecret);
                      if (result.success) {
                        toast({
                          title: "Success",
                          description: "OAuth credentials saved successfully",
                        });
                        // Reload settings to update configured status
                        const data = await loadStudioSettings();
                        if (data) {
                          setSettings(prev => ({
                            ...prev,
                            googleClientIdConfigured: true
                          }));
                        }
                      } else {
                        toast({
                          title: "Error",
                          description: result.error || "Failed to save credentials",
                          variant: "destructive",
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to save credentials",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={!settings.googleClientId || !settings.googleClientSecret}
                >
                  Save Credentials
                </Button>

                {settings.googleClientIdConfigured && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-800">Credentials configured</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Google Calendar Integration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Google Calendar</CardTitle>
                <CardDescription className="text-sm">Automatik tambah tempahan ke kalendar Google</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <Label className="text-sm">Google Calendar Integration</Label>
                    <p className="text-xs text-muted-foreground">
                      Tempahan baru automatik ditambah ke kalendar Google
                    </p>
                  </div>
                  <Switch
                    checked={settings.googleCalendarEnabled}
                    onCheckedChange={(checked) => handleSettingChange('googleCalendarEnabled', checked)}
                  />
                </div>

                {settings.googleCalendarEnabled && (
                  <div className="space-y-4">
                    {!settings.googleClientIdConfigured && (
                      <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">Setup Required</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>Please enter your Google OAuth credentials first.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {settings.googleRefreshTokenConfigured && (
                      <div className="rounded-md bg-green-50 p-4 border border-green-200">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">Google Calendar Connected</h3>
                            <div className="mt-1 text-sm text-green-700">
                              <p>Calendar events will be automatically created for new bookings.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="googleCalendarId" className="text-sm">ID Kalendar Google</Label>
                      <Input
                        id="googleCalendarId"
                        value={settings.googleCalendarId}
                        onChange={(e) => handleSettingChange('googleCalendarId', e.target.value)}
                        placeholder="primary atau calendar-id@group.calendar.google.com"
                      />
                      <p className="text-xs text-muted-foreground">
                        Gunakan 'primary' untuk kalendar utama atau dapatkan ID dari tetapan kalendar Google anda
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Link */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Pautan Tempahan</CardTitle>
                <CardDescription className="text-sm">Pautan untuk sistem tempahan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bookingLink" className="text-sm">Pautan Tempahan</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="bookingLink"
                        value={settings.bookingLink}
                        onChange={(e) => handleSettingChange('bookingLink', e.target.value)}
                        placeholder="https://studio.com/book"
                        className="pl-9"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(settings.bookingLink);
                        toast({
                          description: "Link copied!",
                        });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Studio Layouts */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Layout Studio</CardTitle>
                <CardDescription className="text-sm">Urus Layout dan kemudahan studio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Existing Layouts */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Layout Semasa</h4>
                  {layouts.slice(0, 2).map((layout, index) => (
                    <div key={layout.id} className="border rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={layout.is_active}
                            onCheckedChange={(checked) => handleLayoutChange(index, 'is_active', checked)}
                          />
                          <h5 className="font-medium text-sm">{layout.name}</h5>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeLayout(index)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Nama Layout</Label>
                          <Input
                            value={layout.name}
                            onChange={(e) => handleLayoutChange(index, 'name', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Kapasiti</Label>
                            <Input
                              type="number"
                              value={layout.capacity}
                              onChange={(e) => handleLayoutChange(index, 'capacity', parseInt(e.target.value))}
                              className="h-8 text-sm"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Harga per Jam</Label>
                            <Input
                              type="number"
                              value={layout.price_per_hour}
                              onChange={(e) => handleLayoutChange(index, 'price_per_hour', parseInt(e.target.value))}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Perihal</Label>
                          <Textarea
                            value={layout.description}
                            onChange={(e) => handleLayoutChange(index, 'description', e.target.value)}
                            placeholder="Huraian Layout"
                            className="text-sm min-h-[60px]"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Layout */}
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Tambah Pilihan Layout</h4>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nama Layout</Label>
                      <Input
                        value={newLayout.name}
                        onChange={(e) => setNewLayout(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nama Layout"
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Kapasiti</Label>
                        <Input
                          type="number"
                          value={newLayout.capacity}
                          onChange={(e) => setNewLayout(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Harga per Jam</Label>
                        <Input
                          type="number"
                          value={newLayout.price_per_hour}
                          onChange={(e) => setNewLayout(prev => ({ ...prev, price_per_hour: parseInt(e.target.value) }))}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Perihal</Label>
                      <Textarea
                        value={newLayout.description}
                        onChange={(e) => setNewLayout(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Huraian Layout"
                        className="text-sm min-h-[60px]"
                        rows={2}
                      />
                    </div>

                    <Button onClick={addNewLayout} className="w-full h-9 text-sm">
                      <Plus className="h-3 w-3 mr-1" />
                      Tambah Layout
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="pb-6">
              <Button onClick={saveSettings} size="lg" className="w-full" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Tetapan'
                )}
              </Button>
            </div>
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
              <h1 className="text-2xl font-bold">Tetapan</h1>
              <p className="text-muted-foreground">Konfigurasi studio dan maklumat perniagaan</p>
            </div>

            {/* Settings Form */}
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Maklumat Asas Studio</CardTitle>
                  <CardDescription>Maklumat umum tentang studio anda</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studioName">Nama Studio</Label>
                      <Input
                        id="studioName"
                        value={settings.studioName}
                        onChange={(e) => handleSettingChange('studioName', e.target.value)}
                        placeholder="Masukkan nama studio"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studioEmail">Emel Studio</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="studioEmail"
                          type="email"
                          value={settings.studioEmail}
                          onChange={(e) => handleSettingChange('studioEmail', e.target.value)}
                          placeholder="info@studio.com"
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studioLocation">Lokasi Studio</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="studioLocation"
                        value={settings.studioLocation}
                        onChange={(e) => handleSettingChange('studioLocation', e.target.value)}
                        placeholder="Alamat studio"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="googleMapsLink">Pautan Google Maps</Label>
                      <Input
                        id="googleMapsLink"
                        value={settings.googleMapsLink}
                        onChange={(e) => handleSettingChange('googleMapsLink', e.target.value)}
                        placeholder="https://maps.google.com/..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wazeLink">Pautan Waze</Label>
                      <Input
                        id="wazeLink"
                        value={settings.wazeLink}
                        onChange={(e) => handleSettingChange('wazeLink', e.target.value)}
                        placeholder="https://waze.com/..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Owner Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Maklumat Pemilik</CardTitle>
                  <CardDescription>Maklumat hubungan pemilik studio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Nama Pemilik</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="ownerName"
                          value={settings.ownerName}
                          onChange={(e) => handleSettingChange('ownerName', e.target.value)}
                          placeholder="Nama penuh pemilik"
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ownerPhone">No Telefon Pemilik</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="ownerPhone"
                          value={settings.ownerPhone}
                          onChange={(e) => handleSettingChange('ownerPhone', e.target.value)}
                          placeholder="+60123456789"
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Banking Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Maklumat Perbankan</CardTitle>
                  <CardDescription>Maklumat akaun bank untuk pembayaran</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankAccountNumber">No Akaun Bank</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="bankAccountNumber"
                          value={settings.bankAccountNumber}
                          onChange={(e) => handleSettingChange('bankAccountNumber', e.target.value)}
                          placeholder="1234567890"
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountOwnerName">Nama Pemilik Akaun</Label>
                      <Input
                        id="accountOwnerName"
                        value={settings.accountOwnerName}
                        onChange={(e) => handleSettingChange('accountOwnerName', e.target.value)}
                        placeholder="Nama pada akaun bank"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="qrCode">Kod QR</Label>
                    <Input
                      id="qrCode"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleSettingChange('qrCode', file.name);
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* OAuth Credentials */}
              <Card>
                <CardHeader>
                  <CardTitle>Google OAuth Credentials</CardTitle>
                  <CardDescription>API credentials from Google Cloud Console</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="googleClientId">Client ID</Label>
                    <Input
                      id="googleClientId"
                      type="password"
                      value={settings.googleClientId}
                      onChange={(e) => handleSettingChange('googleClientId', e.target.value)}
                      placeholder="Your Google OAuth Client ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="googleClientSecret">Client Secret</Label>
                    <Input
                      id="googleClientSecret"
                      type="password"
                      value={settings.googleClientSecret}
                      onChange={(e) => handleSettingChange('googleClientSecret', e.target.value)}
                      placeholder="Your Google OAuth Client Secret"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        if (!settings.googleClientId || !settings.googleClientSecret) {
                          toast({
                            title: "Error",
                            description: "Please enter both Client ID and Client Secret first",
                            variant: "destructive",
                          });
                          return;
                        }

                        try {
                          const result = await saveGoogleCredentials(settings.googleClientId, settings.googleClientSecret);
                          if (result.success) {
                            toast({
                              title: "Success",
                              description: "OAuth credentials saved successfully",
                            });
                            // Reload settings to update configured status
                            const data = await loadStudioSettings();
                            if (data) {
                              setSettings(prev => ({
                                ...prev,
                                googleClientIdConfigured: true
                              }));
                            }
                          } else {
                            toast({
                              title: "Error",
                              description: result.error || "Failed to save credentials",
                              variant: "destructive",
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to save credentials",
                            variant: "destructive",
                          });
                        }
                      }}
                      disabled={!settings.googleClientId || !settings.googleClientSecret}
                    >
                      Save Credentials
                    </Button>
                  </div>

                  {settings.googleClientIdConfigured && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-800">Credentials configured</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Google Calendar Integration */}
              <Card>
                <CardHeader>
                  <CardTitle>Integrasi Google Calendar</CardTitle>
                  <CardDescription>Automatik tambah tempahan ke kalendar Google</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Google Calendar Integration</Label>
                      <p className="text-sm text-muted-foreground">
                        Apabila dihidupkan, tempahan baru akan automatik ditambah ke kalendar Google anda
                      </p>
                    </div>
                    <Switch
                      checked={settings.googleCalendarEnabled}
                      onCheckedChange={(checked) => handleSettingChange('googleCalendarEnabled', checked)}
                    />
                  </div>

                  {settings.googleCalendarEnabled && (
                    <div className="space-y-4">
                      {!settings.googleClientIdConfigured && (
                        <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800">Setup Required</h3>
                              <div className="mt-2 text-sm text-yellow-700">
                                <p>Please enter your Google OAuth credentials above first.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {settings.googleClientIdConfigured && !settings.googleRefreshTokenConfigured && (
                        <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-blue-800">Authorization Required</h3>
                              <div className="mt-2 text-sm text-blue-700">
                                <p>Click the button below to authorize access to your Google Calendar.</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4">
                            <Button
                              onClick={async () => {
                                try {
                                  // First, save all settings to ensure Google Calendar settings are persisted
                                  const settingsResult = await saveStudioSettings(settings, []);
                                  if (!settingsResult.success) {
                                    toast({
                                      title: "Error",
                                      description: "Failed to save settings before authorization",
                                      variant: "destructive",
                                    });
                                    return;
                                  }

                                  toast({
                                    title: "Settings saved",
                                    description: "Redirecting to Google for authorization...",
                                  });

                                  // Now initiate OAuth flow
                                  const { authUrl } = await initiateGoogleAuth(settings.googleClientId);
                                  // Store both client ID and secret in session storage for the callback
                                  sessionStorage.setItem('googleClientId', settings.googleClientId);
                                  sessionStorage.setItem('googleClientSecret', settings.googleClientSecret);
                                  window.location.href = authUrl; // Redirect to Google OAuth
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to initiate authorization",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              Authorize Google Calendar
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">
                              This will save your settings and redirect you to Google for authorization
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Check for tokens in localStorage that need to be imported */}
                      {!settings.googleRefreshTokenConfigured && localStorage.getItem('temp_google_refresh_token') && (
                        <div className="rounded-md bg-orange-50 p-4 border border-orange-200">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3 flex-1">
                              <h3 className="text-sm font-medium text-orange-800">Tokens Ready for Import</h3>
                              <div className="mt-2 text-sm text-orange-700">
                                <p>OAuth tokens were obtained but couldn't be saved to database. Click below to import them.</p>
                              </div>
                              <div className="mt-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      const refreshToken = localStorage.getItem('temp_google_refresh_token');
                                      const accessToken = localStorage.getItem('temp_google_access_token');
                                      const expiresAt = localStorage.getItem('temp_google_token_expires_at');

                                      if (!refreshToken || !accessToken || !expiresAt) {
                                        toast({
                                          title: "Error",
                                          description: "Token data is incomplete",
                                          variant: "destructive",
                                        });
                                        return;
                                      }

                                      // Import tokens to database
                                      const { data: { session } } = await supabase.auth.getSession();
                                      if (!session?.user) {
                                        throw new Error('No authenticated user');
                                      }

                                      const { data: adminUser, error: adminError } = await supabase
                                        .from('admin_users')
                                        .select('studio_id')
                                        .eq('auth_user_id', session.user.id)
                                        .eq('is_active', true)
                                        .single();

                                      if (adminError || !adminUser) {
                                        throw new Error('Failed to find admin studio');
                                      }

                                      const { error: updateError } = await supabase
                                        .from('studios')
                                        .update({
                                          google_refresh_token: refreshToken,
                                          google_access_token: accessToken,
                                          google_token_expires_at: expiresAt,
                                          updated_at: new Date().toISOString()
                                        })
                                        .eq('id', adminUser.studio_id);

                                      if (updateError) {
                                        throw updateError;
                                      }

                                      // Clear localStorage
                                      localStorage.removeItem('temp_google_refresh_token');
                                      localStorage.removeItem('temp_google_access_token');
                                      localStorage.removeItem('temp_google_token_expires_at');

                                      toast({
                                        title: "Success",
                                        description: "Tokens imported successfully! Google Calendar is now connected.",
                                      });

                                      // Reload settings
                                      const data = await loadStudioSettings();
                                      if (data) {
                                        setSettings(prev => ({
                                          ...prev,
                                          googleRefreshTokenConfigured: true
                                        }));
                                      }
                                    } catch (error) {
                                      console.error('Error importing tokens:', error);
                                      toast({
                                        title: "Import Failed",
                                        description: "Failed to import tokens to database",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  Import Tokens
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {settings.googleRefreshTokenConfigured && (
                        <div className="rounded-md bg-green-50 p-4 border border-green-200">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-green-800">Google Calendar Connected</h3>
                              <div className="mt-1 text-sm text-green-700">
                                <p>Calendar events will be automatically created for new bookings.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="googleCalendarId">ID Kalendar Google</Label>
                        <Input
                          id="googleCalendarId"
                          value={settings.googleCalendarId}
                          onChange={(e) => handleSettingChange('googleCalendarId', e.target.value)}
                          placeholder="primary atau calendar-id@group.calendar.google.com"
                        />
                        <p className="text-xs text-muted-foreground">
                          Gunakan 'primary' untuk kalendar utama atau dapatkan ID dari tetapan kalendar Google anda
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Booking Link */}
              <Card>
                <CardHeader>
                  <CardTitle>Pautan Tempahan</CardTitle>
                  <CardDescription>Pautan untuk sistem tempahan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bookingLink">Pautan Tempahan</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="bookingLink"
                          value={settings.bookingLink}
                          onChange={(e) => handleSettingChange('bookingLink', e.target.value)}
                          placeholder="https://studio.com/book"
                          className="pl-9"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(settings.bookingLink);
                          toast({
                            description: "Link copied!",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Studio Layouts */}
              <Card>
                <CardHeader>
                  <CardTitle>Layout Studio</CardTitle>
                  <CardDescription>Urus Layout dan kemudahan studio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Existing Layouts */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Layout Semasa</h4>
                    {layouts.map((layout, index) => (
                      <div key={layout.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={layout.is_active}
                              onCheckedChange={(checked) => handleLayoutChange(index, 'is_active', checked)}
                            />
                            <h5 className="font-medium">{layout.name}</h5>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeLayout(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Nama Layout</Label>
                            <Input
                              value={layout.name}
                              onChange={(e) => handleLayoutChange(index, 'name', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Kapasiti</Label>
                            <Input
                              type="number"
                              value={layout.capacity}
                              onChange={(e) => handleLayoutChange(index, 'capacity', parseInt(e.target.value))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Harga per Jam (RM)</Label>
                            <Input
                              type="number"
                              value={layout.price_per_hour}
                              onChange={(e) => handleLayoutChange(index, 'price_per_hour', parseInt(e.target.value))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Gambar</Label>
                            <div className="flex gap-2">
                              <Input
                                value={layout.image}
                                onChange={(e) => handleLayoutChange(index, 'image', e.target.value)}
                                placeholder="URL gambar"
                              />
                              <Button variant="outline" size="sm">
                                <Upload className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Perihal</Label>
                          <Textarea
                            value={layout.description}
                            onChange={(e) => handleLayoutChange(index, 'description', e.target.value)}
                            placeholder="Huraian Layout"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Layout */}
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Tambah Pilihan Layout</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nama Layout</Label>
                        <Input
                          value={newLayout.name}
                          onChange={(e) => setNewLayout(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Nama Layout"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Kapasiti</Label>
                        <Input
                          type="number"
                          value={newLayout.capacity}
                          onChange={(e) => setNewLayout(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Harga per Jam (RM)</Label>
                        <Input
                          type="number"
                          value={newLayout.price_per_hour}
                          onChange={(e) => setNewLayout(prev => ({ ...prev, price_per_hour: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Perihal</Label>
                      <Textarea
                        value={newLayout.description}
                        onChange={(e) => setNewLayout(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Huraian Layout"
                      />
                    </div>

                    <Button onClick={addNewLayout} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Pilihan Layout
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button onClick={saveSettings} size="lg" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Tetapan'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
};

export default AdminSettings;
