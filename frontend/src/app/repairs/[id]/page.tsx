'use client';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import toast from 'react-hot-toast'
import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { StatusBadge, Modal, FormField, Spinner } from '@/components/ui';
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils';
import { FileDown, Send, Pencil, ArrowLeft, RefreshCw, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

const fetcher = (url: string) => api.get(url).then((r) => r.data);
const STATUSES = ['RECEIVED','DIAGNOSING','WAITING_FOR_PARTS','IN_REPAIR','READY','DELIVERED'];

interface ShareResult { pdfUrl: string; pdfName: string; whatsappUrl: string; phone: string; message: string; }

export default function RepairDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: repair, isLoading, mutate } = useSWR(`/repairs/${id}`, fetcher);
  const [editModal, setEditModal] = useState(false);
  const [form, setForm] = useState({ status: '', repairNotes: '', finalCost: '' });
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [sharePreview, setSharePreview] = useState<ShareResult | null>(null);

  const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'jobcard.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const openWhatsAppWithDownload = (whatsappUrl: string, pdfUrl: string, pdfName: string) => {
    if (pdfUrl) triggerDownload(pdfUrl, pdfName);
    setTimeout(() => window.open(whatsappUrl, '_blank', 'noopener,noreferrer'), 400);
  };

  const handleCreateInvoice = async () => {
    setCreatingInvoice(true);
    try {
      const { data: invoice } = await api.post(`/repairs/${id}/create-invoice`);
      toast.success(`Invoice ${invoice.number} created!`);
      router.push(`/invoices/${invoice.id}`);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setCreatingInvoice(false); }
  };

  const openEdit = () => {
    setForm({ status: repair.status, repairNotes: repair.repairNotes || '', finalCost: repair.finalCost ? String(repair.finalCost) : '' });
    setEditModal(true);
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`/repairs/${id}`, { ...form, finalCost: form.finalCost ? parseFloat(form.finalCost) : undefined });
      toast.success('Repair updated');
      mutate();
      setEditModal(false);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleRegeneratePdf = async () => {
    setRegenerating(true);
    try {
      await api.post(`/repairs/${id}/regenerate-pdf`);
      toast.success('Job card PDF regenerated');
      mutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setRegenerating(false); }
  };

  const handleWhatsApp = async () => {
    try {
      const { data: share } = await api.post('/import-export/prepare-send', { type: 'repair', id });
      setSharePreview(share);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (isLoading) return <AppShell><div className="flex justify-center py-20"><Spinner size="lg" /></div></AppShell>;
  if (!repair) return <AppShell><div className="text-center py-20 text-gray-400">Repair job not found</div></AppShell>;

  return (
    <AppShell>
      <div className="mb-4">
        <Link href="/repairs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Repairs
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-mono">{repair.jobId}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Created {formatDate(repair.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={repair.status} />
          <button onClick={openEdit} className="btn-secondary btn-sm"><Pencil className="w-3.5 h-3.5" /> Update Status</button>
          {repair.pdfUrl ? (
            <a
              href={repair.pdfUrl}
              download={repair.pdfUrl.split('/').pop() || 'jobcard.pdf'}
              className="btn-secondary btn-sm"
            >
              <FileDown className="w-3.5 h-3.5" /> Job Card PDF
            </a>
          ) : (
            <button onClick={handleRegeneratePdf} disabled={regenerating} className="btn-secondary btn-sm">
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Generating…' : 'Generate PDF'}
            </button>
          )}
          <button onClick={handleWhatsApp} className="btn-secondary btn-sm text-green-700 border-green-200 hover:bg-green-50">
            <Send className="w-3.5 h-3.5" /> WhatsApp
          </button>
          {['READY', 'DELIVERED'].includes(repair.status) && (
            <button
              onClick={handleCreateInvoice}
              disabled={creatingInvoice}
              className="btn-primary btn-sm"
              title="Create an invoice for this repair job"
            >
              <FileText className="w-3.5 h-3.5" />
              {creatingInvoice ? 'Creating…' : 'Create Invoice'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Device Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400 mb-0.5">Device Type</p><p className="font-medium">{repair.deviceType}</p></div>
              <div><p className="text-gray-400 mb-0.5">Brand</p><p className="font-medium">{repair.brand}</p></div>
              <div><p className="text-gray-400 mb-0.5">Model</p><p className="font-medium">{repair.model}</p></div>
              <div><p className="text-gray-400 mb-0.5">Serial Number</p><p className="font-medium">{repair.serialNumber || '—'}</p></div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Issue Description</h2>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{repair.issueDescription}</p>
            {repair.repairNotes && (
              <>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 mt-5">Repair Notes</h2>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{repair.repairNotes}</p>
              </>
            )}
          </div>

          {(repair.parts ?? []).length > 0 && (
            <div className="card">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Parts Used</h2>
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-header">Product</th>
                    <th className="table-header text-right">Qty</th>
                    <th className="table-header text-right">Unit Cost</th>
                    <th className="table-header text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {repair.parts.map((p: any) => (
                    <tr key={p.id} className="table-row">
                      <td className="table-cell">
                        <p className="font-medium">{p.product?.name}</p>
                        <p className="text-xs text-gray-400">SKU: {p.product?.sku}</p>
                      </td>
                      <td className="table-cell text-right">{p.qty}</td>
                      <td className="table-cell text-right">{formatCurrency(p.cost)}</td>
                      <td className="table-cell text-right font-semibold">{formatCurrency(p.qty * Number(p.cost))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Customer</h2>
            <p className="font-semibold text-gray-900">{repair.customer?.name}</p>
            <p className="text-sm text-gray-500">{repair.customer?.phone}</p>
            {repair.customer?.email && <p className="text-sm text-gray-500">{repair.customer.email}</p>}
          </div>

          <div className="card">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Technician & Cost</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Technician</span><span className="font-medium">{repair.technician?.name || 'Unassigned'}</span></div>
              {repair.estimatedCost && (
                <div className="flex justify-between"><span className="text-gray-500">Estimated</span><span className="font-medium">{formatCurrency(repair.estimatedCost)}</span></div>
              )}
              {repair.finalCost && (
                <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-100">
                  <span>Final Cost</span><span className="text-blue-600">{formatCurrency(repair.finalCost)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Update Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title={`Update — ${repair.jobId}`}>
        <div className="space-y-4">
          <FormField label="Status">
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </FormField>
          <FormField label="Repair Notes">
            <textarea className="input" rows={3} value={form.repairNotes} onChange={(e) => setForm({ ...form, repairNotes: e.target.value })} />
          </FormField>
          <FormField label="Final Cost">
            <input className="input" type="number" min="0" step="0.01" value={form.finalCost} onChange={(e) => setForm({ ...form, finalCost: e.target.value })} />
          </FormField>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setEditModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleUpdate} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Update'}</button>
          </div>
        </div>
      </Modal>

      {/* WhatsApp Preview Modal */}
      <Modal open={!!sharePreview} onClose={() => setSharePreview(null)} title="Share via WhatsApp" size="md">
        {sharePreview && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">Message Preview</p>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{sharePreview.message}</pre>
            </div>
            {sharePreview.pdfUrl && (
              <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
                <FileDown className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{sharePreview.pdfName}</p>
                  <p className="text-xs text-gray-500">PDF downloads automatically when you open WhatsApp</p>
                </div>
                <button
                  onClick={() => triggerDownload(sharePreview.pdfUrl, sharePreview.pdfName)}
                  className="btn-secondary btn-sm flex-shrink-0"
                >
                  <FileDown className="w-3 h-3" /> Save
                </button>
              </div>
            )}
            <div className="bg-green-50 rounded-lg p-3 text-xs text-green-800">
              <strong>Tip:</strong> Clicking "Open WhatsApp" automatically downloads the PDF. Attach it from your files in WhatsApp and hit send.
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setSharePreview(null)} className="btn-secondary">Close</button>
              {sharePreview.pdfUrl && (
                <button
                  onClick={() => triggerDownload(sharePreview.pdfUrl, sharePreview.pdfName)}
                  className="btn-secondary"
                >
                  <FileDown className="w-3.5 h-3.5" /> Download PDF
                </button>
              )}
              <button
                onClick={() => { openWhatsAppWithDownload(sharePreview.whatsappUrl, sharePreview.pdfUrl, sharePreview.pdfName); setSharePreview(null); }}
                className="btn-primary bg-green-600 hover:bg-green-700 focus:ring-green-500"
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
