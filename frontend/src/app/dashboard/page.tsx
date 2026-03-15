'use client';
import AppShell from '@/components/layout/AppShell';
import { StatCard } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Wrench, AlertTriangle, FileText, Plus } from 'lucide-react';
import { formatCurrency, formatDate, STATUS_COLORS } from '@/lib/utils';
import useSWR from 'swr';
import api from '@/lib/api';
import Link from 'next/link';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function DashboardPage() {
  const { data, isLoading } = useSWR('/dashboard', fetcher, { refreshInterval: 60_000 });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Overview of your business · auto-refreshes every minute</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/invoices/new" className="btn-primary">
              <Plus className="w-4 h-4" /> New Invoice
            </Link>
            <Link href="/repairs/new" className="btn-secondary">
              <Plus className="w-4 h-4" /> New Repair
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Sales"
            value={isLoading ? '…' : formatCurrency(data?.todaySales?.amount || 0)}
            subtitle={`${data?.todaySales?.count || 0} invoice${data?.todaySales?.count !== 1 ? 's' : ''}`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Monthly Revenue"
            value={isLoading ? '…' : formatCurrency(data?.monthlyRevenue?.amount || 0)}
            subtitle={`${data?.monthlyRevenue?.count || 0} invoices this month`}
            icon={<FileText className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Active Repairs"
            value={isLoading ? '…' : (data?.activeRepairs || 0)}
            subtitle="In progress"
            icon={<Wrench className="w-6 h-6" />}
            color="yellow"
          />
          <Link href="/products" className="block">
            <StatCard
              title="Low Stock Alerts"
              value={isLoading ? '…' : (data?.lowStockAlerts || 0)}
              subtitle={data?.lowStockAlerts > 0 ? 'Items need restocking — click to view' : 'All stock levels OK'}
              icon={<AlertTriangle className="w-6 h-6" />}
              color={data?.lowStockAlerts > 0 ? 'red' : 'green'}
            />
          </Link>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Sales This Month</h2>
            {isLoading ? (
              <div className="h-[220px] bg-gray-50 rounded-lg animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.salesByDay || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v + 'T00:00:00').getDate().toString()} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), 'Sales']} labelFormatter={(l) => formatDate(l)} />
                  <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Active Repairs</h2>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : (
              <div className="space-y-1">
                {(data?.recentRepairs || []).map((r: any) => (
                  <Link key={r.id} href={`/repairs/${r.id}`}
                    className="flex items-center justify-between py-2.5 px-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.brand} {r.model}</p>
                      <p className="text-xs text-gray-500">{r.customer?.name} · <span className="font-mono">{r.jobId}</span></p>
                    </div>
                    <span className={`badge ${STATUS_COLORS[r.status] || 'badge-gray'}`}>{r.status.replace(/_/g,' ')}</span>
                  </Link>
                ))}
                {!data?.recentRepairs?.length && <p className="text-sm text-gray-400 text-center py-6">No active repairs</p>}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        {(data?.lowStockItems || []).length > 0 && (
          <div className="card border-l-4 border-red-400">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h2 className="text-sm font-semibold text-gray-900">Low Stock Alert ({data.lowStockItems.length} items)</h2>
              </div>
              <Link href="/products" className="text-xs text-blue-600 hover:underline">Manage inventory →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {data.lowStockItems.slice(0, 8).map((item: any) => (
                <div key={item.id} className="bg-red-50 rounded-lg p-2.5">
                  <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-red-600 mt-0.5">Stock: <strong>{item.stockQty}</strong> / Min: {item.minStockLevel}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Invoices */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Invoices</h2>
            <Link href="/invoices" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">Invoice #</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Total</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}><td colSpan={5}><div className="h-8 bg-gray-100 rounded m-1 animate-pulse" /></td></tr>
                    ))
                  : (data?.recentInvoices || []).map((inv: any) => (
                      <tr key={inv.id} className="table-row">
                        <td className="table-cell">
                          <Link href={`/invoices/${inv.id}`} className="font-mono text-xs font-semibold text-blue-600 hover:underline">{inv.number}</Link>
                        </td>
                        <td className="table-cell font-medium text-gray-900">{inv.customer?.name}</td>
                        <td className="table-cell font-semibold">{formatCurrency(inv.totalAmount)}</td>
                        <td className="table-cell"><span className={`badge ${STATUS_COLORS[inv.status]}`}>{inv.status}</span></td>
                        <td className="table-cell text-gray-400">{formatDate(inv.createdAt)}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
