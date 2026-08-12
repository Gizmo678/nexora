import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Customer, CustomerFollowUp } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, User, Building, Phone, Mail, MapPin, FileText, Plus, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const followUpSchema = z.object({
  note: z.string().min(2, 'Note must be at least 2 characters'),
  followUpDate: z.string().optional(),
});
type FollowUpForm = z.infer<typeof followUpSchema>;

const STATUS_BADGE: Record<string, string> = {
  LEAD: 'badge-yellow', ACTIVE: 'badge-green', INACTIVE: 'badge-slate',
};
const TYPE_BADGE: Record<string, string> = {
  RETAIL: 'badge-blue', WHOLESALE: 'badge-purple', DISTRIBUTOR: 'badge-yellow',
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const canManage = user && ['ADMIN', 'SALES'].includes(user.role);

  const { data, isLoading } = useQuery<{ success: boolean; data: Customer }>({
    queryKey: ['customer', id],
    queryFn: () => api.get(`/customers/${id}`).then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FollowUpForm>({
    resolver: zodResolver(followUpSchema),
  });

  const addFollowUp = useMutation({
    mutationFn: (formData: FollowUpForm) => api.post(`/customers/${id}/follow-ups`, {
      note: formData.note,
      followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : undefined,
    }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', id] });
      toast.success('Follow-up note recorded!');
      reset();
      setShowFollowUpForm(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add follow-up'),
  });

  const customer = data?.data;

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
    </div>
  );

  if (!customer) return (
    <div className="card text-center py-12">
      <p className="text-[var(--text-muted)] text-sm">Customer record not found</p>
      <Link to="/customers" className="btn-primary mt-4 inline-flex">Return to Customers</Link>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/customers" className="btn-secondary px-2.5 py-2 mt-1">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold text-[var(--text-main)]">{customer.customerName}</h1>
            <span className={STATUS_BADGE[customer.status]}>{customer.status}</span>
            <span className={TYPE_BADGE[customer.customerType]}>{customer.customerType}</span>
          </div>
          <p className="text-[var(--text-muted)] text-xs mt-1 flex items-center gap-1.5 font-medium">
            <Building size={14} />{customer.businessName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="card space-y-4">
          <h2 className="section-title">Account Details</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-[var(--text-main)]">
              <Phone size={15} className="text-[var(--text-subtle)] flex-shrink-0" />
              <span>{customer.mobile}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[var(--text-main)]">
              <Mail size={15} className="text-[var(--text-subtle)] flex-shrink-0" />
              <span>{customer.email}</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-[var(--text-main)]">
              <MapPin size={15} className="text-[var(--text-subtle)] flex-shrink-0 mt-0.5" />
              <span>{customer.address}</span>
            </div>
            {customer.gstNumber && (
              <div className="flex items-center gap-2.5 text-xs text-[var(--text-main)]">
                <FileText size={15} className="text-[var(--text-subtle)]" />
                <span className="font-mono">{customer.gstNumber}</span>
              </div>
            )}
          </div>

          {customer.followUpDate && (
            <div className="pt-3 border-t border-[var(--border-color)]">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Scheduled Follow-up</p>
              <p className="text-xs text-indigo-500 font-semibold flex items-center gap-1.5">
                <Calendar size={14} />
                {new Date(customer.followUpDate).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
          )}

          {customer.notes && (
            <div className="pt-3 border-t border-[var(--border-color)]">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Account Notes</p>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{customer.notes}</p>
            </div>
          )}

          <div className="pt-3 border-t border-[var(--border-color)] flex gap-2 text-[10px] text-[var(--text-subtle)]">
            <span>Created: {new Date(customer.createdAt).toLocaleDateString('en-IN')}</span>
          </div>
        </div>

        {/* Follow-up History */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Follow-up Activity Timeline</h2>
            {canManage && (
              <button onClick={() => setShowFollowUpForm(!showFollowUpForm)} className="btn-primary text-xs px-3 py-1.5">
                <Plus size={14} /> Record Activity
              </button>
            )}
          </div>

          {/* Add Follow-up Form */}
          {showFollowUpForm && (
            <form onSubmit={handleSubmit(d => addFollowUp.mutate(d))} className="mb-4 p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)] space-y-3">
              <div>
                <label className="label">Activity / Discussion Note *</label>
                <textarea {...register('note')} className="input min-h-[80px] resize-none" placeholder="Details of conversation or next steps..." />
                {errors.note && <p className="error-text">{errors.note.message}</p>}
              </div>
              <div>
                <label className="label">Next Follow-up Date (optional)</label>
                <input type="datetime-local" {...register('followUpDate')} className="input" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowFollowUpForm(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs" disabled={addFollowUp.isPending}>
                  {addFollowUp.isPending ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          )}

          {/* History Timeline */}
          {!customer.followUps || customer.followUps.length === 0 ? (
            <div className="py-12 text-center bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)]">
              <User size={36} className="text-[var(--text-subtle)] mx-auto mb-2" />
              <p className="text-[var(--text-muted)] text-xs font-medium">No activity notes recorded yet</p>
              {canManage && <p className="text-[var(--text-subtle)] text-[10px] mt-1">Use the Record Activity button to log calls or visits</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {customer.followUps.map((fu: CustomerFollowUp) => (
                <div key={fu.id} className="relative pl-6 before:absolute before:left-2 before:top-3 before:w-2 before:h-2 before:bg-indigo-500 before:rounded-full">
                  <div className="bg-[var(--bg-surface)] rounded-xl p-3.5 border border-[var(--border-color)] space-y-1.5">
                    <p className="text-xs text-[var(--text-main)] font-medium leading-relaxed">{fu.note}</p>
                    <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] flex-wrap">
                      <span className="font-semibold text-indigo-500">Recorded by {fu.createdBy.name} ({fu.createdBy.role})</span>
                      <span>·</span>
                      <span>{new Date(fu.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      {fu.followUpDate && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-500 font-semibold">Scheduled: {new Date(fu.followUpDate).toLocaleDateString('en-IN')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
