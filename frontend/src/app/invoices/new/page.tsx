'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Trash2, UserPlus, Package } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { PageHeader, FormField, Modal } from '@/components/ui';
import { formatCurrency, getErrorMessage } from '@/lib/utils';
import api from '@/lib/api';

interface LineItem { productId: string; description: string; qty: number; unitPrice: number; tax: number; }

const EMPTY_CUSTOMER = { name: '', phone: '', email: '', address: '' };
const EMPTY_PRODUCT = { name: '', sku: '', description: '', sellingPrice: '', purchasePrice: '', stockQty: '0', minStockLevel: '0', unit: 'pcs' };

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<LineItem[]>([{ productId: '', description: '', qty: 1, unitPrice: 0, tax: 18 }]);
  const [saving, setSaving] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState(EMPTY_CUSTOMER);
  const [savingCustomer, setSavingCustomer] = useState(false);

  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT);
  const [savingProduct, setSavingProduct] = useState(false);

  const loadCustomers = () => api.get('/customers?limit=200').then((r) => setCustomers(r.data.data || []));
  const loadProducts = () => api.get('/products?limit=500').then((r) => setProducts(r.data.data || []));

  useEffect(() => { loadCustomers(); loadProducts(); }, []);

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      toast.error('Name and phone are required'); return;
    }
    setSavingCustomer(true);
    try {
      const { data } = await api.post('/customers', newCustomer);
      toast.success(`Customer ${data.name} added!`);
      await loadCustomers();
      setCustomerId(data.id);
      setShowNewCustomer(false);
      setNewCustomer(EMPTY_CUSTOMER);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSavingCustomer(false); }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.sku.trim()) {
      toast.error('Name and SKU are required'); return;
    }
    setSavingProduct(true);
    try {
      const { data } = await api.post('/products', {
        ...newProduct,
        sellingPrice: parseFloat(newProduct.sellingPrice) || 0,
        purchasePrice: parseFloat(newProduct.purchasePrice) || 0,
        stockQty: parseInt(newProduct.stockQty) || 0,
        minStockLevel: parseInt(newProduct.minStockLevel) || 0,
      });
      toast.success(`Product ${data.name} added!`);
      await loadProducts();
      setShowNewProduct(false);
      setNewProduct(EMPTY_PRODUCT);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSavingProduct(false); }
  };

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
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Customer</h2>
              <button onClick={() => setShowNewCustomer(true)} className="btn-secondary btn-sm text-blue-600 border-blue-200 hover:bg-blue-50">
                <UserPlus className="w-3.5 h-3.5" /> New Customer
              </button>
            </div>
            <input className="input mb-2" placeholder="Search by name or phone..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
            <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Select customer *</option>
              {filteredCustomers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
            </select>
            {customerId && (
              <p className="text-xs text-green-600 mt-1.5 font-medium">
                ✓ {customers.find(c => c.id === customerId)?.name} selected
              </p>
            )}
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
