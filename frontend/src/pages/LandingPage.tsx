import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Users, Package, ArrowLeftRight,
  FileText, ShieldCheck, CheckCircle2,
  TrendingUp, Database, Lock, RefreshCw, Zap
} from 'lucide-react';
import NexoraLogo from '../components/NexoraLogo';
import ThemeToggle from '../components/ThemeToggle';

function AnimatedCounter({ end, prefix = '', suffix = '' }: { end: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const stepTime = 30;
    const steps = duration / stepTime;
    const increment = end / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [end]);

  return <span>{prefix}{count.toLocaleString('en-IN')}{suffix}</span>;
}

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'customers' | 'inventory' | 'stock' | 'challans'>('inventory');

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--glass-bg)] border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <NexoraLogo size="md" showWordmark={true} />
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/login" className="btn-secondary text-xs font-medium hidden sm:inline-flex">
              Sign In
            </Link>
            <Link to="/login" className="btn-primary text-xs font-semibold">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-28 md:pb-28 overflow-hidden">
        {/* Subtle ambient lighting behind hero */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[var(--accent-primary)] opacity-10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-[var(--text-main)]">
            Run your business <br className="hidden sm:inline" />
            <span className="text-[var(--accent-primary)]">
              with clarity.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto font-normal leading-relaxed">
            Manage customers, inventory, stock movements and sales from one intelligent operations platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 mb-16">
            <Link to="/login" className="btn-primary py-2.5 px-6 text-sm font-semibold w-full sm:w-auto">
              Get Started <ArrowRight size={16} />
            </Link>
            <Link to="/dashboard" className="btn-secondary py-2.5 px-6 text-sm font-medium w-full sm:w-auto">
              Explore Platform
            </Link>
          </div>

          {/* Hero Showcase Frame */}
          <div className="relative mx-auto max-w-4xl rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xl overflow-hidden text-left">
            {/* Window bar */}
            <div className="h-9 bg-[var(--bg-card-elevated)] border-b border-[var(--border-color)] px-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
              </div>
              <div className="text-[11px] text-[var(--text-subtle)] font-mono">
                app.nexora.io/dashboard
              </div>
              <div className="w-8" />
            </div>

            {/* Showcase Dashboard Stats */}
            <div className="p-6 md:p-8 space-y-6 bg-[var(--bg-main)]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat-card">
                  <div className="flex justify-between items-center text-[var(--text-subtle)]">
                    <span className="text-xs font-medium">Total Customers</span>
                    <Users size={16} className="text-[var(--accent-primary)]" />
                  </div>
                  <p className="text-2xl font-bold text-[var(--text-main)]">
                    <AnimatedCounter end={1420} />
                  </p>
                  <span className="text-[10px] text-[var(--success)] font-medium">Active CRM</span>
                </div>
                <div className="stat-card">
                  <div className="flex justify-between items-center text-[var(--text-subtle)]">
                    <span className="text-xs font-medium">Catalog Products</span>
                    <Package size={16} className="text-[var(--text-muted)]" />
                  </div>
                  <p className="text-2xl font-bold text-[var(--text-main)]">
                    <AnimatedCounter end={384} />
                  </p>
                  <span className="text-[10px] text-[var(--text-subtle)] font-medium">Items</span>
                </div>
                <div className="stat-card">
                  <div className="flex justify-between items-center text-[var(--text-subtle)]">
                    <span className="text-xs font-medium">Draft Challans</span>
                    <FileText size={16} className="text-[var(--warning)]" />
                  </div>
                  <p className="text-2xl font-bold text-[var(--text-main)]">
                    <AnimatedCounter end={8} />
                  </p>
                  <span className="text-[10px] text-[var(--warning)] font-medium">Pending Review</span>
                </div>
                <div className="stat-card">
                  <div className="flex justify-between items-center text-[var(--text-subtle)]">
                    <span className="text-xs font-medium">Total Revenue</span>
                    <TrendingUp size={16} className="text-[var(--accent-primary)]" />
                  </div>
                  <p className="text-2xl font-bold text-[var(--text-main)]">
                    <AnimatedCounter end={482500} prefix="₹" />
                  </p>
                  <span className="text-[10px] text-[var(--success)] font-medium">Gross Sales</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Capability Strip */}
      <section className="py-12 bg-[var(--bg-sidebar)] border-y border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <Database size={18} className="mx-auto text-[var(--accent-primary)]" />
              <p className="text-xs font-semibold text-[var(--text-main)]">PostgreSQL Engine</p>
              <p className="text-[11px] text-[var(--text-subtle)]">ACID Compliant</p>
            </div>
            <div className="space-y-1">
              <Lock size={18} className="mx-auto text-[var(--accent-primary)]" />
              <p className="text-xs font-semibold text-[var(--text-main)]">JWT & RBAC Security</p>
              <p className="text-[11px] text-[var(--text-subtle)]">Strict Middleware</p>
            </div>
            <div className="space-y-1">
              <RefreshCw size={18} className="mx-auto text-[var(--accent-primary)]" />
              <p className="text-xs font-semibold text-[var(--text-main)]">Atomic Stock Sync</p>
              <p className="text-[11px] text-[var(--text-subtle)]">Prevent Overselling</p>
            </div>
            <div className="space-y-1">
              <Zap size={18} className="mx-auto text-[var(--accent-primary)]" />
              <p className="text-xs font-semibold text-[var(--text-main)]">Snapshot Pricing</p>
              <p className="text-[11px] text-[var(--text-subtle)]">Historical Integrity</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Product Showcase */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-main)]">Engineered for operations teams</h2>
          <p className="text-[var(--text-muted)] text-xs">Select a capability module below to inspect workflow details.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'} text-xs`}
          >
            <Package size={14} /> Inventory Control
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`btn ${activeTab === 'customers' ? 'btn-primary' : 'btn-secondary'} text-xs`}
          >
            <Users size={14} /> Customer CRM
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`btn ${activeTab === 'stock' ? 'btn-primary' : 'btn-secondary'} text-xs`}
          >
            <ArrowLeftRight size={14} /> Stock Audit Trail
          </button>
          <button
            onClick={() => setActiveTab('challans')}
            className={`btn ${activeTab === 'challans' ? 'btn-primary' : 'btn-secondary'} text-xs`}
          >
            <FileText size={14} /> Sales Challans
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="card p-6 md:p-8 bg-[var(--bg-card)] border border-[var(--border-color)]">
          {activeTab === 'inventory' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in">
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[var(--text-main)]">Real-Time Inventory & Low-Stock Alerts</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Track stock levels, minimum thresholds, SKU codes, and precise warehouse rack locations.
                </p>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-main)] font-medium">
                    <CheckCircle2 size={15} className="text-[var(--success)]" /> Automated Threshold Banners
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-main)] font-medium">
                    <CheckCircle2 size={15} className="text-[var(--success)]" /> Decimal Precision Prices
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-2">
                <div className="flex justify-between items-center p-2.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-main)]">UltraWide Monitor 34"</p>
                    <p className="text-[10px] font-mono text-[var(--text-subtle)]">SKU: MON-34-UW</p>
                  </div>
                  <span className="text-xs font-bold text-[var(--success)]">142 IN STOCK</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-main)]">Ergonomic Keyboard</p>
                    <p className="text-[10px] font-mono text-[var(--text-subtle)]">SKU: KB-ERG-01</p>
                  </div>
                  <span className="text-xs font-bold text-[var(--danger)]">4 IN STOCK (LOW)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in">
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[var(--text-main)]">Structured Customer CRM & Follow-up Timeline</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Track wholesale, retail, and distributor accounts with scheduled follow-up dates and interaction notes.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-2">
                <div className="p-3 rounded bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-semibold text-[var(--text-main)]">Sales Rep Note</p>
                    <span className="text-[10px] text-[var(--accent-primary)] font-mono">10:30 AM</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">"Discussed quarterly order terms for 500 units."</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in">
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[var(--text-main)]">Immutable Stock Movement Audit Log</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Record all stock additions (IN) and dispatches (OUT) with reference reason and author user ID.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-2 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <div>
                    <p className="font-semibold text-[var(--text-main)]">+50 Units (Supplier Delivery)</p>
                    <p className="text-[10px] text-[var(--text-subtle)]">Recorded by Warehouse Lead</p>
                  </div>
                  <span className="badge-green text-[11px]">↑ IN</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <div>
                    <p className="font-semibold text-[var(--text-main)]">-20 Units (Sales Challan CH-2026-0042)</p>
                    <p className="text-[10px] text-[var(--text-subtle)]">Recorded by Sales Team</p>
                  </div>
                  <span className="badge-red text-[11px]">↓ OUT</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'challans' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in">
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[var(--text-main)]">Sales Challans & Printable Documents</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Generate draft challans, lock snapshot pricing, and confirm dispatches with automated stock deduction.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs">
                <div className="p-3 rounded bg-[var(--bg-card)] border border-[var(--border-color)] flex justify-between items-center">
                  <div>
                    <p className="font-mono font-bold text-[var(--accent-primary)]">CH-2026-0089</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Customer: Metro Outlets</p>
                  </div>
                  <span className="badge-green">CONFIRMED</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. Role-Based Security */}
      <section className="py-20 bg-[var(--bg-sidebar)] border-t border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-main)]">Role-Based Access Control</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Four specialized user roles guarantee operational compliance across departments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card p-5 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-primary)] flex items-center justify-center font-bold">
                <ShieldCheck size={18} />
              </div>
              <h3 className="font-bold text-sm text-[var(--text-main)]">ADMIN</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Full platform access. Manage customers, products, stock movements, and confirm challans.
              </p>
            </div>

            <div className="card p-5 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface-hover)] text-[var(--text-muted)] flex items-center justify-center font-bold">
                <Users size={18} />
              </div>
              <h3 className="font-bold text-sm text-[var(--text-main)]">SALES</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Customer account management, follow-up logs, products view, and sales challan creation.
              </p>
            </div>

            <div className="card p-5 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--warning-bg)] text-[var(--warning)] flex items-center justify-center font-bold">
                <Package size={18} />
              </div>
              <h3 className="font-bold text-sm text-[var(--text-main)]">WAREHOUSE</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Add and edit catalog items, record stock movements (IN/OUT), and view inventory metrics.
              </p>
            </div>

            <div className="card p-5 space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--success-bg)] text-[var(--success)] flex items-center justify-center font-bold">
                <FileText size={18} />
              </div>
              <h3 className="font-bold text-sm text-[var(--text-main)]">ACCOUNTS</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Read-only access for financial auditing, sales totals verification, and document inspection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Final Call to Action */}
      <section className="py-24 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 space-y-5 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] tracking-tight">
            Your operations deserve better.
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
            Streamline inventory tracking and sales challans with Nexora.
          </p>
          <div className="pt-2">
            <Link to="/login" className="btn-primary py-3 px-7 text-xs font-bold">
              Launch Nexora
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-[var(--bg-sidebar)] border-t border-[var(--border-color)] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <NexoraLogo size="sm" showWordmark={true} />

          <div className="flex flex-wrap items-center gap-6 text-xs text-[var(--text-muted)]">
            <Link to="/dashboard" className="hover:text-[var(--text-main)] transition-colors">Dashboard</Link>
            <Link to="/customers" className="hover:text-[var(--text-main)] transition-colors">Customers</Link>
            <Link to="/products" className="hover:text-[var(--text-main)] transition-colors">Products</Link>
            <Link to="/stock-movements" className="hover:text-[var(--text-main)] transition-colors">Stock Movements</Link>
            <Link to="/challans" className="hover:text-[var(--text-main)] transition-colors">Challans</Link>
            <Link to="/login" className="hover:text-[var(--text-main)] font-semibold text-[var(--accent-primary)]">Login</Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 text-center text-[10px] text-[var(--text-subtle)] font-medium">
          © {new Date().getFullYear()} Nexora. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
