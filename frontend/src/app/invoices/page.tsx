'use client';
import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, FileDown, Send, XCircle, ExternalLink, RefreshCw } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import DataTable from '@/components/tables/DataTable';
import { PageHeader, StatusBadge, ConfirmDialog, Modal } from '@/components/ui';
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const fetcher = (url: string) => api.get(url).then((r) => r.data);
interface ShareResult { pdfUrl: string; pdfName: string; whatsappUrl: string; phone: string; message: string; }

export default function InvoicesPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  const [sharePreview, setSharePreview] = useState<ShareResult | null>(null);
  const [shareLoading, setShareLoading] = useState<string | null>(null);

  const { data, isLoading, mutate } = useSWR(
    `/invoices?page=${page}&limit=20&search=${encodeURIComponent(search)}&status=${status}`, fetcher,
  );

  const handleWhatsApp = async (inv: any) => {
    setShareLoading(inv.id);
    try {
      const { data: share } = await api.post('/import-export/prepare-send', { type: 'invoice', id: inv.id });
      setSharePreview(share);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setShareLoading(null); }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.post(`/invoices/${cancelTarget.id}/cancel`);
      toast.success(`Invoice ${cancelTarget.number} cancelled`);
      mutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setCancelling(false); setCancelTarget(null); }
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  const columns = [
    { key: 'number', header: 'Invoice #', render: (r: any) => (
      <Link href={`/invoices/${r.id}`} className="font-mono text-xs font-semibold text-blue-600 hover:underline">{r.number}</Link>
    )},
    { key: 'customer', header: 'Customer', render: (r: any) => (
      <div>
        <p className="font-medium text-gray-900">{r.customer?.name}</p>
        <p className="text-xs text-gray-400">{r.customer?.phone}</p>
      </div>
    )},
    { key: 'totalAmount', header: 'Total', render: (r: any) => {
      const paid = (r.payments || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
      return (
        <div>
          <p className="font-bold text-gray-900">{formatCurrency(r.totalAmount)}</p>
          {paid > 0 && <p className="text-xs text-green-600">Paid: {formatCurrency(paid)}</p>}
        </div>
      );
    }},
    { key: 'status', header: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', header: 'Date', render: (r: any) => <span className="text-sm text-gray-500">{formatDate(r.createdAt)}</span> },
    { key: 'actions', header: '', render: (r: any) => (
      <div className="flex items-center gap-1">
        <Link href={`/invoices/${r.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="View detail">
          <Eye className="w-4 h-4" />
        </Link>
        {r.pdfUrl && (
          <a href={`${apiBase}${r.pdfUrl}`} target="_blank" rel="noreferrer"
            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded" title={`Download: ${r.pdfUrl.split('/').pop()}`}>
            <FileDown className="w-4 h-4" />
          </a>
        )}
        <button
          onClick={() => handleWhatsApp(r)}
          disabled={shareLoading === r.id}
          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
          title="Share via WhatsApp"
        >
          {shareLoading === r.id
            ? <RefreshCw className="w-4 h-4 animate-spin" />
            : <Send className="w-4 h-4" />}
        </button>
        {canManage && r.status !== 'CANCELLED' && (
          <button onClick={() => setCancelTarget(r)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Cancel invoice">
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    )},
  ];

  return (
    <AppShell>
      <PageHeader
        title="Invoices"
        subtitle={`${data?.meta?.total || 0} invoices`}
        actions={<Link href="/invoices/new" className="btn-primary"><Plus className="w-4 h-4" />New Invoice</Link>}
      />

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search invoice # or customer…"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="PAID">Paid</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIAL">Partial</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <DataTable
        columns={columns as any}
        data={data?.data || []}
        meta={data?.meta}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage="No invoices found."
        keyExtractor={(r: any) => r.id}
      />

      {/* WhatsApp Share Preview */}
      <Modal open={!!sharePreview} onClose={() => setSharePreview(null)} title="Share via WhatsApp" size="md">
        {sharePreview && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">Message Preview</p>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{sharePreview.message}</pre>
            </div>
            {sharePreview.pdfUrl && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <FileDown className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{sharePreview.pdfName}</p>
                  <p className="text-xs text-gray-500">Download and attach this PDF manually after WhatsApp opens</p>
                </div>
                <a href={sharePreview.pdfUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm flex-shrink-0">
                  <ExternalLink className="w-3 h-3" /> Open
                </a>
              </div>
            )}
            <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-800">
              <strong>How to share:</strong> Click "Open WhatsApp" — the message is pre-filled in a chat with this customer.
              Attach the PDF and tap send.
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <button onClick={() => setSharePreview(null)} className="btn-secondary">Close</button>
              {sharePreview.pdfUrl && (
                <a href={sharePreview.pdfUrl} target="_blank" rel="noreferrer" className="btn-secondary">
                  <FileDown className="w-3.5 h-3.5" /> Download PDF
                </a>
              )}
              <button
                onClick={() => { window.open(sharePreview.whatsappUrl, '_blank', 'noopener,noreferrer'); setSharePreview(null); }}
                className="btn-primary !bg-green-600 hover:!bg-green-700"
              >
                <Send className="w-3.5 h-3.5" /> Open WhatsApp
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel Invoice"
        message={`Cancel invoice ${cancelTarget?.number}? Stock for all items will be restored and payments marked as refunded. This cannot be undone.`}
        confirmLabel="Cancel Invoice"
        danger
        loading={cancelling}
      />
    </AppShell>
  );
}
