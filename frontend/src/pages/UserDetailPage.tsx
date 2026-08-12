import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { User, Role } from '../types';
import { ArrowLeft, Shield, Calendar, Mail, Clock, FileText, ArrowLeftRight, MessageSquare, CheckCircle2 } from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';

const ROLE_PERMISSIONS: Record<Role, { title: string; description: string; permissions: string[] }> = {
  ADMIN: {
    title: 'ADMIN — Full System Access',
    description: 'Complete administrative access across all operational & user management modules.',
    permissions: [
      'Manage team members, roles & user statuses',
      'Create and edit products & inventory stock levels',
      'Record stock movements (IN / OUT dispatches)',
      'Create & confirm sales challans with automatic stock deduction',
      'Full customer CRM & follow-up management',
    ],
  },
  SALES: {
    title: 'SALES — Customer CRM & Sales Challans',
    description: 'Operational access focused on customer relationships and sales order creation.',
    permissions: [
      'Create and manage customer accounts',
      'Log interaction notes and schedule follow-ups',
      'Create and confirm sales challans',
      'View catalog products and stock levels',
      'View stock movement audit logs',
    ],
  },
  WAREHOUSE: {
    title: 'WAREHOUSE — Catalog & Stock Movements',
    description: 'Inventory control access for catalog maintenance and stock dispatch logging.',
    permissions: [
      'Create and edit product catalog items & stock thresholds',
      'Record stock movements (IN additions & OUT dispatches)',
      'View customer directory',
      'View sales challans and dispatch status',
    ],
  },
  ACCOUNTS: {
    title: 'ACCOUNTS — Financial & Operational Auditing',
    description: 'Read-only access for financial auditing and sales verification.',
    permissions: [
      'View customer CRM directory & transaction history',
      'View catalog products & stock levels',
      'View stock movement audit trail',
      'View sales challans and printable invoices',
    ],
  },
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery<{ success: boolean; data: User }>({
    queryKey: ['user-detail', id],
    queryFn: () => api.get(`/users/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });

  const user = data?.data;

  if (isLoading) return <TableSkeleton rows={4} cols={2} />;

  if (isError || !user) {
    return (
      <div className="card text-center py-12 space-y-3 max-w-4xl">
        <p className="text-[var(--danger)] font-semibold text-sm">Failed to load user details</p>
        <Link to="/users" className="btn-secondary text-xs inline-flex">
          <ArrowLeft size={14} /> Back to Users Directory
        </Link>
      </div>
    );
  }

  const perm = ROLE_PERMISSIONS[user.role];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <Link to="/users" className="text-xs text-[var(--accent-primary)] font-semibold hover:underline inline-flex items-center gap-1 mb-1">
            <ArrowLeft size={12} /> Back to Users Directory
          </Link>
          <h1 className="text-xl font-bold text-[var(--text-main)] tracking-tight">{user.name}</h1>
          <p className="text-[var(--text-muted)] text-xs font-mono">{user.email}</p>
        </div>

        <div className="flex items-center gap-2">
          {user.role === 'ADMIN' ? (
            <span className="badge-violet text-xs font-bold px-2 py-0.5">{user.role}</span>
          ) : (
            <span className="badge-slate text-xs font-semibold px-2 py-0.5">{user.role}</span>
          )}

          {user.status === 'ACTIVE' ? (
            <span className="badge-green text-xs font-bold">Active</span>
          ) : (
            <span className="badge-red text-xs font-bold">Suspended</span>
          )}
        </div>
      </div>

      {/* User Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card space-y-1">
          <span className="text-[11px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider flex items-center gap-1.5">
            <Mail size={14} className="text-[var(--accent-primary)]" /> Email Address
          </span>
          <p className="text-sm font-semibold text-[var(--text-main)] truncate">{user.email}</p>
        </div>

        <div className="card space-y-1">
          <span className="text-[11px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={14} className="text-[var(--accent-primary)]" /> Member Since
          </span>
          <p className="text-sm font-semibold text-[var(--text-main)]">
            {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        <div className="card space-y-1">
          <span className="text-[11px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={14} className="text-[var(--accent-primary)]" /> Last Activity
          </span>
          <p className="text-sm font-semibold text-[var(--text-main)]">
            {new Date(user.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Access Summary Box */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
          <Shield size={18} className="text-[var(--accent-primary)]" />
          <div>
            <h2 className="text-sm font-bold text-[var(--text-main)]">{perm.title}</h2>
            <p className="text-xs text-[var(--text-muted)]">{perm.description}</p>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          {perm.permissions.map((p, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-[var(--text-main)] font-medium">
              <CheckCircle2 size={15} className="text-[var(--success)] flex-shrink-0" />
              <span>{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Attribution Summary */}
      {user._count && (
        <div className="card space-y-4">
          <h2 className="section-title">Historical Records Attribution</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-primary)]">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--text-main)]">{user._count.challans}</p>
                <p className="text-[11px] text-[var(--text-subtle)] font-medium">Sales Challans Created</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-primary)]">
                <ArrowLeftRight size={20} />
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--text-main)]">{user._count.movements}</p>
                <p className="text-[11px] text-[var(--text-subtle)] font-medium">Stock Movements Recorded</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-primary)]">
                <MessageSquare size={20} />
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--text-main)]">{user._count.followUps}</p>
                <p className="text-[11px] text-[var(--text-subtle)] font-medium">CRM Follow-ups Logged</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
