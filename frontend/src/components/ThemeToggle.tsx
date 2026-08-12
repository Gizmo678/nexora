import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, ChevronDown } from 'lucide-react';
import { useTheme, type ThemeMode } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Light', icon: <Sun size={14} className="text-amber-500" /> },
    { mode: 'dark', label: 'Dark', icon: <Moon size={14} className="text-indigo-400" /> },
    { mode: 'system', label: 'System', icon: <Laptop size={14} className="text-slate-400" /> },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-color-hover)] transition-all text-xs font-semibold cursor-pointer"
        title="Change theme preference"
      >
        {resolvedTheme === 'dark' ? (
          <Moon size={14} className="text-indigo-400" />
        ) : (
          <Sun size={14} className="text-amber-500" />
        )}
        <span className="capitalize hidden sm:inline">{theme}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 py-1.5 animate-slide-up">
          {options.map((opt) => (
            <button
              key={opt.mode}
              onClick={() => {
                setTheme(opt.mode);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-left transition-colors cursor-pointer ${
                theme === opt.mode
                  ? 'bg-indigo-500/15 text-indigo-500 font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
