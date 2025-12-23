import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Calendar,
  LayoutDashboard,
  Settings,
  FileText,
  LogOut,
  Building2,
  Shield,
  Key,
  Send,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Users,
  Mail,
  Award,
  KanbanSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSidebar } from '@/contexts/SidebarContext';
import { supabase } from '@/lib/supabase';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Tempahan', href: '/admin/bookings', icon: Calendar },
  { name: 'Status Tugasan', href: '/admin/task-tracker', icon: KanbanSquare },
  { name: 'WhatsApp Blaster', href: '/admin/whatsapp', icon: Send },
  { name: 'Pembayaran', href: '/admin/customers', icon: Users },
  { name: 'Laporan', href: '/admin/reports', icon: FileText },
  { name: 'Package Payments', href: '/admin/package-payments', icon: CreditCard, superAdminOnly: true },
  { name: 'Tetapan', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, studio, logout, isSuperAdmin } = useAuth();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [fetchedPackage, setFetchedPackage] = useState<string | null>(null);

  // Fallback: Fetch package from payments table if not in studio record
  useEffect(() => {
    const getPackageFromPayments = async () => {
      if (!isSuperAdmin && studio?.email && !studio.package_name) {
        const { data } = await supabase
          .from('package_payments')
          .select('package_name')
          .eq('email', studio.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setFetchedPackage(data.package_name);
        }
      }
    };

    getPackageFromPayments();
  }, [studio?.email, studio?.package_name, isSuperAdmin]);

  const activePackage = studio?.package_name || fetchedPackage;

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

  const getPackageBadgeStyles = (packageName: string | null | undefined) => {
    if (!packageName) return '';
    const name = packageName.toLowerCase();
    if (name.includes('gold')) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-700 shadow-[0_0_10px_rgba(234,179,8,0.3)]';
    if (name.includes('silver')) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white border-gray-600 shadow-[0_0_10px_rgba(107,114,128,0.2)]';
    if (name.includes('platinum')) return 'bg-gradient-to-r from-purple-400 to-purple-600 text-white border-purple-700 shadow-[0_0_10px_rgba(168,85,247,0.3)]';
    return '';
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-card border-r border-border flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-50 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Logo & Studio Info */}
      <div className="p-6 border-b border-border">
        {!isCollapsed && (
          <Link to="/admin" className="flex items-center gap-2 mb-3">
            <img src="/studiorayalogo.png" alt="Raya Studio Logo" style={{ width: '48px', height: '28px' }} />
            <div>
              <span className="font-semibold">Raya Studio</span>
              <p className="text-xs text-muted-foreground">Portal Admin</p>
            </div>
          </Link>
        )}

        {/* Current Studio Badge */}
        {studio && !isCollapsed && (
          <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/50 rounded-md">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <p className="text-xs font-medium truncate">{studio.name}</p>
                {activePackage && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[8px] px-1 py-0 h-3.5 border-none font-bold uppercase tracking-wider",
                      getPackageBadgeStyles(activePackage)
                    )}
                  >
                    {activePackage}
                  </Badge>
                )}
              </div>
              {studio.location && (
                <p className="text-[10px] text-muted-foreground truncate">{studio.location}</p>
              )}
            </div>
          </div>
        )}

        {studio && isCollapsed && (
          <div className="flex justify-center mt-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation
          .filter((item) => !item.superAdminOnly || isSuperAdmin)
          .map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  isCollapsed && "justify-center"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && item.name}
              </Link>
            );
          })}

        {/* Super Admin Only: Admin Management */}
        {isSuperAdmin && (
          <Link
            to="/admin/management"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              location.pathname === '/admin/management'
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? "Pengurusan Admin" : undefined}
          >
            <Shield className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && "Pengurusan Admin"}
          </Link>
        )}

        {/* Super Admin Only: Super Admin Settings */}
        {isSuperAdmin && (
          <Link
            to="/admin/super-settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              location.pathname === '/admin/super-settings'
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? "Tetapan Super Admin" : undefined}
          >
            <Key className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && "Tetapan Super Admin"}
          </Link>
        )}
      </nav>

      {/* Footer - User Info & Logout */}
      <div className="p-4 border-t border-border">
        {!isCollapsed && (
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
        )}

        {isCollapsed && (
          <div className="flex justify-center mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {getInitials(user?.full_name)}
              </span>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          className={cn(
            "w-full text-muted-foreground hover:text-foreground mb-2",
            isCollapsed ? "justify-center px-0" : "justify-start"
          )}
          size="sm"
          onClick={() => window.location.href = 'mailto:admin@tempahstudio.com?subject=Support Request&body=Hi, I need help with...'}
          title={isCollapsed ? "Hubungi Sokongan" : undefined}
        >
          <Mail className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Hubungi Sokongan</span>}
        </Button>

        <Button
          variant="ghost"
          className={cn(
            "w-full text-muted-foreground hover:text-destructive",
            isCollapsed ? "justify-center px-0" : "justify-start"
          )}
          size="sm"
          onClick={handleLogout}
          title={isCollapsed ? "Log keluar" : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Log keluar</span>}
        </Button>
      </div>
    </aside>
  );
}
