'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import useSWR from 'swr';
import api from '@/lib/api';
import {
  LayoutDashboard, Users, Package, Truck, FileText, Wrench,
  CreditCard, BarChart3, Settings, ArrowUpDown, Search,
  LogOut, Zap, UserCog, Activity,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard, roles: ['ADMIN','MANAGER','STAFF'] },
  { href: '/customers',     label: 'Customers',     icon: Users,           roles: ['ADMIN','MANAGER','STAFF'] },
  { href: '/products',      label: 'Inventory',     icon: Package,         roles: ['ADMIN','MANAGER'] },
  { href: '/suppliers',     label: 'Suppliers',     icon: Truck,           roles: ['ADMIN','MANAGER'] },
  { href: '/invoices',      label: 'Invoices',      icon: FileText,        roles: ['ADMIN','MANAGER','STAFF'] },
  { href: '/repairs',       label: 'Repairs',       icon: Wrench,          roles: ['ADMIN','MANAGER','STAFF'] },
  { href: '/payments',      label: 'Payments',      icon: CreditCard,      roles: ['ADMIN','MANAGER'] },
  { href: '/reports',       label: 'Reports',       icon: BarChart3,       roles: ['ADMIN','MANAGER'] },
  { href: '/import-export', label: 'Import/Export', icon: ArrowUpDown,     roles: ['ADMIN','MANAGER'] },
  { href: '/users',         label: 'Users',         icon: UserCog,         roles: ['ADMIN'] },
  { href: '/audit',         label: 'Audit Log',     icon: Activity,        roles: ['ADMIN'] },
  { href: '/settings',      label: 'Settings',      icon: Settings,        roles: ['ADMIN'] },
];

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { data: dashboard } = useSWR(
    user ? '/dashboard' : null,
    fetcher,
    { refreshInterval: 120_000, revalidateOnFocus: false },
  );
  const lowStockCount: number = dashboard?.lowStockAlerts || 0;

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/60">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-none">Phoneix</p>
          <p className="text-slate-400 text-xs mt-0.5">Business Suite v1.2</p>
        </div>
      </div>

      {/* Quick Search */}
      <div className="px-4 py-3">
        <Link
          href="/search"
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-colors',
            pathname === '/search' && 'bg-slate-800 text-white',
          )}
        >
          <Search className="w-4 h-4" />
          <span className="flex-1">Quick Search</span>
          <kbd className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
        {navItems
          .filter((item) => !user || item.roles.includes(user.role))
          .map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const isInventory = item.href === '/products';
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800',
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {/* Low stock badge on Inventory */}
                {isInventory && lowStockCount > 0 && !active && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                    {lowStockCount > 99 ? '99+' : lowStockCount}
                  </span>
                )}
              </Link>
            );
          })}
      </nav>

      {/* User block */}
      <div className="px-4 py-4 border-t border-slate-700/60">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-slate-400 text-xs">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
