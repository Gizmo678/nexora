import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Customer, Product } from '../types';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface LineItem {
  productId: string;
  quantity: number;
}

export default function CreateChallanPage() {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ productId: '', quantity: 1 }]);

  const { data: customersData } = useQuery<{ success: boolean; data: { items: Customer[] } }>({
    queryKey: ['customers-for-challan'],
    queryFn: () => api.get('/customers', { params: { limit: 100, status: 'ACTIVE' } }).then(r => r.data),
  });

  const { data: productsData } = useQuery<{ success: boolean; data: { items: Product[] } }>({
    queryKey: ['products-for-challan'],
    queryFn: () => api.get('/products', { params: { limit: 100 } }).then(r => r.data),
  });

  const customers = customersData?.data.items ?? [];
  const products = productsData?.data.items ?? [];
  const productMap = new Map(products.map(p => [p.id, p]));

  const addRow = () => setItems(prev => [...prev, { productId: '', quantity: 1 }]);
  const removeRow = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof LineItem, value: string | number) =>
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const lineItems = items.map(item => {
    const product = productMap.get(item.productId);
    const lineTotal = product ? parseFloat(product.unitPrice) * item.quantity : 0;
    return { ...item, product, lineTotal };
  });
  const totalQuantity = items.reduce((s, i) => s + (i.quantity || 0), 0);
  const totalAmount = lineItems.reduce((s, i) => s + i.lineTotal, 0);

  const createMutation = useMutation({
    mutationFn: async (action: 'draft' | 'confirm') => {
      const payload = {
        customerId,
        items: items.filter(i => i.productId).map(i => ({ productId: i.productId, quantity: i.quantity })),
      };
      const createRes = await api.post('/challans', payload);
      const challan = createRes.data.data;
      if (action === 'confirm') {
        const confirmed = await api.post(`/challans/${challan.id}/confirm`);
        return confirmed.data.data;
      }
      return challan;
    },
    onSuccess: (challan, action) => {
      toast.success(action === 'confirm' ? 'Challan confirmed! Stock deducted.' : 'Challan saved as draft!');
      navigate(`/challans/${challan.id}`);
    },
    onError: (err: any) => {
      const errData = err.response?.data;
      const details = errData?.details;
      if (details) {
        toast.error(`${errData.message}\nAvailable: ${details.availableStock} | Requested: ${details.requestedQuantity}`, { duration: 6000 });
      } else {
        toast.error(errData?.message || 'Failed to create challan');
      }
    },
  });

  const validate = () => {
    if (!customerId) { toast.error('Select a customer'); return false; }
    const validItems = items.filter(i => i.productId);
    if (validItems.length === 0) { toast.error('Add at least one product'); return false; }
    if (validItems.some(i => !i.quantity || i.quantity < 1)) { toast.error('All quantities must be at least 1'); return false; }
    return true;
  };

  const handleAction = (action: 'draft' | 'confirm') => {
    if (validate()) createMutation.mutate(action);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/challans')} className="btn-secondary px-2.5 py-2">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">Create Sales Challan</h1>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">Select active customer and add line items</p>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="section-title">Customer Selection</h2>
        <select
          className="input max-w-md"
          value={customerId}
          onChange={e => setCustomerId(e.target.value)}
        >
          <option value="">Select customer account...</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.customerName} — {c.businessName}</option>
          ))}
        </select>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Challan Line Items</h2>
          <button onClick={addRow} className="btn-secondary text-xs">
            <Plus size={14} /> Add Line Item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[var(--border-color)]">
              <tr>
                <th className="table-header text-left py-2 px-3 w-2/5">Product</th>
                <th className="table-header text-center py-2 px-3 w-24">Quantity</th>
                <th className="table-header text-right py-2 px-3 w-32">Unit Price</th>
                <th className="table-header text-right py-2 px-3 w-32">Line Total</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => (
                <tr key={idx} className="border-b border-[var(--border-color)]">
                  <td className="py-2.5 px-3">
                    <select
                      className="input text-xs"
                      value={item.productId}
                      onChange={e => updateItem(idx, 'productId', e.target.value)}
                    >
                      <option value="">Select product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — Available Stock: {p.currentStock}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min={1}
                      className="input text-center text-xs font-bold"
                      value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right text-xs text-[var(--text-muted)]">
                    {item.product ? `₹${parseFloat(item.product.unitPrice).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-xs font-extrabold text-[var(--text-main)]">
                    {item.product ? `₹${item.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {items.length > 1 && (
                      <button onClick={() => removeRow(idx)} className="text-red-500 hover:text-red-600 p-1">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end pt-3 border-t border-[var(--border-color)]">
          <div className="space-y-1.5 min-w-56">
            <div className="flex justify-between text-xs text-[var(--text-muted)]">
              <span>Total Quantity</span>
              <span className="text-[var(--text-main)] font-semibold">{totalQuantity} units</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold">
              <span className="text-[var(--text-main)]">Total Amount</span>
              <span className="text-indigo-500">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button onClick={() => navigate('/challans')} className="btn-secondary">Cancel</button>
        <button onClick={() => handleAction('draft')} disabled={createMutation.isPending} className="btn-secondary">
          {createMutation.isPending ? 'Saving...' : 'Save as Draft'}
        </button>
        <button onClick={() => handleAction('confirm')} disabled={createMutation.isPending} className="btn-primary">
          {createMutation.isPending ? 'Processing...' : 'Confirm & Deduct Stock'}
        </button>
      </div>
    </div>
  );
}
