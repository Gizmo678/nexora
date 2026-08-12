import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NexoraLogo from '../components/NexoraLogo';
import ThemeToggle from '../components/ThemeToggle';
import { Loader2, ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@example.com' },
  { label: 'Sales', email: 'sales@example.com' },
  { label: 'Warehouse', email: 'warehouse@example.com' },
  { label: 'Accounts', email: 'accounts@example.com' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
      toast.success('Welcome back to Nexora');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Check your credentials.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setIsLoading(true);
    try {
      await login(demoEmail, 'Password123!');
      navigate('/dashboard');
      toast.success(`Signed in as ${demoEmail.split('@')[0]}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Demo login failed. Ensure backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center p-4 relative transition-colors duration-200">
      {/* Top bar controls */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
        <Link to="/" className="btn-secondary text-xs font-medium">
          <ArrowLeft size={14} /> Back to Landing Page
        </Link>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <NexoraLogo size="lg" showWordmark={true} className="justify-center" />
          <p className="text-[var(--text-muted)] text-xs font-medium">
            Internal Operations & Business Management Portal
          </p>
        </div>

        {/* Solid Card Surface */}
        <div className="card p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="label mb-0">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--text-main)]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full justify-center py-2.5 mt-2 font-semibold text-xs transition-all duration-150"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              {isLoading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          {/* Professional Demo Access Component */}
          <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
            <div className="text-center space-y-0.5">
              <p className="text-xs font-semibold text-[var(--text-main)] flex items-center justify-center gap-1">
                <ShieldCheck size={14} className="text-[var(--accent-primary)]" /> Demo Access
              </p>
              <p className="text-[11px] text-[var(--text-subtle)]">Explore Nexora with a preconfigured role</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleDemoLogin(acc.email)}
                  disabled={isLoading}
                  className="btn btn-secondary text-xs py-2 justify-center font-medium hover:border-[var(--accent-primary)]"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-[var(--text-subtle)] font-medium">
          Protected by Nexora RBAC & JWT Authorization
        </p>
      </div>
    </div>
  );
}
