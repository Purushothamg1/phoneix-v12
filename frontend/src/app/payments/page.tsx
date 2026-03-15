'use client';
import { useState } from 'react';
import useSWR from 'swr';
import AppShell from '@/components/layout/AppShell';
import { PageHeader, Input, Select, Modal, TableSkeleton, EmptyState, ConfirmDialog } from '@/components/ui/components';
import { Plus, RotateCcw } from 'lucide-react';
import { formatCurrency, formatDateTime, getErrorMessage } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

function AddPaymentForm({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({ invoiceId: '', amount: '', method: 'CASH' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/payments', { ...form, amount: Number(form.amount) });
      toast.success('Payment recorded');
      onSave();
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Invoice ID *" placeholder="UUID of the invoice" value={form.invoiceId} onChange={(e) => set('invoiceId', e.target.value)} required />
      <Input label="Amount *" type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
      <Select label="Payment Method *" value={form.method} onChange={(e) => set('method', e.target.value)}>
        {['CASH','UPI','CARD','BANK_TRANSFER'].map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
      </Select>
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Record Payment'}</button>
      </div>
    </form>
  );
}

const METHOD_COLORS: Record<string, string> = {
  CASH: 'badge-green', UPI: 'badge-blue', CARD: 'badge-purple', BANK_TRANSFER: 'badge-yellow',
};

export default function PaymentsPage() {
  const [showForm, setShowForm] = useState(false);
  const [refunding, setRefunding] = useState<any>(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const { data, isLoading, mutate } = useSWR('/payments', fetcher);

  async function handleRefund() {
    if (!refunding) return; setRefundLoading(true);
    try {
      await api.post('/payments/refund', { paymentId: refunding.id });
      toast.success('Payment refunded');
      mutate();
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setRefundLoading(false); setRefunding(null); }
  }

  const payments: any[] = Array.isArray(data) ? data : (data?.data ?? []);
  const total = payments.filter((p: any) => !p.refunded).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  return (
    <AppShell>
      <PageHeader title="Payments" subtitle="Track all payment transactions"
        actions={<button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" />Record Payment</button>} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {(['CASH','UPI','CARD'] as const).map((method) => {
          const amt = payments.filter((p: any) => p.method === method && !p.refunded)
            .reduce((s: number, p: any) => s + Number(p.amount), 0);
          return (
            <div key={method} className="card">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{method}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(amt)}</p>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Invoice #</th><th className="table-header">Customer</th>
                <th className="table-header">Amount</th><th className="table-header">Method</th>
                <th className="table-header">Status</th><th className="table-header">Date</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? <TableSkeleton rows={6} cols={7} /> :
               !payments.length ? <tr><td colSpan={7}><EmptyState title="No payments recorded" /></td></tr> :
               payments.map((p: any) => (
                <tr key={p.id} className="table-row">
                  <td className="table-cell font-mono text-xs text-blue-600">{p.invoice?.number}</td>
                  <td className="table-cell">{p.invoice?.customer?.name}</td>
                  <td className="table-cell font-semibold">{formatCurrency(p.amount)}</td>
                  <td className="table-cell"><span className={`badge ${METHOD_COLORS[p.method]}`}>{p.method.replace('_',' ')}</span></td>
                  <td className="table-cell">
                    {p.refunded
                      ? <span className="badge badge-red">Refunded</span>
                      : <span className="badge badge-green">Received</span>}
                  </td>
                  <td className="table-cell text-gray-400 text-xs">{formatDateTime(p.createdAt)}</td>
                  <td className="table-cell">
                    {!p.refunded && (
                      <button onClick={() => setRefunding(p)} className="btn-icon btn-sm text-orange-600 hover:bg-orange-50" title="Refund">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Record Payment">
        <AddPaymentForm onSave={() => { setShowForm(false); mutate(); }} onClose={() => setShowForm(false)} />
      </Modal>
      <ConfirmDialog open={!!refunding} onClose={() => setRefunding(null)} onConfirm={handleRefund}
        title="Refund Payment" message={`Refund ${formatCurrency(refunding?.amount || 0)}? This will update the invoice status.`}
        loading={refundLoading} />
    </AppShell>
  );
}
