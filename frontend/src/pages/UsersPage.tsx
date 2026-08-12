import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { User, UserStatus, PaginatedResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Search, Eye, Edit2, UserX, UserCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TableSkeleton } from '../components/Skeleton';

const userCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});

const userEditSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional().refine((val) => !val || val.length >= 6, 'Password must be at least 6 characters if provided'),
  role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});

type UserCreateForm = z.infer<typeof userCreateSchema>;
type UserEditForm = z.infer<typeof userEditSchema>;

function AddUserModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<UserCreateForm>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: { role: 'SALES', status: 'ACTIVE' },
  });

  const mutation = useMutation({
    mutationFn: (data: UserCreateForm) => api.post('/users', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users-list'] });
      toast.success('User created successfully');
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create user';
      toast.error(msg);
    },
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="p-5 border-b border-[var(--border-color)]">
          <h2 className="text-base font-semibold text-[var(--text-main)]">Add New Team Member</h2>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input {...register('name')} className="input" placeholder="e.g. Sarah Jenkins" />
            {errors.name && <p className="error-text">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Email Address *</label>
            <input {...register('email')} type="email" className="input" placeholder="s.jenkins@example.com" />
            {errors.email && <p className="error-text">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Initial Password *</label>
            <input {...register('password')} type="password" className="input" placeholder="At least 6 characters" />
            {errors.password && <p className="error-text">{errors.password.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Role *</label>
              <select {...register('role')} className="input">
                <option value="ADMIN">ADMIN (Full Access)</option>
                <option value="SALES">SALES (CRM & Challans)</option>
                <option value="WAREHOUSE">WAREHOUSE (Stock & Items)</option>
                <option value="ACCOUNTS">ACCOUNTS (Auditing)</option>
              </select>
            </div>
            <div>
              <label className="label">Status *</label>
              <select {...register('status')} className="input">
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose }: { user: User; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<UserEditForm>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: UserEditForm) => {
      const payload: Record<string, any> = { ...data };
      if (!payload.password) delete payload.password;
      return api.patch(`/users/${user.id}`, payload).then(r => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users-list'] });
      qc.invalidateQueries({ queryKey: ['user-detail', user.id] });
      toast.success('User updated successfully');
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update user';
      toast.error(msg);
    },
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="p-5 border-b border-[var(--border-color)]">
          <h2 className="text-base font-semibold text-[var(--text-main)]">Edit User: {user.name}</h2>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input {...register('name')} className="input" />
            {errors.name && <p className="error-text">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Email Address *</label>
            <input {...register('email')} type="email" className="input" />
            {errors.email && <p className="error-text">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">New Password (Leave blank to keep current)</label>
            <input {...register('password')} type="password" className="input" placeholder="Optional" />
            {errors.password && <p className="error-text">{errors.password.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Role *</label>
              <select {...register('role')} className="input">
                <option value="ADMIN">ADMIN</option>
                <option value="SALES">SALES</option>
                <option value="WAREHOUSE">WAREHOUSE</option>
                <option value="ACCOUNTS">ACCOUNTS</option>
              </select>
            </div>
            <div>
              <label className="label">Status *</label>
              <select {...register('status')} className="input">
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<User | null>(null);
  const [removeTarget, setRemoveTarget] = useState<User | null>(null);

  const { data, isLoading, isError } = useQuery<{ success: boolean; data: PaginatedResponse<User> }>({
    queryKey: ['users-list', search, roleFilter, statusFilter, page],
    queryFn: () => api.get('/users', {
      params: {
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: 20,
      },
    }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: UserStatus }) =>
      api.patch(`/users/${userId}/status`, { status }).then(r => r.data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['users-list'] });
      toast.success(variables.status === 'SUSPENDED' ? 'User suspended successfully' : 'User reactivated successfully');
      setSuspendTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/users/${userId}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users-list'] });
      toast.success('User removed successfully');
      setRemoveTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Cannot remove user');
    },
  });

  const users = data?.data.items ?? [];
  const meta = data?.data.meta;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Title & Action */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-main)] tracking-tight">Users</h1>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">Manage team members, roles and access to Nexora.</p>
        </div>
        <button className="btn-primary text-xs font-semibold" onClick={() => setShowAddModal(true)}>
          <UserPlus size={14} /> Add User
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="card p-3.5 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
          <input
            className="input pl-9 text-xs"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <select className="input w-auto text-xs" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SALES">SALES</option>
            <option value="WAREHOUSE">WAREHOUSE</option>
            <option value="ACCOUNTS">ACCOUNTS</option>
          </select>

          <select className="input w-auto text-xs" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
      </div>

      {/* Main Users Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : isError ? (
          <div className="py-12 text-center text-[var(--danger)] text-xs">Failed to load user directory</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-[var(--border-color)]">
                <tr>
                  <th className="table-header text-left p-3.5">User</th>
                  <th className="table-header text-left p-3.5 hidden md:table-cell">Email</th>
                  <th className="table-header text-center p-3.5">Role</th>
                  <th className="table-header text-center p-3.5">Status</th>
                  <th className="table-header text-left p-3.5 hidden lg:table-cell">Last Activity</th>
                  <th className="table-header text-left p-3.5 hidden sm:table-cell">Created</th>
                  <th className="table-header text-right p-3.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-[var(--text-muted)] text-xs">No users found</td></tr>
                ) : (
                  users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr key={u.id} className="table-row">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--text-main)]">{u.name}</span>
                            {isSelf && (
                              <span className="badge-violet text-[10px] font-bold px-1.5 py-0.5 rounded">You</span>
                            )}
                          </div>
                          <span className="text-[10px] text-[var(--text-subtle)] md:hidden">{u.email}</span>
                        </td>
                        <td className="p-3.5 text-[var(--text-muted)] hidden md:table-cell">{u.email}</td>
                        <td className="p-3.5 text-center">
                          {u.role === 'ADMIN' ? (
                            <span className="badge-violet text-[10px] font-bold">{u.role}</span>
                          ) : (
                            <span className="badge-slate text-[10px] font-semibold">{u.role}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-bold">
                          {u.status === 'ACTIVE' ? (
                            <span className="badge-green">Active</span>
                          ) : (
                            <span className="badge-red">Suspended</span>
                          )}
                        </td>
                        <td className="p-3.5 hidden lg:table-cell text-[var(--text-subtle)] font-mono">
                          {new Date(u.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3.5 hidden sm:table-cell text-[var(--text-subtle)] font-mono">
                          {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/users/${u.id}`} className="btn-tertiary px-2 py-1 text-xs" title="View details">
                              <Eye size={14} /> <span className="hidden sm:inline">View</span>
                            </Link>

                            <button onClick={() => setEditTarget(u)} className="btn-tertiary px-2 py-1 text-xs" title="Edit user">
                              <Edit2 size={14} /> <span className="hidden sm:inline">Edit</span>
                            </button>

                            {u.status === 'ACTIVE' ? (
                              <button
                                onClick={() => setSuspendTarget(u)}
                                disabled={isSelf}
                                className="btn-tertiary text-[var(--danger)] px-2 py-1 text-xs disabled:opacity-30"
                                title={isSelf ? 'Cannot suspend yourself' : 'Suspend user'}
                              >
                                <UserX size={14} /> <span className="hidden sm:inline">Suspend</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => statusMutation.mutate({ userId: u.id, status: 'ACTIVE' })}
                                className="btn-tertiary text-[var(--success)] px-2 py-1 text-xs"
                                title="Reactivate user"
                              >
                                <UserCheck size={14} /> <span className="hidden sm:inline">Reactivate</span>
                              </button>
                            )}

                            <button
                              onClick={() => setRemoveTarget(u)}
                              disabled={isSelf}
                              className="btn-tertiary text-[var(--danger)] px-2 py-1 text-xs disabled:opacity-30"
                              title={isSelf ? 'Cannot remove yourself' : 'Remove user'}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
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

      {/* Modals */}
      {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} />}
      {editTarget && <EditUserModal user={editTarget} onClose={() => setEditTarget(null)} />}

      {/* Suspend Confirmation Modal */}
      {suspendTarget && (
        <div className="modal-overlay" onClick={() => setSuspendTarget(null)}>
          <div className="modal p-6 space-y-4">
            <h2 className="text-base font-bold text-[var(--text-main)]">Suspend this user?</h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              This will prevent <span className="font-semibold text-[var(--text-main)]">{suspendTarget.name}</span> ({suspendTarget.email}) from signing in and accessing Nexora.
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setSuspendTarget(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => statusMutation.mutate({ userId: suspendTarget.id, status: 'SUSPENDED' })}
                className="btn-danger flex-1"
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? 'Suspending...' : 'Suspend User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {removeTarget && (
        <div className="modal-overlay" onClick={() => setRemoveTarget(null)}>
          <div className="modal p-6 space-y-4">
            <h2 className="text-base font-bold text-[var(--text-main)]">Remove this user?</h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-[var(--text-main)]">{removeTarget.name}</span>? If this user has recorded sales challans or stock movements, deletion will be blocked to preserve historical business records.
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setRemoveTarget(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => removeMutation.mutate(removeTarget.id)}
                className="btn-danger flex-1"
                disabled={removeMutation.isPending}
              >
                {removeMutation.isPending ? 'Removing...' : 'Remove User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
