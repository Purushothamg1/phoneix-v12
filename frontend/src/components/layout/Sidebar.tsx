'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import useSWR from 'swr';
import api from '@/lib/api';
import {
  LayoutDashboard, Users, Package, Truck, FileText, Wrench,
  CreditCard, BarChart3, Settings, ArrowUpDown, Search,
  LogOut, UserCog, Activity, ChevronLeft, ChevronRight, X,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

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

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { data: dashboard } = useSWR(
    user ? '/dashboard' : null,
    fetcher,
    { refreshInterval: 120_000, revalidateOnFocus: false },
  );
  const lowStockCount: number = dashboard?.lowStockAlerts || 0;

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 bg-slate-900 flex-col z-50 transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          'hidden md:flex',
        )}
      >
        {/* Logo + collapse */}
        <div className={cn(
          'flex items-center border-b border-slate-700/60 flex-shrink-0',
          collapsed ? 'flex-col gap-2 px-2 py-3' : 'gap-2 px-3 py-4',
        )}>
          {!collapsed && (
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-blue-600">
              <Image src="/logo.png" alt="Phoneix" width={32} height={32} className="object-cover w-full h-full" />
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-blue-600">
              <Image src="/logo.png" alt="Phoneix" width={32} height={32} className="object-cover w-full h-full" />
            </div>
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-none truncate">Phoneix</p>
              <p className="text-slate-400 text-xs mt-0.5">Business Suite v1.2</p>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors flex-shrink-0"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Search */}
        <div className={cn('py-2', collapsed ? 'px-2' : 'px-3')}>
          <Link
            href="/search"
            title={collapsed ? 'Quick Search' : undefined}
            className={cn(
              'flex items-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-colors',
              collapsed ? 'justify-center p-2.5' : 'gap-2 px-3 py-2',
              pathname === '/search' && 'bg-slate-800 text-white',
            )}
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1">Quick Search</span>
                <kbd className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono hidden lg:block">⌘K</kbd>
              </>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className={cn('flex-1 pb-4 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700', collapsed ? 'px-2' : 'px-3')}>
          {navItems
            .filter((item) => !user || item.roles.includes(user.role))
            .map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              const isInventory = item.href === '/products';
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center rounded-lg text-sm font-medium transition-colors relative',
                    collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                    active
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800',
                  )}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {isInventory && lowStockCount > 0 && !active && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                          {lowStockCount > 99 ? '99+' : lowStockCount}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && isInventory && lowStockCount > 0 && !active && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </Link>
              );
            })}
        </nav>

        {/* User block */}
        <div className={cn('border-t border-slate-700/60 flex-shrink-0', collapsed ? 'px-2 py-3' : 'px-3 py-3')}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 mb-2.5 px-1">
              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{user?.name}</p>
                <p className="text-slate-400 text-xs">{user?.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            title={collapsed ? 'Sign out' : undefined}
            className={cn(
              'flex items-center w-full text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg text-sm transition-colors',
              collapsed ? 'justify-center p-2.5' : 'gap-2 px-3 py-2',
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && 'Sign out'}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar (overlay) */}
      {mobileOpen && (
        <aside className="fixed inset-y-0 left-0 w-72 bg-slate-900 flex flex-col z-50 md:hidden">
          {/* Mobile header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-700/60">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-blue-600">
              <Image src="/logo.png" alt="Phoneix" width={32} height={32} className="object-cover w-full h-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">Phoneix</p>
              <p className="text-slate-400 text-xs">Business Suite v1.2</p>
            </div>
            <button onClick={onCloseMobile} className="text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile search */}
          <div className="px-3 py-2.5">
            <Link
              href="/search"
              onClick={onCloseMobile}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-colors',
                pathname === '/search' && 'bg-slate-800 text-white',
              )}
            >
              <Search className="w-4 h-4" />
              <span className="flex-1">Quick Search</span>
            </Link>
          </div>

          {/* Mobile nav */}
          <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
            {navItems
              .filter((item) => !user || item.roles.includes(user.role))
              .map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800',
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
          </nav>

          {/* Mobile user */}
          <div className="px-3 py-3 border-t border-slate-700/60">
            <div className="flex items-center gap-2.5 mb-2.5 px-1">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{user?.name}</p>
                <p className="text-slate-400 text-xs">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
