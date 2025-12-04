import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Calendar,
  LayoutDashboard,
  Settings,
  FileText,
  LogOut,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const navigation = [
  { name: 'Papan Pemuka', href: '/admin', icon: LayoutDashboard },
  { name: 'Tempahan', href: '/admin/bookings', icon: Calendar },
  { name: 'Laporan', href: '/admin/reports', icon: FileText },
  { name: 'Tetapan', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, studio, logout } = useAuth();

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

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col">
      {/* Logo & Studio Info */}
      <div className="p-6 border-b border-border">
        <Link to="/admin" className="flex items-center gap-2 mb-3">
          <img src="/studiorayalogo.png" alt="Raya Studio Logo" style={{ width: '48px', height: '28px' }} />
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
      <nav className="flex-1 p-4 space-y-1">
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
    </aside>
  );
}
