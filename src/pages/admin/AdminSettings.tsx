import { useState, useEffect } from 'react';
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
import { Plus, X, Upload, MapPin, Phone, Mail, CreditCard, User, Link as LinkIcon, Copy, Loader2 } from 'lucide-react';
import { loadStudioSettings, saveStudioSettings, updateStudioLayouts } from '@/services/studioSettings';
import type { StudioLayout } from '@/types/database';


const AdminSettings = () => {
  const { toast } = useToast();
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
    bookingLink: ''
  });

  const [layouts, setLayouts] = useState<StudioLayout[]>([]);

  const [newLayout, setNewLayout] = useState({
    name: '',
    description: '',
    capacity: 1,
    price_per_hour: 100
  });

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
            bookingLink: data.bookingLink
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

  const handleSettingChange = (field: string, value: string) => {
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
        <AdminSidebar />
        <main className="pl-64">
          <div className="p-8">
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
};

export default AdminSettings;
