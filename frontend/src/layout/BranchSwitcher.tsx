import { invalidateApiCache } from '@/lib/apiCache';
import { setStoredTenant } from '@/lib/tenantStorage';
import { useTenant } from '@/context/TenantContext';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Props = {
  className?: string;
  variant?: 'topbar';
};

export function BranchSwitcher({ className = '', variant = 'topbar' }: Props) {
  const tenant = useTenant();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const branch = tenant.branches.find((b) => b.id === tenant.branchId);
  const branchName = branch?.name ?? 'Branch';

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  function pickBranch(id: string) {
    if (!tenant.orgSlug) return;
    setStoredTenant(tenant.orgSlug, id);
    invalidateApiCache();
    setOpen(false);
    window.dispatchEvent(new CustomEvent('lon-branch-change', { detail: { branchId: id } }));
  }

  if (tenant.branches.length === 0) return null;

  return (
    <div className={`branch-switcher branch-switcher--${variant} ${className}`} ref={ref}>
      <button
        type="button"
        className="branch-switcher-trigger"
        onClick={(e) => {
          e.stopPropagation();
          if (tenant.branches.length > 1) setOpen((o) => !o);
        }}
        aria-haspopup={tenant.branches.length > 1 ? 'listbox' : undefined}
        aria-expanded={open}
        title={`Branch: ${branchName}`}
      >
        <span className="branch-switcher-trigger-label">{branchName}</span>
        {tenant.branches.length > 1 ? <ChevronDown size={14} className="text-muted shrink-0" /> : null}
      </button>
      {open && tenant.branches.length > 1 ? (
        <div className="dropdown branch-switcher-menu branch-switcher-menu--topbar">
          <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Switch branch
          </div>
          {tenant.branches.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`dd-item ${b.id === tenant.branchId ? 'on' : ''}`}
              onClick={() => pickBranch(b.id)}
            >
              <div className="flex-1 text-left min-w-0">
                <div className="truncate font-medium text-ink">{b.name}</div>
                {b.area ? <div className="text-[11px] text-muted font-normal truncate">{b.area}</div> : null}
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}