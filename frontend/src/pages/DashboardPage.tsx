import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { DashboardMetrics, ChallanStatus, CustomerStatus } from '../types';
import {
  Users, Package, AlertTriangle, FileText,
  CheckCircle, Calendar, TrendingUp, ArrowRight, Plus, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { StatCardSkeleton } from '../components/Skeleton';

const CHALLAN_STATUS_CLASS: Record<ChallanStatus, string> = {
  DRAFT: 'badge-yellow',
  CONFIRMED: 'badge-green',
  CANCELLED: 'badge-slate',
};

const CUSTOMER_STATUS_CLASS: Record<CustomerStatus, string> = {
  LEAD: 'badge-yellow',
  ACTIVE: 'badge-green',
  INACTIVE: 'badge-slate',
};

function formatCurrency(val: string | number) {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatCard({
  icon,
  label,
  value,
  badge,
  badgeClass = 'badge-slate',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  badge?: string;
  badgeClass?: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-lg bg-[var(--bg-surface-hover)] text-[var(--text-muted)]">
          {icon}
        </div>
        {badge && <span className={badgeClass}>{badge}</span>}
      </div>
      <div className="mt-1">
        <p className="text-2xl font-bold text-[var(--text-main)] tracking-tight">{value}</p>
        <p className="text-xs font-medium text-[var(--text-subtle)] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const canCreateChallan = user && ['ADMIN', 'SALES'].includes(user.role);
  const canManageStock = user && ['ADMIN', 'WAREHOUSE'].includes(user.role);
  const canManageCustomer = user && ['ADMIN', 'SALES'].includes(user.role);

  const { data, isLoading, isError } = useQuery<{ success: boolean; data: DashboardMetrics }>({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.get('/dashboard/metrics').then((r) => r.data),
    refetchInterval: 30000,
  });

  const metrics = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !metrics) {
    return (
      <div className="card text-center py-12 space-y-2 max-w-6xl">
        <AlertTriangle size={40} className="text-[var(--warning)] mx-auto" />
        <p className="text-[var(--text-main)] font-semibold text-sm">Failed to load operations metrics</p>
        <p className="text-[var(--text-subtle)] text-xs">Ensure PostgreSQL & backend server are running</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Header & Quick Action Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-main)] tracking-tight">Executive Dashboard</h1>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">
            Welcome back, <span className="font-semibold text-[var(--text-main)]">{user?.name}</span>. Real-time operations status.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canCreateChallan && (
            <Link to="/challans/new" className="btn-primary text-xs font-semibold">
              <Plus size={14} /> Create Challan
            </Link>
          )}
          {canManageStock && (
            <Link to="/stock-movements" className="btn-secondary text-xs font-medium">
              <Plus size={14} /> Record Movement
            </Link>
          )}
          {canManageCustomer && (
            <Link to="/customers" className="btn-secondary text-xs font-medium">
              <Plus size={14} /> Add Customer
            </Link>
          )}
        </div>
      </div>

      {/* Neutral Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={18} className="text-[var(--accent-primary)]" />}
          label="Total Customers"
          value={metrics.totalCustomers}
          badge="Active"
          badgeClass="badge-violet"
        />
        <StatCard
          icon={<Package size={18} className="text-[var(--text-muted)]" />}
          label="Catalog Products"
          value={metrics.totalProducts}
          badge="Items"
          badgeClass="badge-slate"
        />
        <StatCard
          icon={<AlertTriangle size={18} className="text-[var(--warning)]" />}
          label="Low Stock Warnings"
          value={metrics.lowStockProductCount}
          badge={metrics.lowStockProductCount > 0 ? "Requires Action" : "Optimal"}
          badgeClass={metrics.lowStockProductCount > 0 ? "badge-red" : "badge-green"}
        />
        <StatCard
          icon={<FileText size={18} className="text-[var(--warning)]" />}
          label="Draft Challans"
          value={metrics.draftChallans}
          badge="Pending Review"
          badgeClass="badge-yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard
          icon={<CheckCircle size={18} className="text-[var(--success)]" />}
          label="Confirmed Sales Challans"
          value={metrics.confirmedChallans}
          badge="Dispatched"
          badgeClass="badge-green"
        />
        <StatCard
          icon={<TrendingUp size={18} className="text-[var(--accent-primary)]" />}
          label="Total Confirmed Revenue"
          value={formatCurrency(metrics.totalSalesValue)}
          badge="Gross Total"
          badgeClass="badge-violet"
        />
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Low Stock Banners */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <AlertTriangle size={16} className="text-[var(--warning)]" />
              Low Stock Warnings
            </h2>
            <Link to="/products" className="text-xs font-semibold text-[var(--accent-primary)] hover:underline flex items-center gap-1">
              Manage Products <ArrowRight size={12} />
            </Link>
          </div>

          {metrics.lowStockItems.length === 0 ? (
            <div className="py-8 text-center bg-[var(--bg-surface)] rounded-lg border border-[var(--border-color)]">
              <CheckCircle size={28} className="text-[var(--success)] mx-auto mb-2" />
              <p className="text-[var(--text-main)] font-semibold text-xs">Inventory levels healthy</p>
              <p className="text-[var(--text-subtle)] text-[11px] mt-0.5">All products exceed minimum stock thresholds.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.lowStockItems.map((item) => (
                <div key={item.id} className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-[var(--text-main)]">{item.name}</p>
                    <p className="text-[10px] font-mono text-[var(--text-subtle)]">SKU: {item.sku} · {item.warehouseLocation}</p>
                  </div>
                  <div className="text-right">
                    <span className="badge-red font-mono font-semibold">{item.currentStock} UNITS</span>
                    <p className="text-[10px] text-[var(--text-subtle)] mt-0.5">Min required: {item.minStock}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming CRM Follow-ups */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Calendar size={16} className="text-[var(--accent-primary)]" />
              Upcoming Follow-ups
            </h2>
            <Link to="/customers" className="text-xs font-semibold text-[var(--accent-primary)] hover:underline flex items-center gap-1">
              Customer CRM <ArrowRight size={12} />
            </Link>
          </div>

          {metrics.upcomingFollowUps.length === 0 ? (
            <div className="py-8 text-center bg-[var(--bg-surface)] rounded-lg border border-[var(--border-color)]">
              <Activity size={28} className="text-[var(--text-subtle)] mx-auto mb-2" />
              <p className="text-[var(--text-muted)] text-xs">No follow-ups scheduled in next 7 days</p>
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.upcomingFollowUps.map((c) => (
                <Link to={`/customers/${c.id}`} key={c.id} className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-between hover:border-[var(--border-color-hover)] transition-colors text-xs">
                  <div>
                    <p className="font-semibold text-[var(--text-main)]">{c.customerName}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{c.businessName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-[var(--accent-primary)]">
                      {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString('en-IN') : 'Scheduled'}
                    </p>
                    <span className={`${CUSTOMER_STATUS_CLASS[c.status]} text-[10px] mt-0.5`}>{c.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales Challans */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Recent Sales Challans</h2>
          <Link to="/challans" className="text-xs font-semibold text-[var(--accent-primary)] hover:underline flex items-center gap-1">
            All Challans <ArrowRight size={12} />
          </Link>
        </div>

        {metrics.recentChallans.length === 0 ? (
          <div className="py-8 text-center bg-[var(--bg-surface)] rounded-lg border border-[var(--border-color)]">
            <p className="text-[var(--text-muted)] text-xs">No sales challans recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="table-header text-left py-2.5 px-3">Challan #</th>
                  <th className="table-header text-left py-2.5 px-3">Customer</th>
                  <th className="table-header text-left py-2.5 px-3">Status</th>
                  <th className="table-header text-right py-2.5 px-3">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentChallans.map((ch) => (
                  <tr key={ch.id} className="table-row">
                    <td className="py-3 px-3 font-mono font-semibold">
                      <Link to={`/challans/${ch.id}`} className="text-[var(--accent-primary)] hover:underline">
                        {ch.challanNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-[var(--text-main)]">{ch.customer.customerName}</p>
                      <p className="text-[10px] text-[var(--text-subtle)]">{ch.customer.businessName}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className={CHALLAN_STATUS_CLASS[ch.status]}>{ch.status}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-[var(--text-main)]">
                      {formatCurrency(ch.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
