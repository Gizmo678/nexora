import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Customer, CustomerType, CustomerStatus, PaginatedResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, Phone, Building } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TableSkeleton } from '../components/Skeleton';

const CUSTOMER_STATUS_CLASS: Record<CustomerStatus, string> = {
  LEAD: 'badge-yellow', ACTIVE: 'badge-green', INACTIVE: 'badge-slate',
};
const CUSTOMER_TYPE_CLASS: Record<CustomerType, string> = {
  RETAIL: 'badge-blue', WHOLESALE: 'badge-purple', DISTRIBUTOR: 'badge-yellow',
};

const createSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().min(7, 'Mobile number invalid'),
  email: z.string().email('Email invalid'),
  businessName: z.string().min(2, 'Business name required'),
  gstNumber: z.string().optional(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().min(3, 'Address required'),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']),
  notes: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;

function CustomerModal({ onClose, editCustomer }: { onClose: () => void; editCustomer?: Customer }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: editCustomer ? {
      customerName: editCustomer.customerName,
      mobile: editCustomer.mobile,
      email: editCustomer.email,
      businessName: editCustomer.businessName,
      gstNumber: editCustomer.gstNumber ?? '',
      customerType: editCustomer.customerType,
      address: editCustomer.address,
      status: editCustomer.status,
      notes: editCustomer.notes ?? '',
    } : { customerType: 'WHOLESALE', status: 'LEAD' },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateForm) =>
      editCustomer
        ? api.patch(`/customers/${editCustomer.id}`, data).then(r => r.data.data)
        : api.post('/customers', data).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success(editCustomer ? 'Customer record updated!' : 'Customer created!');
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save customer'),
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="p-5 border-b border-[var(--border-color)]">
          <h2 className="text-base font-bold text-[var(--text-main)]">{editCustomer ? 'Edit Customer Record' : 'Add New Customer Account'}</h2>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Customer Name *</label>
              <input {...register('customerName')} className="input" />
              {errors.customerName && <p className="error-text">{errors.customerName.message}</p>}
            </div>
            <div>
              <label className="label">Mobile *</label>
              <input {...register('mobile')} className="input" />
              {errors.mobile && <p className="error-text">{errors.mobile.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email *</label>
              <input {...register('email')} className="input" type="email" />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Business Name *</label>
              <input {...register('businessName')} className="input" />
              {errors.businessName && <p className="error-text">{errors.businessName.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Account Type</label>
              <select {...register('customerType')} className="input">
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select {...register('status')} className="input">
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Registered Address *</label>
            <input {...register('address')} className="input" />
            {errors.address && <p className="error-text">{errors.address.message}</p>}
          </div>
          <div>
            <label className="label">GSTIN / Tax ID (Optional)</label>
            <input {...register('gstNumber')} className="input" placeholder="e.g. 29AAAAA0000A1Z5" />
          </div>
          <div>
            <label className="label">Account Notes</label>
            <textarea {...register('notes')} className="input min-h-[80px] resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | undefined>();

  const canManage = user && ['ADMIN', 'SALES'].includes(user.role);

  const { data, isLoading, isError } = useQuery<{ success: boolean; data: PaginatedResponse<Customer> }>({
    queryKey: ['customers', search, status, type, page],
    queryFn: () => api.get('/customers', { params: { search: search || undefined, status: status || undefined, customerType: type || undefined, page, limit: 20 } }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const customers = data?.data.items ?? [];
  const meta = data?.data.meta;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Customer CRM</h1>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">{meta?.total ?? 0} active accounts in database</p>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={() => { setEditCustomer(undefined); setShowModal(true); }}>
            <Plus size={16} /> Add Customer Account
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
          <input className="input pl-9" placeholder="Search customer or business name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-auto" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <select className="input w-auto" value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
          <option value="">All Account Types</option>
          <option value="RETAIL">Retail</option>
          <option value="WHOLESALE">Wholesale</option>
          <option value="DISTRIBUTOR">Distributor</option>
        </select>
      </div>

      {/* Table & Loading/Error/Empty states */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : isError ? (
          <div className="py-12 text-center text-red-500 text-xs">Failed to load customer accounts</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[var(--border-color)]">
                <tr>
                  <th className="table-header text-left p-4">Customer</th>
                  <th className="table-header text-left p-4 hidden sm:table-cell">Mobile</th>
                  <th className="table-header text-left p-4 hidden md:table-cell">Type</th>
                  <th className="table-header text-left p-4">Status</th>
                  <th className="table-header text-left p-4 hidden lg:table-cell">Next Follow-up</th>
                  <th className="table-header text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-[var(--text-muted)] text-xs font-medium">No customer accounts match criteria</td></tr>
                ) : customers.map((c) => (
                  <tr key={c.id} className="table-row">
                    <td className="p-4">
                      <p className="font-extrabold text-[var(--text-main)] text-xs">{c.customerName}</p>
                      <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5 font-medium">
                        <Building size={11} />{c.businessName}
                      </p>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-1.5">
                        <Phone size={13} className="text-[var(--text-subtle)]" />{c.mobile}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className={CUSTOMER_TYPE_CLASS[c.customerType]}>{c.customerType}</span>
                    </td>
                    <td className="p-4">
                      <span className={CUSTOMER_STATUS_CLASS[c.status]}>{c.status}</span>
                    </td>
                    <td className="p-4 hidden lg:table-cell text-xs font-semibold text-indigo-500">
                      {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/customers/${c.id}`} className="btn-secondary px-2.5 py-1 text-xs font-semibold">
                          <Eye size={13} /> View
                        </Link>
                        {canManage && (
                          <button onClick={() => { setEditCustomer(c); setShowModal(true); }} className="btn-secondary px-2.5 py-1 text-xs font-semibold">
                            <Edit2 size={13} /> Edit
                          </button>
                        )}
                      </div>
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
        <CustomerModal
          onClose={() => { setShowModal(false); setEditCustomer(undefined); }}
          editCustomer={editCustomer}
        />
      )}
    </div>
  );
}
