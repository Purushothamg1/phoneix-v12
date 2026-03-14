'use client';
import { X, ChevronLeft, ChevronRight, AlertTriangle, Inbox } from 'lucide-react';
import { useEffect, ReactNode, Component, ErrorInfo } from 'react';
import { cn } from '@/lib/utils';

// ── Modal ──────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title: string;
  children: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handler);
    };
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-xl shadow-2xl w-full max-h-[90vh] flex flex-col', sizes[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 id="modal-title" className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ── Confirm Dialog ──────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = false, loading = false, confirmLabel = 'Confirm' }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; danger?: boolean; loading?: boolean; confirmLabel?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, loading, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="alertdialog">
      <div className="absolute inset-0 bg-black/50" onClick={() => !loading && onClose()} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start gap-4">
          <div className={cn('flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center', danger ? 'bg-red-100' : 'bg-amber-100')}>
            <AlertTriangle className={cn('w-5 h-5', danger ? 'text-red-600' : 'text-amber-600')} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className={cn('btn', danger ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 focus:ring-2 focus:ring-offset-2' : 'btn-primary')}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing…
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────────
export function StatCard({ title, value, subtitle, icon, color = 'blue' }: {
  title: string; value: string | number; subtitle?: string;
  icon: ReactNode; color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600',
    yellow: 'bg-amber-50 text-amber-600', red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="card flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', colors[color])}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5 truncate">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5 leading-tight">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Input ───────────────────────────────────────────────────────
export function Input({ label, error, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <input className={cn('input', error && 'border-red-300 focus:ring-red-400', className)} {...props} />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ── Select ──────────────────────────────────────────────────────
export function Select({ label, error, children, className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <select className={cn('input', error && 'border-red-300', className)} {...props}>{children}</select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ── Textarea ────────────────────────────────────────────────────
export function Textarea({ label, error, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <textarea rows={3} className={cn('input resize-none', error && 'border-red-300', className)} {...props} />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ── Pagination ──────────────────────────────────────────────────
export function Pagination({ meta, onPageChange }: {
  meta: { page: number; totalPages: number; total: number; limit: number };
  onPageChange: (page: number) => void;
}) {
  if (meta.totalPages <= 1) return null;
  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);
  return (
    <div className="flex items-center justify-between px-1 py-3">
      <p className="text-sm text-gray-500">Showing {start}–{end} of {meta.total.toLocaleString()}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(meta.page - 1)} disabled={meta.page <= 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
          let page = i + 1;
          if (meta.totalPages > 5) {
            if (meta.page <= 3) page = i + 1;
            else if (meta.page >= meta.totalPages - 2) page = meta.totalPages - 4 + i;
            else page = meta.page - 2 + i;
          }
          return (
            <button key={page} onClick={() => onPageChange(page)}
              className={cn('w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                page === meta.page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600')}>
              {page}
            </button>
          );
        })}
        <button onClick={() => onPageChange(meta.page + 1)} disabled={meta.page >= meta.totalPages}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Table Skeleton ──────────────────────────────────────────────
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>{Array.from({ length: rows }).map((_, i) => (
      <tr key={i}>
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
        ))}
      </tr>
    ))}</>
  );
}

// ── Empty State ─────────────────────────────────────────────────
export function EmptyState({ title, description, action }: {
  title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="w-12 h-12 text-gray-300 mb-3" />
      <p className="text-base font-medium text-gray-600">{title}</p>
      {description && <p className="text-sm text-gray-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Page Header ─────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

// ── Search Input ────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Search…' }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} className="input pl-9" />
    </div>
  );
}

// ── Form Field ──────────────────────────────────────────────────
export function FormField({ label, error, children, required, className }: {
  label: string; error?: string; children: ReactNode; required?: boolean; className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1" role="alert">{error}</p>}
    </div>
  );
}

// ── Spinner ─────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4 border', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-2' };
  return <div className={cn('border-blue-600 border-t-transparent rounded-full animate-spin', s[size])} role="status" aria-label="Loading" />;
}

// ── Status Badge ────────────────────────────────────────────────
const STATUS_BADGE_COLORS: Record<string, string> = {
  PAID: 'badge-green', UNPAID: 'badge-red', PARTIAL: 'badge-yellow', CANCELLED: 'badge-gray',
  RECEIVED: 'badge-blue', DIAGNOSING: 'badge-purple', WAITING_FOR_PARTS: 'badge-yellow',
  IN_REPAIR: 'badge-blue', READY: 'badge-green', DELIVERED: 'badge-gray',
};
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('badge', STATUS_BADGE_COLORS[status] || 'badge-gray')}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ── Error Boundary ──────────────────────────────────────────────
interface ErrorBoundaryState { hasError: boolean; error?: Error; }
export class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, ErrorBoundaryState> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('ErrorBoundary caught:', error, info); }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-xl border border-red-100">
          <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
          <p className="text-sm font-medium text-red-700">Something went wrong loading this section.</p>
          <button onClick={() => this.setState({ hasError: false })} className="mt-3 text-xs text-red-600 underline">Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
