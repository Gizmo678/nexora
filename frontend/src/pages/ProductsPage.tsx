import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Product, PaginatedResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Edit2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TableSkeleton } from '../components/Skeleton';

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  sku: z.string().min(2, 'SKU required'),
  category: z.string().min(1, 'Category required'),
  unitPrice: z.coerce.number().positive('Must be positive'),
  currentStock: z.coerce.number().int().min(0, 'Min 0 stock'),
  minStock: z.coerce.number().int().min(0, 'Min 0 threshold'),
  warehouseLocation: z.string().min(1, 'Location required'),
});
type ProductForm = z.infer<typeof productSchema>;

function ProductModal({ onClose, editProduct }: { onClose: () => void; editProduct?: Product }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: editProduct ? {
      name: editProduct.name, sku: editProduct.sku, category: editProduct.category,
      unitPrice: parseFloat(editProduct.unitPrice), currentStock: editProduct.currentStock,
      minStock: editProduct.minStock, warehouseLocation: editProduct.warehouseLocation,
    } : {},
  });

  const mutation = useMutation({
    mutationFn: (data: ProductForm) =>
      editProduct
        ? api.patch(`/products/${editProduct.id}`, data).then(r => r.data.data)
        : api.post('/products', data).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success(editProduct ? 'Catalog product updated!' : 'Product added to catalog!');
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save product'),
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="p-5 border-b border-[var(--border-color)]">
          <h2 className="text-base font-bold text-[var(--text-main)]">{editProduct ? 'Edit Catalog Product' : 'Add Catalog Product'}</h2>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Product Name *</label>
              <input {...register('name')} className="input" />
              {errors.name && <p className="error-text">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">SKU *</label>
              <input {...register('sku')} className="input" placeholder="e.g. MON-27-4K" />
              {errors.sku && <p className="error-text">{errors.sku.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <input {...register('category')} className="input" />
              {errors.category && <p className="error-text">{errors.category.message}</p>}
            </div>
            <div>
              <label className="label">Unit Price (₹) *</label>
              <input {...register('unitPrice')} type="number" step="0.01" className="input" />
              {errors.unitPrice && <p className="error-text">{errors.unitPrice.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Current Stock *</label>
              <input {...register('currentStock')} type="number" className="input" />
              {errors.currentStock && <p className="error-text">{errors.currentStock.message}</p>}
            </div>
            <div>
              <label className="label">Min Stock Threshold *</label>
              <input {...register('minStock')} type="number" className="input" />
              {errors.minStock && <p className="error-text">{errors.minStock.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Warehouse Location *</label>
            <input {...register('warehouseLocation')} className="input" placeholder="e.g. Rack A-3, Shelf 2" />
            {errors.warehouseLocation && <p className="error-text">{errors.warehouseLocation.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | undefined>();
  const canManage = user && ['ADMIN', 'WAREHOUSE'].includes(user.role);

  const { data, isLoading, isError } = useQuery<{ success: boolean; data: PaginatedResponse<Product> }>({
    queryKey: ['products', search, page],
    queryFn: () => api.get('/products', { params: { search: search || undefined, page, limit: 20 } }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const products = data?.data.items ?? [];
  const meta = data?.data.meta;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Products & Inventory</h1>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">{meta?.total ?? 0} active catalog items</p>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={() => { setEditProduct(undefined); setShowModal(true); }}>
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      <div className="card p-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
          <input className="input pl-9" placeholder="Search product name, SKU, or category..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : isError ? (
          <div className="py-12 text-center text-red-500 text-xs font-semibold">Failed to load product catalog</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[var(--border-color)]">
                <tr>
                  <th className="table-header text-left p-4">Product Name</th>
                  <th className="table-header text-left p-4 hidden sm:table-cell">SKU</th>
                  <th className="table-header text-left p-4 hidden md:table-cell">Category</th>
                  <th className="table-header text-right p-4">Unit Price</th>
                  <th className="table-header text-center p-4">Inventory Level</th>
                  <th className="table-header text-left p-4 hidden lg:table-cell">Location</th>
                  <th className="table-header text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-[var(--text-muted)] text-xs font-medium">No catalog items found</td></tr>
                ) : products.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {p.isLowStock ? (
                          <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
                        ) : (
                          <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                        )}
                        <span className="font-extrabold text-[var(--text-main)] text-xs">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] px-2 py-0.5 rounded border border-[var(--border-color)] font-semibold">{p.sku}</span>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="badge-purple text-[10px]">{p.category}</span>
                    </td>
                    <td className="p-4 text-right text-xs font-black text-[var(--text-main)]">₹{parseFloat(p.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`font-black text-xs ${p.isLowStock ? 'text-red-500' : 'text-emerald-500'}`}>
                          {p.currentStock} UNITS
                        </span>
                        {/* Visual stock progress bar */}
                        <div className="w-20 h-1.5 bg-[var(--bg-surface-hover)] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${p.isLowStock ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, Math.max(10, (p.currentStock / (p.minStock * 2 || 1)) * 100))}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[var(--text-subtle)]">Min. req: {p.minStock}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell text-xs font-semibold text-[var(--text-muted)]">{p.warehouseLocation}</td>
                    <td className="p-4">
                      {canManage && (
                        <button onClick={() => { setEditProduct(p); setShowModal(true); }} className="btn-secondary px-2.5 py-1 text-xs font-semibold float-right">
                          <Edit2 size={13} /> Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs font-semibold">
            <span className="text-[var(--text-muted)]">Page {meta.page} of {meta.totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1 text-xs">Prev</button>
              <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="btn-secondary px-3 py-1 text-xs">Next</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <ProductModal
          onClose={() => { setShowModal(false); setEditProduct(undefined); }}
          editProduct={editProduct}
        />
      )}
    </div>
  );
}
