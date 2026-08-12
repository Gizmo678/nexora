import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { SalesChallan, ChallanStatus, PaginatedResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Eye } from 'lucide-react';

const STATUS_BADGE: Record<ChallanStatus, string> = {
  DRAFT: 'badge-yellow', CONFIRMED: 'badge-green', CANCELLED: 'badge-slate',
};

export default function ChallansPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const canCreate = user && ['ADMIN', 'SALES'].includes(user.role);

  const { data, isLoading } = useQuery<{ success: boolean; data: PaginatedResponse<SalesChallan> }>({
    queryKey: ['challans', search, status, page],
    queryFn: () => api.get('/challans', { params: { search: search || undefined, status: status || undefined, page, limit: 20 } }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const challans = data?.data.items ?? [];
  const meta = data?.data.meta;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">Sales Challans</h1>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">{meta?.total ?? 0} challan records</p>
        </div>
        {canCreate && (
          <Link to="/challans/new" className="btn-primary">
            <Plus size={16} /> Create Challan
          </Link>
        )}
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
          <input className="input pl-9" placeholder="Search by challan number or customer..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-auto" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[var(--border-color)]">
              <tr>
                <th className="table-header text-left p-4">Challan #</th>
                <th className="table-header text-left p-4">Customer</th>
                <th className="table-header text-left p-4">Status</th>
                <th className="table-header text-center p-4 hidden sm:table-cell">Total Qty</th>
                <th className="table-header text-right p-4">Total Amount</th>
                <th className="table-header text-left p-4 hidden md:table-cell">Created By</th>
                <th className="table-header text-left p-4 hidden lg:table-cell">Date</th>
                <th className="table-header text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-12 text-[var(--text-muted)] text-sm">Loading sales challans...</td></tr>
              ) : challans.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-[var(--text-muted)] text-sm">No challans found</td></tr>
              ) : challans.map((ch) => (
                <tr key={ch.id} className="table-row">
                  <td className="p-4">
                    <span className="text-xs font-mono font-bold text-indigo-500">{ch.challanNumber}</span>
                  </td>
                  <td className="p-4">
                    <p className="text-xs font-bold text-[var(--text-main)]">{ch.customer.customerName}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{ch.customer.businessName}</p>
                  </td>
                  <td className="p-4">
                    <span className={STATUS_BADGE[ch.status]}>{ch.status}</span>
                  </td>
                  <td className="p-4 text-center hidden sm:table-cell text-xs font-semibold text-[var(--text-main)]">{ch.totalQuantity}</td>
                  <td className="p-4 text-right text-xs font-extrabold text-[var(--text-main)]">
                    ₹{parseFloat(ch.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 hidden md:table-cell text-xs text-[var(--text-muted)]">{ch.createdBy.name}</td>
                  <td className="p-4 hidden lg:table-cell text-xs text-[var(--text-subtle)]">
                    {new Date(ch.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="p-4">
                    <Link to={`/challans/${ch.id}`} className="btn-secondary px-2.5 py-1 text-xs float-right">
                      <Eye size={13} /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">Page {meta.page} of {meta.totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1 text-xs">Prev</button>
              <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="btn-secondary px-3 py-1 text-xs">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
