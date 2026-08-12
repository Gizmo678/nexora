import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { SalesChallan, ChallanStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { COMPANY_PROFILE } from '../config/company';
import { ArrowLeft, CheckCircle, XCircle, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import NexoraLogo from '../components/NexoraLogo';

const STATUS_BADGE: Record<ChallanStatus, string> = {
  DRAFT: 'badge-yellow', CONFIRMED: 'badge-green', CANCELLED: 'badge-slate',
};

function formatCurrency(val: string | number) {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ChallanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const canAct = user && ['ADMIN', 'SALES'].includes(user.role);

  const { data, isLoading } = useQuery<{ success: boolean; data: SalesChallan }>({
    queryKey: ['challan', id],
    queryFn: () => api.get(`/challans/${id}`).then(r => r.data),
  });

  const confirmMutation = useMutation({
    mutationFn: () => api.post(`/challans/${id}/confirm`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['challan', id] });
      qc.invalidateQueries({ queryKey: ['challans'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Challan confirmed! Stock has been deducted.');
    },
    onError: (err: any) => {
      const errData = err.response?.data;
      const details = errData?.details;
      if (details) {
        toast.error(`${errData.message}\nAvailable: ${details.availableStock} | Requested: ${details.requestedQuantity}`, { duration: 8000 });
      } else {
        toast.error(errData?.message || 'Failed to confirm challan');
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/challans/${id}/cancel`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['challan', id] });
      qc.invalidateQueries({ queryKey: ['challans'] });
      toast.success('Challan cancelled.');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to cancel challan'),
  });

  const challan = data?.data;

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
    </div>
  );

  if (!challan) return (
    <div className="card text-center py-12">
      <p className="text-[var(--text-muted)] text-xs">Challan document record not found</p>
      <Link to="/challans" className="btn-primary mt-4 inline-flex">Return to Challans</Link>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Top Controls (Hidden on Print) */}
      <div className="flex items-center justify-between no-print flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/challans')} className="btn-secondary px-2.5 py-2">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black font-mono text-[var(--text-main)]">{challan.challanNumber}</h1>
              <span className={STATUS_BADGE[challan.status]}>{challan.status}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Created by {challan.createdBy.name} on {new Date(challan.createdAt).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <button onClick={() => window.print()} className="btn-primary">
          <Printer size={16} /> Print Document / Save PDF
        </button>
      </div>

      {/* Action Bar for Draft Status (Hidden on Print) */}
      {canAct && challan.status === 'DRAFT' && (
        <div className="card border-amber-500/30 bg-amber-500/5 no-print">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-bold text-amber-500">Challan Awaiting Confirmation</p>
              <p className="text-[11px] text-[var(--text-muted)]">
                Confirming will atomically deduct stock for all items. Insufficient stock will reject the operation.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (window.confirm('Confirm this sales challan? Stock will be deducted immediately.')) {
                    confirmMutation.mutate();
                  }
                }}
                disabled={confirmMutation.isPending}
                className="btn-success text-xs font-bold"
              >
                <CheckCircle size={14} />
                {confirmMutation.isPending ? 'Confirming...' : 'Confirm & Deduct Stock'}
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Cancel this sales challan?')) cancelMutation.mutate();
                }}
                disabled={cancelMutation.isPending}
                className="btn-danger text-xs font-bold"
              >
                <XCircle size={14} />
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Printable Sales Challan / Invoice Document */}
      <div className="printable-document card p-8 sm:p-10 space-y-8 bg-white text-slate-900 border border-[var(--border-color)] rounded-2xl shadow-xl">
        {/* Header Block */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-6 flex-wrap gap-4">
          <div className="space-y-1">
            <NexoraLogo size="md" showWordmark={true} showSubtitle={true} />
            <p className="text-xs text-slate-600 font-bold pt-2">{COMPANY_PROFILE.legalName}</p>
            <p className="text-xs text-slate-500">{COMPANY_PROFILE.address}, {COMPANY_PROFILE.cityStateZip}</p>
            <p className="text-xs text-slate-500">Phone: {COMPANY_PROFILE.phone} · Email: {COMPANY_PROFILE.email}</p>
            {COMPANY_PROFILE.gstin && <p className="text-xs font-mono font-bold text-slate-800">GSTIN: {COMPANY_PROFILE.gstin}</p>}
          </div>

          <div className="text-right space-y-1">
            <h2 className="text-xl font-black tracking-wider text-indigo-700 uppercase">SALES CHALLAN / INVOICE</h2>
            <p className="text-sm font-mono font-bold text-slate-900">{challan.challanNumber}</p>
            <p className="text-xs text-slate-600">Date: {new Date(challan.createdAt).toLocaleDateString('en-IN')}</p>
            <p className="text-xs text-slate-600">Status: <span className="font-extrabold text-slate-900 uppercase">{challan.status}</span></p>
          </div>
        </div>

        {/* Customer & Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <h3 className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px] mb-1.5">CUSTOMER / BILL TO</h3>
            <p className="font-bold text-sm text-slate-900">{challan.customer.customerName}</p>
            <p className="font-semibold text-slate-700">{challan.customer.businessName}</p>
            <p className="text-slate-600 mt-1">{challan.customer.address}</p>
            <p className="text-slate-600">Phone: {challan.customer.mobile}</p>
            <p className="text-slate-600">Email: {challan.customer.email}</p>
            {challan.customer.gstNumber && <p className="text-slate-800 font-mono font-semibold">GSTIN: {challan.customer.gstNumber}</p>}
          </div>
          <div className="sm:text-right space-y-1">
            <h3 className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px] mb-1.5">DOCUMENT INFO</h3>
            <p className="text-slate-700">Created By: <span className="font-semibold text-slate-900">{challan.createdBy.name}</span></p>
            <p className="text-slate-700">Role: <span className="font-semibold text-slate-900">{challan.createdBy.role}</span></p>
            <p className="text-slate-700">Dispatched Via: <span className="font-semibold text-slate-900">Standard Delivery</span></p>
          </div>
        </div>

        {/* Line Items Table */}
        <div>
          <table className="print-table w-full text-xs">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-slate-700">
                <th className="py-2.5 px-3 text-left font-bold w-12">#</th>
                <th className="py-2.5 px-3 text-left font-bold">Product Description</th>
                <th className="py-2.5 px-3 text-left font-bold">SKU</th>
                <th className="py-2.5 px-3 text-center font-bold">Qty</th>
                <th className="py-2.5 px-3 text-right font-bold">Unit Price</th>
                <th className="py-2.5 px-3 text-right font-bold">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {challan.items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{item.productNameSnapshot}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{item.skuSnapshot}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-900">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-right text-slate-700">{formatCurrency(item.unitPriceSnapshot)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 font-bold">
                <td colSpan={3} className="py-3 px-3 text-right text-slate-600">Total Quantity:</td>
                <td className="py-3 px-3 text-center text-slate-900">{challan.totalQuantity} units</td>
                <td className="py-3 px-3 text-right text-slate-600">Grand Total Amount:</td>
                <td className="py-3 px-3 text-right text-base text-indigo-700 font-black">{formatCurrency(challan.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signature & Stamp Section */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
          <div className="space-y-12">
            <p className="font-bold text-slate-700">Customer Receipt & Acceptance</p>
            <div className="border-b border-slate-400 w-48" />
            <p className="text-[10px] text-slate-500">Receiver's Signature & Date</p>
          </div>

          <div className="text-right space-y-12">
            <p className="font-bold text-slate-700">For {COMPANY_PROFILE.legalName}</p>
            <div className="border-b border-slate-400 w-48 ml-auto" />
            <p className="text-[10px] text-slate-500">Authorized Signatory / Stamp</p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500">
          <p className="font-semibold">Generated by Nexora Business Operations Platform</p>
          <p>Thank you for your business.</p>
        </div>
      </div>
    </div>
  );
}
