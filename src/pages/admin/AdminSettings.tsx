import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { StudioSelector } from '@/components/admin/StudioSelector';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveStudioId } from '@/contexts/StudioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, X, Upload, MapPin, Phone, Mail, CreditCard, User, Link as LinkIcon, Copy, Loader2, Menu, Home, CalendarDays, BarChart3, Cog, LogOut, Building2, ExternalLink, Palette, Image as ImageIcon, Users as UsersIcon, Trash } from 'lucide-react';
import { loadStudioSettings, saveStudioSettings, updateStudioLayouts, saveGoogleCredentials, initiateGoogleAuth, exchangeGoogleCode, loadStudioPortfolioPhotos, deleteStudioPortfolioPhoto } from '@/services/studioSettings';
import { supabase } from '@/lib/supabase';
import { uploadLogo, uploadTermsPdf } from '@/services/fileUploadService';
import BookingFormPreview, { PreviewSettings } from '@/components/booking/preview/BookingFormPreview';
import { BookingTitleCustomization } from '@/components/admin/BookingTitleCustomization';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { StudioLayout } from '@/types/database';
import type { AddonPackage } from '@/types/booking';
import { createStudioUser, getStudioAdmins } from '@/services/adminAuth';
import type { AdminUser } from '@/types/database';
import { useSidebar } from '@/contexts/SidebarContext';


const navigation = [
  { name: 'Papan Pemuka', href: '/admin', icon: Home },
  { name: 'Tempahan', href: '/admin/bookings', icon: CalendarDays },
  { name: 'Laporan', href: '/admin/reports', icon: BarChart3 },
  { name: 'Tetapan', href: '/admin/settings', icon: Cog },
];

const AdminSettings = () => {
  const { user, studio, isSuperAdmin } = useAuth();
  const effectiveStudioId = useEffectiveStudioId();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const [deletingPhotoUrl, setDeletingPhotoUrl] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    studioName: '',
    slug: '',
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
    googleRefreshTokenConfigured: false,
    termsConditionsType: 'none',
    termsConditionsText: '',
    termsConditionsPdf: '',
    timeSlotGap: 30,
    studioLogo: '',
    // Booking form customization
    enableCustomHeader: false,
    enableCustomFooter: false,
    enableWhatsappButton: false,
    showStudioName: false,
    headerLogo: '',
    headerHomeEnabled: false,
    headerHomeUrl: '',
    headerAboutEnabled: false,
    headerAboutUrl: '',
    headerPortfolioEnabled: false,
    headerPortfolioUrl: '',
    headerContactEnabled: false,
    headerContactUrl: '',
    enablePortfolioPhotoUpload: false,
    portfolioUploadInstructions: 'Upload your photos for your portfolio session. Maximum 20 photos, each file up to 10MB.',
    portfolioMaxFileSize: 10,
    footerWhatsappLink: '',
    footerFacebookLink: '',
    footerInstagramLink: '',
    footerTrademark: '',
    whatsappMessage: 'Hubungi kami',
    brandColorPrimary: '#000000',
    brandColorSecondary: '#ffffff',
    // Booking form title customization
    bookingTitleText: 'Tempahan Studio',
    bookingSubtitleText: 'Isi maklumat dan buat pembayaran untuk tempahan slot anda.',
    bookingTitleFont: 'default',
    bookingTitleSize: 'xl',
    bookingSubtitleFont: 'default',
    bookingSubtitleSize: 'base'
  });

  const [layouts, setLayouts] = useState<StudioLayout[]>([]);
  const [addonPackages, setAddonPackages] = useState<AddonPackage[]>([]);
  const [bookingLink, setBookingLink] = useState('');

  // Users management state
  const [studioUsers, setStudioUsers] = useState<AdminUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    full_name: '',
    phone: '',
    password: '',
  });

  const [newLayout, setNewLayout] = useState({
    name: '',
    description: '',
    capacity: 1,
    price_per_hour: 100
  });

  // Layout photos management state
  const [uploadingLayoutPhoto, setUploadingLayoutPhoto] = useState<{ [layoutId: string]: boolean }>({});
  const [deletingLayoutPhoto, setDeletingLayoutPhoto] = useState<{ [key: string]: boolean }>({});

  // Add layout dialog state
  const [isAddLayoutDialogOpen, setIsAddLayoutDialogOpen] = useState(false);

  // Add-on package dialog state
  const [isAddAddonDialogOpen, setIsAddAddonDialogOpen] = useState(false);
  const [newAddonPackage, setNewAddonPackage] = useState({
    name: '',
    description: '',
    price: 100
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
        const data = await loadStudioSettings(effectiveStudioId);
        if (data) {
          setSettings({
            studioName: data.studioName,
            slug: data.slug || '',
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
            googleRefreshTokenConfigured: data.googleRefreshTokenConfigured,
            termsConditionsType: data.termsConditionsType || 'none',
            termsConditionsText: data.termsConditionsText || '',
            termsConditionsPdf: data.termsConditionsPdf || '',
            timeSlotGap: data.timeSlotGap || 30,
            studioLogo: data.studioLogo || '',
            // Booking form customization
            enableCustomHeader: data.enableCustomHeader || false,
            enableCustomFooter: data.enableCustomFooter || false,
            enableWhatsappButton: data.enableWhatsappButton || false,
            showStudioName: data.showStudioName || false,
            headerLogo: data.headerLogo || '',
            headerHomeEnabled: data.headerHomeEnabled || false,
            headerHomeUrl: data.headerHomeUrl || '',
            headerAboutEnabled: data.headerAboutEnabled || false,
            headerAboutUrl: data.headerAboutUrl || '',
            headerPortfolioEnabled: data.headerPortfolioEnabled || false,
            headerPortfolioUrl: data.headerPortfolioUrl || '',
            headerContactEnabled: data.headerContactEnabled || false,
            headerContactUrl: data.headerContactUrl || '',
            enablePortfolioPhotoUpload: data.enablePortfolioPhotoUpload || false,
            portfolioUploadInstructions: data.portfolioUploadInstructions || 'Upload your photos for your portfolio session. Maximum 20 photos, each file up to 10MB.',
            portfolioMaxFileSize: data.portfolioMaxFileSize || 10,
            footerWhatsappLink: data.footerWhatsappLink || '',
            footerFacebookLink: data.footerFacebookLink || '',
            footerInstagramLink: data.footerInstagramLink || '',
            footerTrademark: data.footerTrademark || '',
            whatsappMessage: data.whatsappMessage || 'Hubungi kami',
            brandColorPrimary: data.brandColorPrimary || '#000000',
            brandColorSecondary: data.brandColorSecondary || '#ffffff',
            bookingTitleText: data.bookingTitleText || 'Tempahan Studio',
            bookingSubtitleText: data.bookingSubtitleText || 'Isi maklumat dan buat pembayaran untuk tempahan slot anda.',
            bookingTitleFont: data.bookingTitleFont || 'default',
            bookingTitleSize: data.bookingTitleSize || 'xl',
            bookingSubtitleFont: data.bookingSubtitleFont || 'default',
            bookingSubtitleSize: data.bookingSubtitleSize || 'base'
          });
          setLayouts(data.layouts);

          // Load add-on packages from database
          if (effectiveStudioId) {
            const { data: addonData, error: addonError } = await supabase
              .from('addon_packages')
              .select('*')
              .eq('studio_id', effectiveStudioId)
              .order('created_at', { ascending: true });

            if (!addonError && addonData) {
              setAddonPackages(addonData);
            }
          }
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
  }, [toast, effectiveStudioId]);

  // Dedicated effect to calculate booking link exactly like AdminBookings
  useEffect(() => {
    const fetchBookingLink = async () => {
      if (!effectiveStudioId) return;

      try {
        const { data: studioData } = await supabase
          .from('studios')
          .select('slug')
          .eq('id', effectiveStudioId)
          .single();

        const baseUrl = window.location.origin;
        const link = studioData?.slug
          ? `${baseUrl}/${studioData.slug}`
          : `${baseUrl}/book/${effectiveStudioId}`;

        // setFinalBookingLink(link);
      } catch (e) {
        console.error('Error fetching slug for link:', e);
        // Fallback
        // setFinalBookingLink(`${window.location.origin}/book/${effectiveStudioId}`);
      }
    };

    fetchBookingLink();
  }, [effectiveStudioId]);

  // Load portfolio photos
  const fetchPortfolioPhotos = useCallback(async () => {
    if (!effectiveStudioId) return;
    setIsLoadingPortfolio(true);
    try {
      const photos = await loadStudioPortfolioPhotos(effectiveStudioId);
      setPortfolioPhotos(photos);
    } catch (error) {
      console.error('Failed to load portfolio photos:', error);
      toast({
        title: "Error",
        description: "Failed to load portfolio photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPortfolio(false);
    }
  }, [effectiveStudioId, toast]);

  useEffect(() => {
    fetchPortfolioPhotos();
  }, [fetchPortfolioPhotos]);

  const handleDeletePortfolioPhoto = useCallback(async (photoUrl: string) => {
    setDeletingPhotoUrl(photoUrl);
    try {
      const { deletePortfolioPhoto } = await import('@/services/fileUploadService');

      // Remove from storage first
      const storageResult = await deletePortfolioPhoto(photoUrl);
      if (!storageResult.success) {
        toast({
          title: "Delete failed",
          description: storageResult.error || "Failed to delete photo from storage",
          variant: "destructive",
        });
        return;
      }

      // Remove DB record
      const dbResult = await deleteStudioPortfolioPhoto(photoUrl, effectiveStudioId || undefined);
      if (!dbResult) {
        toast({
          title: "Delete failed",
          description: "Photo removed from storage but not from database.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Deleted", description: "Portfolio photo deleted." });
      }

      await fetchPortfolioPhotos();
    } catch (error) {
      console.error('Failed to delete portfolio photo:', error);
      toast({
        title: "Delete failed",
        description: "Unexpected error while deleting photo",
        variant: "destructive",
      });
    } finally {
      setDeletingPhotoUrl(null);
    }
  }, [effectiveStudioId, fetchPortfolioPhotos, toast]);

  // Generate booking link for this studio
  useEffect(() => {
    if (effectiveStudioId) {
      const baseUrl = window.location.origin;
      const studioBookingLink = `${baseUrl}/book/${effectiveStudioId}`;
      setBookingLink(studioBookingLink);
    }
  }, [effectiveStudioId]);

  // Load studio users
  const loadStudioUsers = async () => {
    if (!effectiveStudioId) return;

    setIsLoadingUsers(true);
    try {
      const users = await getStudioAdmins(effectiveStudioId);
      setStudioUsers(users);
    } catch (error) {
      console.error('Error loading studio users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Load users when studio ID is available
  useEffect(() => {
    if (effectiveStudioId && user?.role !== 'super_admin') {
      loadStudioUsers();
    }
  }, [effectiveStudioId, user?.role]);

  // Handle create new user
  const handleCreateUser = async () => {
    // Validate form
    if (!newUserForm.email || !newUserForm.full_name || !newUserForm.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserForm.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Validate password (minimum 6 characters)
    if (newUserForm.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingUser(true);
    try {
      const result = await createStudioUser({
        email: newUserForm.email,
        password: newUserForm.password,
        full_name: newUserForm.full_name,
        phone: newUserForm.phone || undefined,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "User created successfully",
        });
        // Reset form
        setNewUserForm({
          email: '',
          full_name: '',
          phone: '',
          password: '',
        });
        // Reload users
        await loadStudioUsers();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

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

  const handleSettingChange = (field: string, value: string | boolean | number) => {
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
      setIsAddLayoutDialogOpen(false);
      toast({
        title: "Layout ditambah",
        description: "Layout baru telah ditambah. Jangan lupa untuk simpan tetapan.",
      });
    } else {
      toast({
        title: "Maklumat tidak lengkap",
        description: "Sila isi nama dan perihal layout",
        variant: "destructive",
      });
    }
  };

  const removeLayout = (index: number) => {
    setLayouts(prev => prev.filter((_, i) => i !== index));
  };

  // Add-on package management functions
  const handleAddonPackageChange = (index: number, field: string, value: string | number | boolean) => {
    setAddonPackages(prev => prev.map((pkg, i) =>
      i === index ? { ...pkg, [field]: value } : pkg
    ));
  };

  const addNewAddonPackage = () => {
    if (newAddonPackage.name && newAddonPackage.description) {
      const addonPackage: AddonPackage = {
        id: `addon-${Date.now()}`,
        studio_id: effectiveStudioId || '',
        name: newAddonPackage.name,
        description: newAddonPackage.description,
        price: newAddonPackage.price,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setAddonPackages(prev => [...prev, addonPackage]);
      setNewAddonPackage({
        name: '',
        description: '',
        price: 100
      });
      setIsAddAddonDialogOpen(false);
      toast({
        title: "Pakej ditambah",
        description: "Pakej tambahan baru telah ditambah. Jangan lupa untuk simpan tetapan.",
      });
    } else {
      toast({
        title: "Maklumat tidak lengkap",
        description: "Sila isi nama dan perihal pakej",
        variant: "destructive",
      });
    }
  };

  const removeAddonPackage = (index: number) => {
    setAddonPackages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle layout photo upload
  const handleUploadLayoutPhoto = async (layoutIndex: number, file: File) => {
    const layout = layouts[layoutIndex];
    if (!layout || !effectiveStudioId) return;

    // Check if already have 5 photos
    const currentPhotos = layout.layout_photos || [];
    if (currentPhotos.length >= 5) {
      toast({
        title: "Maximum photos reached",
        description: "You can only upload up to 5 photos per layout",
        variant: "destructive",
      });
      return;
    }

    setUploadingLayoutPhoto(prev => ({ ...prev, [layout.id]: true }));
    try {
      const { uploadLayoutPhoto } = await import('@/services/fileUploadService');
      const result = await uploadLayoutPhoto(file, layout.id, effectiveStudioId);

      if (result.success && result.url) {
        // Update layout with new photo
        const updatedPhotos = [...currentPhotos, result.url];
        handleLayoutChange(layoutIndex, 'layout_photos', updatedPhotos);

        // If this is the first photo, set it as thumbnail
        if (!layout.thumbnail_photo) {
          handleLayoutChange(layoutIndex, 'thumbnail_photo', result.url);
        }

        toast({
          title: "Photo uploaded",
          description: "Layout photo uploaded successfully",
        });
      } else {
        toast({
          title: "Upload failed",
          description: result.error || "Failed to upload photo",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Layout photo upload error:', error);
      toast({
        title: "Upload failed",
        description: "Unexpected error while uploading photo",
        variant: "destructive",
      });
    } finally {
      setUploadingLayoutPhoto(prev => ({ ...prev, [layout.id]: false }));
    }
  };

  // Handle layout photo delete
  const handleDeleteLayoutPhoto = async (layoutIndex: number, photoUrl: string) => {
    const layout = layouts[layoutIndex];
    if (!layout) return;

    const deleteKey = `${layout.id}-${photoUrl}`;
    setDeletingLayoutPhoto(prev => ({ ...prev, [deleteKey]: true }));

    try {
      const { deleteLayoutPhoto } = await import('@/services/fileUploadService');
      const result = await deleteLayoutPhoto(photoUrl);

      if (result.success) {
        // Remove photo from layout
        const currentPhotos = layout.layout_photos || [];
        const updatedPhotos = currentPhotos.filter(url => url !== photoUrl);
        handleLayoutChange(layoutIndex, 'layout_photos', updatedPhotos);

        // If deleted photo was the thumbnail, set a new thumbnail
        if (layout.thumbnail_photo === photoUrl) {
          const newThumbnail = updatedPhotos.length > 0 ? updatedPhotos[0] : null;
          handleLayoutChange(layoutIndex, 'thumbnail_photo', newThumbnail);
        }

        toast({
          title: "Photo deleted",
          description: "Layout photo deleted successfully",
        });
      } else {
        toast({
          title: "Delete failed",
          description: result.error || "Failed to delete photo",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Layout photo delete error:', error);
      toast({
        title: "Delete failed",
        description: "Unexpected error while deleting photo",
        variant: "destructive",
      });
    } finally {
      setDeletingLayoutPhoto(prev => ({ ...prev, [deleteKey]: false }));
    }
  };

  // Handle setting thumbnail photo
  const handleSetThumbnail = (layoutIndex: number, photoUrl: string) => {
    handleLayoutChange(layoutIndex, 'thumbnail_photo', photoUrl);
    toast({
      title: "Thumbnail updated",
      description: "Thumbnail photo updated successfully",
    });
  };


  const saveSettings = async () => {
    setIsSaving(true);
    try {
      console.log('[AdminSettings] saving settings payload:', { ...settings, layoutsCount: layouts.length, effectiveStudioId });
      // Save settings
      const settingsResult = await saveStudioSettings(settings, layouts, effectiveStudioId || undefined);
      if (!settingsResult.success) {
        toast({
          title: "Error",
          description: settingsResult.error || "Failed to save settings",
          variant: "destructive",
        });
        return;
      }

      // Save layouts separately
      const layoutsResult = await updateStudioLayouts(layouts, effectiveStudioId || undefined);
      if (!layoutsResult.success) {
        toast({
          title: "Warning",
          description: "Settings saved but layouts update failed: " + layoutsResult.error,
          variant: "destructive",
        });
        return;
      }

      // Save add-on packages
      if (effectiveStudioId) {
        // Delete removed packages
        const { data: existingPackages } = await supabase
          .from('addon_packages')
          .select('id')
          .eq('studio_id', effectiveStudioId);

        const existingIds = existingPackages?.map(p => p.id) || [];
        const currentIds = addonPackages.map(p => p.id);
        const toDelete = existingIds.filter(id => !currentIds.includes(id));

        if (toDelete.length > 0) {
          await supabase
            .from('addon_packages')
            .delete()
            .in('id', toDelete);
        }

        // Handle new and existing packages separately
        if (addonPackages.length > 0) {
          const newPackages = addonPackages.filter(pkg => pkg.id.startsWith('addon-'));
          const existingPkgs = addonPackages.filter(pkg => !pkg.id.startsWith('addon-'));

          // Insert new packages only
          const packagesToSave = newPackages.map(pkg => ({
            studio_id: effectiveStudioId,
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            is_active: pkg.is_active
          }));

          const { error: addonError } = await supabase
            .from('addon_packages')
            .insert(packagesToSave.map(({ id, created_at, ...pkg }) => pkg));

          if (addonError) {
            toast({
              title: "Warning",
              description: "Settings saved but add-on packages update failed: " + addonError.message,
              variant: "destructive",
            });
            return;
          }

          // Update existing packages
          for (const pkg of existingPkgs) {
            const { error: updateError } = await supabase
              .from('addon_packages')
              .update({
                name: pkg.name,
                description: pkg.description,
                price: pkg.price,
                is_active: pkg.is_active,
                updated_at: new Date().toISOString()
              })
              .eq('id', pkg.id);

            if (updateError) {
              toast({
                title: "Warning",
                description: "Add-on package update failed: " + updateError.message,
                variant: "destructive",
              });
              return;
            }
          }
        }
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
            {/* Studio Selector for Super Admins */}
            {isSuperAdmin && <StudioSelector />}
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
                      placeholder="+601129947089"
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

            {/* Booking Title Customization */}
            <BookingTitleCustomization
              settings={{
                bookingTitleText: settings.bookingTitleText,
                bookingSubtitleText: settings.bookingSubtitleText,
                bookingTitleFont: settings.bookingTitleFont,
                bookingTitleSize: settings.bookingTitleSize,
                bookingSubtitleFont: settings.bookingSubtitleFont,
                bookingSubtitleSize: settings.bookingSubtitleSize
              }}
              onSettingChange={handleSettingChange}
            />

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

        <main className={cn("transition-all duration-300", isCollapsed ? "pl-16" : "pl-64")}>
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Tetapan</h1>
              <p className="text-muted-foreground">Konfigurasi studio dan maklumat perniagaan</p>
              {/* Studio Selector for Super Admins */}
              {isSuperAdmin && <StudioSelector />}
            </div>

            {/* Settings Tabs */}
            <Tabs defaultValue="maklumat-asas" className="w-full">
              <div className="border-b border-border">
                <TabsList className="grid w-full grid-cols-5 md:flex md:w-auto h-auto p-0 bg-transparent justify-start">
                  <TabsTrigger
                    value="maklumat-asas"
                    className="text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <span className="mr-2">🏢</span>
                    Maklumat Asas Studio
                  </TabsTrigger>
                  <TabsTrigger
                    value="google-calendar"
                    className="text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <span className="mr-2">📅</span>
                    Google Calendar
                  </TabsTrigger>
                  <TabsTrigger
                    value="pakej"
                    className="text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <span className="mr-2">📦</span>
                    Pakej
                  </TabsTrigger>
                  <TabsTrigger
                    value="booking-form"
                    className="text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <span className="mr-2">📋</span>
                    Booking Form
                  </TabsTrigger>
                  <TabsTrigger
                    value="users"
                    className="text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <UsersIcon className="h-4 w-4 mr-2" />
                    Users
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab 1: Maklumat Asas Studio */}
              <TabsContent value="maklumat-asas" className="space-y-6 mt-6">
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
                            placeholder="+601129947089"
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

                {/* Save Button for Tab 1 */}
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
              </TabsContent>

              {/* Tab 2: Google Calendar */}
              <TabsContent value="google-calendar" className="space-y-6 mt-6">
                {/* Google OAuth Credentials */}
                <Card>
                  <CardHeader>
                    <CardTitle>Google Calendar Keys</CardTitle>
                    <CardDescription>API credentials from Google Cloud Console</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="googleClientIdTab2">Client ID</Label>
                      <Input
                        id="googleClientIdTab2"
                        type="password"
                        value={settings.googleClientId}
                        onChange={(e) => handleSettingChange('googleClientId', e.target.value)}
                        placeholder="Your Google OAuth Client ID"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="googleClientSecretTab2">Client Secret</Label>
                      <Input
                        id="googleClientSecretTab2"
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
                              const data = await loadStudioSettings(effectiveStudioId);
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
                        <Label className="text-base">Enable Integration</Label>
                        <p className="text-sm text-muted-foreground">
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
                                  <p>Please configure your Google OAuth credentials first.</p>
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
                                    const settingsResult = await saveStudioSettings(settings, [], effectiveStudioId || undefined);
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

                                    const { authUrl } = await initiateGoogleAuth(settings.googleClientId);
                                    sessionStorage.setItem('googleClientId', settings.googleClientId);
                                    sessionStorage.setItem('googleClientSecret', settings.googleClientSecret);
                                    window.location.href = authUrl;
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
                          <Label htmlFor="googleCalendarIdTab2">ID Kalendar Google</Label>
                          <Input
                            id="googleCalendarIdTab2"
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

                {/* Save Button for Tab 2 */}
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
              </TabsContent>

              {/* Tab 3: Pakej */}
              <TabsContent value="pakej" className="space-y-6 mt-6">
                {/* Nested Tabs for Pakej */}
                <Tabs defaultValue="layouts" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="layouts">Layout Studio</TabsTrigger>
                    <TabsTrigger value="addons">Pakej Tambahan</TabsTrigger>
                  </TabsList>

                  {/* Sub-Tab 1: Studio Layouts */}
                  <TabsContent value="layouts" className="space-y-6 mt-6">
                    {/* Studio Layouts */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Layout Studio</CardTitle>
                        <CardDescription>Urus Layout dan kemudahan studio</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Existing Layouts */}
                        <div className="space-y-6">
                          <h4 className="font-medium">Layout Semasa</h4>
                          {layouts.map((layout, index) => (
                            <div key={layout.id} className="border-2 rounded-lg p-6 space-y-4 bg-muted/30 shadow-sm">
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
                                  <Trash className="h-4 w-4" />
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

                              {/* Layout Photos Section */}
                              <Separator />
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Label className="text-base">Foto Layout</Label>
                                    <p className="text-sm text-muted-foreground">
                                      Muat naik sehingga 5 gambar untuk layout ini. Pilih satu sebagai thumbnail.
                                    </p>
                                  </div>
                                  <Badge variant="secondary">
                                    {(layout.layout_photos || []).length} / 5
                                  </Badge>
                                </div>

                                {/* Upload Button */}
                                {(layout.layout_photos || []).length < 5 && (
                                  <div>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      id={`layout-photo-${layout.id}`}
                                      className="hidden"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          await handleUploadLayoutPhoto(index, file);
                                          e.target.value = '';
                                        }
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={uploadingLayoutPhoto[layout.id]}
                                      onClick={() => document.getElementById(`layout-photo-${layout.id}`)?.click()}
                                    >
                                      {uploadingLayoutPhoto[layout.id] ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          Memuat naik...
                                        </>
                                      ) : (
                                        <>
                                          <Upload className="h-4 w-4 mr-2" />
                                          Muat Naik Foto
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                )}

                                {/* Photos Grid */}
                                {(layout.layout_photos || []).length > 0 && (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                    {(layout.layout_photos || []).map((photoUrl, photoIndex) => {
                                      const isThumbnail = layout.thumbnail_photo === photoUrl;
                                      const deleteKey = `${layout.id}-${photoUrl}`;
                                      return (
                                        <div
                                          key={`${photoUrl}-${photoIndex}`}
                                          className={cn(
                                            "relative overflow-hidden rounded-md border aspect-square group",
                                            isThumbnail && "ring-2 ring-primary"
                                          )}
                                        >
                                          <img
                                            src={photoUrl}
                                            alt={`Layout photo ${photoIndex + 1}`}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                          />

                                          {/* Thumbnail Badge */}
                                          {isThumbnail && (
                                            <div className="absolute top-1 left-1">
                                              <Badge variant="default" className="text-xs">
                                                Thumbnail
                                              </Badge>
                                            </div>
                                          )}

                                          {/* Action Buttons */}
                                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            {!isThumbnail && (
                                              <Button
                                                size="icon"
                                                variant="secondary"
                                                className="h-8 w-8"
                                                onClick={() => handleSetThumbnail(index, photoUrl)}
                                                title="Set as thumbnail"
                                              >
                                                <ImageIcon className="h-4 w-4" />
                                              </Button>
                                            )}
                                            <Button
                                              size="icon"
                                              variant="destructive"
                                              className="h-8 w-8"
                                              disabled={deletingLayoutPhoto[deleteKey]}
                                              onClick={() => handleDeleteLayoutPhoto(index, photoUrl)}
                                              title="Delete photo"
                                            >
                                              {deletingLayoutPhoto[deleteKey] ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                              ) : (
                                                <Trash className="h-4 w-4" />
                                              )}
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add New Layout Button */}
                        <Separator />
                        <div className="flex justify-center">
                          <Dialog open={isAddLayoutDialogOpen} onOpenChange={setIsAddLayoutDialogOpen}>
                            <DialogTrigger asChild>
                              <Button size="lg" className="w-full md:w-auto">
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Pilihan Layout
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Tambah Layout Baru</DialogTitle>
                                <DialogDescription>
                                  Isi maklumat layout studio dan muat naik foto-foto
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="new-layout-name">Nama Layout *</Label>
                                    <Input
                                      id="new-layout-name"
                                      value={newLayout.name}
                                      onChange={(e) => setNewLayout(prev => ({ ...prev, name: e.target.value }))}
                                      placeholder="Contoh: Studio Minimalist"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="new-layout-capacity">Kapasiti (orang)</Label>
                                    <Input
                                      id="new-layout-capacity"
                                      type="number"
                                      min="1"
                                      value={newLayout.capacity}
                                      onChange={(e) => setNewLayout(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                                    />
                                  </div>

                                  <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="new-layout-price">Harga per Jam (RM)</Label>
                                    <Input
                                      id="new-layout-price"
                                      type="number"
                                      min="0"
                                      step="10"
                                      value={newLayout.price_per_hour}
                                      onChange={(e) => setNewLayout(prev => ({ ...prev, price_per_hour: parseInt(e.target.value) || 0 }))}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="new-layout-description">Perihal *</Label>
                                  <Textarea
                                    id="new-layout-description"
                                    value={newLayout.description}
                                    onChange={(e) => setNewLayout(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Huraian tentang layout ini..."
                                    rows={4}
                                  />
                                </div>

                                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                  <p className="font-medium mb-1">💡 Nota:</p>
                                  <p>Foto layout boleh dimuat naik selepas layout ditambah. Klik "Tambah" dahulu, kemudian edit layout untuk muat naik foto.</p>
                                </div>
                              </div>

                              <DialogFooter>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setIsAddLayoutDialogOpen(false);
                                    setNewLayout({
                                      name: '',
                                      description: '',
                                      capacity: 1,
                                      price_per_hour: 100
                                    });
                                  }}
                                >
                                  Batal
                                </Button>
                                <Button type="button" onClick={addNewLayout}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Tambah Layout
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent >
                    </Card >
                  </TabsContent >

                  {/* Sub-Tab 2: Add-on Packages */}
                  <TabsContent value="addons" className="space-y-6 mt-6">
                    {/* Add-on Packages */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Pakej Tambahan (Add-on Packages)</CardTitle>
                        <CardDescription>Uruskan pakej tambahan yang boleh dipilih pelanggan</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Existing Packages */}
                        <div className="space-y-6">
                          <h4 className="font-medium">Pakej Semasa</h4>
                          {addonPackages.map((pkg, index) => (
                            <div key={pkg.id} className="border-2 rounded-lg p-6 space-y-4 bg-muted/30 shadow-sm">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Switch
                                    checked={pkg.is_active}
                                    onCheckedChange={(checked) => handleAddonPackageChange(index, 'is_active', checked)}
                                  />
                                  <h5 className="font-medium">{pkg.name}</h5>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAddonPackage(index)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Nama Pakej</Label>
                                  <Input
                                    value={pkg.name}
                                    onChange={(e) => handleAddonPackageChange(index, 'name', e.target.value)}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Harga (RM)</Label>
                                  <Input
                                    type="number"
                                    value={pkg.price}
                                    onChange={(e) => handleAddonPackageChange(index, 'price', parseFloat(e.target.value))}
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Perihal</Label>
                                <Textarea
                                  value={pkg.description}
                                  onChange={(e) => handleAddonPackageChange(index, 'description', e.target.value)}
                                  placeholder="Huraian Pakej"
                                  rows={3}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add New Package Button */}
                        <Separator />
                        <div className="flex justify-center">
                          <Dialog open={isAddAddonDialogOpen} onOpenChange={setIsAddAddonDialogOpen}>
                            <DialogTrigger asChild>
                              <Button size="lg" className="w-full md:w-auto">
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Pakej Tambahan
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Tambah Pakej Tambahan Baru</DialogTitle>
                                <DialogDescription>
                                  Isi maklumat pakej tambahan
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="new-addon-name">Nama Pakej *</Label>
                                    <Input
                                      id="new-addon-name"
                                      value={newAddonPackage.name}
                                      onChange={(e) => setNewAddonPackage(prev => ({ ...prev, name: e.target.value }))}
                                      placeholder="Contoh: Pakej Premium"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="new-addon-price">Harga (RM)</Label>
                                    <Input
                                      id="new-addon-price"
                                      type="number"
                                      min="0"
                                      step="10"
                                      value={newAddonPackage.price}
                                      onChange={(e) => setNewAddonPackage(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="new-addon-description">Perihal *</Label>
                                  <Textarea
                                    id="new-addon-description"
                                    value={newAddonPackage.description}
                                    onChange={(e) => setNewAddonPackage(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Huraian tentang pakej ini..."
                                    rows={4}
                                  />
                                </div>

                                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                  <p className="font-medium mb-1">💡 Nota:</p>
                                  <p>Pakej tambahan akan ditunjukkan kepada pelanggan semasa membuat tempahan. Tempahan dengan pakej tambahan akan dikategorikan secara automatik dalam kolum "Done Delivery" di halaman WhatsApp Blaster.</p>
                                </div>
                              </div>

                              <DialogFooter>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setIsAddAddonDialogOpen(false);
                                    setNewAddonPackage({
                                      name: '',
                                      description: '',
                                      price: 100
                                    });
                                  }}
                                >
                                  Batal
                                </Button>
                                <Button type="button" onClick={addNewAddonPackage}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Tambah Pakej
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card >
                  </TabsContent>
                </Tabs>

                {/* Save Button for Tab 3 */}
                < div className="flex justify-end" >
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
                </div >
              </TabsContent >

              {/* Tab 4: Booking Form */}
              < TabsContent value="booking-form" className="space-y-6 mt-6" >

                {/* Booking Title Customization */}
                < BookingTitleCustomization
                  settings={{
                    bookingTitleText: settings.bookingTitleText,
                    bookingSubtitleText: settings.bookingSubtitleText,
                    bookingTitleFont: settings.bookingTitleFont,
                    bookingTitleSize: settings.bookingTitleSize,
                    bookingSubtitleFont: settings.bookingSubtitleFont,
                    bookingSubtitleSize: settings.bookingSubtitleSize
                  }}
                  onSettingChange={handleSettingChange}
                />

                {/* Terms and Conditions Settings */}
                < Card >
                  <CardHeader>
                    <CardTitle>Terma dan Syarat</CardTitle>
                    <CardDescription>Tetapkan terma dan syarat yang akan dipaparkan dalam borang tempahan</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Label>Jenis Terma dan Syarat</Label>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="tc-none"
                            name="termsType"
                            value="none"
                            checked={settings.termsConditionsType === 'none'}
                            onChange={() => handleSettingChange('termsConditionsType', 'none')}
                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                          />
                          <Label htmlFor="tc-none" className="text-sm">Tiada terma dan syarat</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="tc-text"
                            name="termsType"
                            value="text"
                            checked={settings.termsConditionsType === 'text'}
                            onChange={() => handleSettingChange('termsConditionsType', 'text')}
                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                          />
                          <Label htmlFor="tc-text" className="text-sm">Taipkan teks terma dan syarat</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="tc-pdf"
                            name="termsType"
                            value="pdf"
                            checked={settings.termsConditionsType === 'pdf'}
                            onChange={() => handleSettingChange('termsConditionsType', 'pdf')}
                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                          />
                          <Label htmlFor="tc-pdf" className="text-sm">Muat naik fail PDF</Label>
                        </div>
                      </div>
                    </div>

                    {settings.termsConditionsType === 'text' && (
                      <div className="space-y-2">
                        <Label htmlFor="termsText">Teks Terma dan Syarat</Label>
                        <Textarea
                          id="termsText"
                          value={settings.termsConditionsText}
                          onChange={(e) => handleSettingChange('termsConditionsText', e.target.value)}
                          placeholder="Taip terma dan syarat studio anda di sini..."
                          rows={6}
                          className="min-h-[120px]"
                        />
                      </div>
                    )}

                    {settings.termsConditionsType === 'pdf' && (
                      <div className="space-y-2">
                        <Label htmlFor="termsPdf">Fail PDF Terma dan Syarat</Label>
                        <Input
                          id="termsPdf"
                          type="file"
                          accept=".pdf"
                          disabled={isUploadingPdf}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            if (!effectiveStudioId) {
                              toast({
                                title: "Studio not ready",
                                description: "Please select a studio before uploading a PDF.",
                                variant: "destructive",
                              });
                              return;
                            }

                            setIsUploadingPdf(true);
                            try {
                              const result = await uploadTermsPdf(file, effectiveStudioId);
                              if (result.success && result.url) {
                                handleSettingChange('termsConditionsPdf', result.url);
                                toast({ title: "PDF uploaded", description: "Terms & Conditions PDF updated successfully." });
                              } else {
                                toast({
                                  title: "Upload failed",
                                  description: result.error || "Failed to upload PDF",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              console.error('PDF upload error:', error);
                              toast({
                                title: "Upload failed",
                                description: "Unexpected error while uploading PDF",
                                variant: "destructive",
                              });
                            } finally {
                              setIsUploadingPdf(false);
                              // Clear the input
                              e.target.value = '';
                            }
                          }}
                        />
                        {settings.termsConditionsPdf && (
                          <div className="space-y-2 p-3 bg-muted rounded-md">
                            <span className="text-sm block">Fail semasa:</span>
                            <div className="flex items-center gap-2">
                              <a
                                href={settings.termsConditionsPdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                Lihat PDF
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              {isUploadingPdf && (
                                <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card >

                {/* Time Slot Configuration */}
                < Card >
                  <CardHeader>
                    <CardTitle>Konfigurasi Slot Masa</CardTitle>
                    <CardDescription>Tetapkan jarak antara slot masa dalam borang tempahan</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="timeSlotGap">Jarak Slot Masa</Label>
                      <Select value={settings.timeSlotGap.toString()} onValueChange={(value) => handleSettingChange('timeSlotGap', parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jarak slot masa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minit</SelectItem>
                          <SelectItem value="30">30 minit</SelectItem>
                          <SelectItem value="45">45 minit</SelectItem>
                          <SelectItem value="60">1 jam</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Slot masa akan dipaparkan dengan jarak {settings.timeSlotGap} minit antara setiap pilihan.
                      </p>
                    </div>
                  </CardContent>
                </Card >

                {/* Studio Logo Upload */}
                < Card >
                  <CardHeader>
                    <CardTitle>Logo Studio</CardTitle>
                    <CardDescription>Muat naik logo perniagaan studio untuk dipaparkan dalam borang tempahan</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="studioLogo">Logo Studio</Label>
                      <Input
                        id="studioLogo"
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          if (!effectiveStudioId) {
                            toast({
                              title: "Studio not ready",
                              description: "Please select a studio before uploading a logo.",
                              variant: "destructive",
                            });
                            return;
                          }

                          setIsUploadingLogo(true);
                          try {
                            const result = await uploadLogo(file, effectiveStudioId);
                            if (result.success && result.url) {
                              handleSettingChange('studioLogo', result.url);
                              toast({ title: "Logo uploaded", description: "Logo updated successfully." });
                            } else {
                              toast({
                                title: "Upload failed",
                                description: result.error || "Failed to upload logo",
                                variant: "destructive",
                              });
                            }
                          } catch (error) {
                            console.error('Logo upload error:', error);
                            toast({
                              title: "Upload failed",
                              description: "Unexpected error while uploading logo",
                              variant: "destructive",
                            });
                          } finally {
                            setIsUploadingLogo(false);
                          }
                        }}
                      />
                      {settings.studioLogo ? (
                        <div className="space-y-2 p-3 bg-muted rounded-md">
                          <span className="text-sm block">Logo semasa:</span>
                          <div className="relative h-24 w-24 rounded-md border bg-white overflow-hidden flex items-center justify-center">
                            <img
                              src={settings.studioLogo}
                              alt="Studio logo"
                              className="h-full w-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            {isUploadingLogo && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                                <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Jika tiada logo dimuat naik, logo lalai akan digunakan.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card >

                {/* Form Customization */}
                < Card >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Penyesuaian Borang Tempahan
                    </CardTitle>
                    <CardDescription>Sesuaikan penampilan dan fungsi borang tempahan anda</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Portfolio Showcase */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Enable Portfolio Gallery</Label>
                          <p className="text-sm text-muted-foreground">
                            Display your portfolio photos gallery on the booking form
                          </p>
                        </div>
                        <Switch
                          checked={settings.enablePortfolioPhotoUpload}
                          onCheckedChange={(checked) => handleSettingChange('enablePortfolioPhotoUpload', checked)}
                        />
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold">Portfolio Photos Management</h4>
                        <p className="text-xs text-muted-foreground">
                          Upload photos of your previous work to showcase on your booking form
                        </p>

                        {/* Portfolio Photo Upload Interface */}
                        <Card variant="outline" className="p-4">
                          <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                              <div className="text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="mt-4">
                                  <label htmlFor="portfolio-photo-upload" className="cursor-pointer">
                                    <span className="mt-2 block text-sm font-medium text-gray-900">
                                      Upload portfolio photos
                                    </span>
                                    <span className="mt-1 block text-xs text-gray-500">
                                      JPEG, PNG, GIF up to 10MB each
                                    </span>
                                  </label>
                                  <input
                                    id="portfolio-photo-upload"
                                    name="portfolio-photo-upload"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="sr-only"
                                    onChange={async (e) => {
                                      const files = Array.from(e.target.files || []);
                                      if (files.length === 0) return;

                                      // Clear the input
                                      e.target.value = '';

                                      const { toast } = await import('@/hooks/use-toast');
                                      const { uploadPortfolioPhoto } = await import('@/services/fileUploadService');

                                      for (const file of files) {
                                        try {
                                          const result = await uploadPortfolioPhoto(file);
                                          if (result.success) {
                                            toast({ title: "Success", description: `${file.name} uploaded successfully` });
                                            await fetchPortfolioPhotos();
                                          } else {
                                            toast({
                                              title: "Upload failed",
                                              description: result.error || "Failed to upload photo",
                                              variant: "destructive"
                                            });
                                          }
                                        } catch (error) {
                                          toast({
                                            title: "Upload failed",
                                            description: "Failed to upload photo",
                                            variant: "destructive"
                                          });
                                        }
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Existing Portfolio Photos */}
                            <div className="space-y-2">
                              <Label className="text-xs font-medium">Current Portfolio Photos</Label>
                              <div className="min-h-[120px] space-y-3">
                                {isLoadingPortfolio ? (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading portfolio photos...
                                  </div>
                                ) : portfolioPhotos.length === 0 ? (
                                  <p className="text-xs text-muted-foreground">
                                    No portfolio photos uploaded yet.
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {portfolioPhotos.map((photoUrl, idx) => (
                                      <div
                                        key={`${photoUrl}-${idx}`}
                                        className="relative overflow-hidden rounded-md border bg-muted/30 aspect-square"
                                      >
                                        <img
                                          src={photoUrl}
                                          alt={`Portfolio ${idx + 1}`}
                                          className="h-full w-full object-cover"
                                          loading="lazy"
                                        />
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="absolute top-1 right-1 h-8 w-8 bg-red-600 hover:bg-red-700 text-white"
                                          disabled={deletingPhotoUrl === photoUrl}
                                          onClick={() => handleDeletePortfolioPhoto(photoUrl)}
                                          aria-label="Delete portfolio photo"
                                        >
                                          {deletingPhotoUrl === photoUrl ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Trash className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>

                    <Separator />

                    {/* Header Customization */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Enable Custom Header</Label>
                          <p className="text-sm text-muted-foreground">
                            Tambah header dengan logo dan navigasi di borang tempahan
                          </p>
                        </div>
                        <Switch
                          checked={settings.enableCustomHeader}
                          onCheckedChange={(checked) => handleSettingChange('enableCustomHeader', checked)}
                        />
                      </div>

                      {/* Show Studio Name */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Show Studio Name</Label>
                          <p className="text-sm text-muted-foreground">
                            Paparkan nama studio di bawah logo dalam borang tempahan
                          </p>
                        </div>
                        <Switch
                          checked={settings.showStudioName}
                          onCheckedChange={(checked) => handleSettingChange('showStudioName', checked)}
                        />
                      </div>

                      {settings.enableCustomHeader && (
                        <div className="pl-4 border-l-2 border-primary/20 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="headerLogo">Logo Header</Label>
                            <Input
                              id="headerLogo"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleSettingChange('headerLogo', file.name);
                                }
                              }}
                            />
                            {settings.headerLogo && (
                              <p className="text-xs text-muted-foreground">Logo: {settings.headerLogo}</p>
                            )}
                          </div>

                          <Separator />
                          <Label className="text-sm font-semibold">Navigasi Header</Label>

                          {/* Home Navigation */}
                          <div className="flex items-start gap-4">
                            <Switch
                              checked={settings.headerHomeEnabled}
                              onCheckedChange={(checked) => handleSettingChange('headerHomeEnabled', checked)}
                            />
                            <div className="flex-1 space-y-2">
                              <Label className="text-sm">Home</Label>
                              {settings.headerHomeEnabled && (
                                <Input
                                  placeholder="https://yourwebsite.com"
                                  value={settings.headerHomeUrl}
                                  onChange={(e) => handleSettingChange('headerHomeUrl', e.target.value)}
                                />
                              )}
                            </div>
                          </div>

                          {/* About Navigation */}
                          <div className="flex items-start gap-4">
                            <Switch
                              checked={settings.headerAboutEnabled}
                              onCheckedChange={(checked) => handleSettingChange('headerAboutEnabled', checked)}
                            />
                            <div className="flex-1 space-y-2">
                              <Label className="text-sm">About</Label>
                              {settings.headerAboutEnabled && (
                                <Input
                                  placeholder="https://yourwebsite.com/about"
                                  value={settings.headerAboutUrl}
                                  onChange={(e) => handleSettingChange('headerAboutUrl', e.target.value)}
                                />
                              )}
                            </div>
                          </div>

                          {/* Portfolio Navigation */}
                          <div className="flex items-start gap-4">
                            <Switch
                              checked={settings.headerPortfolioEnabled}
                              onCheckedChange={(checked) => handleSettingChange('headerPortfolioEnabled', checked)}
                            />
                            <div className="flex-1 space-y-2">
                              <Label className="text-sm">Portfolio</Label>
                              {settings.headerPortfolioEnabled && (
                                <Input
                                  placeholder="https://yourwebsite.com/portfolio"
                                  value={settings.headerPortfolioUrl}
                                  onChange={(e) => handleSettingChange('headerPortfolioUrl', e.target.value)}
                                />
                              )}
                            </div>
                          </div>

                          {/* Contact Navigation */}
                          <div className="flex items-start gap-4">
                            <Switch
                              checked={settings.headerContactEnabled}
                              onCheckedChange={(checked) => handleSettingChange('headerContactEnabled', checked)}
                            />
                            <div className="flex-1 space-y-2">
                              <Label className="text-sm">Contact</Label>
                              {settings.headerContactEnabled && (
                                <Input
                                  placeholder="https://yourwebsite.com/contact"
                                  value={settings.headerContactUrl}
                                  onChange={(e) => handleSettingChange('headerContactUrl', e.target.value)}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Customization */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Enable Custom Footer</Label>
                          <p className="text-sm text-muted-foreground">
                            Tambah footer dengan ikon media sosial
                          </p>
                        </div>
                        <Switch
                          checked={settings.enableCustomFooter}
                          onCheckedChange={(checked) => handleSettingChange('enableCustomFooter', checked)}
                        />
                      </div>

                      {settings.enableCustomFooter && (
                        <div className="pl-4 border-l-2 border-primary/20 space-y-4">
                          <Label className="text-sm font-semibold">Pautan Media Sosial</Label>

                          <div className="space-y-2">
                            <Label htmlFor="footerWhatsapp" className="text-sm">WhatsApp</Label>
                            <Input
                              id="footerWhatsapp"
                              placeholder="https://wa.me/60123456789"
                              value={settings.footerWhatsappLink}
                              onChange={(e) => handleSettingChange('footerWhatsappLink', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="footerFacebook" className="text-sm">Facebook</Label>
                            <Input
                              id="footerFacebook"
                              placeholder="https://facebook.com/yourstudio"
                              value={settings.footerFacebookLink}
                              onChange={(e) => handleSettingChange('footerFacebookLink', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="footerInstagram" className="text-sm">Instagram</Label>
                            <Input
                              id="footerInstagram"
                              placeholder="https://instagram.com/yourstudio"
                              value={settings.footerInstagramLink}
                              onChange={(e) => handleSettingChange('footerInstagramLink', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="footerTrademark" className="text-sm">Trademark</Label>
                            <Input
                              id="footerTrademark"
                              placeholder=" 2025 {{BrandName}}. All rights reserved."
                              value={settings.footerTrademark}
                              onChange={(e) => handleSettingChange('footerTrademark', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Enter your custom trademark text</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* WhatsApp Float Button */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Enable WhatsApp Button</Label>
                          <p className="text-sm text-muted-foreground">
                            Butang WhatsApp terapung di borang tempahan
                          </p>
                        </div>
                        <Switch
                          checked={settings.enableWhatsappButton}
                          onCheckedChange={(checked) => handleSettingChange('enableWhatsappButton', checked)}
                        />
                      </div>

                      {settings.enableWhatsappButton && (
                        <div className="pl-4 border-l-2 border-primary/20 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="whatsappMessage" className="text-sm">Teks Butang</Label>
                            <Input
                              id="whatsappMessage"
                              placeholder="Hubungi kami"
                              value={settings.whatsappMessage}
                              onChange={(e) => handleSettingChange('whatsappMessage', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="whatsappNumber" className="text-sm">Nombor WhatsApp</Label>
                            <Input
                              id="whatsappNumber"
                              placeholder="+601129947089"
                              value={settings.ownerPhone}
                              onChange={(e) => handleSettingChange('ownerPhone', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              Menggunakan nombor telefon dari tetapan pemilik
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Brand Colors */}
                    <div className="space-y-4">
                      <Label className="text-base">Warna Jenama</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Pilih warna untuk header, footer, dan butang
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="brandColorPrimary" className="text-sm">Warna Utama</Label>
                          <div className="flex gap-2">
                            <Input
                              id="brandColorPrimary"
                              type="color"
                              value={settings.brandColorPrimary}
                              onChange={(e) => handleSettingChange('brandColorPrimary', e.target.value)}
                              className="w-20 h-10"
                            />
                            <Input
                              type="text"
                              value={settings.brandColorPrimary}
                              onChange={(e) => handleSettingChange('brandColorPrimary', e.target.value)}
                              placeholder="#000000"
                              className="flex-1"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="brandColorSecondary" className="text-sm">Warna Teks</Label>
                          <div className="flex gap-2">
                            <Input
                              id="brandColorSecondary"
                              type="color"
                              value={settings.brandColorSecondary}
                              onChange={(e) => handleSettingChange('brandColorSecondary', e.target.value)}
                              className="w-20 h-10"
                            />
                            <Input
                              type="text"
                              value={settings.brandColorSecondary}
                              onChange={(e) => handleSettingChange('brandColorSecondary', e.target.value)}
                              placeholder="#ffffff"
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Preview Section */}
                    <Separator />
                    <div className="space-y-4">
                      <Label className="text-base">Pratonton</Label>
                      <p className="text-sm text-muted-foreground">
                        Lihat pratonton borang tempahan dengan tetapan semasa
                      </p>
                      <BookingFormPreview
                        settings={{
                          enableCustomHeader: settings.enableCustomHeader,
                          enableCustomFooter: settings.enableCustomFooter,
                          enableWhatsappButton: settings.enableWhatsappButton,
                          headerLogo: settings.headerLogo,
                          headerHomeEnabled: settings.headerHomeEnabled,
                          headerHomeUrl: settings.headerHomeUrl,
                          headerAboutEnabled: settings.headerAboutEnabled,
                          headerAboutUrl: settings.headerAboutUrl,
                          headerPortfolioEnabled: settings.headerPortfolioEnabled,
                          headerPortfolioUrl: settings.headerPortfolioUrl,
                          headerContactEnabled: settings.headerContactEnabled,
                          headerContactUrl: settings.headerContactUrl,
                          footerWhatsappLink: settings.footerWhatsappLink,
                          footerFacebookLink: settings.footerFacebookLink,
                          footerInstagramLink: settings.footerInstagramLink,
                          whatsappMessage: settings.whatsappMessage,
                          whatsappPhoneNumber: settings.ownerPhone,
                          brandColorPrimary: settings.brandColorPrimary,
                          brandColorSecondary: settings.brandColorSecondary
                        }}
                      />
                    </div>
                  </CardContent>
                </Card >

                {/* Save Button for Tab 4 */}
                < div className="flex justify-end" >
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
                </div >
              </TabsContent >

              {/* Tab 5: Users */}
              < TabsContent value="users" className="space-y-6 mt-6" >
                {/* Add New User Form */}
                < Card >
                  <CardHeader>
                    <CardTitle>Add New User</CardTitle>
                    <CardDescription>Create a new admin user for this studio. The user will be able to login immediately without email verification.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="userEmail">Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="userEmail"
                            type="email"
                            value={newUserForm.email}
                            onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                            placeholder="user@example.com"
                            className="pl-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="userFullName">Full Name *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="userFullName"
                            value={newUserForm.full_name}
                            onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                            placeholder="John Doe"
                            className="pl-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="userPhone">Phone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="userPhone"
                            type="tel"
                            value={newUserForm.phone}
                            onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                            placeholder="+60123456789"
                            className="pl-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="userPassword">Password *</Label>
                        <Input
                          id="userPassword"
                          type="password"
                          value={newUserForm.password}
                          onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                          placeholder="Minimum 6 characters"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleCreateUser}
                        disabled={isCreatingUser}
                      >
                        {isCreatingUser ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Create User
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card >

                {/* Existing Users List */}
                < Card >
                  <CardHeader>
                    <CardTitle>Studio Users</CardTitle>
                    <CardDescription>Manage users associated with this studio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingUsers ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : studioUsers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No users found</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studioUsers.map((studioUser) => (
                            <TableRow key={studioUser.id}>
                              <TableCell className="font-medium">
                                {studioUser.full_name}
                              </TableCell>
                              <TableCell>{studioUser.email}</TableCell>
                              <TableCell>{studioUser.phone || '-'}</TableCell>
                              <TableCell>
                                <Badge variant="default">
                                  {studioUser.role === 'admin' ? 'Admin' : studioUser.role === 'staff' ? 'Staff' : studioUser.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(studioUser.created_at).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card >
              </TabsContent >
            </Tabs >
          </div >
        </main >
      </div >
    );
  }
};

export default AdminSettings;
