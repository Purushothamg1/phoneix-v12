'use client';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { StatusBadge, ConfirmDialog, Spinner, Modal, FormField, Select } from '@/components/ui';
import { formatCurrency, formatDate, formatDateTime, getErrorMessage } from '@/lib/utils';
import { FileDown, Send, XCircle, ArrowLeft, CreditCard, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

interface ShareResult {
  pdfUrl: string;
  pdfName: string;
  whatsappUrl: string;
  phone: string;
  message: string;
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: inv, isLoading, mutate } = useSWR(`/invoices/${id}`, fetcher);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', method: 'CASH' });
  const [paying, setPaying] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [sharePreview, setSharePreview] = useState<ShareResult | null>(null);

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'invoice.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.post(`/invoices/${id}/cancel`);
      toast.success('Invoice cancelled and stock restored');
      mutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setCancelling(false); setShowCancel(false); }
  };

  const handlePayment = async () => {
    if (!payForm.amount || parseFloat(payForm.amount) <= 0) {
      toast.error('Enter a valid amount'); return;
    }
    setPaying(true);
    try {
      await api.post('/payments', { invoiceId: id, amount: parseFloat(payForm.amount), method: payForm.method });
      toast.success('Payment recorded');
      mutate();
      setPayModal(false);
      setPayForm({ amount: '', method: 'CASH' });
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setPaying(false); }
  };

  const handleRegeneratePdf = async () => {
    setRegenerating(true);
    try {
      await api.post(`/invoices/${id}/regenerate-pdf`);
      toast.success('PDF regenerated');
      mutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setRegenerating(false); }
  };

  const handleWhatsApp = async () => {
    try {
      const { data: share } = await api.post('/import-export/prepare-send', { type: 'invoice', id });
      setSharePreview(share);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const openWhatsAppWithDownload = (whatsappUrl: string, pdfUrl: string, pdfName: string) => {
    if (pdfUrl) {
      triggerDownload(pdfUrl, pdfName);
    }
    setTimeout(() => {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }, 400);
  };

  if (isLoading) {
    return <AppShell><div className="flex justify-center py-20"><Spinner size="lg" /></div></AppShell>;
  }
  if (!inv) {
    return <AppShell><div className="text-center py-20 text-gray-400">Invoice not found</div></AppShell>;
  }

  const paidAmount = (inv.payments ?? []).filter((p: any) => !p.refunded).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const outstanding = Math.max(0, Number(inv.totalAmount) - paidAmount);
  const subtotal = Number(inv.totalAmount) - Number(inv.taxAmount) + Number(inv.discount);

  return (
    <AppShell>
      <div className="mb-4">
        <Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Invoices
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice {inv.number}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatDate(inv.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={inv.status} />

          {/* PDF */}
          {inv.pdfUrl ? (
            <a
              href={inv.pdfUrl}
              download={inv.pdfUrl.split('/').pop() || 'invoice.pdf'}
              className="btn-secondary btn-sm"
              title="Download Invoice PDF"
            >
              <FileDown className="w-3.5 h-3.5" /> Download PDF
            </a>
          ) : (
            <button onClick={handleRegeneratePdf} disabled={regenerating} className="btn-secondary btn-sm">
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Generating…' : 'Generate PDF'}
            </button>
          )}

          {/* WhatsApp */}
          <button onClick={handleWhatsApp} className="btn-secondary btn-sm text-green-700 border-green-200 hover:bg-green-50">
            <Send className="w-3.5 h-3.5" /> WhatsApp
          </button>

          {/* Record Payment */}
          {canManage && inv.status !== 'CANCELLED' && inv.status !== 'PAID' && outstanding > 0.01 && (
            <button onClick={() => { setPayForm({ amount: outstanding.toFixed(2), method: 'CASH' }); setPayModal(true); }} className="btn-primary btn-sm">
              <CreditCard className="w-3.5 h-3.5" /> Record Payment
            </button>
          )}

          {/* Cancel */}
          {canManage && inv.status !== 'CANCELLED' && (
            <button onClick={() => setShowCancel(true)} className="btn-danger btn-sm">
              <XCircle className="w-3.5 h-3.5" /> Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <div className="card">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Bill To</h2>
            <p className="font-semibold text-gray-900 text-base">{inv.customer?.name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{inv.customer?.phone}</p>
            {inv.customer?.email && <p className="text-sm text-gray-500">{inv.customer.email}</p>}
            {inv.customer?.address && <p className="text-sm text-gray-500 mt-1">{inv.customer.address}</p>}
          </div>

          {/* Items */}
          <div className="card overflow-x-auto">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Items</h2>
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">Description</th>
                  <th className="table-header text-right">Qty</th>
                  <th className="table-header text-right">Unit Price</th>
                  <th className="table-header text-right">Tax%</th>
                  <th className="table-header text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(inv.items ?? []).map((item: any) => (
                  <tr key={item.id} className="table-row">
                    <td className="table-cell">
                      <p className="font-medium text-gray-900">{item.description}</p>
                      {item.product && <p className="text-xs text-gray-400">SKU: {item.product.sku}</p>}
                    </td>
                    <td className="table-cell text-right">{item.qty}</td>
                    <td className="table-cell text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="table-cell text-right text-gray-500">{Number(item.tax)}%</td>
                    <td className="table-cell text-right font-semibold">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-gray-100 ml-auto max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Tax</span><span>{formatCurrency(inv.taxAmount)}</span></div>
              {Number(inv.discount) > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(inv.discount)}</span></div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                <span>Total</span><span className="text-blue-600">{formatCurrency(inv.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Payment Summary */}
          <div className="card">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Payment Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Invoice Total</span><span className="font-semibold">{formatCurrency(inv.totalAmount)}</span></div>
              <div className="flex justify-between text-green-600"><span>Amount Paid</span><span className="font-semibold">{formatCurrency(paidAmount)}</span></div>
              {outstanding > 0.01 && (
                <div className="flex justify-between text-red-600 font-bold pt-1 border-t border-gray-100">
                  <span>Outstanding</span><span>{formatCurrency(outstanding)}</span>
                </div>
              )}
              {outstanding <= 0.01 && paidAmount > 0 && (
                <div className="text-center text-green-600 font-medium text-sm pt-1">✓ Fully Paid</div>
              )}
            </div>
            {canManage && inv.status !== 'CANCELLED' && inv.status !== 'PAID' && outstanding > 0.01 && (
              <button
                onClick={() => { setPayForm({ amount: outstanding.toFixed(2), method: 'CASH' }); setPayModal(true); }}
                className="btn-primary w-full justify-center mt-4 btn-sm"
              >
                <CreditCard className="w-3.5 h-3.5" /> Record Payment
              </button>
            )}
          </div>

          {/* Payment History */}
          {(inv.payments ?? []).length > 0 && (
            <div className="card">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Payment History</h2>
              <div className="space-y-2">
                {inv.payments.map((p: any) => (
                  <div key={p.id} className={`flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0 ${p.refunded ? 'opacity-40' : ''}`}>
                    <div>
                      <p className="font-medium text-gray-800">{p.method.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(p.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${p.refunded ? 'line-through text-gray-400' : 'text-gray-900'}`}>{formatCurrency(p.amount)}</p>
                      {p.refunded && <p className="text-xs text-red-500">Refunded</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Record Payment" size="sm">
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-3 text-sm">
            <span className="text-gray-600">Outstanding Balance: </span>
            <span className="font-bold text-blue-700">{formatCurrency(outstanding)}</span>
          </div>
          <FormField label="Amount" required>
            <input
              className="input"
              type="number"
              min="0.01"
              step="0.01"
              max={outstanding}
              value={payForm.amount}
              onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </FormField>
          <FormField label="Payment Method" required>
            <select className="input" value={payForm.method} onChange={(e) => setPayForm((f) => ({ ...f, method: e.target.value }))}>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </FormField>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setPayModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handlePayment} disabled={paying} className="btn-primary">
              {paying ? 'Recording…' : 'Record Payment'}
            </button>
          </div>
        </div>
      </Modal>

      {/* WhatsApp Share Preview Modal */}
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
              <strong>Tip:</strong> Clicking "Open WhatsApp" will automatically download the PDF to your device. Open WhatsApp, find the downloaded PDF in your files, attach it to the chat, and hit send.
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

      <ConfirmDialog
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={handleCancel}
        title="Cancel Invoice"
        message={`Cancel invoice ${inv.number}? Stock for all product items will be restored and any payments will be marked as refunded. This cannot be undone.`}
        confirmLabel="Yes, Cancel Invoice"
        danger
        loading={cancelling}
      />
    </AppShell>
  );
}
