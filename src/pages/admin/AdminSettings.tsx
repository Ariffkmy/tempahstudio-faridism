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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, X, Upload, MapPin, Phone, Mail, CreditCard, User, Link as LinkIcon, Copy, Loader2, Menu, Home, CalendarDays, BarChart3, Cog, LogOut, Building2, ExternalLink, Palette, Image as ImageIcon, Users as UsersIcon, Trash, Trash2, MessageCircle, Paintbrush, Layout, Edit, Save, Clock, CheckCircle2, AlertCircle, Check, Lock } from 'lucide-react';
import { loadStudioSettings, saveStudioSettings, updateStudioLayouts, initiateGoogleAuth, exchangeGoogleCode, loadStudioPortfolioPhotos, deleteStudioPortfolioPhoto } from '@/services/studioSettings';
import { supabase } from '@/lib/supabase';
import { uploadLogo, uploadTermsPdf } from '@/services/fileUploadService';
import BookingFormPreview, { PreviewSettings } from '@/components/booking/preview/BookingFormPreview';
import { BookingTitleCustomization } from '@/components/admin/BookingTitleCustomization';
import { StaffManagementCard } from '@/components/admin/StaffManagementCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { StudioLayout } from '@/types/database';
import type { AddonPackage } from '@/types/booking';
import { createStudioUser, getStudioAdmins, updateStudioUser, deleteStudioUser } from '@/services/adminAuth';
import { getStudioStaff, createStaff, updateStaff, deleteStaff } from '@/services/studioStaffService';
import type { AdminUser } from '@/types/database';
import type { StudioStaff, StaffRole } from '@/types/studioStaff';
import { useSidebar } from '@/contexts/SidebarContext';
import { usePackageAccess } from '@/hooks/usePackageAccess';
import { FEATURES } from '@/config/packageFeatures';
import { UpgradePrompt } from '@/components/access/UpgradePrompt';


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
  const [isUploadingAboutPhoto, setIsUploadingAboutPhoto] = useState(false);
  const [isUploadingTngQr, setIsUploadingTngQr] = useState(false);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const [deletingPhotoUrl, setDeletingPhotoUrl] = useState<string | null>(null);

  // Package access control
  const { hasFeature, getRequiredTier, getSubAccountLimit } = usePackageAccess();
  const canCustomizeBookingForm = hasFeature(FEATURES.BOOKING_CUSTOMIZATION);
  const canEnableFPX = hasFeature(FEATURES.FPX_PAYMENT);
  const maxSubAccounts = getSubAccountLimit();
  const [showCustomizationUpgradePrompt, setShowCustomizationUpgradePrompt] = useState(false);
  const [showFpxUpgradePrompt, setShowFpxUpgradePrompt] = useState(false);
  const customizationRequiredTier = getRequiredTier(FEATURES.BOOKING_CUSTOMIZATION);
  const fpxRequiredTier = getRequiredTier(FEATURES.FPX_PAYMENT);

  const [settings, setSettings] = useState({
    studioName: '',
    slug: '',
    studioLocation: '',
    googleMapsLink: '',
    wazeLink: '',
    ownerName: '',
    ownerPhone: '',
    studioEmail: '',
    studioPhone: '',
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
    headerHomeText: '',
    headerAboutEnabled: false,
    headerAboutUrl: '',
    headerAboutText: '',
    headerAboutPhoto: '',
    headerPortfolioEnabled: false,
    headerPortfolioUrl: '',
    headerContactEnabled: false,
    headerContactUrl: '',
    headerContactAddress: '',
    headerContactPhone: '',
    headerContactEmail: '',
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
    bookingSubtitleSize: 'base',
    // Studio operational status
    isOperational: true,
    // Operating hours
    operatingStartTime: '09:00',
    operatingEndTime: '18:00',
    breakStartTime: '13:00',
    breakEndTime: '14:00',
    // Deposit settings
    depositEnabled: false,
    depositAmount: 0,
    // Payment methods
    paymentStudioEnabled: false,
    paymentQrEnabled: false,
    paymentBankTransferEnabled: false,
    paymentFpxEnabled: false,
    paymentTngEnabled: false,
    tngQrCode: ''
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
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    email: '',
    full_name: '',
    phone: '',
  });
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);

  // Staff management state
  const [staffMembers, setStaffMembers] = useState<StudioStaff[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: 'Photographer' as StaffRole,
  });
  const [isDeletingStaff, setIsDeletingStaff] = useState<string | null>(null);

  // Unavailable dates state
  const [isDateRange, setIsDateRange] = useState(false);
  const [isWholeDay, setIsWholeDay] = useState(true); // Default to whole day
  const [unavailableDate, setUnavailableDate] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    startTime: '09:00',
    endTime: '18:00'
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState<any[]>([]);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [isEditingOperatingHours, setIsEditingOperatingHours] = useState(false);
  const [isEditingBreakTime, setIsEditingBreakTime] = useState(false);

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

  // Checklist state
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  const checklistItems = [
    {
      id: 'basic-info',
      label: 'Maklumat asas studio',
      isComplete: !!(settings.studioName && settings.studioEmail && settings.studioPhone && settings.studioLocation),
      description: 'Lengkapkan nama, emel, telefon dan lokasi studio'
    },
    {
      id: 'packages',
      label: 'Pakej',
      isComplete: layouts.length > 0,
      description: 'Tambah sekurang-kurangnya satu layout studio'
    },
    {
      id: 'booking-form',
      label: 'Booking Form',
      isComplete: !!(
        settings.timeSlotGap &&
        (settings.paymentStudioEnabled || settings.paymentQrEnabled ||
          settings.paymentBankTransferEnabled || settings.paymentFpxEnabled ||
          settings.paymentTngEnabled)
      ),
      description: 'Tetapkan jarak slot masa dan aktifkan sekurang-kurangnya satu kaedah pembayaran'
    },
    {
      id: 'operating-hours',
      label: 'Waktu operasi',
      isComplete: !!(settings.operatingStartTime && settings.operatingEndTime),
      description: 'Tetapkan waktu buka dan tutup studio'
    }
  ];

  const completedCount = checklistItems.filter(item => item.isComplete).length;
  const progressPercentage = Math.round((completedCount / checklistItems.length) * 100);

  // Donut Chart Component
  const ProgressDonut = ({ percentage, size = 48 }: { percentage: number, size?: number }) => {
    const strokeWidth = 5;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-muted/20"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: offset }}
            className="text-primary transition-all duration-500 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-[10px] font-bold">{percentage}%</span>
      </div>
    );
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
            studioPhone: data.studioPhone || '',
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
            headerHomeText: data.headerHomeText || '',
            headerAboutEnabled: data.headerAboutEnabled || false,
            headerAboutUrl: data.headerAboutUrl || '',
            headerAboutText: data.headerAboutText || '',
            headerAboutPhoto: data.headerAboutPhoto || '',
            headerPortfolioEnabled: data.headerPortfolioEnabled || false,
            headerPortfolioUrl: data.headerPortfolioUrl || '',
            headerContactEnabled: data.headerContactEnabled || false,
            headerContactUrl: data.headerContactUrl || '',
            headerContactAddress: data.headerContactAddress || '',
            headerContactPhone: data.headerContactPhone || '',
            headerContactEmail: data.headerContactEmail || '',
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
            bookingSubtitleSize: data.bookingSubtitleSize || 'base',
            isOperational: data.isOperational !== false, // Default to true if not set
            operatingStartTime: data.operatingStartTime || '09:00',
            operatingEndTime: data.operatingEndTime || '18:00',
            breakStartTime: data.breakStartTime || '13:00',
            breakEndTime: data.breakEndTime || '14:00',
            depositEnabled: data.depositEnabled || false,
            depositAmount: data.depositAmount || 0,
            // Payment methods
            paymentStudioEnabled: data.paymentStudioEnabled || false,
            paymentQrEnabled: data.paymentQrEnabled || false,
            paymentBankTransferEnabled: data.paymentBankTransferEnabled || false,
            paymentFpxEnabled: data.paymentFpxEnabled || false,
            paymentTngEnabled: data.paymentTngEnabled || false,
            tngQrCode: data.tngQrCode || ''
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

  // Load unavailable dates on mount
  useEffect(() => {
    loadUnavailableDates();
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

  // Handle edit user
  const handleEditUser = (studioUser: AdminUser) => {
    setEditingUserId(studioUser.id);
    setEditUserForm({
      email: studioUser.email,
      full_name: studioUser.full_name,
      phone: studioUser.phone || '',
    });
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditUserForm({
      email: '',
      full_name: '',
      phone: '',
    });
  };

  // Handle save edit
  const handleSaveEdit = async (userId: string) => {
    // Validate form
    if (!editUserForm.email || !editUserForm.full_name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editUserForm.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await updateStudioUser(userId, {
        email: editUserForm.email,
        full_name: editUserForm.full_name,
        phone: editUserForm.phone || undefined,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "User updated successfully",
        });
        // Reset edit state
        handleCancelEdit();
        // Reload users
        await loadStudioUsers();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    setIsDeletingUser(userId);
    try {
      const result = await deleteStudioUser(userId);

      if (result.success) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        // Reload users
        await loadStudioUsers();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsDeletingUser(null);
    }
  };

  // ===== STAFF MANAGEMENT FUNCTIONS =====

  // Load staff members
  const loadStaffMembers = async () => {
    if (!effectiveStudioId) return;

    setIsLoadingStaff(true);
    try {
      const staff = await getStudioStaff(effectiveStudioId);
      setStaffMembers(staff);
    } catch (error) {
      console.error('Error loading staff:', error);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStaff(false);
    }
  };

  // Load staff when studio ID is available
  useEffect(() => {
    if (effectiveStudioId) {
      loadStaffMembers();
    }
  }, [effectiveStudioId]);

  // Handle create/edit staff
  const handleSaveStaff = async () => {
    if (!staffForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter staff name",
        variant: "destructive",
      });
      return;
    }

    if (!effectiveStudioId) return;

    try {
      let result;
      if (editingStaffId) {
        // Update existing staff
        result = await updateStaff(editingStaffId, staffForm.name);
      } else {
        // Create new staff
        result = await createStaff(effectiveStudioId, staffForm.name, staffForm.role);
      }

      if (result.success) {
        toast({
          title: "Success",
          description: editingStaffId ? "Staff updated successfully" : "Staff created successfully",
        });
        setIsStaffDialogOpen(false);
        setStaffForm({ name: '', role: 'Photographer' });
        setEditingStaffId(null);
        await loadStaffMembers();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save staff",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving staff:', error);
      toast({
        title: "Error",
        description: "Failed to save staff",
        variant: "destructive",
      });
    }
  };

  // Handle edit staff
  const handleEditStaff = (staff: StudioStaff) => {
    setEditingStaffId(staff.id);
    setStaffForm({
      name: staff.name,
      role: staff.role,
    });
    setIsStaffDialogOpen(true);
  };

  // Handle delete staff
  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (!confirm(`Adakah anda pasti mahu memadam ${staffName}? Tindakan ini tidak boleh dibatalkan.`)) {
      return;
    }

    setIsDeletingStaff(staffId);
    try {
      const result = await deleteStaff(staffId);

      if (result.success) {
        toast({
          title: "Success",
          description: "Staff deleted successfully",
        });
        await loadStaffMembers();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete staff",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast({
        title: "Error",
        description: "Failed to delete staff",
        variant: "destructive",
      });
    } finally {
      setIsDeletingStaff(null);
    }
  };

  // Handle open new staff dialog
  const handleOpenNewStaffDialog = () => {
    setEditingStaffId(null);
    setStaffForm({ name: '', role: 'Photographer' });
    setIsStaffDialogOpen(true);
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
          const result = await exchangeGoogleCode(code);

          if (result.success) {
            toast({
              title: "Success!",
              description: "Google Calendar authorization completed. Integration is now active.",
            });

            // Reload settings to reflect new state
            const data = await loadStudioSettings();
            if (data) {
              setSettings(prev => ({
                ...prev,
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

  // Load unavailable dates
  const loadUnavailableDates = async () => {
    if (!effectiveStudioId) return;

    console.log('📅 Loading unavailable dates for studio:', effectiveStudioId);

    const { data, error } = await supabase
      .from('unavailable_dates')
      .select('*')
      .eq('studio_id', effectiveStudioId)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('❌ Error loading unavailable dates:', error);
      return;
    }

    console.log('✅ Loaded unavailable dates:', data);
    setUnavailableDates(data || []);
  };

  // Handle deleting unavailable date
  const handleDeleteUnavailableDate = async (dateId: string, dateInfo: string) => {
    const confirmed = window.confirm(
      `Adakah anda pasti mahu memadam tarikh ini?\n\n${dateInfo}`
    );

    if (!confirmed) {
      console.log('❌ Delete cancelled by user');
      return;
    }

    console.log('🗑️ Deleting unavailable date:', dateId);

    try {
      const { error } = await supabase
        .from('unavailable_dates')
        .delete()
        .eq('id', dateId);

      if (error) {
        console.error('❌ Error deleting:', error);
        toast({
          title: "Error",
          description: `Failed to delete: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Successfully deleted');
      toast({
        title: "Success",
        description: "Tarikh tidak beroperasi telah dipadam",
      });

      // Reload the list
      await loadUnavailableDates();

    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast({
        title: "Error",
        description: "Unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle editing unavailable date
  const handleEditUnavailableDate = (date: any) => {
    console.log('✏️ Editing unavailable date:', date);

    // Populate form with existing data
    setUnavailableDate({
      startDate: date.start_date,
      endDate: date.end_date || '',
      reason: date.reason || '',
      startTime: date.start_time || '09:00',
      endTime: date.end_time || '18:00'
    });

    // Set toggles
    setIsDateRange(!!date.end_date);
    setIsWholeDay(date.is_whole_day);

    // Set editing ID
    setEditingDateId(date.id);

    // Open dialog
    setIsDialogOpen(true);
  };

  // Save operating hours to database
  const handleSaveOperatingHours = async () => {
    try {
      console.log('💾 Saving operating hours...', {
        operatingStartTime: settings.operatingStartTime,
        operatingEndTime: settings.operatingEndTime
      });

      const { error } = await supabase
        .from('studios')
        .update({
          operating_start_time: settings.operatingStartTime,
          operating_end_time: settings.operatingEndTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', effectiveStudioId);

      if (error) {
        console.error('❌ Error saving operating hours:', error);
        toast({
          title: "Error",
          description: "Failed to save operating hours",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Operating hours saved successfully');
      toast({
        title: "Success",
        description: "Waktu operasi telah disimpan",
      });
      setIsEditingOperatingHours(false);
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast({
        title: "Error",
        description: "Unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Save break time to database
  const handleSaveBreakTime = async () => {
    try {
      console.log('💾 Saving break time...', {
        breakStartTime: settings.breakStartTime,
        breakEndTime: settings.breakEndTime
      });

      const { error } = await supabase
        .from('studios')
        .update({
          break_start_time: settings.breakStartTime,
          break_end_time: settings.breakEndTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', effectiveStudioId);

      if (error) {
        console.error('❌ Error saving break time:', error);
        toast({
          title: "Error",
          description: "Failed to save break time",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Break time saved successfully');
      toast({
        title: "Success",
        description: "Waktu berehat telah disimpan",
      });
      setIsEditingBreakTime(false);
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast({
        title: "Error",
        description: "Unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Toggle operational status and save to database
  const handleToggleOperationalStatus = async (newStatus: boolean) => {
    const action = newStatus ? 'membuka semula' : 'menutup';
    const message = newStatus
      ? 'Anda pasti mahu membuka semula studio? Pelanggan akan dapat membuat tempahan.'
      : 'Anda pasti mahu menutup studio? Pelanggan tidak akan dapat membuat tempahan baru.';

    if (!window.confirm(message)) {
      return;
    }

    try {
      console.log(`🔄 ${action} studio...`, { isOperational: newStatus });

      // Update state first for immediate UI feedback
      setSettings({ ...settings, isOperational: newStatus });

      const { error } = await supabase
        .from('studios')
        .update({
          is_operational: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', effectiveStudioId);

      if (error) {
        console.error('❌ Error updating operational status:', error);
        // Revert state on error
        setSettings({ ...settings, isOperational: !newStatus });
        toast({
          title: "Error",
          description: "Failed to update operational status",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Operational status updated successfully');
      toast({
        title: "Success",
        description: newStatus
          ? "Studio telah dibuka semula"
          : "Studio telah ditutup",
      });
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      // Revert state on error
      setSettings({ ...settings, isOperational: !newStatus });
      toast({
        title: "Error",
        description: "Unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle adding unavailable date
  const handleAddUnavailableDate = async () => {
    console.log('🔵 [handleAddUnavailableDate] Starting...');
    console.log('📅 Form Data:', {
      startDate: unavailableDate.startDate,
      endDate: unavailableDate.endDate,
      reason: unavailableDate.reason,
      isWholeDay,
      isDateRange,
      startTime: unavailableDate.startTime,
      endTime: unavailableDate.endTime
    });

    if (!unavailableDate.startDate) {
      console.log('❌ No start date provided');
      toast({
        title: "Error",
        description: "Sila pilih tarikh mula",
        variant: "destructive",
      });
      return;
    }

    if (isDateRange && !unavailableDate.endDate) {
      console.log('❌ Date range selected but no end date');
      toast({
        title: "Error",
        description: "Sila pilih tarikh tamat untuk julat tarikh",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🔄 Preparing data for database...');
      const dataToSave = {
        studio_id: effectiveStudioId,
        start_date: unavailableDate.startDate,
        end_date: isDateRange ? unavailableDate.endDate : null,
        is_whole_day: isWholeDay,
        start_time: isWholeDay ? null : unavailableDate.startTime,
        end_time: isWholeDay ? null : unavailableDate.endTime,
        reason: unavailableDate.reason || null
      };

      console.log('💾 Data to save:', dataToSave);
      console.log('📝 Editing mode:', editingDateId ? 'UPDATE' : 'INSERT');

      let data, error;

      if (editingDateId) {
        // Update existing date
        const result = await supabase
          .from('unavailable_dates')
          .update(dataToSave)
          .eq('id', editingDateId)
          .select();
        data = result.data;
        error = result.error;
      } else {
        // Insert new date
        const result = await supabase
          .from('unavailable_dates')
          .insert([dataToSave])
          .select();
        data = result.data;
        error = result.error;
      }

      console.log('📡 Supabase response:', { data, error });

      if (error) {
        console.error('❌ Supabase error:', error);
        toast({
          title: "Error",
          description: `Failed to save: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Successfully saved!', data);
      toast({
        title: "Success",
        description: editingDateId
          ? "Tarikh tidak beroperasi telah dikemaskini"
          : "Tarikh tidak beroperasi telah ditambah",
      });

      // Reset form
      setUnavailableDate({
        startDate: '',
        endDate: '',
        reason: '',
        startTime: '09:00',
        endTime: '18:00'
      });
      setIsDateRange(false);
      setIsWholeDay(true);
      setEditingDateId(null); // Reset editing state

      // Close dialog
      setIsDialogOpen(false);

      // Reload the list
      await loadUnavailableDates();

    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast({
        title: "Error",
        description: "Unexpected error occurred",
        variant: "destructive",
      });
    }
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
              <img src="/tempahstudiologo.png" alt="Tempah Studio Logo" style={{ width: '32px', height: '19px' }} />
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
                      <img src="/tempahstudiologo.png" alt="Tempah Studio Logo" style={{ width: '48px', height: '29px' }} />
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

          {/* Checklist Button & Progress */}
          <div className="mb-6 flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
            <div className="flex items-center gap-4">
              <ProgressDonut percentage={progressPercentage} size={56} />
              <div>
                <h3 className="font-semibold text-sm">Kemajuan Konfigurasi</h3>
                <p className="text-xs text-muted-foreground">{completedCount} daripada {checklistItems.length} langkah selesai</p>
              </div>
            </div>
            <Dialog open={isChecklistOpen} onOpenChange={setIsChecklistOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-background">
                  Lihat Konfigurasi Wajib
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Konfigurasi Wajib Studio</DialogTitle>
                  <DialogDescription>
                    Lengkapkan langkah-langkah berikut untuk memastikan studio anda sedia untuk menerima tempahan.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Accordion type="single" collapsible className="w-full">
                    {checklistItems.map((item) => (
                      <AccordionItem key={item.id} value={item.id} className="border-none">
                        <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20 mb-2">
                          {item.isComplete ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            {item.id === 'basic-info' || item.id === 'packages' || item.id === 'booking-form' || item.id === 'operating-hours' ? (
                              <AccordionTrigger className="p-0 hover:no-underline py-0">
                                <div className="text-left">
                                  <p className={cn("text-sm font-medium", item.isComplete ? "text-foreground" : "text-muted-foreground")}>
                                    {item.label}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {item.description}
                                  </p>
                                </div>
                              </AccordionTrigger>
                            ) : (
                              <div>
                                <p className={cn("text-sm font-medium", item.isComplete ? "text-foreground" : "text-muted-foreground")}>
                                  {item.label}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {item.description}
                                </p>
                              </div>
                            )}

                            {item.id === 'basic-info' && (
                              <AccordionContent className="pt-4 pb-0">
                                <div className="grid grid-cols-2 min-[600px]:grid-cols-4 gap-3">
                                  {[
                                    { label: 'Nama Studio', key: 'studioName', placeholder: 'Nama studio' },
                                    { label: 'Telefon Studio', key: 'studioPhone', placeholder: '012-3456789' },
                                    { label: 'Lokasi Studio', key: 'studioLocation', placeholder: 'Alamat' },
                                    { label: 'Google Map Link', key: 'googleMapsLink', placeholder: 'Link' },
                                    { label: 'Emel studio', key: 'studioEmail', type: 'email', placeholder: 'info@studio.com' },
                                    { label: 'Akaun Bank', key: 'bankAccountNumber', placeholder: '1234567890' },
                                    { label: 'Pemilik Akaun', key: 'accountOwnerName', placeholder: 'Nama' },
                                  ].map((field) => (
                                    <div key={field.key} className="space-y-1 min-w-0">
                                      <div className="flex items-center gap-1.5 overflow-hidden">
                                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">
                                          {field.label}
                                        </Label>
                                        {(settings as any)[field.key] && <Check className="h-2.5 w-2.5 text-green-600 shrink-0" />}
                                      </div>
                                      <Input
                                        className="h-8 text-[10px] bg-background px-2"
                                        placeholder={field.placeholder}
                                        value={(settings as any)[field.key]}
                                        type={field.type || 'text'}
                                        onChange={(e) => handleSettingChange(field.key, e.target.value)}
                                      />
                                    </div>
                                  ))}
                                  <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">
                                        Kod QR
                                      </Label>
                                      {settings.qrCode && <Check className="h-2.5 w-2.5 text-green-600 shrink-0" />}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      {settings.qrCode && (
                                        <div className="relative w-full aspect-square max-w-[120px] rounded-lg border overflow-hidden mx-auto bg-white">
                                          <img src={settings.qrCode} className="w-full h-full object-contain" alt="QR Code" />
                                        </div>
                                      )}
                                      <Input
                                        type="file"
                                        accept="image/*"
                                        className="h-8 text-[10px] bg-background cursor-pointer px-1 file:text-[9px] file:mr-1 file:px-1"
                                        disabled={isUploadingQr}
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file || !effectiveStudioId) return;
                                          setIsUploadingQr(true);
                                          try {
                                            const { uploadLogo } = await import('@/services/fileUploadService');
                                            const result = await uploadLogo(file, effectiveStudioId);
                                            if (result.success && result.url) {
                                              handleSettingChange('qrCode', result.url);
                                              toast({ title: "QR Uploaded", description: "QR code updated successfully" });
                                            }
                                          } catch (error) {
                                            toast({ title: "Error", description: "Failed to upload QR code", variant: "destructive" });
                                          } finally {
                                            setIsUploadingQr(false);
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </AccordionContent>
                            )}

                            {item.id === 'packages' && (
                              <AccordionContent className="pt-4 pb-0">
                                <div className="space-y-4">
                                  {/* Existing Packages List with Photos */}
                                  {layouts.length > 0 && (
                                    <div className="space-y-3 pb-2">
                                      {layouts.map((layout, idx) => (
                                        <div key={layout.id} className="p-3 rounded-lg bg-background border border-border/50 shadow-sm space-y-3">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
                                                {layout.thumbnail_photo ? (
                                                  <img src={layout.thumbnail_photo} className="w-full h-full object-cover" alt={layout.name} />
                                                ) : (
                                                  <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                                                )}
                                              </div>
                                              <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-bold text-foreground truncate">{layout.name}</span>
                                                <span className="text-[10px] text-muted-foreground">RM{layout.price_per_hour}/jam • {layout.capacity} Pax</span>
                                              </div>
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                              onClick={() => removeLayout(idx)}
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </div>

                                          {/* Mini Photo Grid */}
                                          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                                            {(layout.layout_photos || []).map((photoUrl, pIdx) => {
                                              const deleteKey = `${layout.id}-${photoUrl}`;
                                              return (
                                                <div key={pIdx} className="relative w-14 h-14 rounded-md overflow-hidden border border-border/50 shrink-0 group">
                                                  <img src={photoUrl} className="w-full h-full object-cover" alt={`Layout ${idx} photo ${pIdx}`} />
                                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                      onClick={() => handleDeleteLayoutPhoto(idx, photoUrl)}
                                                      disabled={deletingLayoutPhoto[deleteKey]}
                                                      className="p-1 bg-destructive text-white rounded hover:bg-destructive/80 transition-colors"
                                                    >
                                                      {deletingLayoutPhoto[deleteKey] ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                      ) : (
                                                        <Trash className="h-3 w-3" />
                                                      )}
                                                    </button>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                            {(layout.layout_photos || []).length < 5 && (
                                              <div className="shrink-0">
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  id={`checklist-photo-mobile-${layout.id}`}
                                                  className="hidden"
                                                  onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                      await handleUploadLayoutPhoto(idx, file);
                                                      e.target.value = '';
                                                    }
                                                  }}
                                                />
                                                <button
                                                  onClick={() => document.getElementById(`checklist-photo-mobile-${layout.id}`)?.click()}
                                                  disabled={uploadingLayoutPhoto[layout.id]}
                                                  className="w-14 h-14 rounded-md border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-50"
                                                >
                                                  {uploadingLayoutPhoto[layout.id] ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                  ) : (
                                                    <Plus className="h-4 w-4 text-muted-foreground/50" />
                                                  )}
                                                  <span className="text-[7px] text-muted-foreground/60 font-bold mt-1 uppercase">Foto</span>
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Add New Package Grid */}
                                  <div className="grid grid-cols-2 min-[600px]:grid-cols-4 gap-3 pt-2 border-t border-border/50">
                                    <div className="space-y-1 min-w-0">
                                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate block">Nama Pakej</Label>
                                      <Input
                                        className="h-8 text-[10px] bg-background px-2"
                                        placeholder="e.g. Studio A"
                                        value={newLayout.name}
                                        onChange={(e) => setNewLayout(prev => ({ ...prev, name: e.target.value }))}
                                      />
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate block">Perihal</Label>
                                      <Input
                                        className="h-8 text-[10px] bg-background px-2"
                                        placeholder="e.g. Studio luas..."
                                        value={newLayout.description}
                                        onChange={(e) => setNewLayout(prev => ({ ...prev, description: e.target.value }))}
                                      />
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate block">Kapasiti / Harga</Label>
                                      <div className="flex gap-1">
                                        <Input
                                          type="number"
                                          className="h-8 w-1/2 text-[10px] bg-background px-1"
                                          placeholder="Pax"
                                          value={newLayout.capacity}
                                          onChange={(e) => setNewLayout(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                                        />
                                        <Input
                                          type="number"
                                          className="h-8 w-1/2 text-[10px] bg-background px-1"
                                          placeholder="RM"
                                          value={newLayout.price_per_hour}
                                          onChange={(e) => setNewLayout(prev => ({ ...prev, price_per_hour: parseInt(e.target.value) || 0 }))}
                                        />
                                      </div>
                                    </div>
                                    <div className="flex items-end">
                                      <Button size="sm" className="h-8 w-full text-[10px] px-2 shadow-sm font-bold bg-primary hover:bg-primary/90" onClick={addNewLayout}>
                                        <Plus className="h-3 w-3 mr-1" /> Simpan Pakej
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </AccordionContent>
                            )}

                            {item.id === 'booking-form' && (
                              <AccordionContent className="pt-4 pb-0">
                                <div className="space-y-4">
                                  {/* Slot Masa */}
                                  <div className="p-3 rounded-lg bg-background border border-border/50 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-primary" />
                                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Slot Masa</span>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-[10px] text-muted-foreground font-bold">JARAK SLOT MASA</Label>
                                      <Select value={settings.timeSlotGap.toString()} onValueChange={(value) => handleSettingChange('timeSlotGap', parseInt(value))}>
                                        <SelectTrigger className="h-9 text-xs">
                                          <SelectValue placeholder="Pilih jarak" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="15">15 minit</SelectItem>
                                          <SelectItem value="30">30 minit</SelectItem>
                                          <SelectItem value="45">45 minit</SelectItem>
                                          <SelectItem value="60">1 jam</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  {/* Deposit Settings */}
                                  <div className="p-3 rounded-lg bg-background border border-border/50 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deposit</span>
                                      </div>
                                      <Switch
                                        checked={settings.depositEnabled}
                                        onCheckedChange={(checked) => handleSettingChange('depositEnabled', checked)}
                                      />
                                    </div>
                                    {settings.depositEnabled && (
                                      <div className="space-y-2 pt-2 border-t border-border/10">
                                        <Label className="text-[10px] text-muted-foreground font-bold uppercase">JUMLAH DEPOSIT (RM)</Label>
                                        <Input
                                          type="number"
                                          className="h-9 text-xs"
                                          value={settings.depositAmount}
                                          onChange={(e) => handleSettingChange('depositAmount', parseFloat(e.target.value) || 0)}
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* Cara Pembayaran */}
                                  <div className="p-3 rounded-lg bg-background border border-border/50 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2">
                                      <CreditCard className="h-4 w-4 text-primary" />
                                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cara Pembayaran</span>
                                    </div>
                                    <div className="space-y-3">
                                      {/* Pembayaran di Studio */}
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium">Pembayaran di Studio</Label>
                                        <Switch
                                          checked={settings.paymentStudioEnabled}
                                          onCheckedChange={(checked) => handleSettingChange('paymentStudioEnabled', checked)}
                                        />
                                      </div>

                                      {/* QR Sekarang */}
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium">QR Sekarang</Label>
                                        <Switch
                                          checked={settings.paymentQrEnabled}
                                          onCheckedChange={(checked) => handleSettingChange('paymentQrEnabled', checked)}
                                        />
                                      </div>

                                      {/* Pindahan Bank */}
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium">Pindahan Bank</Label>
                                        <Switch
                                          checked={settings.paymentBankTransferEnabled}
                                          onCheckedChange={(checked) => handleSettingChange('paymentBankTransferEnabled', checked)}
                                        />
                                      </div>

                                      {/* FPX (Online Banking) - Package Restricted */}
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium">FPX (Online Banking)</Label>
                                        <div className="flex items-center gap-2">
                                          <Switch
                                            checked={settings.paymentFpxEnabled}
                                            disabled={!canEnableFPX}
                                            onCheckedChange={(checked) => {
                                              if (!canEnableFPX) {
                                                setShowFpxUpgradePrompt(true);
                                              } else {
                                                handleSettingChange('paymentFpxEnabled', checked);
                                              }
                                            }}
                                          />
                                          {!canEnableFPX && (
                                            <Badge variant="outline" className="bg-gradient-to-r from-purple-400 to-purple-600 text-white border-none text-[9px] px-1.5 py-0">
                                              Platinum
                                            </Badge>
                                          )}
                                        </div>
                                      </div>

                                      {/* Touch n Go eWallet */}
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium">Touch n Go eWallet</Label>
                                        <Switch
                                          checked={settings.paymentTngEnabled}
                                          onCheckedChange={(checked) => handleSettingChange('paymentTngEnabled', checked)}
                                        />
                                      </div>

                                      {settings.paymentTngEnabled && (
                                        <div className="pt-3 border-t border-border/10 space-y-2">
                                          <Label className="text-[10px] text-muted-foreground font-bold uppercase">TNG QR CODE</Label>
                                          <div className="flex flex-col gap-2">
                                            {settings.tngQrCode && (
                                              <div className="relative w-full aspect-square max-w-[120px] rounded-lg border overflow-hidden mx-auto bg-white">
                                                <img src={settings.tngQrCode} className="w-full h-full object-contain" alt="TNG QR" />
                                              </div>
                                            )}
                                            <Input
                                              type="file"
                                              accept="image/*"
                                              className="h-8 text-[10px] file:text-[10px]"
                                              onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file || !effectiveStudioId) return;
                                                setIsUploadingTngQr(true);
                                                try {
                                                  const { uploadLogo } = await import('@/services/fileUploadService');
                                                  const result = await uploadLogo(file, effectiveStudioId);
                                                  if (result.success && result.url) {
                                                    handleSettingChange('tngQrCode', result.url);
                                                    toast({ title: "QR Uploaded", description: "TNG QR updated successfully" });
                                                  }
                                                } finally {
                                                  setIsUploadingTngQr(false);
                                                }
                                              }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </AccordionContent>
                            )}

                            {item.id === 'operating-hours' && (
                              <AccordionContent className="pt-4 pb-0">
                                <div className="space-y-4">
                                  {/* Killer Switch */}
                                  <div className={cn(
                                    "p-4 rounded-lg border flex items-center justify-between gap-4 transition-colors",
                                    settings.isOperational ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
                                  )}>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className={cn("h-2 w-2 rounded-full", settings.isOperational ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                                        <span className="text-xs font-bold uppercase tracking-tight">Status Studio</span>
                                      </div>
                                      <p className="text-[10px] text-muted-foreground leading-tight">
                                        {settings.isOperational ? "Buka untuk semua tempahan" : "Tutup untuk semua tempahan"}
                                      </p>
                                    </div>
                                    <Switch
                                      checked={settings.isOperational}
                                      onCheckedChange={(checked) => handleSettingChange('isOperational', checked)}
                                    />
                                  </div>

                                  {/* Waktu Operasi Row */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-background border border-border/50 shadow-sm space-y-2">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Clock className="h-3 w-3 text-primary" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Waktu Buka</span>
                                      </div>
                                      <Input
                                        type="time"
                                        className="h-9 text-xs"
                                        value={settings.operatingStartTime}
                                        onChange={(e) => handleSettingChange('operatingStartTime', e.target.value)}
                                      />
                                    </div>
                                    <div className="p-3 rounded-lg bg-background border border-border/50 shadow-sm space-y-2">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Clock className="h-3 w-3 text-primary" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Waktu Tutup</span>
                                      </div>
                                      <Input
                                        type="time"
                                        className="h-9 text-xs"
                                        value={settings.operatingEndTime}
                                        onChange={(e) => handleSettingChange('operatingEndTime', e.target.value)}
                                      />
                                    </div>
                                  </div>

                                  {/* Waktu Rehat */}
                                  <div className="p-3 rounded-lg bg-muted/20 border border-border/50 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2">
                                      <CalendarDays className="h-3 w-3 text-primary" />
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Waktu Rehat (Tutup Tempahan)</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1.5">
                                        <Label className="text-[9px] uppercase font-bold text-muted-foreground/70">DARI</Label>
                                        <Input
                                          type="time"
                                          className="h-8 text-[11px] bg-background"
                                          value={settings.breakStartTime}
                                          onChange={(e) => handleSettingChange('breakStartTime', e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-[9px] uppercase font-bold text-muted-foreground/70">HINGGA</Label>
                                        <Input
                                          type="time"
                                          className="h-8 text-[11px] bg-background"
                                          value={settings.breakEndTime}
                                          onChange={(e) => handleSettingChange('breakEndTime', e.target.value)}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </AccordionContent>
                            )}
                          </div>
                        </div>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
                <DialogFooter className="flex-col gap-2 min-[480px]:flex-row">
                  <Button variant="outline" onClick={() => setIsChecklistOpen(false)} className="w-full min-[480px]:flex-1">
                    Tutup
                  </Button>
                  <Button onClick={saveSettings} disabled={isSaving} className="w-full min-[480px]:flex-1">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Simpan...
                      </>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qrCode" className="text-sm">Kod QR</Label>
                  {settings.qrCode && (
                    <div className="relative w-full aspect-square max-w-[200px] rounded-lg border overflow-hidden bg-white">
                      <img src={settings.qrCode} className="w-full h-full object-contain" alt="QR Code" />
                    </div>
                  )}
                  <Input
                    id="qrCode"
                    type="file"
                    accept="image/*"
                    disabled={isUploadingQr}
                    onChange={async (e) => {
                      alert('🔵 QR UPLOAD HANDLER FIRED! Check console for details.');
                      console.log('🔵 [QR Upload] onChange event fired!');
                      console.log('🔵 [QR Upload] Event target:', e.target);
                      console.log('🔵 [QR Upload] Files:', e.target.files);
                      console.log('🔵 [QR Upload] Starting QR code upload process...');
                      const file = e.target.files?.[0];

                      if (!file) {
                        console.log('❌ [QR Upload] No file selected');
                        return;
                      }

                      console.log('📄 [QR Upload] File details:', {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        sizeInMB: (file.size / (1024 * 1024)).toFixed(2) + 'MB'
                      });

                      if (!effectiveStudioId) {
                        console.log('❌ [QR Upload] No effective studio ID found');
                        toast({
                          title: "Error",
                          description: "Studio ID not found. Please refresh the page.",
                          variant: "destructive"
                        });
                        return;
                      }

                      console.log('🏢 [QR Upload] Studio ID:', effectiveStudioId);

                      setIsUploadingQr(true);
                      try {
                        console.log('📤 [QR Upload] Importing upload service...');
                        const { uploadLogo } = await import('@/services/fileUploadService');

                        console.log('📤 [QR Upload] Calling uploadLogo function...');
                        const result = await uploadLogo(file, effectiveStudioId);

                        console.log('📥 [QR Upload] Upload result:', result);

                        if (result.success && result.url) {
                          console.log('✅ [QR Upload] File uploaded successfully!');
                          console.log('🔗 [QR Upload] Public URL:', result.url);

                          // Update state
                          console.log('💾 [QR Upload] Updating local state...');
                          handleSettingChange('qrCode', result.url);

                          // Auto-save to database immediately
                          console.log('💾 [QR Upload] Importing save settings service...');
                          const { saveStudioSettings } = await import('@/services/studioSettings');

                          console.log('💾 [QR Upload] Preparing settings payload...');
                          const updatedSettings = { ...settings, qrCode: result.url };
                          console.log('💾 [QR Upload] Updated settings:', {
                            qrCode: updatedSettings.qrCode,
                            studioName: updatedSettings.studioName,
                            studioId: effectiveStudioId
                          });

                          console.log('💾 [QR Upload] Calling saveStudioSettings...');
                          const saveResult = await saveStudioSettings(
                            updatedSettings,
                            layouts,
                            effectiveStudioId
                          );

                          console.log('💾 [QR Upload] Save result:', saveResult);

                          if (saveResult.success) {
                            console.log('✅ [QR Upload] Settings saved to database successfully!');
                            toast({
                              title: "Success",
                              description: "QR code uploaded and saved successfully"
                            });
                          } else {
                            console.error('❌ [QR Upload] Failed to save to database:', saveResult.error);
                            toast({
                              title: "Warning",
                              description: "QR code uploaded but failed to save. Please click 'Simpan Tetapan' to save manually.",
                              variant: "destructive"
                            });
                          }
                        } else {
                          console.error('❌ [QR Upload] Upload failed:', result.error);
                          toast({
                            title: "Error",
                            description: result.error || "Failed to upload QR code",
                            variant: "destructive"
                          });
                        }
                      } catch (error) {
                        console.error('❌ [QR Upload] Unexpected error:', error);
                        console.error('❌ [QR Upload] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
                        toast({
                          title: "Error",
                          description: "Failed to upload QR code",
                          variant: "destructive"
                        });
                      } finally {
                        console.log('🏁 [QR Upload] Upload process completed');
                        setIsUploadingQr(false);
                        // Reset the input so the same file can be selected again
                        e.target.value = '';
                      }
                    }}
                  />
                  {isUploadingQr && (
                    <p className="text-xs text-muted-foreground">Uploading QR code...</p>
                  )}
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
                          <Label className="text-xs">Nama Pakej</Label>
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
                      <Label className="text-xs">Nama Pakej</Label>
                      <Input
                        value={newLayout.name}
                        onChange={(e) => setNewLayout(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nama Pakej"
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

            {/* Staff Management */}
            <StaffManagementCard
              staffMembers={staffMembers}
              isLoading={isLoadingStaff}
              isDialogOpen={isStaffDialogOpen}
              editingStaffId={editingStaffId}
              staffForm={staffForm}
              isDeletingStaff={isDeletingStaff}
              onOpenDialog={handleOpenNewStaffDialog}
              onCloseDialog={() => setIsStaffDialogOpen(false)}
              onSaveStaff={handleSaveStaff}
              onEditStaff={handleEditStaff}
              onDeleteStaff={handleDeleteStaff}
              onFormChange={(field, value) => {
                setStaffForm(prev => ({ ...prev, [field]: value }));
              }}
            />

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
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Tetapan</h1>
                <p className="text-muted-foreground">Konfigurasi studio dan maklumat perniagaan</p>
              </div>
              <div className="flex items-center gap-6 p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="flex items-center gap-3">
                  <ProgressDonut percentage={progressPercentage} size={64} />
                  <div>
                    <h3 className="font-semibold text-sm">Kemajuan Konfigurasi</h3>
                    <p className="text-xs text-muted-foreground">{completedCount} daripada {checklistItems.length} langkah selesai</p>
                  </div>
                </div>
                <Dialog open={isChecklistOpen} onOpenChange={setIsChecklistOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="bg-background shadow-sm hover:translate-y-[-2px] transition-all">
                      Lihat Konfigurasi Wajib
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl">
                    <DialogHeader>
                      <DialogTitle>Konfigurasi Wajib Studio</DialogTitle>
                      <DialogDescription>
                        Lengkapkan langkah-langkah berikut untuk memastikan studio anda sedia untuk menerima tempahan.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Accordion type="single" collapsible className="w-full">
                        {checklistItems.map((item) => (
                          <AccordionItem key={item.id} value={item.id} className="border-none">
                            <div className="flex items-start gap-4 p-4 rounded-xl border bg-muted/10 mb-3">
                              {item.isComplete ? (
                                <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                </div>
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                {item.id === 'basic-info' || item.id === 'packages' || item.id === 'booking-form' || item.id === 'operating-hours' ? (
                                  <AccordionTrigger className="p-0 hover:no-underline py-0">
                                    <div className="text-left">
                                      <p className={cn("text-sm font-semibold", item.isComplete ? "text-foreground" : "text-muted-foreground")}>
                                        {item.label}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {item.description}
                                      </p>
                                    </div>
                                  </AccordionTrigger>
                                ) : (
                                  <div>
                                    <p className={cn("text-sm font-semibold", item.isComplete ? "text-foreground" : "text-muted-foreground")}>
                                      {item.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {item.description}
                                    </p>
                                  </div>
                                )}

                                {item.id === 'basic-info' && (
                                  <AccordionContent className="pt-4 pb-0">
                                    <div className="grid grid-cols-4 gap-4 mt-2">
                                      {[
                                        { label: 'Nama Studio', key: 'studioName', placeholder: 'Nama studio' },
                                        { label: 'Telefon Studio', key: 'studioPhone', placeholder: '012-3456789' },
                                        { label: 'Lokasi Studio', key: 'studioLocation', placeholder: 'Alamat' },
                                        { label: 'Google Map Link', key: 'googleMapsLink', placeholder: 'Link' },
                                        { label: 'Emel studio', key: 'studioEmail', type: 'email', placeholder: 'info@studio.com' },
                                        { label: 'Akaun Bank', key: 'bankAccountNumber', placeholder: '1234567890' },
                                        { label: 'Pemilik Akaun', key: 'accountOwnerName', placeholder: 'Nama' },
                                      ].map((field) => (
                                        <div key={field.key} className="space-y-1.5 p-3 rounded-xl bg-background border border-border/50 shadow-sm min-w-0">
                                          <div className="flex items-center gap-2 overflow-hidden">
                                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">
                                              {field.label}
                                            </Label>
                                            {(settings as any)[field.key] && (
                                              <div className="h-4 w-4 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                                <Check className="h-2.5 w-2.5 text-green-600 font-bold" />
                                              </div>
                                            )}
                                          </div>
                                          <Input
                                            className="h-9 text-xs bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary"
                                            placeholder={field.placeholder}
                                            value={(settings as any)[field.key]}
                                            type={field.type || 'text'}
                                            onChange={(e) => handleSettingChange(field.key, e.target.value)}
                                          />
                                        </div>
                                      ))}
                                      <div className="space-y-1.5 p-3 rounded-xl bg-background border border-border/50 shadow-sm min-w-0">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">
                                            Kod QR
                                          </Label>
                                          {settings.qrCode && (
                                            <div className="h-4 w-4 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                              <Check className="h-2.5 w-2.5 text-green-600 font-bold" />
                                            </div>
                                          )}
                                        </div>
                                        <Input
                                          id="desktop-checklist-qr-code"
                                          type="file"
                                          accept="image/*"
                                          disabled={isUploadingQr}
                                          className="h-9 text-xs bg-muted/30 border-none cursor-pointer file:bg-primary file:text-primary-foreground file:border-none file:px-2 file:py-1 file:rounded-md file:mr-2 file:text-[9px]"
                                          onChange={async (e) => {
                                            console.log('🔵 [Desktop Checklist QR] onChange event fired!');
                                            console.log('🔵 [Desktop Checklist QR] Input ID:', e.target.id);
                                            const file = e.target.files?.[0];

                                            if (!file) {
                                              console.log('❌ [Desktop Checklist QR] No file selected');
                                              return;
                                            }

                                            console.log('📄 [Desktop Checklist QR] File:', file.name, file.size);

                                            if (!effectiveStudioId) {
                                              console.log('❌ [Desktop Checklist QR] No studio ID');
                                              toast({
                                                title: "Error",
                                                description: "Studio ID not found",
                                                variant: "destructive"
                                              });
                                              return;
                                            }

                                            setIsUploadingQr(true);
                                            try {
                                              console.log('📤 [Desktop Checklist QR] Uploading...');
                                              const { uploadLogo } = await import('@/services/fileUploadService');
                                              const result = await uploadLogo(file, effectiveStudioId);

                                              console.log('📥 [Desktop Checklist QR] Result:', result);

                                              if (result.success && result.url) {
                                                handleSettingChange('qrCode', result.url);

                                                // Auto-save
                                                const { saveStudioSettings } = await import('@/services/studioSettings');
                                                const saveResult = await saveStudioSettings(
                                                  { ...settings, qrCode: result.url },
                                                  layouts,
                                                  effectiveStudioId
                                                );

                                                if (saveResult.success) {
                                                  toast({
                                                    title: "Success",
                                                    description: "QR code uploaded and saved"
                                                  });
                                                } else {
                                                  toast({
                                                    title: "Warning",
                                                    description: "Uploaded but not saved. Click 'Simpan Tetapan'.",
                                                    variant: "destructive"
                                                  });
                                                }
                                              } else {
                                                toast({
                                                  title: "Error",
                                                  description: result.error || "Upload failed",
                                                  variant: "destructive"
                                                });
                                              }
                                            } catch (error) {
                                              console.error('❌ [Desktop Checklist QR] Error:', error);
                                              toast({
                                                title: "Error",
                                                description: "Failed to upload QR code",
                                                variant: "destructive"
                                              });
                                            } finally {
                                              setIsUploadingQr(false);
                                              e.target.value = '';
                                            }
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </AccordionContent>
                                )}

                                {item.id === 'packages' && (
                                  <AccordionContent className="pt-4 pb-0">
                                    <div className="space-y-6">
                                      {/* Existing Packages Items with Photos */}
                                      {layouts.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {layouts.map((layout, idx) => (
                                            <div key={layout.id} className="p-4 rounded-xl bg-background border border-border/50 shadow-sm hover:border-primary/50 transition-all space-y-4">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border/50 shadow-inner">
                                                    {layout.thumbnail_photo ? (
                                                      <img src={layout.thumbnail_photo} className="w-full h-full object-cover" alt={layout.name} />
                                                    ) : (
                                                      <ImageIcon className="h-6 w-6 text-muted-foreground/20" />
                                                    )}
                                                  </div>
                                                  <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-foreground truncate">{layout.name}</span>
                                                    <span className="text-xs text-muted-foreground font-medium">RM{layout.price_per_hour}/jam • {layout.capacity} Pax</span>
                                                  </div>
                                                </div>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full"
                                                  onClick={() => removeLayout(idx)}
                                                >
                                                  <X className="h-4 w-4" />
                                                </Button>
                                              </div>

                                              {/* Mini Gallery Scrollable */}
                                              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                                                {(layout.layout_photos || []).map((photoUrl, pIdx) => {
                                                  const deleteKey = `${layout.id}-${photoUrl}`;
                                                  const isThumbnail = layout.thumbnail_photo === photoUrl;
                                                  return (
                                                    <div key={pIdx} className={cn(
                                                      "relative w-16 h-16 rounded-lg overflow-hidden border shrink-0 group transition-all",
                                                      isThumbnail ? "border-primary ring-1 ring-primary/20" : "border-border/50"
                                                    )}>
                                                      <img src={photoUrl} className="w-full h-full object-cover" alt={`Gallery ${pIdx}`} />
                                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                                        <button
                                                          onClick={() => handleDeleteLayoutPhoto(idx, photoUrl)}
                                                          disabled={deletingLayoutPhoto[deleteKey]}
                                                          className="p-1.5 bg-destructive text-white rounded-md hover:bg-destructive/80 transition-colors"
                                                          title="Hapus"
                                                        >
                                                          {deletingLayoutPhoto[deleteKey] ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                          ) : (
                                                            <Trash className="h-3.5 w-3.5" />
                                                          )}
                                                        </button>
                                                        {!isThumbnail && (
                                                          <button
                                                            onClick={() => handleSetThumbnail(idx, photoUrl)}
                                                            className="p-1.5 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors"
                                                            title="Set Thumbnail"
                                                          >
                                                            <ImageIcon className="h-3.5 w-3.5" />
                                                          </button>
                                                        )}
                                                      </div>
                                                      {isThumbnail && (
                                                        <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-[7px] text-white font-bold py-0.5 text-center uppercase tracking-tighter">
                                                          Main
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                })}

                                                {(layout.layout_photos || []).length < 5 && (
                                                  <div className="shrink-0">
                                                    <input
                                                      type="file"
                                                      accept="image/*"
                                                      id={`checklist-photo-desktop-${layout.id}`}
                                                      className="hidden"
                                                      onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                          await handleUploadLayoutPhoto(idx, file);
                                                          e.target.value = '';
                                                        }
                                                      }}
                                                    />
                                                    <button
                                                      onClick={() => document.getElementById(`checklist-photo-desktop-${layout.id}`)?.click()}
                                                      disabled={uploadingLayoutPhoto[layout.id]}
                                                      className="w-16 h-16 rounded-lg border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center hover:border-primary/40 hover:bg-primary/5 transition-all group disabled:opacity-50"
                                                    >
                                                      {uploadingLayoutPhoto[layout.id] ? (
                                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                                      ) : (
                                                        <Upload className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                                                      )}
                                                      <span className="text-[8px] text-muted-foreground/50 font-bold mt-1 uppercase group-hover:text-primary/60">Muat Naik</span>
                                                    </button>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Add Package Form Matching Basic Info Style */}
                                      <div className="grid grid-cols-4 gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10 shadow-inner">
                                        <div className="space-y-1.5 min-w-0">
                                          <Label className="text-[10px] uppercase tracking-wider text-primary/80 font-bold block">Nama Pakej</Label>
                                          <Input
                                            className="h-10 text-sm bg-background border-primary/20 focus-visible:ring-primary shadow-sm"
                                            placeholder="e.g. Studio A (Full Set)"
                                            value={newLayout.name}
                                            onChange={(e) => setNewLayout(prev => ({ ...prev, name: e.target.value }))}
                                          />
                                        </div>
                                        <div className="space-y-1.5 min-w-0">
                                          <Label className="text-[10px] uppercase tracking-wider text-primary/80 font-bold block">Penerangan Ringkas</Label>
                                          <Input
                                            className="h-10 text-sm bg-background border-primary/20 focus-visible:ring-primary shadow-sm"
                                            placeholder="Penerangan ringkas tentang kemudahan layout ini..."
                                            value={newLayout.description}
                                            onChange={(e) => setNewLayout(prev => ({ ...prev, description: e.target.value }))}
                                          />
                                        </div>
                                        <div className="space-y-1.5 min-w-0">
                                          <Label className="text-[10px] uppercase tracking-wider text-primary/80 font-bold block">Kapasiti & Harga</Label>
                                          <div className="flex gap-2">
                                            <Input
                                              type="number"
                                              className="h-10 w-1/2 text-sm bg-background border-primary/20 focus-visible:ring-primary shadow-sm"
                                              placeholder="Pax"
                                              value={newLayout.capacity}
                                              onChange={(e) => setNewLayout(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                                            />
                                            <Input
                                              type="number"
                                              className="h-10 w-1/2 text-sm bg-background border-primary/20 focus-visible:ring-primary shadow-sm"
                                              placeholder="RM"
                                              value={newLayout.price_per_hour}
                                              onChange={(e) => setNewLayout(prev => ({ ...prev, price_per_hour: parseInt(e.target.value) || 0 }))}
                                            />
                                          </div>
                                        </div>
                                        <div className="flex items-end">
                                          <Button onClick={addNewLayout} className="h-10 w-full font-bold shadow-lg shadow-primary/20 hover:translate-y-[-1px] transition-all">
                                            <Plus className="h-4 w-4 mr-2" /> Simpan Layout
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </AccordionContent>
                                )}

                                {item.id === 'booking-form' && (
                                  <AccordionContent className="pt-4 pb-0">
                                    <div className="grid grid-cols-3 gap-6">
                                      {/* Slot Masa & Deposit Column */}
                                      <div className="col-span-1 space-y-6">
                                        {/* Slot Masa */}
                                        <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm space-y-4">
                                          <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                              <Clock className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                              <h4 className="text-xs font-bold text-primary tracking-tight">SLOT MASA</h4>
                                              <p className="text-[10px] text-muted-foreground">Konfigurasi jarak slot</p>
                                            </div>
                                          </div>
                                          <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">JARAK ANTARA SLOT</Label>
                                            <Select value={settings.timeSlotGap.toString()} onValueChange={(value) => handleSettingChange('timeSlotGap', parseInt(value))}>
                                              <SelectTrigger className="h-10 bg-background border-primary/20">
                                                <SelectValue placeholder="Pilih jarak" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="15">15 minit</SelectItem>
                                                <SelectItem value="30">30 minit</SelectItem>
                                                <SelectItem value="45">45 minit</SelectItem>
                                                <SelectItem value="60">1 jam</SelectItem>
                                                <SelectItem value="120">2 jam</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>

                                        {/* Deposit */}
                                        <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm space-y-4">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <CreditCard className="h-4 w-4 text-primary" />
                                              </div>
                                              <div>
                                                <h4 className="text-xs font-bold text-primary tracking-tight">DEPOSIT</h4>
                                                <p className="text-[10px] text-muted-foreground font-medium">Bayaran separa</p>
                                              </div>
                                            </div>
                                            <Switch
                                              checked={settings.depositEnabled}
                                              onCheckedChange={(checked) => handleSettingChange('depositEnabled', checked)}
                                            />
                                          </div>
                                          {settings.depositEnabled && (
                                            <div className="space-y-2 pt-2 border-t border-primary/10">
                                              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">JUMLAH DEPOSIT (RM)</Label>
                                              <Input
                                                type="number"
                                                className="h-10 bg-background border-primary/20"
                                                placeholder="0.00"
                                                value={settings.depositAmount}
                                                onChange={(e) => handleSettingChange('depositAmount', parseFloat(e.target.value) || 0)}
                                              />
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Cara Pembayaran Column */}
                                      <div className="col-span-2 p-6 rounded-2xl bg-muted/30 border border-border/50 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6">
                                          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <CreditCard className="h-5 w-5 text-primary" />
                                          </div>
                                          <div>
                                            <h4 className="text-sm font-bold text-foreground">Kaedah Pembayaran</h4>
                                            <p className="text-xs text-muted-foreground">Aktifkan pilihan untuk pelanggan</p>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                          {/* Pembayaran di Studio */}
                                          <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 group hover:border-primary/30 transition-all">
                                            <div className="flex flex-col gap-0.5">
                                              <Label className="text-xs font-bold leading-none">Pembayaran di Studio</Label>
                                              <span className="text-[10px] text-muted-foreground">Bayar di kaunter</span>
                                            </div>
                                            <Switch
                                              checked={settings.paymentStudioEnabled}
                                              onCheckedChange={(checked) => handleSettingChange('paymentStudioEnabled', checked)}
                                            />
                                          </div>

                                          {/* QR Sekarang */}
                                          <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 group hover:border-primary/30 transition-all">
                                            <div className="flex flex-col gap-0.5">
                                              <Label className="text-xs font-bold leading-none">QR Sekarang (Main)</Label>
                                              <span className="text-[10px] text-muted-foreground">Kod QR studio standard</span>
                                            </div>
                                            <Switch
                                              checked={settings.paymentQrEnabled}
                                              onCheckedChange={(checked) => handleSettingChange('paymentQrEnabled', checked)}
                                            />
                                          </div>

                                          {/* Pindahan Bank */}
                                          <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 group hover:border-primary/30 transition-all">
                                            <div className="flex flex-col gap-0.5">
                                              <Label className="text-xs font-bold leading-none">Pindahan Bank Direct</Label>
                                              <span className="text-[10px] text-muted-foreground">Manual transfer</span>
                                            </div>
                                            <Switch
                                              checked={settings.paymentBankTransferEnabled}
                                              onCheckedChange={(checked) => handleSettingChange('paymentBankTransferEnabled', checked)}
                                            />
                                          </div>

                                          {/* FPX (Online Banking) - Package Restricted */}
                                          <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 group hover:border-primary/30 transition-all">
                                            <div className="flex flex-col gap-0.5">
                                              <Label className="text-xs font-bold leading-none">FPX (Online Banking)</Label>
                                              <span className="text-[10px] text-muted-foreground">Pembayaran automatik</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Switch
                                                checked={settings.paymentFpxEnabled}
                                                disabled={!canEnableFPX}
                                                onCheckedChange={(checked) => {
                                                  if (!canEnableFPX) {
                                                    setShowFpxUpgradePrompt(true);
                                                  } else {
                                                    handleSettingChange('paymentFpxEnabled', checked);
                                                  }
                                                }}
                                              />
                                              {!canEnableFPX && (
                                                <Badge variant="outline" className="bg-gradient-to-r from-purple-400 to-purple-600 text-white border-none text-[9px] px-1.5 py-0.5">
                                                  Platinum
                                                </Badge>
                                              )}
                                            </div>
                                          </div>

                                          {/* Touch n Go eWallet */}
                                          <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 group hover:border-primary/30 transition-all">
                                            <div className="flex flex-col gap-0.5">
                                              <Label className="text-xs font-bold leading-none">Touch n Go eWallet</Label>
                                              <span className="text-[10px] text-muted-foreground">Scan & Pay TNG</span>
                                            </div>
                                            <Switch
                                              checked={settings.paymentTngEnabled}
                                              onCheckedChange={(checked) => handleSettingChange('paymentTngEnabled', checked)}
                                            />
                                          </div>
                                        </div>

                                        {settings.paymentTngEnabled && (
                                          <div className="mt-6 pt-6 border-t border-border/50 flex gap-6 items-start">
                                            <div className="flex-1 space-y-3">
                                              <Label className="text-[10px] font-bold text-primary uppercase tracking-widest block">MUAT NAIK TNG QR CODE</Label>
                                              <p className="text-xs text-muted-foreground mb-4">Fail gambar sahaja (JPEG/PNG). Maksimum 5MB.</p>
                                              <div className="relative">
                                                <Input
                                                  type="file"
                                                  accept="image/*"
                                                  className="h-10 cursor-pointer file:font-bold file:text-xs"
                                                  onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file || !effectiveStudioId) return;
                                                    setIsUploadingTngQr(true);
                                                    try {
                                                      const { uploadLogo } = await import('@/services/fileUploadService');
                                                      const result = await uploadLogo(file, effectiveStudioId);
                                                      if (result.success && result.url) {
                                                        handleSettingChange('tngQrCode', result.url);
                                                        toast({ title: "QR Diupload", description: "Kod QR TNG telah berjaya kemaskini" });
                                                      }
                                                    } finally {
                                                      setIsUploadingTngQr(false);
                                                    }
                                                  }}
                                                />
                                                {isUploadingTngQr && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />}
                                              </div>
                                            </div>
                                            <div className="w-24 h-24 rounded-2xl border border-dashed border-primary/20 bg-background flex items-center justify-center overflow-hidden p-1 shadow-inner shrink-0">
                                              {settings.tngQrCode ? (
                                                <img src={settings.tngQrCode} className="w-full h-full object-contain rounded-xl" alt="TNG QR" />
                                              ) : (
                                                <ImageIcon className="h-8 w-8 text-primary/20" />
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </AccordionContent>
                                )}

                                {item.id === 'operating-hours' && (
                                  <AccordionContent className="pt-4 pb-0">
                                    <div className="grid grid-cols-2 gap-6">
                                      {/* Operational Status & Operating Hours */}
                                      <div className="space-y-6">
                                        <div className={cn(
                                          "p-6 rounded-2xl border flex items-center justify-between gap-6 transition-all duration-300",
                                          settings.isOperational
                                            ? "bg-green-500/5 border-green-500/20 shadow-[0_0_15px_-5px_rgba(34,197,94,0.1)]"
                                            : "bg-red-500/5 border-red-500/20 shadow-[0_0_15px_-5px_rgba(239,68,68,0.1)]"
                                        )}>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                              <div className={cn(
                                                "h-3 w-3 rounded-full shadow-sm",
                                                settings.isOperational ? "bg-green-500 animate-pulse" : "bg-red-500"
                                              )} />
                                              <h4 className={cn(
                                                "text-sm font-bold tracking-tight uppercase",
                                                settings.isOperational ? "text-green-700" : "text-red-700"
                                              )}>Status Studio Sekarang</h4>
                                            </div>
                                            <p className="text-xs text-muted-foreground font-medium">
                                              {settings.isOperational
                                                ? "Studio terbuka untuk semua tempahan pelanggan melalui borang tempahan."
                                                : "Studio ditutup sementara. Borang tempahan tidak akan menerima sebarang slot baru."}
                                            </p>
                                          </div>
                                          <Switch
                                            className="scale-125 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-600"
                                            checked={settings.isOperational}
                                            onCheckedChange={(checked) => handleSettingChange('isOperational', checked)}
                                          />
                                        </div>

                                        <div className="p-6 rounded-2xl bg-muted/30 border border-border/50 shadow-sm space-y-6">
                                          <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                              <Clock className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                              <h4 className="text-sm font-bold text-foreground">Waktu Kerja</h4>
                                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Setiap Hari</p>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-4">
                                            <div className="flex-1 space-y-2">
                                              <Label className="text-[10px] uppercase font-extrabold text-muted-foreground/70 tracking-widest pl-1">JAM BUKA</Label>
                                              <div className="relative">
                                                <Input
                                                  type="time"
                                                  className="h-12 bg-background border-primary/10 focus-visible:ring-primary text-base font-medium pl-10"
                                                  value={settings.operatingStartTime}
                                                  onChange={(e) => handleSettingChange('operatingStartTime', e.target.value)}
                                                />
                                                <Clock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground/50" />
                                              </div>
                                            </div>
                                            <div className="self-end pb-3 text-muted-foreground font-light text-2xl">→</div>
                                            <div className="flex-1 space-y-2">
                                              <Label className="text-[10px] uppercase font-extrabold text-muted-foreground/70 tracking-widest pl-1">JAM TUTUP</Label>
                                              <div className="relative">
                                                <Input
                                                  type="time"
                                                  className="h-12 bg-background border-primary/10 focus-visible:ring-primary text-base font-medium pl-10"
                                                  value={settings.operatingEndTime}
                                                  onChange={(e) => handleSettingChange('operatingEndTime', e.target.value)}
                                                />
                                                <Clock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground/50" />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Break Time & Preview */}
                                      <div className="space-y-6">
                                        <div className="p-6 rounded-2xl bg-muted/30 border border-border/50 shadow-sm space-y-6">
                                          <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                              <CalendarDays className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                              <h4 className="text-sm font-bold text-foreground">Waktu Rehat</h4>
                                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tutup Tempahan Sementara</p>
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label className="text-[10px] uppercase font-extrabold text-muted-foreground/70 tracking-widest pl-1">MULA REHAT</Label>
                                              <Input
                                                type="time"
                                                className="h-11 bg-background border-primary/10"
                                                value={settings.breakStartTime}
                                                onChange={(e) => handleSettingChange('breakStartTime', e.target.value)}
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label className="text-[10px] uppercase font-extrabold text-muted-foreground/70 tracking-widest pl-1">TAMAT REHAT</Label>
                                              <Input
                                                type="time"
                                                className="h-11 bg-background border-primary/10"
                                                value={settings.breakEndTime}
                                                onChange={(e) => handleSettingChange('breakEndTime', e.target.value)}
                                              />
                                            </div>
                                          </div>

                                          <div className="p-3 bg-primary/5 rounded-xl text-[11px] text-muted-foreground leading-relaxed italic border border-primary/10">
                                            "Dalam tempoh waktu rehat ini, slot tempahan pada borang tempahan akan ditanda sebagai tidak tersedia (grayed out) secara automatik."
                                          </div>
                                        </div>


                                      </div>
                                    </div>
                                  </AccordionContent>
                                )}
                              </div>
                            </div>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsChecklistOpen(false)} className="flex-1">
                        Tutup
                      </Button>
                      <Button onClick={saveSettings} disabled={isSaving} className="flex-1">
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          'Simpan Semua'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Studio Selector for Super Admins */}
            {isSuperAdmin && <div className="mb-8"><StudioSelector /></div>}

            {/* Settings Tabs */}
            <Tabs defaultValue="maklumat-asas" className="w-full">
              <div className="border-b border-border">
                <TabsList className="grid w-full grid-cols-6 md:flex md:w-auto h-auto p-0 bg-transparent justify-start">
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
                    <span className="mr-2">👥</span>
                    Users
                  </TabsTrigger>
                  <TabsTrigger
                    value="waktu-operasi"
                    className="text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <span className="mr-2">🕒</span>
                    Waktu Operasi
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
                      <Label htmlFor="studioPhone">Telefon Studio</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="studioPhone"
                          type="tel"
                          value={settings.studioPhone}
                          onChange={(e) => handleSettingChange('studioPhone', e.target.value)}
                          placeholder="012-345-6789"
                          className="pl-9"
                        />
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
                      {settings.qrCode && (
                        <div className="relative w-full aspect-square max-w-[200px] rounded-lg border overflow-hidden bg-white">
                          <img src={settings.qrCode} className="w-full h-full object-contain" alt="QR Code" />
                        </div>
                      )}
                      <Input
                        id="qrCode"
                        type="file"
                        accept="image/*"
                        disabled={isUploadingQr}
                        onChange={async (e) => {

                          console.log('🔵 [Main QR Upload] onChange event fired!');
                          console.log('🔵 [Main QR Upload] Event target:', e.target);
                          console.log('🔵 [Main QR Upload] Files:', e.target.files);
                          console.log('🔵 [Main QR Upload] Starting QR code upload process...');
                          const file = e.target.files?.[0];

                          if (!file) {
                            console.log('❌ [Main QR Upload] No file selected');
                            return;
                          }

                          console.log('📄 [Main QR Upload] File details:', {
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            sizeInMB: (file.size / (1024 * 1024)).toFixed(2) + 'MB'
                          });

                          if (!effectiveStudioId) {
                            console.log('❌ [Main QR Upload] No effective studio ID found');
                            toast({
                              title: "Error",
                              description: "Studio ID not found. Please refresh the page.",
                              variant: "destructive"
                            });
                            return;
                          }

                          console.log('🏢 [Main QR Upload] Studio ID:', effectiveStudioId);

                          setIsUploadingQr(true);
                          try {
                            console.log('📤 [Main QR Upload] Importing upload service...');
                            const { uploadLogo } = await import('@/services/fileUploadService');

                            console.log('📤 [Main QR Upload] Calling uploadLogo function...');
                            const result = await uploadLogo(file, effectiveStudioId);

                            console.log('📥 [Main QR Upload] Upload result:', result);

                            if (result.success && result.url) {
                              console.log('✅ [Main QR Upload] File uploaded successfully!');
                              console.log('🔗 [Main QR Upload] Public URL:', result.url);

                              // Update state
                              console.log('💾 [Main QR Upload] Updating local state...');
                              handleSettingChange('qrCode', result.url);

                              // Auto-save to database immediately
                              console.log('💾 [Main QR Upload] Importing save settings service...');
                              const { saveStudioSettings } = await import('@/services/studioSettings');

                              console.log('💾 [Main QR Upload] Preparing settings payload...');
                              const updatedSettings = { ...settings, qrCode: result.url };
                              console.log('💾 [Main QR Upload] Updated settings:', {
                                qrCode: updatedSettings.qrCode,
                                studioName: updatedSettings.studioName,
                                studioId: effectiveStudioId
                              });

                              console.log('💾 [Main QR Upload] Calling saveStudioSettings...');
                              const saveResult = await saveStudioSettings(
                                updatedSettings,
                                layouts,
                                effectiveStudioId
                              );

                              console.log('💾 [Main QR Upload] Save result:', saveResult);

                              if (saveResult.success) {
                                console.log('✅ [Main QR Upload] Settings saved to database successfully!');
                                toast({
                                  title: "Success",
                                  description: "QR code uploaded and saved successfully"
                                });
                              } else {
                                console.error('❌ [Main QR Upload] Failed to save to database:', saveResult.error);
                                toast({
                                  title: "Warning",
                                  description: "QR code uploaded but failed to save. Please click 'Simpan Tetapan' to save manually.",
                                  variant: "destructive"
                                });
                              }
                            } else {
                              console.error('❌ [Main QR Upload] Upload failed:', result.error);
                              toast({
                                title: "Error",
                                description: result.error || "Failed to upload QR code",
                                variant: "destructive"
                              });
                            }
                          } catch (error) {
                            console.error('❌ [Main QR Upload] Unexpected error:', error);
                            console.error('❌ [Main QR Upload] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
                            toast({
                              title: "Error",
                              description: "Failed to upload QR code",
                              variant: "destructive"
                            });
                          } finally {
                            console.log('🏁 [Main QR Upload] Upload process completed');
                            setIsUploadingQr(false);
                            // Reset the input so the same file can be selected again
                            e.target.value = '';
                          }
                        }}
                      />
                      {isUploadingQr && (
                        <p className="text-xs text-muted-foreground">Uploading QR code...</p>
                      )}
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
                        {!settings.googleRefreshTokenConfigured && (
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
                                  <p className="mt-1 text-xs">Note: OAuth credentials are managed by Super Admin. You only need to authorize your calendar.</p>
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

                                    // Fetch global credentials and initiate OAuth
                                    const { authUrl } = await initiateGoogleAuth();
                                    window.location.href = authUrl;
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description: error instanceof Error ? error.message : "Failed to initiate authorization",
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
                  <div className="bg-muted/30 rounded-lg p-2">
                    <TabsList className="w-full justify-start h-auto p-1 bg-background/50 rounded-md flex-wrap gap-1">
                      <TabsTrigger value="layouts" className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        Layout Studio
                      </TabsTrigger>
                      <TabsTrigger value="addons" className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        Pakej Tambahan
                      </TabsTrigger>
                    </TabsList>
                  </div>

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
                                  <Label>Nama Pakej</Label>
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
                                  <Label>Tempoh Pakej (Minit)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={layout.minute_package || ''}
                                    onChange={(e) => handleLayoutChange(index, 'minute_package', parseInt(e.target.value) || 0)}
                                    placeholder="e.g., 60, 120, 180"
                                  />
                                  <p className="text-xs text-muted-foreground">Tempoh pakej dalam minit (cth: 60 = 1 jam)</p>
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
                                    <Label htmlFor="new-layout-name">Nama Pakej *</Label>
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

                                  <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="new-layout-minute-package">Tempoh Pakej (Minit)</Label>
                                    <Input
                                      id="new-layout-minute-package"
                                      type="number"
                                      min="0"
                                      value={newLayout.minute_package || ''}
                                      onChange={(e) => setNewLayout(prev => ({ ...prev, minute_package: parseInt(e.target.value) || 0 }))}
                                      placeholder="e.g., 60, 120, 180"
                                    />
                                    <p className="text-xs text-muted-foreground">Tempoh pakej dalam minit (cth: 60 = 1 jam)</p>
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
              <TabsContent value="booking-form" className="space-y-6 mt-6">
                {/* Nested tabs for booking form sections */}
                <Tabs defaultValue="tajuk-borang" className="w-full">
                  <div className="bg-muted/30 rounded-lg p-2">
                    <TabsList className="w-full justify-start h-auto p-1 bg-background/50 rounded-md flex-wrap gap-1">
                      <TabsTrigger
                        value="tajuk-borang"
                        className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        Tajuk Borang Tempahan
                      </TabsTrigger>
                      <TabsTrigger
                        value="terma-syarat"
                        className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        Terma dan Syarat
                      </TabsTrigger>
                      <TabsTrigger
                        value="slot-masa"
                        className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        Konfigurasi Slot Masa
                      </TabsTrigger>
                      <TabsTrigger
                        value="deposit"
                        className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        Deposit
                      </TabsTrigger>
                      <TabsTrigger
                        value="logo-studio"
                        className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        Logo Studio
                      </TabsTrigger>
                      <TabsTrigger
                        value="penyesuaian-borang"
                        className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        Penyesuaian Borang Tempahan
                      </TabsTrigger>
                      <TabsTrigger
                        value="cara-pembayaran"
                        className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        Cara Pembayaran
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Sub-tab 1: Tajuk Borang Tempahan */}
                  <TabsContent value="tajuk-borang" className="space-y-6 mt-6">
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
                  </TabsContent>

                  {/* Sub-tab 2: Terma dan Syarat */}
                  <TabsContent value="terma-syarat" className="space-y-6 mt-6">
                    <Card>
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
                    </Card>
                  </TabsContent>

                  {/* Sub-tab 3: Konfigurasi Slot Masa */}
                  <TabsContent value="slot-masa" className="space-y-6 mt-6">
                    <Card>
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
                              <SelectItem value="120">2 jam</SelectItem>
                              <SelectItem value="180">3 jam</SelectItem>
                              <SelectItem value="240">4 jam</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-muted-foreground">
                            Slot masa akan dipaparkan dengan jarak {settings.timeSlotGap >= 60 ? `${settings.timeSlotGap / 60} jam` : `${settings.timeSlotGap} minit`} antara setiap pilihan.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Sub-tab 4: Deposit */}
                  <TabsContent value="deposit" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Tetapan Deposit</CardTitle>
                        <CardDescription>Konfigurasi pilihan pembayaran deposit untuk tempahan</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Aktifkan Pilihan Deposit</Label>
                            <p className="text-sm text-muted-foreground">
                              Benarkan pelanggan membayar deposit sahaja semasa membuat tempahan
                            </p>
                          </div>
                          <Switch
                            checked={settings.depositEnabled}
                            onCheckedChange={(checked) => handleSettingChange('depositEnabled', checked)}
                          />
                        </div>

                        {settings.depositEnabled && (
                          <div className="space-y-2 pt-4 border-t">
                            <Label htmlFor="depositAmount">Jumlah Deposit (RM)</Label>
                            <Input
                              id="depositAmount"
                              type="number"
                              min="0"
                              step="0.01"
                              value={settings.depositAmount}
                              onChange={(e) => handleSettingChange('depositAmount', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                            <p className="text-sm text-muted-foreground">
                              Tetapkan jumlah deposit yang perlu dibayar oleh pelanggan. Baki akan dibayar kemudian.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Sub-tab 5: Logo Studio */}
                  <TabsContent value="logo-studio" className="space-y-6 mt-6">
                    <Card>
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
                    </Card>
                  </TabsContent>

                  {/* Sub-tab 5: Penyesuaian Borang Tempahan */}
                  <TabsContent value="penyesuaian-borang" className="space-y-6 mt-6">
                    <div className="relative">
                      {!canCustomizeBookingForm && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-start justify-center pt-12 rounded-lg min-h-[400px]">
                          <Button
                            onClick={() => setShowCustomizationUpgradePrompt(true)}
                            size="lg"
                            className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white hover:opacity-90"
                          >
                            <Lock className="mr-2 h-5 w-5" />
                            Naik taraf ke Pakej Gold
                          </Button>
                        </div>
                      )}

                      {/* Header Customization Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Layout className="h-5 w-5" />
                            Custom Header
                          </CardTitle>
                          <CardDescription>Tambah header dengan logo dan navigasi di borang tempahan</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-base">Enable Custom Header</Label>
                              <p className="text-sm text-muted-foreground">
                                Aktifkan header tersuai untuk borang tempahan
                              </p>
                            </div>
                            <Switch
                              checked={settings.enableCustomHeader}
                              onCheckedChange={(checked) => handleSettingChange('enableCustomHeader', checked)}
                            />
                          </div>

                          {settings.enableCustomHeader && (
                            <div className="mt-6 p-4 bg-muted/30 rounded-lg space-y-4">
                              <Label className="text-sm font-semibold">Navigasi Header</Label>

                              {/* Home Navigation */}
                              <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                  <Switch
                                    checked={settings.headerHomeEnabled}
                                    onCheckedChange={(checked) => handleSettingChange('headerHomeEnabled', checked)}
                                  />
                                  <div className="flex-1 space-y-2">
                                    <Label className="text-sm">Home</Label>
                                  </div>
                                </div>

                                {settings.headerHomeEnabled && (
                                  <div className="pl-8 space-y-2">
                                    <Label htmlFor="headerHomeText" className="text-xs">Home Description</Label>
                                    <Textarea
                                      id="headerHomeText"
                                      placeholder="Enter text to display when users click on Home..."
                                      value={settings.headerHomeText}
                                      onChange={(e) => handleSettingChange('headerHomeText', e.target.value)}
                                      rows={4}
                                      className="text-sm"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      This text will appear in a popup when users click on the Home navigation
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* About Navigation */}
                              <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                  <Switch
                                    checked={settings.headerAboutEnabled}
                                    onCheckedChange={(checked) => handleSettingChange('headerAboutEnabled', checked)}
                                  />
                                  <div className="flex-1 space-y-2">
                                    <Label className="text-sm">About</Label>
                                  </div>
                                </div>

                                {settings.headerAboutEnabled && (
                                  <div className="pl-8 space-y-2">
                                    <Label htmlFor="headerAboutText" className="text-xs">About Description</Label>
                                    <Textarea
                                      id="headerAboutText"
                                      placeholder="Enter text to display when users click on About..."
                                      value={settings.headerAboutText}
                                      onChange={(e) => handleSettingChange('headerAboutText', e.target.value)}
                                      rows={4}
                                      className="text-sm"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      This text will appear in a popup when users click on the About navigation
                                    </p>

                                    {/* About Photo Upload */}
                                    <div className="space-y-2 mt-4">
                                      <Label htmlFor="headerAboutPhoto" className="text-xs">
                                        About Photo (Optional)
                                        {settings.headerAboutPhoto && <span className="text-muted-foreground ml-1">- Upload new to replace</span>}
                                      </Label>
                                      <Input
                                        id="headerAboutPhoto"
                                        type="file"
                                        accept="image/*"
                                        disabled={isUploadingAboutPhoto}
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;

                                          if (!effectiveStudioId) {
                                            toast({
                                              title: "Studio not ready",
                                              description: "Please select a studio before uploading a photo.",
                                              variant: "destructive",
                                            });
                                            return;
                                          }

                                          setIsUploadingAboutPhoto(true);
                                          try {
                                            const { uploadAboutPhoto } = await import('@/services/fileUploadService');
                                            const result = await uploadAboutPhoto(file, effectiveStudioId);
                                            if (result.success && result.url) {
                                              handleSettingChange('headerAboutPhoto', result.url);
                                              toast({ title: "Photo uploaded", description: "About photo updated successfully." });
                                            } else {
                                              toast({
                                                title: "Upload failed",
                                                description: result.error || "Failed to upload photo",
                                                variant: "destructive",
                                              });
                                            }
                                          } catch (error) {
                                            console.error('About photo upload error:', error);
                                            toast({
                                              title: "Upload failed",
                                              description: "Unexpected error while uploading photo",
                                              variant: "destructive",
                                            });
                                          } finally {
                                            setIsUploadingAboutPhoto(false);
                                            // Clear the input
                                            e.target.value = '';
                                          }
                                        }}
                                      />
                                      {settings.headerAboutPhoto ? (
                                        <div className="space-y-2 p-3 bg-muted rounded-md">
                                          <span className="text-sm block">Current photo:</span>
                                          <div className="relative w-full max-w-xs max-h-48 rounded-md border bg-white overflow-hidden flex items-center justify-center">
                                            <img
                                              src={settings.headerAboutPhoto}
                                              alt="About photo"
                                              className="max-w-full max-h-48 h-auto object-contain"
                                              onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                              }}
                                            />
                                            {isUploadingAboutPhoto && (
                                              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                                                <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                                              </div>
                                            )}
                                            <Button
                                              type="button"
                                              size="icon"
                                              variant="ghost"
                                              className="absolute top-1 right-1 h-8 w-8 bg-red-600 hover:bg-red-700 text-white"
                                              onClick={() => {
                                                handleSettingChange('headerAboutPhoto', '');
                                                toast({
                                                  title: "Photo removed",
                                                  description: "About photo has been removed. Click 'Simpan Tetapan' to save changes.",
                                                });
                                              }}
                                              aria-label="Delete about photo"
                                            >
                                              <Trash className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">
                                          Upload a photo to display in the About popup
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Portfolio Navigation */}
                              <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                  <Switch
                                    checked={settings.headerPortfolioEnabled}
                                    onCheckedChange={(checked) => handleSettingChange('headerPortfolioEnabled', checked)}
                                  />
                                  <div className="flex-1 space-y-2">
                                    <Label className="text-sm">Portfolio</Label>
                                  </div>
                                </div>

                                {settings.headerPortfolioEnabled && (
                                  <div className="pl-8 space-y-4">
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
                                )}
                              </div>

                              {/* Contact Navigation */}
                              <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                  <Switch
                                    checked={settings.headerContactEnabled}
                                    onCheckedChange={(checked) => handleSettingChange('headerContactEnabled', checked)}
                                  />
                                  <div className="flex-1 space-y-2">
                                    <Label className="text-sm">Contact</Label>
                                  </div>
                                </div>

                                {settings.headerContactEnabled && (
                                  <div className="pl-8 space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="headerContactAddress" className="text-xs">Address</Label>
                                      <Textarea
                                        id="headerContactAddress"
                                        placeholder="Enter your studio address..."
                                        value={settings.headerContactAddress}
                                        onChange={(e) => handleSettingChange('headerContactAddress', e.target.value)}
                                        rows={3}
                                        className="text-sm"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="headerContactPhone" className="text-xs">Telephone No</Label>
                                      <Input
                                        id="headerContactPhone"
                                        placeholder="+60123456789"
                                        value={settings.headerContactPhone}
                                        onChange={(e) => handleSettingChange('headerContactPhone', e.target.value)}
                                        className="text-sm"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="headerContactEmail" className="text-xs">Email</Label>
                                      <Input
                                        id="headerContactEmail"
                                        type="email"
                                        placeholder="studio@example.com"
                                        value={settings.headerContactEmail}
                                        onChange={(e) => handleSettingChange('headerContactEmail', e.target.value)}
                                        className="text-sm"
                                      />
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                      This contact information will appear in a popup when users click on the Contact navigation
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Footer Customization Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Layout className="h-5 w-5 rotate-180" />
                            Custom Footer
                          </CardTitle>
                          <CardDescription>Tambah footer dengan ikon media sosial</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-base">Enable Custom Footer</Label>
                              <p className="text-sm text-muted-foreground">
                                Aktifkan footer tersuai untuk borang tempahan
                              </p>
                            </div>
                            <Switch
                              checked={settings.enableCustomFooter}
                              onCheckedChange={(checked) => handleSettingChange('enableCustomFooter', checked)}
                            />
                          </div>

                          {settings.enableCustomFooter && (
                            <div className="mt-6 p-4 bg-muted/30 rounded-lg space-y-4">
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
                        </CardContent>
                      </Card>

                      {/* WhatsApp Float Button Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            WhatsApp Button
                          </CardTitle>
                          <CardDescription>Butang WhatsApp terapung di borang tempahan</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-base">Enable WhatsApp Button</Label>
                              <p className="text-sm text-muted-foreground">
                                Paparkan butang WhatsApp terapung di borang tempahan
                              </p>
                            </div>
                            <Switch
                              checked={settings.enableWhatsappButton}
                              onCheckedChange={(checked) => handleSettingChange('enableWhatsappButton', checked)}
                            />
                          </div>

                          {settings.enableWhatsappButton && (
                            <div className="mt-6 p-4 bg-muted/30 rounded-lg space-y-4">
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
                        </CardContent>
                      </Card>

                      {/* Brand Colors Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Paintbrush className="h-5 w-5" />
                            Warna Jenama
                          </CardTitle>
                          <CardDescription>Pilih warna untuk header, footer, dan butang</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                        </CardContent>
                      </Card>

                      {/* Preview Section Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5" />
                            Pratonton
                          </CardTitle>
                          <CardDescription>Lihat pratonton borang tempahan dengan tetapan semasa</CardDescription>
                        </CardHeader>
                        <CardContent>
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
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Sub-tab 7: Cara Pembayaran */}
                  <TabsContent value="cara-pembayaran" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Cara Pembayaran</CardTitle>
                        <CardDescription>Aktifkan atau matikan kaedah pembayaran yang tersedia untuk pelanggan dalam borang tempahan</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base text-gray-900">Pembayaran di studio</Label>
                            <p className="text-sm text-gray-500">Pelanggan membayar secara tunai atau kad di studio</p>
                          </div>
                          <Switch
                            checked={settings.paymentStudioEnabled}
                            onCheckedChange={(checked) => handleSettingChange('paymentStudioEnabled', checked)}
                          />
                        </div>

                        <Separator className="bg-gray-100" />

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base text-gray-900">QR Code</Label>
                            <p className="text-sm text-gray-500">Pelanggan mengimbas kod QR untuk pembayaran</p>
                          </div>
                          <Switch
                            checked={settings.paymentQrEnabled}
                            onCheckedChange={(checked) => handleSettingChange('paymentQrEnabled', checked)}
                          />
                        </div>

                        <Separator className="bg-gray-100" />

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base text-gray-900">Direct Bank Transfer</Label>
                            <p className="text-sm text-gray-500">Pelanggan memindahkan wang terus ke akaun bank studio</p>
                          </div>
                          <Switch
                            checked={settings.paymentBankTransferEnabled}
                            onCheckedChange={(checked) => handleSettingChange('paymentBankTransferEnabled', checked)}
                          />
                        </div>

                        <Separator className="bg-gray-100" />

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base text-gray-900">FPX</Label>
                            <p className="text-sm text-gray-500">Pembayaran melalui perbankan dalam talian (FPX)</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={settings.paymentFpxEnabled}
                              disabled={!canEnableFPX}
                              onCheckedChange={(checked) => {
                                if (!canEnableFPX) {
                                  setShowFpxUpgradePrompt(true);
                                } else {
                                  handleSettingChange('paymentFpxEnabled', checked);
                                }
                              }}
                            />
                            {!canEnableFPX && (
                              <Badge variant="outline" className="bg-gradient-to-r from-purple-400 to-purple-600 text-white border-none text-xs">
                                Platinum
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Separator className="bg-gray-100" />

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base text-gray-900">Touch n Go</Label>
                            <p className="text-sm text-gray-500">Pembayaran menggunakan aplikasi Touch n Go eWallet</p>
                          </div>
                          <Switch
                            checked={settings.paymentTngEnabled}
                            onCheckedChange={(checked) => handleSettingChange('paymentTngEnabled', checked)}
                          />
                        </div>

                        {settings.paymentTngEnabled && (
                          <div className="mt-4 pl-4 border-l-2 border-primary/20 space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="tngQrCode" className="text-sm">Touch n Go QR Code</Label>
                              <Input
                                id="tngQrCode"
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  if (!effectiveStudioId) {
                                    toast({
                                      title: "Studio not ready",
                                      description: "Please select a studio before uploading a QR code.",
                                      variant: "destructive",
                                    });
                                    return;
                                  }

                                  setIsUploadingTngQr(true);
                                  try {
                                    const { uploadLogo } = await import('@/services/fileUploadService');
                                    // We can reuse uploadLogo as it's generic enough for QR codes
                                    const result = await uploadLogo(file, effectiveStudioId);
                                    if (result.success && result.url) {
                                      handleSettingChange('tngQrCode', result.url);
                                      toast({ title: "QR Code uploaded", description: "TNG QR updated successfully." });
                                    } else {
                                      toast({
                                        title: "Upload failed",
                                        description: result.error || "Failed to upload QR code",
                                        variant: "destructive",
                                      });
                                    }
                                  } catch (error) {
                                    console.error('TNG QR upload error:', error);
                                    toast({
                                      title: "Upload failed",
                                      description: "Unexpected error while uploading QR code",
                                      variant: "destructive",
                                    });
                                  } finally {
                                    setIsUploadingTngQr(false);
                                  }
                                }}
                              />
                              {settings.tngQrCode && (
                                <div className="mt-2 relative h-32 w-32 border rounded-md overflow-hidden bg-white flex items-center justify-center">
                                  <img
                                    src={settings.tngQrCode}
                                    alt="Touch n Go QR Code"
                                    className="h-full w-full object-contain"
                                  />
                                  {isUploadingTngQr && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                                      <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                                    </div>
                                  )}
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Muat naik kod QR Touch n Go studio anda untuk dipaparkan kepada pelanggan semasa membuat tempahan.
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                </Tabs>

                {/* Save Button for Tab 4 */}
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

              {/* Tab 5: Users */}
              < TabsContent value="users" className="space-y-6 mt-6" >
                {/* Sub-account Usage Display */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <h3 className="text-sm font-semibold">Sub-Account Usage</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {studioUsers.filter(u => u.role !== 'super_admin').length} / {maxSubAccounts === Infinity ? '∞' : maxSubAccounts} sub-accounts used
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {studio?.package_name?.toUpperCase() || 'SILVER'} Plan
                  </Badge>
                </div>

                {/* Add New User Form - Conditional based on limit */}
                {studioUsers.filter(u => u.role !== 'super_admin').length >= maxSubAccounts ? (
                  <Card className="border-yellow-200 bg-yellow-50/50">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-3 bg-yellow-100 rounded-full">
                          <AlertCircle className="h-8 w-8 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-2">Sub-Account Limit Reached</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Your {studio?.package_name?.toUpperCase() || 'SILVER'} plan allows {maxSubAccounts} sub-account{maxSubAccounts !== 1 ? 's' : ''}.
                            Upgrade to add more users to your studio.
                          </p>
                          <Button
                            variant="default"
                            className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white hover:opacity-90"
                            onClick={() => window.open('mailto:support@rayastudio.com?subject=Package Upgrade Request', '_blank')}
                          >
                            Contact Sales to Upgrade
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  /* Add New User Form */
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
                )}

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
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studioUsers.map((studioUser) => {
                            const isEditing = editingUserId === studioUser.id;
                            const isCurrentUser = user?.id === studioUser.id;

                            return (
                              <TableRow key={studioUser.id}>
                                <TableCell className="font-medium">
                                  {isEditing ? (
                                    <Input
                                      value={editUserForm.full_name}
                                      onChange={(e) => setEditUserForm({ ...editUserForm, full_name: e.target.value })}
                                      placeholder="Full Name"
                                      className="h-8"
                                    />
                                  ) : (
                                    studioUser.full_name
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <Input
                                      type="email"
                                      value={editUserForm.email}
                                      onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                                      placeholder="Email"
                                      className="h-8"
                                    />
                                  ) : (
                                    studioUser.email
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <Input
                                      type="tel"
                                      value={editUserForm.phone}
                                      onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                                      placeholder="Phone"
                                      className="h-8"
                                    />
                                  ) : (
                                    studioUser.phone || '-'
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="default">
                                    {studioUser.role === 'admin' ? 'Admin' : studioUser.role === 'staff' ? 'Staff' : studioUser.role}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {new Date(studioUser.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {isEditing ? (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleSaveEdit(studioUser.id)}
                                          className="h-8 w-8 p-0"
                                        >
                                          <Save className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={handleCancelEdit}
                                          className="h-8 w-8 p-0"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleEditUser(studioUser)}
                                          disabled={isCurrentUser}
                                          className="h-8 w-8 p-0"
                                          title={isCurrentUser ? "Cannot edit your own account" : "Edit user"}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleDeleteUser(studioUser.id, studioUser.full_name)}
                                          disabled={isCurrentUser || isDeletingUser === studioUser.id}
                                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          title={isCurrentUser ? "Cannot delete your own account" : "Delete user"}
                                        >
                                          {isDeletingUser === studioUser.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Trash className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card >
              </TabsContent >

              {/* Tab 6: Waktu Operasi */}
              <TabsContent value="waktu-operasi" className="space-y-6 mt-6">
                {/* Studio Operational Status - Killer Switch */}
                <Card className={`border-2 ${settings.isOperational ? 'border-green-500/50 bg-green-50/50' : 'border-red-500/50 bg-red-50/50'}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {settings.isOperational ? (
                            <>
                              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                              <h3 className="text-lg font-semibold text-green-900">Studio Beroperasi</h3>
                            </>
                          ) : (
                            <>
                              <div className="h-3 w-3 rounded-full bg-red-500"></div>
                              <h3 className="text-lg font-semibold text-red-900">Studio Tidak Beroperasi</h3>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {settings.isOperational
                            ? 'Studio sedang menerima tempahan. Pelanggan boleh membuat tempahan melalui borang tempahan.'
                            : 'Studio tidak menerima tempahan. Pelanggan tidak boleh membuat tempahan baru.'
                          }
                        </p>
                      </div>
                      <div>
                        {settings.isOperational ? (
                          <Button
                            variant="destructive"
                            size="lg"
                            onClick={() => handleToggleOperationalStatus(false)}
                            className="min-w-[180px]"
                          >
                            <X className="h-5 w-5 mr-2" />
                            Tidak Beroperasi
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="lg"
                            onClick={() => handleToggleOperationalStatus(true)}
                            className="min-w-[180px] bg-green-600 hover:bg-green-700"
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            Mula Beroperasi
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Operating Hours Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Waktu Operasi</CardTitle>
                        <CardDescription>Waktu operasi studio setiap hari</CardDescription>
                      </div>
                      {isEditingOperatingHours ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleSaveOperatingHours}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Simpan
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingOperatingHours(true)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 flex-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Mula</span>
                        <Input
                          type="time"
                          value={settings.operatingStartTime}
                          onChange={(e) => handleSettingChange('operatingStartTime', e.target.value)}
                          disabled={!isEditingOperatingHours}
                          className="w-32"
                        />
                      </div>
                      <span className="text-muted-foreground">-</span>
                      <div className="flex items-center gap-2 flex-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Tamat</span>
                        <Input
                          type="time"
                          value={settings.operatingEndTime}
                          onChange={(e) => handleSettingChange('operatingEndTime', e.target.value)}
                          disabled={!isEditingOperatingHours}
                          className="w-32"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Break Time Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Waktu Berehat</CardTitle>
                        <CardDescription>Waktu berehat di mana studio tidak menerima tempahan</CardDescription>
                      </div>
                      {isEditingBreakTime ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleSaveBreakTime}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Simpan
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingBreakTime(true)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 flex-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Mula</span>
                        <Input
                          type="time"
                          value={settings.breakStartTime}
                          onChange={(e) => handleSettingChange('breakStartTime', e.target.value)}
                          disabled={!isEditingBreakTime}
                          className="w-32"
                        />
                      </div>
                      <span className="text-muted-foreground">-</span>
                      <div className="flex items-center gap-2 flex-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Tamat</span>
                        <Input
                          type="time"
                          value={settings.breakEndTime}
                          onChange={(e) => handleSettingChange('breakEndTime', e.target.value)}
                          disabled={!isEditingBreakTime}
                          className="w-32"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Unavailable Dates Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tarikh Tidak Beroperasi</CardTitle>
                    <CardDescription>Tetapkan tarikh dan waktu di mana studio tidak beroperasi (cuti umum, cuti tahunan, dll)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Add Unavailable Date Button */}
                    <Dialog
                      open={isDialogOpen}
                      onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) {
                          // Reset editing state when dialog closes
                          setEditingDateId(null);
                          setUnavailableDate({
                            startDate: '',
                            endDate: '',
                            reason: '',
                            startTime: '09:00',
                            endTime: '18:00'
                          });
                          setIsDateRange(false);
                          setIsWholeDay(true);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Tambah Tarikh Tidak Beroperasi
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>
                            {editingDateId ? 'Edit Tarikh & Waktu' : 'Tambah Tarikh & Waktu'}
                          </DialogTitle>
                          <DialogDescription>
                            Tetapkan tarikh dan waktu di mana studio tidak beroperasi
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {/* Date Range Toggle */}
                          <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <Switch
                              id="dialog-date-range"
                              checked={isDateRange}
                              onCheckedChange={setIsDateRange}
                            />
                            <div className="flex-1">
                              <Label htmlFor="dialog-date-range" className="font-medium cursor-pointer">Studio tidak beroperasi lebih dari 1 hari</Label>
                              <p className="text-xs text-muted-foreground">Pilih beberapa hari berturut-turut</p>
                            </div>
                          </div>

                          {/* Date Inputs */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`space-y-2 ${!isDateRange ? 'md:col-span-2' : ''}`}>
                              <Label htmlFor="dialog-start-date">Tarikh Mula *</Label>
                              <Input
                                id="dialog-start-date"
                                type="date"
                                value={unavailableDate.startDate}
                                onChange={(e) => setUnavailableDate({ ...unavailableDate, startDate: e.target.value })}
                                placeholder="Pilih tarikh"
                              />
                            </div>
                            {/* End Date - Only shown when date range is enabled */}
                            {isDateRange && (
                              <div className="space-y-2">
                                <Label htmlFor="dialog-end-date">Tarikh Tamat *</Label>
                                <Input
                                  id="dialog-end-date"
                                  type="date"
                                  value={unavailableDate.endDate}
                                  onChange={(e) => setUnavailableDate({ ...unavailableDate, endDate: e.target.value })}
                                  placeholder="Pilih tarikh tamat"
                                />
                              </div>
                            )}
                          </div>

                          {/* Reason */}
                          <div className="space-y-2">
                            <Label htmlFor="dialog-unavailable-reason">Sebab (Optional)</Label>
                            <Input
                              id="dialog-unavailable-reason"
                              value={unavailableDate.reason}
                              onChange={(e) => setUnavailableDate({ ...unavailableDate, reason: e.target.value })}
                              placeholder="Cth: Cuti Umum, Cuti Tahunan, Cuti Peribadi"
                            />
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <Switch
                              id="dialog-whole-day-unavailable"
                              checked={isWholeDay}
                              onCheckedChange={setIsWholeDay}
                            />
                            <div className="flex-1">
                              <Label htmlFor="dialog-whole-day-unavailable" className="font-medium cursor-pointer">Sepanjang Hari</Label>
                              <p className="text-xs text-muted-foreground">Studio tidak beroperasi sepanjang hari</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="dialog-start-time">Waktu Mula Tidak Tersedia</Label>
                              <Input
                                id="dialog-start-time"
                                type="time"
                                value={unavailableDate.startTime}
                                onChange={(e) => setUnavailableDate({ ...unavailableDate, startTime: e.target.value })}
                                disabled={isWholeDay}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="dialog-end-time">Waktu Tamat Tidak Tersedia</Label>
                              <Input
                                id="dialog-end-time"
                                type="time"
                                value={unavailableDate.endTime}
                                onChange={(e) => setUnavailableDate({ ...unavailableDate, endTime: e.target.value })}
                                disabled={isWholeDay}
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            onClick={handleAddUnavailableDate}
                            className="w-full sm:w-auto"
                          >
                            {editingDateId ? (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Simpan
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* List of Unavailable Dates */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Senarai Tarikh Tidak Tersedia</Label>
                      <div className="border rounded-lg divide-y">
                        {unavailableDates.length === 0 ? (
                          /* Empty state */
                          <div className="p-8 text-center text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Tiada data</p>
                          </div>
                        ) : (
                          /* List of dates */
                          unavailableDates.map((date) => (
                            <div key={date.id} className="p-4 hover:bg-muted/50 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {new Date(date.start_date).toLocaleDateString('ms-MY', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric'
                                    })}
                                    {date.end_date && (
                                      <span> - {new Date(date.end_date).toLocaleDateString('ms-MY', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                      })}</span>
                                    )}
                                  </div>
                                  {date.reason && (
                                    <p className="text-sm text-muted-foreground mt-1">{date.reason}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                    {date.is_whole_day ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                        <Clock className="h-3 w-3" />
                                        Sepanjang Hari
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded">
                                        <Clock className="h-3 w-3" />
                                        {date.start_time} - {date.end_time}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {/* Action Buttons */}
                                <div className="flex items-center gap-2">
                                  {/* Edit Button */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditUnavailableDate(date)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {/* Delete Button */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const dateInfo = new Date(date.start_date).toLocaleDateString('ms-MY', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                      }) + (date.end_date ? ` - ${new Date(date.end_date).toLocaleDateString('ms-MY', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                      })}` : '');
                                      handleDeleteUnavailableDate(date.id, dateInfo);
                                    }}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Staff Management */}
                <StaffManagementCard
                  staffMembers={staffMembers}
                  isLoading={isLoadingStaff}
                  isDialogOpen={isStaffDialogOpen}
                  editingStaffId={editingStaffId}
                  staffForm={staffForm}
                  isDeletingStaff={isDeletingStaff}
                  onOpenDialog={handleOpenNewStaffDialog}
                  onCloseDialog={() => setIsStaffDialogOpen(false)}
                  onSaveStaff={handleSaveStaff}
                  onEditStaff={handleEditStaff}
                  onDeleteStaff={handleDeleteStaff}
                  onFormChange={(field, value) => {
                    setStaffForm(prev => ({ ...prev, [field]: value }));
                  }}
                />

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
              </TabsContent>
            </Tabs >
          </div >
        </main >

        {/* Upgrade Prompts */}
        {customizationRequiredTier && (
          <UpgradePrompt
            open={showCustomizationUpgradePrompt}
            onClose={() => setShowCustomizationUpgradePrompt(false)}
            requiredTier={customizationRequiredTier}
            feature={FEATURES.BOOKING_CUSTOMIZATION}
          />
        )}

        {fpxRequiredTier && (
          <UpgradePrompt
            open={showFpxUpgradePrompt}
            onClose={() => setShowFpxUpgradePrompt(false)}
            requiredTier={fpxRequiredTier}
            feature={FEATURES.FPX_PAYMENT}
          />
        )}
      </div >
    );
  }
};

export default AdminSettings;
