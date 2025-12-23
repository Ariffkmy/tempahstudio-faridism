import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { getAllAdmins, createSuperAdmin, updateAdminRole, getAvailableStudios } from '@/services/adminAuth';
import { getStudioAdmins } from '@/services/adminAuth';
import type { AdminUserWithStudio, Studio } from '@/types/database';
import { Plus, Shield, Users, Crown, Menu, Home, Calendar, BarChart3, Cog, LogOut, Building2 } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Tempahan', href: '/admin/bookings', icon: Calendar },
  { name: 'Laporan', href: '/admin/reports', icon: BarChart3 },
  { name: 'Tetapan', href: '/admin/settings', icon: Cog },
];

export default function AdminManagement() {
  const { user, studio, logout, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const { isCollapsed } = useSidebar();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  const [admins, setAdmins] = useState<AdminUserWithStudio[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // New super admin form state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [isSuperAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminsData, studiosData] = await Promise.all([
        getAllAdmins(),
        getAvailableStudios()
      ]);
      setAdmins(adminsData);
      setStudios(studiosData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuperAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword || !newAdminName) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      const result = await createSuperAdmin({
        email: newAdminEmail,
        password: newAdminPassword,
        full_name: newAdminName,
        phone: newAdminPhone || undefined,
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Super admin created successfully',
        });
        setShowCreateDialog(false);
        setNewAdminEmail('');
        setNewAdminPassword('');
        setNewAdminName('');
        setNewAdminPhone('');
        loadData(); // Reload the data
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create super admin',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create super admin',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateRole = async (adminId: string, newRole: string, studioId?: string) => {
    try {
      const result = await updateAdminRole(adminId, newRole as any, studioId);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Admin role updated successfully',
        });
        loadData(); // Reload the data
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update admin role',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update admin role',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge variant="default" className="bg-red-100 text-red-800"><Crown className="w-3 h-3 mr-1" />Super Admin</Badge>;
      case 'admin':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'staff':
        return <Badge variant="secondary"><Users className="w-3 h-3 mr-1" />Staff</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  // Get user initials for avatar
  const getInitials = (name: string | undefined) => {
    if (!name) return 'AD';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: 'Log keluar berjaya',
      description: 'Anda telah log keluar dari sistem',
    });
    navigate('/admin/login');
  };

  // Redirect if not super admin
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need super admin privileges to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mobile Layout
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
                      {/* Super Admin Only Links */}
                      {isSuperAdmin && (
                        <>
                          <Link
                            to="/admin/management"
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                              location.pathname === '/admin/management'
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                          >
                            <Shield className="h-5 w-5" />
                            Pengurusan Admin
                          </Link>
                        </>
                      )}
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
            <h1 className="text-xl font-bold">Admin Management</h1>
            <p className="text-muted-foreground text-sm">
              Manage all admin users and their roles
            </p>
          </div>

          {/* Create Button */}
          <div className="mb-4">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Super Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Super Admin</DialogTitle>
                  <DialogDescription>
                    Create a new super admin user with full system access.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="superadmin@example.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+601129947089"
                      value={newAdminPhone}
                      onChange={(e) => setNewAdminPhone(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateSuperAdmin}
                      disabled={creating}
                      className="flex-1"
                    >
                      {creating ? 'Creating...' : 'Create'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Admins List - Mobile View */}
          <div className="space-y-3">
            {admins.map((admin) => (
              <Card key={admin.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium">{admin.full_name}</p>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                    </div>
                    {getRoleBadge(admin.role)}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Studio:</span>
                      <span>{admin.studio ? admin.studio.name : 'System-wide'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={admin.is_active ? 'default' : 'secondary'}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="pt-2">
                      <Select
                        value={admin.role}
                        onValueChange={(newRole) => {
                          if (admin.role === 'super_admin' && newRole !== 'super_admin') {
                            const firstStudio = studios[0];
                            if (firstStudio) {
                              handleUpdateRole(admin.id, newRole, firstStudio.id);
                            }
                          } else {
                            handleUpdateRole(admin.id, newRole);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {admins.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No admin users found</p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <main className={cn("transition-all duration-300", isCollapsed ? "pl-16" : "pl-64")}>
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">Admin Management</h1>
                <p className="text-muted-foreground">
                  Manage all admin users and their roles
                </p>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Super Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Super Admin</DialogTitle>
                    <DialogDescription>
                      Create a new super admin user with full system access.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="superadmin@example.com"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={newAdminName}
                        onChange={(e) => setNewAdminName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+601129947089"
                        value={newAdminPhone}
                        onChange={(e) => setNewAdminPhone(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateSuperAdmin}
                        disabled={creating}
                        className="flex-1"
                      >
                        {creating ? 'Creating...' : 'Create'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Admins Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Admins ({admins.length})</CardTitle>
              <CardDescription>
                Overview of all admin users in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Studio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.full_name}
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{getRoleBadge(admin.role)}</TableCell>
                      <TableCell>
                        {admin.studio ? admin.studio.name : 'System-wide'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={admin.is_active ? 'default' : 'secondary'}>
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={admin.role}
                          onValueChange={(newRole) => {
                            // For role changes from super_admin to regular roles, we need a studio
                            if (admin.role === 'super_admin' && newRole !== 'super_admin') {
                              // Show studio selection or use first available studio
                              const firstStudio = studios[0];
                              if (firstStudio) {
                                handleUpdateRole(admin.id, newRole, firstStudio.id);
                              }
                            } else {
                              handleUpdateRole(admin.id, newRole);
                            }
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {admins.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No admin users found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
