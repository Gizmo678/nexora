import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, ArrowLeftRight,
  FileText, UserCog, LogOut, Menu, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NexoraLogo from '../components/NexoraLogo';
import ThemeToggle from '../components/ThemeToggle';
import type { Role } from '../types';

const ROLE_BADGE: Record<Role, string> = {
  ADMIN: 'badge-violet',
  SALES: 'badge-slate',
  WAREHOUSE: 'badge-yellow',
  ACCOUNTS: 'badge-green',
};

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  roles: Role[];
  isAdminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={18} />, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
  { label: 'Customers', to: '/customers', icon: <Users size={18} />, roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
  { label: 'Products', to: '/products', icon: <Package size={18} />, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
  { label: 'Stock Movements', to: '/stock-movements', icon: <ArrowLeftRight size={18} />, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
  { label: 'Challans', to: '/challans', icon: <FileText size={18} />, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Users', to: '/users', icon: <UserCog size={18} />, roles: ['ADMIN'], isAdminOnly: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleNav = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));
  const visibleAdminNav = ADMIN_NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-[var(--bg-sidebar)] border-r border-[var(--border-color)]">
      {/* Brand Header */}
      <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
        <NexoraLogo size="sm" showWordmark={true} />
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-hover)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-main)] text-xs font-bold">
            {user?.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--text-main)] truncate">{user?.name}</p>
            <p className="text-[11px] text-[var(--text-subtle)] truncate">{user?.email}</p>
          </div>
        </div>
        <div className="mt-2.5">
          <span className={`${ROLE_BADGE[user?.role as Role] || 'badge-slate'} text-[10px] font-semibold uppercase tracking-wider`}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => (isActive ? 'nav-link-active' : 'nav-link')}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* ADMIN section separated by a subtle divider */}
        {visibleAdminNav.length > 0 && (
          <div className="pt-3 mt-3 border-t border-[var(--border-color)] space-y-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)] mb-1">
              Administration
            </p>
            {visibleAdminNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => (isActive ? 'nav-link-active' : 'nav-link')}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Theme & Sign Out */}
      <div className="p-4 border-t border-[var(--border-color)] space-y-2">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-[var(--text-subtle)] font-medium">Theme</span>
          <ThemeToggle />
        </div>
        <button onClick={handleLogout} className="nav-link w-full text-[var(--danger)] hover:bg-red-500/10">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-main)]">
      {/* Desktop Sidebar */}
      <div
        className="hidden lg:flex flex-col border-r border-[var(--border-color)]"
        style={{ width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width)' }}
      >
        <Sidebar />
      </div>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-72 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] z-10">
            <button className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-main)]" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-[var(--bg-sidebar)] border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-4 lg:px-6">
          <button className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text-main)]" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          
          <div className="lg:hidden flex items-center gap-2">
            <NexoraLogo size="sm" showWordmark={true} />
          </div>

          <div className="flex-1" />

          <div className="hidden lg:block">
            <ThemeToggle />
          </div>

          <span className="text-xs text-[var(--text-subtle)] font-medium hidden sm:block">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
