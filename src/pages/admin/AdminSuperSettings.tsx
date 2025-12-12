import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Menu, Home, Users, CalendarDays, BarChart3, Cog, LogOut, Key, Shield, Mail, Phone, Plus, X, FileText, Edit, Check, RotateCcw, User, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { AdminUser, Customer } from '@/types/database';

// Import payment gateway service
import { getPaymentGatewaySettings, updatePaymentGatewaySettings } from '@/services/paymentGatewayService';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Tempahan', href: '/admin/bookings', icon: CalendarDays },
  { name: 'Laporan', href: '/admin/reports', icon: BarChart3 },
  { name: 'Pengurusan', href: '/admin/management', icon: Users },
  { name: 'Tetapan', href: '/admin/settings', icon: Cog },
];

// Component for individual notification configuration item
const NotificationConfigItem = ({
  notification,
  availableTemplates,
  onUpdate
}: {
  notification: any;
  availableTemplates: any[];
  onUpdate: (id: string, updates: any) => void;
}) => {
  const [isEnabled, setIsEnabled] = useState(notification.is_enabled || false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(notification.email_template_id || '');
  const [saving, setSaving] = useState(false);

  const hasChanges = isEnabled !== notification.is_enabled ||
    selectedTemplateId !== (notification.email_template_id || '');

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(notification.id, {
        is_enabled: isEnabled,
        email_template_id: selectedTemplateId || null
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h5 className="font-medium text-sm mb-1">{notification.name}</h5>
          <p className="text-xs text-muted-foreground">{notification.description}</p>
        </div>
        {/* Enable/Disable Toggle */}
        <label className="relative inline-flex items-center cursor-pointer ml-4">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
          />
          <div className={`w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300
            ${isEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-all
            ${isEnabled ? 'translate-x-full' : ''}`}></div>
        </label>
      </div>

      {/* Template Selection */}
      <div className="space-y-2">
        <Label className="text-sm">SendGrid Template</Label>
        <select
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          disabled={availableTemplates.length === 0}
        >
          <option value="">
            {availableTemplates.length === 0 ? '-- No templates available --' : '-- Select Template --'}
          </option>
          {availableTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        {availableTemplates.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Add templates in the SendGrid Templates section below to configure mappings.
          </p>
        )}
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end pt-2 border-t">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Mapping'}
          </Button>
        </div>
      )}
    </div>
  );
};

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

  // Payment gateway settings state
  const [paymentGatewaySettings, setPaymentGatewaySettings] = useState({
    userSecretKey: '',
    categoryCode: '',
  });

  // Twilio settings state
  const [twilioSettings, setTwilioSettings] = useState({
    twilioSid: '',
    twilioAuthToken: '',
    twilioWhatsappNumber: '',
  });
  const [sendgridTemplates, setSendgridTemplates] = useState<Array<any>>([]);
  const [newTemplate, setNewTemplate] = useState({
    template_id: '',
    name: '',
    description: '',
    subject: '',
    template_variables: [] as string[]
  });
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editTemplateData, setEditTemplateData] = useState({
    template_id: '',
    name: '',
    description: '',
    subject: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Email notifications state
  const [emailNotifications, setEmailNotifications] = useState<any[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [emailLoading, setEmailLoading] = useState(false);

  // Users state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Edit dialog state
  const [editingUser, setEditingUser] = useState<AdminUser | Customer | null>(null);
  const [editUserData, setEditUserData] = useState<any>({});

  // Load super admin settings and email notifications
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

        // Load payment gateway settings from database
        const paymentResult = await getPaymentGatewaySettings();
        if (paymentResult.success && paymentResult.settings) {
          setPaymentGatewaySettings({
            userSecretKey: paymentResult.settings.user_secret_key || '',
            categoryCode: paymentResult.settings.category_code || '',
          });
        }

        // Load Twilio settings from database
        const { getTwilioSettings } = await import('@/services/twilioService');
        const twilioResult = await getTwilioSettings();
        if (twilioResult.success && twilioResult.settings) {
          setTwilioSettings({
            twilioSid: twilioResult.settings.twilio_sid || '',
            twilioAuthToken: twilioResult.settings.twilio_auth_token || '',
            twilioWhatsappNumber: twilioResult.settings.twilio_whatsapp_number || '',
          });
        }

        // Load email notifications and templates
        await loadEmailNotifications();

        // Load users
        await loadUsers();
      } catch (error) {
        console.error('Error loading super admin settings:', error);
      }
    };

    loadSuperAdminSettings();
  }, []);

  // Load email notifications from database
  const loadEmailNotifications = async () => {
    setEmailLoading(true);
    try {
      const { getEmailNotifications, getEmailTemplates } = await import('@/services/emailService');

      // Load notifications
      const notificationsResult = await getEmailNotifications();
      if (notificationsResult.success) {
        setEmailNotifications(notificationsResult.notifications || []);
      }

      // Load available templates
      const templatesResult = await getEmailTemplates();
      if (templatesResult.success) {
        setAvailableTemplates(templatesResult.templates || []);
      }
    } catch (error) {
      console.error('Error loading email notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email notification settings',
        variant: 'destructive',
      });
    } finally {
      setEmailLoading(false);
    }
  };

  // Save email notification configuration
  const saveEmailNotification = async (notificationId: string, updates: any) => {
    try {
      const { updateEmailNotification } = await import('@/services/emailService');
      const result = await updateEmailNotification(notificationId, updates);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Email notification configuration updated',
        });
        // Reload notifications
        await loadEmailNotifications();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update notification',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving email notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to save email notification configuration',
        variant: 'destructive',
      });
    }
  };

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

  const handlePaymentGatewayChange = (field: string, value: string) => {
    setPaymentGatewaySettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTwilioChange = (field: string, value: string) => {
    setTwilioSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };



  // Template management functions
  const addTemplate = async () => {
    if (newTemplate.name && newTemplate.template_id) {
      try {
        const { createEmailTemplate } = await import('@/services/emailService');
        const result = await createEmailTemplate({
          template_id: newTemplate.template_id,
          name: newTemplate.name,
          subject: `Template: ${newTemplate.name}`,
        });

        if (result.success) {
          setNewTemplate({
            template_id: '',
            name: '',
            description: '',
            subject: '',
            template_variables: []
          });
          // Reload templates
          await loadEmailNotifications();

          toast({
            title: 'Berjaya!',
            description: 'Template telah ditambah',
          });
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to create template',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to create template',
          variant: 'destructive',
        });
      }
    }
  };

  const startEditTemplate = (template: any) => {
    setEditingTemplate(template.id);
    setEditTemplateData({
      template_id: template.template_id,
      name: template.name,
      description: template.description || '',
      subject: template.subject || '',
    });
  };

  const cancelEditTemplate = () => {
    setEditingTemplate(null);
    setEditTemplateData({
      template_id: '',
      name: '',
      description: '',
      subject: '',
    });
  };

  const saveEditTemplate = async () => {
    if (!editingTemplate) return;

    try {
      const { updateEmailTemplate } = await import('@/services/emailService');
      const result = await updateEmailTemplate(editingTemplate, editTemplateData);

      if (result.success) {
        setEditingTemplate(null);
        setEditTemplateData({
          template_id: '',
          name: '',
          description: '',
          subject: '',
        });
        // Reload templates
        await loadEmailNotifications();

        toast({
          title: 'Template dikemas kini',
          description: 'Template telah berjaya dikemas kini',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update template',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive',
      });
    }
  };

  const removeTemplate = async (templateId: string) => {
    try {
      const { deleteEmailTemplate } = await import('@/services/emailService');
      const result = await deleteEmailTemplate(templateId);

      if (result.success) {
        // Reload templates
        await loadEmailNotifications();

        toast({
          title: 'Template dibuang',
          description: 'Template telah berjaya dibuang',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete template',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  // Load users from database
  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      // Load admin users
      const { data: adminUsersData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (adminError) {
        console.error('Error loading admin users:', adminError);
        toast({
          title: 'Error',
          description: 'Failed to load admin users',
          variant: 'destructive',
        });
      } else {
        setAdminUsers(adminUsersData || []);
      }

      // Load customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) {
        console.error('Error loading customers:', customersError);
        toast({
          title: 'Error',
          description: 'Failed to load customers',
          variant: 'destructive',
        });
      } else {
        setCustomers(customersData || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setUsersLoading(false);
    }
  };

  // Update user function
  const updateUser = async (user: AdminUser | Customer, isAdmin: boolean) => {
    try {
      const table = isAdmin ? 'admin_users' : 'customers';
      const { error } = await supabase
        .from(table)
        .update(user)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user:', error);
        toast({
          title: 'Error',
          description: 'Failed to update user',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'User updated successfully',
        });
        await loadUsers(); // Reload users after update
        setEditingUser(null); // Close edit dialog
        setEditUserData({}); // Clear edit data
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  // Open edit dialog
  const openEditUser = (user: AdminUser | Customer) => {
    setEditingUser(user);
    setEditUserData({ ...user });
  };

  // Close edit dialog
  const closeEditUser = () => {
    setEditingUser(null);
    setEditUserData({});
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage for now (in production, save to backend)
      localStorage.setItem('superAdminSettings', JSON.stringify(settings));
      localStorage.setItem('sendgridTemplates', JSON.stringify(sendgridTemplates));

      // Save payment gateway settings to database
      const paymentResult = await updatePaymentGatewaySettings({
        user_secret_key: paymentGatewaySettings.userSecretKey,
        category_code: paymentGatewaySettings.categoryCode,
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Failed to save payment gateway settings');
      }

      // Save Twilio settings to database
      const { updateTwilioSettings } = await import('@/services/twilioService');
      const twilioResult = await updateTwilioSettings({
        twilio_sid: twilioSettings.twilioSid,
        twilio_auth_token: twilioSettings.twilioAuthToken,
        twilio_whatsapp_number: twilioSettings.twilioWhatsappNumber,
      });

      if (!twilioResult.success) {
        throw new Error(twilioResult.error || 'Failed to save Twilio settings');
      }

      toast({
        title: 'Berjaya!',
        description: 'Tetapan super admin, templat, pembayaran gateway dan Twilio telah disimpan',
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

          {/* Settings Tabs */}
          <Tabs defaultValue="users" className="w-full">
            <div className="border-b border-border">
              <TabsList className="grid w-full grid-cols-5 md:flex md:w-auto h-auto p-0 bg-transparent justify-start">
                <TabsTrigger value="users" className="text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  <User className="h-4 w-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="google-calendar" className="text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Google Calendar
                </TabsTrigger>
                <TabsTrigger value="payment-gateway" className="text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  <Key className="h-4 w-4 mr-2" />
                  Payment Gateway
                </TabsTrigger>
                <TabsTrigger value="sendgrid" className="text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  <Mail className="h-4 w-4 mr-2" />
                  SendGrid
                </TabsTrigger>
                <TabsTrigger value="twilio" className="text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  <Phone className="h-4 w-4 mr-2" />
                  Twilio WhatsApp
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Users Tab Content */}
            <TabsContent value="users" className="space-y-4">
              {/* Sub-tabs for User Types */}
              <Tabs defaultValue="system-users" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="system-users" className="text-sm">
                    <UserCheck className="h-4 w-4 mr-2" />
                    System Users
                  </TabsTrigger>
                  <TabsTrigger value="client-users" className="text-sm">
                    <User className="h-4 w-4 mr-2" />
                    Client Users
                  </TabsTrigger>
                </TabsList>

                {/* System Users (Admin Users) Table */}
                <TabsContent value="system-users" className="space-y-4 mt-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <UserCheck className="h-5 w-5" />
                        System Users
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Manage administrator and super admin accounts in the system
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {usersLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="text-sm text-muted-foreground mt-2">Loading system users...</p>
                        </div>
                      ) : adminUsers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No system users found</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4 font-medium text-sm">Name</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Phone</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Role</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Created</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminUsers.map((admin) => (
                                <tr key={admin.id} className="border-b hover:bg-muted/50">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-300 flex items-center justify-center">
                                        <span className="text-xs font-medium text-purple-800">
                                          {getInitials(admin.full_name)}
                                        </span>
                                      </div>
                                      <span className="font-medium text-sm">{admin.full_name}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-sm">{admin.email}</td>
                                  <td className="py-3 px-4 text-sm">{admin.phone || '-'}</td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${admin.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                      }`}>
                                      {admin.role?.replace('_', ' ').toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${admin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                      {admin.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-sm">
                                    {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : '-'}
                                  </td>
                                  <td className="py-3 px-4">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openEditUser(admin)}
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      Edit
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Client Users (Customers) Table */}
                <TabsContent value="client-users" className="space-y-4 mt-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Client Users
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Manage customer accounts and bookings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {usersLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="text-sm text-muted-foreground mt-2">Loading client users...</p>
                        </div>
                      ) : customers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No client users found</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4 font-medium text-sm">Name</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Phone</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Type</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Created</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {customers.map((customer) => (
                                <tr key={customer.id} className="border-b hover:bg-muted/50">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-green-100 border border-green-300 flex items-center justify-center">
                                        <span className="text-xs font-medium text-green-800">
                                          {getInitials(customer.name)}
                                        </span>
                                      </div>
                                      <span className="font-medium text-sm">{customer.name || 'Unnamed Customer'}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-sm">{customer.email}</td>
                                  <td className="py-3 px-4 text-sm">{customer.phone || '-'}</td>
                                  <td className="py-3 px-4">
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Client
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-sm">
                                    {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '-'}
                                  </td>
                                  <td className="py-3 px-4">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openEditUser(customer)}
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      Edit
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="google-calendar" className="space-y-4">
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
            </TabsContent>

            <TabsContent value="payment-gateway" className="space-y-4">
              {/* Payment Gateway Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Payment Gateway Configuration
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Tetapan untuk integrasi pembayaran
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="userSecretKey">User Secret Key</Label>
                      <Input
                        id="userSecretKey"
                        type="password"
                        value={paymentGatewaySettings.userSecretKey}
                        onChange={(e) => handlePaymentGatewayChange('userSecretKey', e.target.value)}
                        placeholder="Masukkan User Secret Key"
                        className="font-mono text-xs"
                      />
                      <p className="text-xs text-muted-foreground">
                        Rahsia pengguna untuk pembayaran gateway
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="categoryCode">Category Code</Label>
                      <Input
                        id="categoryCode"
                        value={paymentGatewaySettings.categoryCode}
                        onChange={(e) => handlePaymentGatewayChange('categoryCode', e.target.value)}
                        placeholder="Masukkan Category Code"
                        className="text-xs"
                      />
                      <p className="text-xs text-muted-foreground">
                        Kod kategori untuk klasifikasi pembayaran
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      onClick={saveSettings}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Menyimpan...' : 'Simpan Tetapan Payment Gateway'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sendgrid" className="space-y-4">
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

              {/* Side by side Email Notifications and SendGrid Templates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email Notification Configuration */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Notifications
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Configure email templates for user actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-2">
                      Map user actions to SendGrid templates
                    </div>

                    {emailLoading ? (
                      <div className="text-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        <p className="text-xs text-muted-foreground mt-1">Loading...</p>
                      </div>
                    ) : emailNotifications.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No notifications</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {emailNotifications.map((notification) => (
                          <NotificationConfigItem
                            key={notification.id}
                            notification={notification}
                            availableTemplates={availableTemplates}
                            onUpdate={saveEmailNotification}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* SendGrid Templates Section */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Templates
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Manage email templates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-2">
                      Templates for notifications
                    </div>

                    {/* Existing Templates */}
                    {availableTemplates.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {availableTemplates.map((template) => {
                          const isEditing = editingTemplate === template.id;
                          return (
                            <div key={template.id} className="border rounded-md p-3">
                              {isEditing ? (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 gap-3">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Template Name</Label>
                                      <Input
                                        value={editTemplateData.name}
                                        onChange={(e) => setEditTemplateData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g., Booking Confirmation"
                                        className="text-xs h-8"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Template ID</Label>
                                      <Input
                                        value={editTemplateData.template_id}
                                        onChange={(e) => setEditTemplateData(prev => ({ ...prev, template_id: e.target.value }))}
                                        placeholder="e.g., d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                        className="font-mono text-xs h-8"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={cancelEditTemplate}
                                      className="text-xs h-7 px-2"
                                    >
                                      <RotateCcw className="h-3 w-3 mr-1" />
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={saveEditTemplate}
                                      disabled={!editTemplateData.name || !editTemplateData.template_id}
                                      className="text-xs h-7 px-2"
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-xs truncate">{template.name}</p>
                                    <p className="text-xs text-muted-foreground font-mono truncate">{template.template_id}</p>
                                  </div>
                                  <div className="flex gap-1 ml-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => startEditTemplate(template)}
                                      className="text-xs h-6 w-6 p-0"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeTemplate(template.id)}
                                      className="text-destructive hover:text-destructive text-xs h-6 w-6 p-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {availableTemplates.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <FileText className="h-6 w-6 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No templates</p>
                      </div>
                    )}

                    {/* Add New Template */}
                    <div className="space-y-3 border-t pt-3">
                      <h5 className="font-medium text-sm">Add Template</h5>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Template Name</Label>
                          <Input
                            value={newTemplate.name}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Booking Confirmation"
                            className="text-xs h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Template ID</Label>
                          <Input
                            value={newTemplate.template_id}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, template_id: e.target.value }))}
                            placeholder="e.g., d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            className="font-mono text-xs h-8"
                          />
                        </div>
                        <Button
                          onClick={addTemplate}
                          disabled={!newTemplate.name || !newTemplate.template_id}
                          className="w-full text-xs h-8"
                          size="sm"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Template
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Save Button for SendGrid tab */}
              <div className="pt-4 border-t">
                <Button
                  onClick={saveSettings}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Tetapan SendGrid'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="twilio" className="space-y-4">
              {/* Twilio WhatsApp Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Twilio WhatsApp Configuration
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Tetapan untuk integrasi WhatsApp melalui Twilio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="twilioSidMobile" className="text-sm">Twilio SID</Label>
                    <Input
                      id="twilioSidMobile"
                      value={twilioSettings.twilioSid}
                      onChange={(e) => handleTwilioChange('twilioSid', e.target.value)}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Dapat dari Twilio Console → Project Settings → SID
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twilioAuthTokenMobile" className="text-sm">Auth Token</Label>
                    <Input
                      id="twilioAuthTokenMobile"
                      type="password"
                      value={twilioSettings.twilioAuthToken}
                      onChange={(e) => handleTwilioChange('twilioAuthToken', e.target.value)}
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Rahsia auth token dari Twilio
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twilioWhatsappNumberMobile" className="text-sm">WhatsApp Number</Label>
                    <Input
                      id="twilioWhatsappNumberMobile"
                      value={twilioSettings.twilioWhatsappNumber}
                      onChange={(e) => handleTwilioChange('twilioWhatsappNumber', e.target.value)}
                      placeholder="+1234567890"
                      className="text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Nombor WhatsApp yang didaftarkan dengan Twilio
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      onClick={saveSettings}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Menyimpan...' : 'Simpan Tetapan Twilio'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        {/* User Edit Dialog */}
        <Dialog open={!!editingUser} onOpenChange={closeEditUser}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                Edit {editingUser && 'id' in editingUser ? 'Admin User' : 'Customer'}
              </DialogTitle>
              <DialogDescription>
                Update user information and settings.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {editingUser && (
                <>
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {'full_name' in editingUser ? (
                      <div className="space-y-2">
                        <Label htmlFor="edit-full-name">Full Name</Label>
                        <Input
                          id="edit-full-name"
                          value={editUserData.full_name || ''}
                          onChange={(e) => setEditUserData(prev => ({ ...prev, full_name: e.target.value }))}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Name</Label>
                        <Input
                          id="edit-name"
                          value={editUserData.name || ''}
                          onChange={(e) => setEditUserData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editUserData.email || ''}
                        onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                  </div>

                  {/* Additional Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {('phone' in editingUser || 'phone' in editUserData) && (
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone">Phone</Label>
                        <Input
                          id="edit-phone"
                          value={editUserData.phone || ''}
                          onChange={(e) => setEditUserData(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                    )}

                    {/* Admin-specific fields */}
                    {'role' in editingUser && (
                      <div className="space-y-2">
                        <Label htmlFor="edit-role">Role</Label>
                        <Select
                          value={editUserData.role || ''}
                          onValueChange={(value) => setEditUserData(prev => ({ ...prev, role: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Status toggles */}
                  <div className="space-y-4">
                    {'is_active' in editingUser && (
                      <div className="flex items-center space-x-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={editUserData.is_active || false}
                            onChange={(e) => setEditUserData(prev => ({ ...prev, is_active: e.target.checked }))}
                          />
                          <div className={`w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300
                            ${editUserData.is_active ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                          <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-all
                            ${editUserData.is_active ? 'translate-x-full' : ''}`}></div>
                        </label>
                        <Label className="text-sm font-normal">
                          {editUserData.is_active ? 'Account Active' : 'Account Inactive'}
                        </Label>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={closeEditUser}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingUser) {
                    updateUser(editUserData, 'auth_user_id' in editingUser);
                  }
                }}
                disabled={usersLoading}
              >
                {usersLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

            {/* Settings Tabs */}
            <Tabs defaultValue="users" className="w-full max-w-6xl">
              <div className="border-b border-border">
                <TabsList className="grid w-full grid-cols-5 md:flex md:w-auto h-auto p-0 bg-transparent justify-start">
                  <TabsTrigger value="users" className="text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    <User className="h-4 w-4 mr-2" />
                    Users
                  </TabsTrigger>
                  <TabsTrigger value="google-calendar" className="text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Google Calendar
                  </TabsTrigger>
                  <TabsTrigger value="payment-gateway" className="text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    <Key className="h-4 w-4 mr-2" />
                    Payment Gateway
                  </TabsTrigger>
                  <TabsTrigger value="sendgrid" className="text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    <Mail className="h-4 w-4 mr-2" />
                    SendGrid
                  </TabsTrigger>
                  <TabsTrigger value="twilio" className="text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    <Phone className="h-4 w-4 mr-2" />
                    Twilio WhatsApp
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Users Tab Content */}
              <TabsContent value="users" className="space-y-6 mt-6">
                {/* Sub-tabs for User Types */}
                <Tabs defaultValue="system-users" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="system-users" className="text-sm">
                      <UserCheck className="h-4 w-4 mr-2" />
                      System Users
                    </TabsTrigger>
                    <TabsTrigger value="client-users" className="text-sm">
                      <User className="h-4 w-4 mr-2" />
                      Client Users
                    </TabsTrigger>
                  </TabsList>

                  {/* System Users (Admin Users) Table */}
                  <TabsContent value="system-users" className="space-y-4 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <UserCheck className="h-5 w-5" />
                          System Users
                        </CardTitle>
                        <CardDescription>
                          Manage administrator and super admin accounts in the system
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {usersLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="text-sm text-muted-foreground mt-2">Loading system users...</p>
                          </div>
                        ) : adminUsers.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No system users found</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-3 px-4 font-medium text-sm">Name</th>
                                  <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                                  <th className="text-left py-3 px-4 font-medium text-sm">Phone</th>
                                  <th className="text-left py-3 px-4 font-medium text-sm">Role</th>
                                  <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                                  <th className="text-left py-3 px-4 font-medium text-sm">Created</th>
                                  <th className="text-left py-3 px-4 font-medium text-sm">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {adminUsers.map((admin) => (
                                  <tr key={admin.id} className="border-b hover:bg-muted/50">
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-300 flex items-center justify-center">
                                          <span className="text-xs font-medium text-purple-800">
                                            {getInitials(admin.full_name)}
                                          </span>
                                        </div>
                                        <span className="font-medium">{admin.full_name}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm">{admin.email}</td>
                                    <td className="py-3 px-4 text-sm">{admin.phone || '-'}</td>
                                    <td className="py-3 px-4">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${admin.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {admin.role?.replace('_', ' ').toUpperCase()}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${admin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {admin.is_active ? 'Active' : 'Inactive'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                      {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="py-3 px-4">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditUser(admin)}
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Client Users (Customers) Table */}
                  <TabsContent value="client-users" className="space-y-4 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Client Users
                        </CardTitle>
                        <CardDescription>
                          Manage customer accounts and bookings
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {usersLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="text-sm text-muted-foreground mt-2">Loading client users...</p>
                          </div>
                        ) : customers.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No client users found</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-3 px-4 font-medium text-sm">Name</th>
                                  <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                                  <th className="text-left py-3 px-4 font-medium text-sm">Phone</th>
                                  <th className="text-left py-3 px-4 font-medium text-sm">Type</th>
                                  <th className="text-left py-3 px-4 font-medium text-sm">Created</th>
                                  <th className="text-left py-3 px-4 font-medium text-sm">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {customers.map((customer) => (
                                  <tr key={customer.id} className="border-b hover:bg-muted/50">
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-100 border border-green-300 flex items-center justify-center">
                                          <span className="text-xs font-medium text-green-800">
                                            {getInitials(customer.name)}
                                          </span>
                                        </div>
                                        <span className="font-medium">{customer.name || 'Unnamed Customer'}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm">{customer.email}</td>
                                    <td className="py-3 px-4 text-sm">{customer.phone || '-'}</td>
                                    <td className="py-3 px-4">
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Client
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                      {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="py-3 px-4">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditUser(customer)}
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </TabsContent>



              <TabsContent value="google-calendar" className="space-y-6 mt-6">
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
              </TabsContent>

              <TabsContent value="payment-gateway" className="space-y-6 mt-6">
                {/* Payment Gateway Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Payment Gateway Configuration
                    </CardTitle>
                    <CardDescription>
                      Tetapan untuk integrasi pembayaran
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="userSecretKeyDesktop">User Secret Key</Label>
                        <Input
                          id="userSecretKeyDesktop"
                          type="password"
                          value={paymentGatewaySettings.userSecretKey}
                          onChange={(e) => handlePaymentGatewayChange('userSecretKey', e.target.value)}
                          placeholder="Masukkan User Secret Key"
                          className="font-mono"
                        />
                        <p className="text-sm text-muted-foreground">
                          Rahsia pengguna untuk pembayaran gateway
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="categoryCodeDesktop">Category Code</Label>
                        <Input
                          id="categoryCodeDesktop"
                          value={paymentGatewaySettings.categoryCode}
                          onChange={(e) => handlePaymentGatewayChange('categoryCode', e.target.value)}
                          placeholder="Masukkan Category Code"
                        />
                        <p className="text-sm text-muted-foreground">
                          Kod kategori untuk klasifikasi pembayaran
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t">
                      <Button
                        onClick={saveSettings}
                        disabled={isLoading}
                        size="lg"
                      >
                        {isLoading ? 'Menyimpan...' : 'Simpan Tetapan Payment Gateway'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sendgrid" className="space-y-6 mt-6">
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

                {/* Side by side Email Notifications and SendGrid Templates */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Email Notification Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Notifications
                      </CardTitle>
                      <CardDescription>
                        Configure which email templates to use for specific user actions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <strong>How it works:</strong> Map user actions to SendGrid templates. Only enabled notifications will trigger emails.
                        Recipients are determined automatically by business logic (code).
                      </div>

                      {emailLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="text-sm text-muted-foreground mt-2">Loading email configurations...</p>
                        </div>
                      ) : emailNotifications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No email notifications configured</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <h4 className="font-medium text-sm">Notification Triggers</h4>

                          {emailNotifications.map((notification) => (
                            <NotificationConfigItem
                              key={notification.id}
                              notification={notification}
                              availableTemplates={availableTemplates}
                              onUpdate={saveEmailNotification}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Template Management Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        SendGrid Templates
                      </CardTitle>
                      <CardDescription>
                        Manage email templates from SendGrid to use in notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-sm text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                        Templates in the database populate the dropdowns above. Add/remove templates here to configure notification mappings.
                      </div>

                      {/* Existing Templates */}
                      {availableTemplates.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Current Templates</h4>
                          <div className="space-y-3 max-h-80 overflow-y-auto">
                            {availableTemplates.map((template) => {
                              const isEditing = editingTemplate === template.id;
                              return (
                                <div key={template.id} className="border rounded-lg p-4">
                                  {isEditing ? (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label>Template Name</Label>
                                          <Input
                                            value={editTemplateData.name}
                                            onChange={(e) => setEditTemplateData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g., Booking Confirmation"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Template ID</Label>
                                          <Input
                                            value={editTemplateData.template_id}
                                            onChange={(e) => setEditTemplateData(prev => ({ ...prev, template_id: e.target.value }))}
                                            placeholder="e.g., d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                            className="font-mono"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={cancelEditTemplate}
                                        >
                                          <RotateCcw className="h-3 w-3 mr-1" />
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={saveEditTemplate}
                                          disabled={!editTemplateData.name || !editTemplateData.template_id}
                                        >
                                          <Check className="h-3 w-3 mr-1" />
                                          Save
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium">{template.name}</p>
                                        <p className="text-sm text-muted-foreground font-mono">{template.template_id}</p>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => startEditTemplate(template)}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removeTemplate(template.id)}
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {availableTemplates.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No templates available</p>
                          <p className="text-sm">Add your first template below</p>
                        </div>
                      )}

                      {/* Add New Template */}
                      <div className="space-y-4 border-t pt-6">
                        <h4 className="font-medium">Add New Template</h4>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label>Template Name</Label>
                            <Input
                              value={newTemplate.name}
                              onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., Booking Confirmation"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Template ID</Label>
                            <Input
                              value={newTemplate.template_id}
                              onChange={(e) => setNewTemplate(prev => ({ ...prev, template_id: e.target.value }))}
                              placeholder="e.g., d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                              className="font-mono"
                            />
                            <p className="text-sm text-muted-foreground">
                              Get from SendGrid Dashboard → Marketing → Templates
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={addTemplate}
                          disabled={!newTemplate.name || !newTemplate.template_id}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Save Button for SendGrid tab */}
                <div className="flex justify-end pt-6 border-t">
                  <Button
                    onClick={saveSettings}
                    disabled={isLoading}
                    size="lg"
                  >
                    {isLoading ? 'Menyimpan...' : 'Simpan Tetapan SendGrid'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="twilio" className="space-y-6 mt-6">
                {/* Twilio WhatsApp Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Twilio WhatsApp Configuration
                    </CardTitle>
                    <CardDescription>
                      Tetapan untuk integrasi WhatsApp melalui Twilio di seluruh sistem
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="twilioSidDesktop">Twilio SID</Label>
                        <Input
                          id="twilioSidDesktop"
                          value={twilioSettings.twilioSid}
                          onChange={(e) => handleTwilioChange('twilioSid', e.target.value)}
                          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          className="font-mono"
                        />
                        <p className="text-sm text-muted-foreground">
                          Dapat dari Twilio Console → Project Settings → SID
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="twilioAuthTokenDesktop">Auth Token</Label>
                        <Input
                          id="twilioAuthTokenDesktop"
                          type="password"
                          value={twilioSettings.twilioAuthToken}
                          onChange={(e) => handleTwilioChange('twilioAuthToken', e.target.value)}
                          placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          className="font-mono"
                        />
                        <p className="text-sm text-muted-foreground">
                          Rahsia auth token dari Twilio
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="twilioWhatsappNumberDesktop">WhatsApp Number</Label>
                        <Input
                          id="twilioWhatsappNumberDesktop"
                          value={twilioSettings.twilioWhatsappNumber}
                          onChange={(e) => handleTwilioChange('twilioWhatsappNumber', e.target.value)}
                          placeholder="+1234567890"
                        />
                        <p className="text-sm text-muted-foreground">
                          Nombor WhatsApp yang didaftarkan dengan Twilio
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t">
                      <Button
                        onClick={saveSettings}
                        disabled={isLoading}
                        size="lg"
                      >
                        {isLoading ? 'Menyimpan...' : 'Simpan Tetapan Twilio'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* User Edit Dialog */}
        <Dialog open={!!editingUser} onOpenChange={closeEditUser}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                Edit {editingUser && 'id' in editingUser ? 'Admin User' : 'Customer'}
              </DialogTitle>
              <DialogDescription>
                Update user information and settings.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {editingUser && (
                <>
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {'full_name' in editingUser ? (
                      <div className="space-y-2">
                        <Label htmlFor="edit-full-name">Full Name</Label>
                        <Input
                          id="edit-full-name"
                          value={editUserData.full_name || ''}
                          onChange={(e) => setEditUserData(prev => ({ ...prev, full_name: e.target.value }))}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Name</Label>
                        <Input
                          id="edit-name"
                          value={editUserData.name || ''}
                          onChange={(e) => setEditUserData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editUserData.email || ''}
                        onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                  </div>

                  {/* Additional Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {('phone' in editingUser || 'phone' in editUserData) && (
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone">Phone</Label>
                        <Input
                          id="edit-phone"
                          value={editUserData.phone || ''}
                          onChange={(e) => setEditUserData(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                    )}

                    {/* Admin-specific fields */}
                    {'role' in editingUser && (
                      <div className="space-y-2">
                        <Label htmlFor="edit-role">Role</Label>
                        <Select
                          value={editUserData.role || ''}
                          onValueChange={(value) => setEditUserData(prev => ({ ...prev, role: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Status toggles */}
                  <div className="space-y-4">
                    {'is_active' in editingUser && (
                      <div className="flex items-center space-x-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={editUserData.is_active || false}
                            onChange={(e) => setEditUserData(prev => ({ ...prev, is_active: e.target.checked }))}
                          />
                          <div className={`w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300
                            ${editUserData.is_active ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                          <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-all
                            ${editUserData.is_active ? 'translate-x-full' : ''}`}></div>
                        </label>
                        <Label className="text-sm font-normal">
                          {editUserData.is_active ? 'Account Active' : 'Account Inactive'}
                        </Label>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={closeEditUser}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingUser) {
                    updateUser(editUserData, 'auth_user_id' in editingUser);
                  }
                }}
                disabled={usersLoading}
              >
                {usersLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
};

export default AdminSuperSettings;
