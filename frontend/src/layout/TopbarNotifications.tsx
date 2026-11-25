import { useFetch } from '@/hooks/useFetch';
import { fmtTime } from '@/lib/format';
import { useTenant } from '@/context/TenantContext';
import { Bell, Calendar, Package, UserRoundPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

type NotifItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  meta?: string;
  to: string;
  severity: 'urgent' | 'warn' | 'info';
  startSlot?: number;
};

type NotifData = {
  items: NotifItem[];
  count: number;
  branchName: string;
};

const LAST_SEEN_KEY = 'lonsa_notif_seen_count';

function iconFor(type: string) {
  if (type === 'low_stock') return Package;
  if (type === 'appointment') return Calendar;
  if (type === 'customers') return UserRoundPlus;
  return Bell;
}

export function TopbarNotifications() {
  const { ready, branchId } = useTenant();
  const [open, setOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const path = branchId ? `notifications?branchId=${encodeURIComponent(branchId)}` : '';
  const { data, loading } = useFetch<NotifData>(ready ? path : '', [ready, branchId, reloadKey]);

  const count = data?.count ?? 0;
  const lastSeen = Number(localStorage.getItem(LAST_SEEN_KEY) || '0');
  const showDot = count > 0 && count > lastSeen;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  useEffect(() => {
    function onBranch() {
      setReloadKey((k) => k + 1);
    }
    window.addEventListener('lon-branch-change', onBranch);
    return () => window.removeEventListener('lon-branch-change', onBranch);
  }, []);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    setOpen((o) => {
      if (!o) setReloadKey((k) => k + 1);
      return !o;
    });
  }

  function markSeen() {
    if (data) localStorage.setItem(LAST_SEEN_KEY, String(data.count));
  }

  function go(to: string) {
    markSeen();
    setOpen(false);
    navigate(to);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        className="top-btn !px-3 relative hidden sm:flex"
        aria-label={showDot ? `${count} notifications` : 'Notifications'}
        aria-expanded={open}
        onClick={toggle}
      >
        <Bell size={16} />
        {showDot ? (
          <span
            className="absolute top-2 right-2 min-w-[8px] h-2 px-0.5 rounded-full bg-hot text-[0px]"
            style={{ boxShadow: '0 0 8px #D13095' }}
            aria-hidden
          />
        ) : null}
      </button>

      {open ? (
        <div className="dropdown right-0 !mt-2 w-[min(100vw-2rem,340px)] max-h-[min(420px,70vh)] overflow-y-auto">
          <div className="px-3 pt-2 pb-1 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Alerts</span>
            {data?.branchName ? (
              <span className="text-[11px] text-muted truncate">{data.branchName}</span>
            ) : null}
          </div>

          {loading ? (
            <p className="px-3 py-4 text-[13px] text-muted">Loading…</p>
          ) : !data?.items.length ? (
            <p className="px-3 py-6 text-[13px] text-muted text-center">You&apos;re all caught up for today.</p>
          ) : (
            <ul className="pb-2">
              {data.items.map((n) => {
                const Icon = iconFor(n.type);
                return (
                  <li key={n.id}>
                    <button type="button" className="dd-item w-full !items-start !py-2.5" onClick={() => go(n.to)}>
                      <div
                        className={`notif-ic notif-${n.severity}`}
                        style={
                          n.severity === 'info'
                            ? ({ '--c': '#3598CB' } as React.CSSProperties)
                            : undefined
                        }
                      >
                        <Icon size={15} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-[12.5px] font-semibold text-ink">{n.title}</div>
                        <div className="text-[12px] text-secondary mt-0.5 leading-snug">{n.body}</div>
                        {n.startSlot != null || n.meta ? (
                          <div className="text-[11px] text-muted mt-1">
                            {n.startSlot != null ? fmtTime(n.startSlot) : null}
                            {n.startSlot != null && n.meta ? ' · ' : null}
                            {n.meta}
                          </div>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="px-3 py-2 border-t border-[var(--line)] flex gap-2">
            <button
              type="button"
              className="btn-ghost btn-sm flex-1 !text-[12px]"
              disabled={!count}
              onClick={() => {
                markSeen();
                setOpen(false);
              }}
            >
              Mark as read
            </button>
            <Link
              to="/dashboard"
              className="btn-ghost btn-sm flex-1 !text-[12px] no-underline text-center"
              onClick={() => {
                markSeen();
                setOpen(false);
              }}
            >
              Dashboard
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}