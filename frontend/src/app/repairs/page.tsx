'use client';
import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Pencil, FileDown, Send, RefreshCw, ExternalLink } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import DataTable from '@/components/tables/DataTable';
import { PageHeader, StatusBadge, Modal, FormField } from '@/components/ui';
import { formatDate, getErrorMessage } from '@/lib/utils';
import api from '@/lib/api';

const fetcher = (url: string) => api.get(url).then((r) => r.data);
const STATUSES = ['RECEIVED','DIAGNOSING','WAITING_FOR_PARTS','IN_REPAIR','READY','DELIVERED'];
interface ShareResult { pdfUrl: string; pdfName: string; whatsappUrl: string; phone: string; message: string; }

export default function RepairsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updateModal, setUpdateModal] = useState<any>(null);
  const [updateForm, setUpdateForm] = useState({ status: '', repairNotes: '', finalCost: '' });
  const [saving, setSaving] = useState(false);
  const [sharePreview, setSharePreview] = useState<ShareResult | null>(null);
  const [shareLoading, setShareLoading] = useState<string | null>(null);

  const { data, isLoading, mutate } = useSWR(
    `/repairs?page=${page}&limit=20&search=${encodeURIComponent(search)}&status=${statusFilter}`, fetcher,
  );

  const openUpdate = (r: any) => {
    setUpdateModal(r);
    setUpdateForm({ status: r.status, repairNotes: r.repairNotes || '', finalCost: r.finalCost || '' });
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`/repairs/${updateModal.id}`, {
        ...updateForm,
        finalCost: updateForm.finalCost ? parseFloat(updateForm.finalCost) : undefined,
      });
      toast.success('Repair updated');
      mutate();
      setUpdateModal(null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleWhatsApp = async (r: any) => {
    setShareLoading(r.id);
    try {
      const { data: share } = await api.post('/import-export/prepare-send', { type: 'repair', id: r.id });
      setSharePreview(share);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setShareLoading(null); }
  };

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  const columns = [
    { key:'jobId', header:'Job ID', render:(r:any) => (
      <Link href={`/repairs/${r.id}`} className="font-mono text-xs font-semibold text-blue-600 hover:underline">{r.jobId}</Link>
    )},
    { key:'device', header:'Device', render:(r:any) => (
      <div><p className="font-medium text-gray-900">{r.brand} {r.model}</p><p className="text-xs text-gray-400">{r.deviceType}</p></div>
    )},
    { key:'customer', header:'Customer', render:(r:any) => (
      <div><p className="text-sm font-medium text-gray-900">{r.customer?.name}</p><p className="text-xs text-gray-400">{r.customer?.phone}</p></div>
    )},
    { key:'technician', header:'Technician', render:(r:any) => r.technician?.name || <span className="text-gray-300 text-sm">Unassigned</span> },
    { key:'status', header:'Status', render:(r:any) => <StatusBadge status={r.status} /> },
    { key:'createdAt', header:'Date', render:(r:any) => <span className="text-sm text-gray-500">{formatDate(r.createdAt)}</span> },
    { key:'actions', header:'', render:(r:any) => (
      <div className="flex items-center gap-1">
        <Link href={`/repairs/${r.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="View detail">
          <Eye className="w-4 h-4" />
        </Link>
        <button onClick={() => openUpdate(r)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded" title="Update status">
          <Pencil className="w-4 h-4" />
        </button>
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
          {shareLoading === r.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    )},
  ];

  return (
    <AppShell>
      <PageHeader title="Repair Jobs" subtitle={`${data?.meta?.total||0} jobs`} actions={<Link href="/repairs/new" className="btn-primary"><Plus className="w-4 h-4" />New Repair</Link>} />

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Job ID, brand, model, customer…"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-52" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
      </div>

      <DataTable columns={columns as any} data={data?.data||[]} meta={data?.meta} onPageChange={setPage} loading={isLoading} emptyMessage="No repair jobs found." keyExtractor={(r:any) => r.id} />

      {/* Update Status Modal */}
      <Modal open={!!updateModal} onClose={() => setUpdateModal(null)} title={`Update — ${updateModal?.jobId}`}>
        <div className="space-y-4">
          <FormField label="Status">
            <select className="input" value={updateForm.status} onChange={(e) => setUpdateForm({...updateForm, status:e.target.value})}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select>
          </FormField>
          <FormField label="Repair Notes">
            <textarea className="input resize-none" rows={3} value={updateForm.repairNotes} onChange={(e) => setUpdateForm({...updateForm, repairNotes:e.target.value})} />
          </FormField>
          <FormField label="Final Cost">
            <input className="input" type="number" min="0" step="0.01" value={updateForm.finalCost} onChange={(e) => setUpdateForm({...updateForm, finalCost:e.target.value})} />
          </FormField>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setUpdateModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleUpdate} disabled={saving} className="btn-primary">{saving?'Saving…':'Update'}</button>
          </div>
        </div>
      </Modal>

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
                  <p className="text-xs text-gray-500">Attach this PDF after WhatsApp opens</p>
                </div>
                <a href={sharePreview.pdfUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm flex-shrink-0">
                  <ExternalLink className="w-3 h-3" /> Open
                </a>
              </div>
            )}
            <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-800">
              <strong>How to share:</strong> Click "Open WhatsApp" — message is pre-filled. Attach the PDF and send.
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
    </AppShell>
  );
}
