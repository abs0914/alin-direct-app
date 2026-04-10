import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, UserCheck, Truck, CreditCard,
  Wallet, MessageSquare, BookOpen, LogOut, Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { to: '/hq', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/hq/branches', label: 'Branches', icon: Building2 },
  { to: '/hq/riders', label: 'Riders', icon: Truck },
  { to: '/hq/customers', label: 'Customers', icon: Users },
  { to: '/hq/jobs', label: 'Delivery Jobs', icon: Package },
  { to: '/hq/users', label: 'Users', icon: UserCheck },
  { to: '/hq/payments', label: 'Payments', icon: CreditCard },
  { to: '/hq/payouts', label: 'Payouts', icon: Wallet },
  { to: '/hq/support', label: 'Support', icon: MessageSquare },
  { to: '/hq/knowledge', label: 'Knowledge Base', icon: BookOpen },
];

/** Find current page title from nav */
function usePageTitle() {
  const { pathname } = useLocation();
  const match = nav.find((n) => n.end ? pathname === n.to : pathname.startsWith(n.to));
  return match?.label ?? 'HQ Portal';
}

export default function HQLayout() {
  const navigate = useNavigate();
  const pageTitle = usePageTitle();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
        {/* Brand header */}
        <div className="px-5 py-4 flex items-center gap-3 border-b border-white/10">
          <img src="/alin-move-logo.png" alt="ALiN Move" className="h-9 w-auto" />
          <div className="min-w-0">
            <h1 className="font-bold text-sm text-white leading-tight truncate">ALiN HQ Portal</h1>
            <p className="text-[11px] text-white/60 leading-tight">Headquarters Admin</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors',
                  isActive
                    ? 'bg-sidebar-active text-sidebar-active-foreground font-semibold'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-2 py-3 border-t border-white/10">
          <button
            onClick={() => { localStorage.removeItem('alin_admin_token'); navigate('/login'); }}
            className="flex items-center gap-2 text-[13px] text-white/60 hover:text-red-400 w-full px-3 py-2.5 rounded-lg transition-colors"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
          <h2 className="text-lg font-semibold text-foreground">{pageTitle}</h2>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">A</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
