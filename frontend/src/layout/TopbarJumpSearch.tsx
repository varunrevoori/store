import { SearchField } from '@/components/ui/SearchField';
import {
  CalendarDays,
  LayoutDashboard,
  Megaphone,
  Package,
  Plus,
  ReceiptIndianRupee,
  Sparkles,
  UserCog,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const JUMPS: { label: string; to: string; tags: string[]; icon: LucideIcon }[] = [
  { label: 'Dashboard', to: '/dashboard', tags: ['dashboard', 'home', 'revenue'], icon: LayoutDashboard },
  { label: 'Calendar', to: '/calendar', tags: ['calendar', 'appointment', 'book'], icon: CalendarDays },
  { label: 'New appointment', to: '/calendar?book=1', tags: ['book', 'walk-in'], icon: Plus },
  { label: 'POS & Billing', to: '/pos', tags: ['pos', 'billing', 'charge'], icon: ReceiptIndianRupee },
  { label: 'Customers', to: '/customers', tags: ['customer', 'crm', 'phone'], icon: UsersRound },
  { label: 'Staff & Payroll', to: '/staff', tags: ['staff', 'stylist', 'payroll'], icon: UserCog },
  { label: 'Inventory', to: '/inventory', tags: ['inventory', 'stock', 'product', 'store'], icon: Package },
  { label: 'Marketing', to: '/marketing', tags: ['marketing', 'campaign'], icon: Megaphone },
  { label: 'AI Studio', to: '/ai', tags: ['ai', 'advisor'], icon: Sparkles },
];

export function TopbarJumpSearch({ className = '' }: { className?: string }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return JUMPS.slice(0, 7);
    return JUMPS.filter(
      (j) =>
        j.label.toLowerCase().includes(needle) || j.tags.some((t) => t.includes(needle) || needle.includes(t)),
    );
  }, [q]);

  const go = useCallback(
    (to: string) => {
      navigate(to);
      setQ('');
      setOpen(false);
      setActive(0);
    },
    [navigate],
  );

  useEffect(() => {
    setActive(0);
  }, [q, matches.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div ref={wrapRef} className={`jump-search ${className}`.trim()}>
      <SearchField
        inputRef={inputRef}
        value={q}
        onChange={setQ}
        placeholder="Search pages & jump to…"
        className="search-field-topbar"
        size="sm"
        showShortcutHint
        aria-label="Search pages and jump to"
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(i + 1, matches.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === 'Enter' && matches[active]) {
            e.preventDefault();
            go(matches[active].to);
          } else if (e.key === 'Escape') {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
      />
      {open && matches.length > 0 ? (
        <div className="jump-search-panel" role="listbox">
          <div className="jump-search-panel-head">
            {q.trim() ? 'Results' : 'Quick navigation'}
          </div>
          <ul className="jump-search-list">
            {matches.map((j, i) => {
              const Icon = j.icon;
              return (
                <li key={j.to}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    className={`jump-search-item ${i === active ? 'is-active' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(j.to)}
                  >
                    <span className="jump-search-item-icon">
                      <Icon size={16} strokeWidth={1.9} />
                    </span>
                    <span className="jump-search-item-label">{j.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="jump-search-panel-foot">
            <span className="text-muted">Record lookup:</span>{' '}
            <Link to="/customers" className="jump-search-link" onClick={() => setOpen(false)}>
              Customers
            </Link>
            <span className="text-muted"> · </span>
            <Link to="/pos" className="jump-search-link" onClick={() => setOpen(false)}>
              POS
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}