import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { readBootstrapCache, writeBootstrapCache } from '@/lib/apiCache';
import { setStoredTenant } from '@/lib/tenantStorage';

type Branch = { id: string; name: string; area?: string; factor?: number };

type TenantState = {
  ready: boolean;
  error: string | null;
  orgSlug: string | null;
  orgName: string | null;
  role: string | null;
  branchId: string | null;
  branches: Branch[];
};

const TenantContext = createContext<TenantState>({
  ready: false,
  error: null,
  orgSlug: null,
  orgName: null,
  role: null,
  branchId: null,
  branches: [],
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TenantState>({
    ready: false,
    error: null,
    orgSlug: null,
    orgName: null,
    role: null,
    branchId: null,
    branches: [],
  });

  useEffect(() => {
    let cancelled = false;

    function applyBootstrap(data: {
      orgSlug: string;
      orgName?: string;
      role?: string;
      branchId?: string | null;
      branches?: Branch[];
    }) {
      const branchId = data.branchId ?? null;
      if (data.orgSlug) setStoredTenant(data.orgSlug, branchId);
      setState({
        ready: true,
        error: null,
        orgSlug: data.orgSlug,
        orgName: data.orgName ?? null,
        role: data.role ?? null,
        branchId,
        branches: data.branches ?? [],
      });
    }

    const cached = readBootstrapCache() as {
      orgSlug?: string;
      orgName?: string;
      role?: string;
      branchId?: string | null;
      branches?: Branch[];
    } | null;

    if (cached?.orgSlug) {
      applyBootstrap(cached as { orgSlug: string });
    }

    apiFetch('/tenant/bootstrap')
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body?.error?.message ?? `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        writeBootstrapCache(data as Record<string, unknown>);
        applyBootstrap(data);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setState((s) => ({ ...s, ready: true, error: e.message }));
      });

    function onBranchChange(e: Event) {
      const id = (e as CustomEvent<{ branchId: string }>).detail?.branchId;
      if (id) setState((s) => ({ ...s, branchId: id }));
    }
    window.addEventListener('lon-branch-change', onBranchChange);

    return () => {
      cancelled = true;
      window.removeEventListener('lon-branch-change', onBranchChange);
    };
  }, []);

  const value = useMemo(() => state, [state]);
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  return useContext(TenantContext);
}

export function branchQuery(branchId: string | null) {
  return branchId ? `branchId=${encodeURIComponent(branchId)}` : '';
}