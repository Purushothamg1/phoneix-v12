'use client';
import { useState } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Pencil, Trash2, Phone, Mail } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import DataTable from '@/components/tables/DataTable';
import { Modal, ConfirmDialog, PageHeader, FormField, StatusBadge } from '@/components/ui';
import { formatDate, getErrorMessage } from '@/lib/utils';
import api from '@/lib/api';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

const EMPTY_FORM = { name: '', phone: '', email: '', address: '', notes: '' };

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading, mutate } = useSWR(
    `/customers?page=${page}&limit=20&search=${search}`, fetcher,
  );

  const openCreate = () => { setForm(EMPTY_FORM); setSelected(null); setModal('create'); };
  const openEdit = (c: any) => { setSelected(c); setForm({ name: c.name, phone: c.phone, email: c.email || '', address: c.address || '', notes: c.notes || '' }); setModal('edit'); };
  const openView = (c: any) => { setSelected(c); setModal('view'); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'create') {
        await api.post('/customers', form);
        toast.success('Customer created');
      } else {
        await api.put(`/customers/${selected.id}`, form);
        toast.success('Customer updated');
      }
      mutate();
      setModal(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/customers/${deleteTarget.id}`);
      toast.success('Customer deleted');
      mutate();
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally { setDeleting(false); }
  };

  const columns = [
    { key: 'name', header: 'Name', render: (r: any) => <span className="font-medium text-gray-900">{r.name}</span> },
    { key: 'phone', header: 'Phone', render: (r: any) => <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" />{r.phone}</span> },
    { key: 'email', header: 'Email', render: (r: any) => r.email ? <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-gray-400" />{r.email}</span> : <span className="text-gray-300">—</span> },
    { key: 'createdAt', header: 'Added', render: (r: any) => formatDate(r.createdAt) },
    {
      key: 'actions', header: '', render: (r: any) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openView(r)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button>
          <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Customers"
        subtitle={`${data?.meta?.total || 0} customers`}
        actions={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />New Customer</button>}
      />

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9 max-w-sm"
          placeholder="Search name, phone, email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <DataTable
        columns={columns as any}
        data={data?.data || []}
        meta={data?.meta}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage="No customers found. Create your first customer."
        keyExtractor={(r: any) => r.id}
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modal === 'create' || modal === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'New Customer' : 'Edit Customer'}
      >
        <div className="space-y-4">
          <FormField label="Full Name" required><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" /></FormField>
          <FormField label="Phone Number" required><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 9999999999" /></FormField>
          <FormField label="Email Address"><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" /></FormField>
          <FormField label="Address"><textarea className="input" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></FormField>
          <FormField label="Notes"><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></FormField>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Customer'}</button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={modal === 'view'} onClose={() => setModal(null)} title="Customer Details">
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-gray-500">Name</p><p className="font-medium">{selected.name}</p></div>
              <div><p className="text-gray-500">Phone</p><p className="font-medium">{selected.phone}</p></div>
              <div><p className="text-gray-500">Email</p><p className="font-medium">{selected.email || '—'}</p></div>
              <div><p className="text-gray-500">Added</p><p className="font-medium">{formatDate(selected.createdAt)}</p></div>
            </div>
            {selected.address && <div><p className="text-gray-500">Address</p><p className="font-medium">{selected.address}</p></div>}
            {selected.notes && <div><p className="text-gray-500">Notes</p><p className="font-medium">{selected.notes}</p></div>}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </AppShell>
  );
}
