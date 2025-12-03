import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Calendar,
  LayoutDashboard,
  Settings,
  Users,
  FileText,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Papan Pemuka', href: '/admin', icon: LayoutDashboard },
  { name: 'Tempahan', href: '/admin/bookings', icon: Calendar },
  { name: 'Laporan', href: '/admin/reports', icon: FileText },
  { name: 'Tetapan', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link to="/admin" className="flex items-center gap-2">
          <img src="/studiorayalogo.png" alt="Raya Studio Logo" style={{ width: '48px', height: '28px' }} />
          <div>
            <span className="font-semibold">Raya Studio</span>
            <p className="text-xs text-muted-foreground">Portal Admin</p>
          </div>
        </Link>
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

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-sm font-medium">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">admin@rayastudio.com</p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" size="sm" asChild>
          <Link to="/admin/login">
            <LogOut className="h-4 w-4 mr-2" />
            Log keluar
          </Link>
        </Button>
      </div>
    </aside>
  );
}
