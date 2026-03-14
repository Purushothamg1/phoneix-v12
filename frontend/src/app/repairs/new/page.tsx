'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { PageHeader, FormField } from '@/components/ui';
import { formatCurrency, getErrorMessage } from '@/lib/utils';
import api from '@/lib/api';
import Link from 'next/link';

interface Part { productId: string; qty: number; cost: number; }
const DEVICE_TYPES = ['Smartphone','Tablet','Laptop','Desktop','Smartwatch','Gaming Console','Other'];
const EMPTY_FORM = { customerId:'', deviceType:'Smartphone', brand:'', model:'', serialNumber:'', issueDescription:'', technicianId:'', estimatedCost:'' };

export default function NewRepairPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [parts, setParts] = useState<Part[]>([]);

  useEffect(() => {
    api.get('/customers?limit=200').then((r) => setCustomers(r.data.data||[])).catch(()=>{});
    api.get('/products?limit=500').then((r) => setProducts(r.data.data||[])).catch(()=>{});
    api.get('/auth/users').then((r) => setTechnicians(r.data||[])).catch(()=>{});
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)
  );

  const addPart = () => setParts([...parts, { productId:'', qty:1, cost:0 }]);
  const removePart = (i: number) => setParts(parts.filter((_,idx) => idx !== i));
  const updatePart = (i: number, key: keyof Part, value: string|number) => {
    const updated = [...parts];
    updated[i] = { ...updated[i], [key]: value };
    if (key === 'productId' && value) {
      const p = products.find((p) => p.id === value);
      if (p) updated[i].cost = parseFloat(p.sellingPrice);
    }
    setParts(updated);
  };

  const partsTotal = parts.reduce((s,p) => s + p.qty * p.cost, 0);

  const handleSubmit = async () => {
    if (!form.customerId) { toast.error('Please select a customer'); return; }
    if (!form.brand.trim()) { toast.error('Brand is required'); return; }
    if (!form.model.trim()) { toast.error('Model is required'); return; }
    if (!form.issueDescription.trim()) { toast.error('Issue description is required'); return; }
    if (parts.some((p) => !p.productId)) { toast.error('All parts must have a product selected'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        technicianId: form.technicianId || undefined,
        estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
        serialNumber: form.serialNumber || undefined,
        parts: parts.length ? parts : undefined,
      };
      const { data } = await api.post('/repairs', payload);
      toast.success(`Repair job ${data.jobId} created!`);
      router.push('/repairs');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  return (
    <AppShell>
      <div className="mb-4">
        <Link href="/repairs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Repairs
        </Link>
      </div>
      <PageHeader title="New Repair Job" subtitle="Log a new device for service" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <div className="card">
            <h2 className="font-semibold mb-4">Customer</h2>
            <input className="input mb-2" placeholder="Search by name or phone…" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
            <select className="input" value={form.customerId} onChange={(e) => set('customerId', e.target.value)}>
              <option value="">Select customer *</option>
              {filteredCustomers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
            </select>
          </div>

          {/* Device */}
          <div className="card">
            <h2 className="font-semibold mb-4">Device Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Device Type *">
                <select className="input" value={form.deviceType} onChange={(e) => set('deviceType', e.target.value)}>
                  {DEVICE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="Brand *">
                <input className="input" placeholder="Apple, Samsung…" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
              </FormField>
              <FormField label="Model *">
                <input className="input" placeholder="iPhone 15, Galaxy S24…" value={form.model} onChange={(e) => set('model', e.target.value)} />
              </FormField>
              <FormField label="Serial Number">
                <input className="input" placeholder="Optional" value={form.serialNumber} onChange={(e) => set('serialNumber', e.target.value)} />
              </FormField>
            </div>
            <div className="mt-4">
              <FormField label="Issue Description *">
                <textarea className="input" rows={3} placeholder="Describe the fault or problem in detail…" value={form.issueDescription} onChange={(e) => set('issueDescription', e.target.value)} />
              </FormField>
            </div>
          </div>

          {/* Parts */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Parts Required</h2>
              <button onClick={addPart} className="btn-secondary btn-sm"><Plus className="w-3 h-3" />Add Part</button>
            </div>
            {parts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No parts added. Click Add Part if components are needed.</p>
            ) : (
              <div className="space-y-2">
                {parts.map((part, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-5">
                      <label className="label text-xs">Product</label>
                      <select className="input text-xs" value={part.productId} onChange={(e) => updatePart(i,'productId',e.target.value)}>
                        <option value="">Select product</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockQty})</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="label text-xs">Qty</label>
                      <input className="input text-xs" type="number" min="1" value={part.qty} onChange={(e) => updatePart(i,'qty',parseInt(e.target.value)||1)} />
                    </div>
                    <div className="col-span-3">
                      <label className="label text-xs">Cost Each</label>
                      <input className="input text-xs" type="number" min="0" step="0.01" value={part.cost} onChange={(e) => updatePart(i,'cost',parseFloat(e.target.value)||0)} />
                    </div>
                    <div className="col-span-1 text-xs font-bold text-blue-700 pb-2">{formatCurrency(part.qty*part.cost)}</div>
                    <div className="col-span-1 pb-2 flex justify-end">
                      <button onClick={() => removePart(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="card sticky top-6 space-y-4">
            <h2 className="font-semibold">Assignment & Cost</h2>
            <FormField label="Assign Technician">
              <select className="input" value={form.technicianId} onChange={(e) => set('technicianId', e.target.value)}>
                <option value="">Unassigned</option>
                {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </FormField>
            <FormField label="Estimated Cost">
              <input className="input" type="number" min="0" step="0.01" placeholder="0.00" value={form.estimatedCost} onChange={(e) => set('estimatedCost', e.target.value)} />
            </FormField>
            {parts.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-3 text-sm flex justify-between">
                <span className="text-gray-600">Parts total</span>
                <span className="font-semibold text-blue-700">{formatCurrency(partsTotal)}</span>
              </div>
            )}
            <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full justify-center py-3 mt-2">
              {saving ? 'Creating…' : 'Create Repair Job'}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
