import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { StockMovement, PaginatedResponse, Product } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ArrowDownRight, ArrowUpRight, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TableSkeleton } from '../components/Skeleton';

const movSchema = z.object({
  productId: z.string().uuid('Select a product'),
  quantity: z.coerce.number().int().positive('Must be positive integer'),
  type: z.enum(['IN', 'OUT']),
  reason: z.string().min(3, 'Reason required'),
});
type MovForm = z.infer<typeof movSchema>;

function MovementModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<MovForm>({
    resolver: zodResolver(movSchema),
    defaultValues: { type: 'IN' },
  });

  const { data: productsData } = useQuery<{ success: boolean; data: { items: Product[] } }>({
    queryKey: ['products-list'],
    queryFn: () => api.get('/products', { params: { limit: 100 } }).then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data: MovForm) => api.post('/stock-movements', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stock movement recorded');
      onClose();
    },
    onError: (err: any) => {
      const errData = err.response?.data;
      const details = errData?.details;
      const msg = details
        ? `${errData.message} (Available: ${details.availableStock}, Requested: ${details.requestedQuantity})`
        : (errData?.message || 'Failed to record movement');
      toast.error(msg);
    },
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="p-5 border-b border-[var(--border-color)]">
          <h2 className="text-base font-semibold text-[var(--text-main)]">Record Stock Movement</h2>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="label">Product *</label>
            <select {...register('productId')} className="input">
              <option value="">Select product...</option>
              {productsData?.data.items.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku}) — Stock: {p.currentStock}</option>
              ))}
            </select>
            {errors.productId && <p className="error-text">{errors.productId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity *</label>
              <input {...register('quantity')} type="number" className="input" placeholder="e.g. 10" />
              {errors.quantity && <p className="error-text">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="label">Type *</label>
              <select {...register('type')} className="input">
                <option value="IN">IN (Stock Addition)</option>
                <option value="OUT">OUT (Stock Deduction)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Reason / Reference *</label>
            <input {...register('reason')} className="input" placeholder="e.g. Supplier Invoice #402, Dispatched Challan, etc." />
            {errors.reason && <p className="error-text">{errors.reason.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Recording...' : 'Record Movement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StockMovementsPage() {
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const canRecord = user && ['ADMIN', 'WAREHOUSE'].includes(user.role);

  const { data, isLoading, isError } = useQuery<{ success: boolean; data: PaginatedResponse<StockMovement> }>({
    queryKey: ['stock-movements', typeFilter, page],
    queryFn: () => api.get('/stock-movements', { params: { type: typeFilter || undefined, page, limit: 30 } }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const movements = data?.data.items ?? [];
  const meta = data?.data.meta;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-main)] tracking-tight">Stock Movements Log</h1>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">Audit trail of all inventory dispatches and arrivals</p>
        </div>
        {canRecord && (
          <button className="btn-primary text-xs" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Record Movement
          </button>
        )}
      </div>

      <div className="card p-3.5 flex gap-3">
        <select className="input w-auto text-xs" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">All Movement Types</option>
          <option value="IN">IN (Stock Added)</option>
          <option value="OUT">OUT (Stock Deducted)</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : isError ? (
          <div className="py-12 text-center text-[var(--danger)] text-xs">Failed to load audit log</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-[var(--border-color)]">
                <tr>
                  <th className="table-header text-left p-3.5">Product</th>
                  <th className="table-header text-center p-3.5 w-24">Type</th>
                  <th className="table-header text-center p-3.5 w-28">Quantity</th>
                  <th className="table-header text-left p-3.5 hidden md:table-cell">Reason / Reference</th>
                  <th className="table-header text-left p-3.5 hidden lg:table-cell">Recorded By</th>
                  <th className="table-header text-left p-3.5 hidden sm:table-cell">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-[var(--text-muted)] text-xs">No stock movements found</td></tr>
                ) : movements.map((m) => (
                  <tr key={m.id} className="table-row">
                    <td className="p-3.5">
                      <p className="font-semibold text-[var(--text-main)]">{m.product.name}</p>
                      <p className="text-[10px] font-mono text-[var(--text-subtle)]">SKU: {m.product.sku}</p>
                    </td>
                    <td className="p-3.5 text-center">
                      {/* Clean Single-Line Status Text */}
                      {m.type === 'IN' ? (
                        <span className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-400 whitespace-nowrap">
                          <ArrowUpRight size={13} className="flex-shrink-0" /> IN
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-red-400 whitespace-nowrap">
                          <ArrowDownRight size={13} className="flex-shrink-0" /> OUT
                        </span>
                      )}
                    </td>
                    {/* Primary Semantic Signal on Quantity column */}
                    <td className="p-3.5 text-center font-mono font-bold text-sm">
                      {m.type === 'IN' ? (
                        <span className="text-[var(--success)]">+{m.quantity}</span>
                      ) : (
                        <span className="text-[var(--danger)]">-{m.quantity}</span>
                      )}
                    </td>
                    <td className="p-3.5 hidden md:table-cell text-[var(--text-muted)] max-w-xs truncate">{m.reason}</td>
                    <td className="p-3.5 hidden lg:table-cell text-[var(--text-main)]">{m.createdBy.name}</td>
                    <td className="p-3.5 hidden sm:table-cell text-[var(--text-subtle)] font-mono">
                      {new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta && meta.totalPages > 1 && (
          <div className="p-3.5 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">Page {meta.page} of {meta.totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-2.5 py-1 text-xs">Prev</button>
              <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="btn-secondary px-2.5 py-1 text-xs">Next</button>
            </div>
          </div>
        )}
      </div>

      {showModal && <MovementModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
