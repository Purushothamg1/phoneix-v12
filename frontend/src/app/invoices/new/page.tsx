'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Trash2, Search } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { PageHeader, FormField } from '@/components/ui';
import { formatCurrency, getErrorMessage } from '@/lib/utils';
import api from '@/lib/api';

interface LineItem { productId: string; description: string; qty: number; unitPrice: number; tax: number; }

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<LineItem[]>([{ productId: '', description: '', qty: 1, unitPrice: 0, tax: 18 }]);
  const [saving, setSaving] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  useEffect(() => {
    api.get('/customers?limit=100').then((r) => setCustomers(r.data.data));
    api.get('/products?limit=200').then((r) => setProducts(r.data.data));
  }, []);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const addItem = () => setItems([...items, { productId: '', description: '', qty: 1, unitPrice: 0, tax: 18 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const updateItem = (i: number, key: keyof LineItem, value: any) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [key]: value };
    if (key === 'productId' && value) {
      const product = products.find((p) => p.id === value);
      if (product) {
        updated[i].description = product.name;
        updated[i].unitPrice = parseFloat(product.sellingPrice);
      }
    }
    setItems(updated);
  };

  const lineTotal = (item: LineItem) => {
    const sub = item.qty * item.unitPrice;
    return sub + sub * (item.tax / 100);
  };

  const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const taxTotal = items.reduce((s, it) => s + it.qty * it.unitPrice * (it.tax / 100), 0);
  const grandTotal = subtotal + taxTotal - discount;

  const handleSubmit = async () => {
    if (!customerId) { toast.error('Please select a customer'); return; }
    if (items.some((it) => !it.description)) { toast.error('All items need a description'); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/invoices', { customerId, discount, items });
      toast.success(`Invoice ${data.number} created!`);
      router.push('/invoices');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally { setSaving(false); }
  };

  return (
    <AppShell>
      <PageHeader title="New Invoice" subtitle="Create a new sales invoice" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <div className="card">
            <h2 className="font-semibold mb-4">Customer</h2>
            <input className="input mb-2" placeholder="Search customer..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
            <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Select customer</option>
              {filteredCustomers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
            </select>
          </div>

          {/* Line Items */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Items</h2>
              <button onClick={addItem} className="btn-secondary btn-sm"><Plus className="w-3 h-3" />Add Item</button>
            </div>

            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                  <div className="col-span-4">
                    <label className="label text-xs">Product</label>
                    <select className="input text-xs" value={item.productId} onChange={(e) => updateItem(i, 'productId', e.target.value)}>
                      <option value="">Custom item</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="label text-xs">Description</label>
                    <input className="input text-xs" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} placeholder="Item description" />
                  </div>
                  <div className="col-span-1">
                    <label className="label text-xs">Qty</label>
                    <input className="input text-xs" type="number" min="1" value={item.qty} onChange={(e) => updateItem(i, 'qty', parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="col-span-2">
                    <label className="label text-xs">Unit Price</label>
                    <input className="input text-xs" type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-1">
                    <label className="label text-xs">Tax%</label>
                    <input className="input text-xs" type="number" min="0" max="100" value={item.tax} onChange={(e) => updateItem(i, 'tax', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-1 flex items-center justify-between">
                    <div className="text-xs font-bold text-blue-700">{formatCurrency(lineTotal(item))}</div>
                    {items.length > 1 && <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="card sticky top-6">
            <h2 className="font-semibold mb-4">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{formatCurrency(taxTotal)}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Discount</span>
                <input className="input w-28 text-right text-sm" type="number" min="0" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base">
                <span>Total</span><span className="text-blue-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full justify-center mt-6 py-3">
              {saving ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
