import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Users, Package, Receipt, ShoppingBag,
  MessageSquare, LogOut, CalendarCheck, Radio, BarChart2, TrendingUp,
  Star, Activity, Clock, FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type NavItem =
  | { to: string; label: string; icon: any; end?: boolean; group?: never }
  | { group: string; icon?: never; to?: never; label?: never; end?: never };

const nav: NavItem[] = [
  { to: '/branch', label: 'Dashboard', icon: LayoutDashboard, end: true },

  { group: 'Operations' },
  { to: '/branch/daily-summary', label: 'Daily Summary', icon: FileText },
  { to: '/branch/broadcast', label: 'Broadcast Dispatch', icon: Radio },
  { to: '/branch/eod-closing', label: 'End of Day', icon: Clock },
  { to: '/branch/attendance', label: 'Attendance', icon: CalendarCheck },

  { group: 'Records' },
  { to: '/branch/riders', label: 'Riders', icon: Truck },
  { to: '/branch/customers', label: 'Customers', icon: Users },
  { to: '/branch/jobs', label: 'Delivery Jobs', icon: Package },
  { to: '/branch/sales', label: 'Sales', icon: ShoppingBag },
  { to: '/branch/expenses', label: 'Expenses', icon: Receipt },
  { to: '/branch/support', label: 'Support', icon: MessageSquare },

  { group: 'Reports' },
  { to: '/branch/reports/deliveries', label: 'Delivery Reports', icon: BarChart2 },
  { to: '/branch/reports/revenue', label: 'Revenue', icon: TrendingUp },
  { to: '/branch/reports/riders', label: 'Rider Performance', icon: Star },
  { to: '/branch/reports/operations', label: 'Operations', icon: Activity },
];

/** Flatten nav for title lookup */
const flatNav = nav.filter((n) => n.to) as Extract<NavItem, { to: string }>[];

function usePageTitle() {
  const { pathname } = useLocation();
  const match = flatNav.find((n) => n.end ? pathname === n.to : pathname.startsWith(n.to));
  return match?.label ?? 'Branch Portal';
}

export default function BranchLayout() {
  const navigate = useNavigate();
  const pageTitle = usePageTitle();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={cn('bg-sidebar text-sidebar-foreground flex flex-col shrink-0 transition-all duration-200', collapsed ? 'w-14' : 'w-60')}>
        {/* Brand */}
        <div className="px-3 py-4 flex items-center gap-3 border-b border-white/10">
          <img src="/alin-move-logo.png" alt="ALiN Move" className="h-8 w-8 shrink-0 object-contain" />
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-sm text-white leading-tight truncate">ALiN Branch</h1>
              <p className="text-[11px] text-white/60 leading-tight">Branch Portal</p>
            </div>
          )}
          <button onClick={() => setCollapsed((c) => !c)} className="ml-auto text-white/40 hover:text-white shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
          {nav.map((item, idx) => {
            if ('group' in item) {
              if (collapsed) return null;
              return (
                <p key={idx} className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30 select-none">
                  {item.group}
                </p>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to!}
                end={item.end}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-sidebar-active text-sidebar-active-foreground font-semibold'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )
                }
              >
                <item.icon size={16} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className={cn('px-1.5 py-3 border-t border-white/10')}>
          <button
            onClick={() => { localStorage.removeItem('alin_admin_token'); navigate('/login'); }}
            title={collapsed ? 'Sign out' : undefined}
            className={cn('flex items-center gap-2 text-[13px] text-white/60 hover:text-red-400 w-full px-3 py-2.5 rounded-lg transition-colors', collapsed && 'justify-center')}
          >
            <LogOut size={16} />
            {!collapsed && 'Sign out'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
          <h2 className="text-lg font-semibold text-foreground">{pageTitle}</h2>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">M</span>
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
