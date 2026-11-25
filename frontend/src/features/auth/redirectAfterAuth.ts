import { homeRouteForRole } from '@lon-crm/shared';
import type { NavigateFunction } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { writeBootstrapCache } from '@/lib/apiCache';
import { setStoredTenant } from '@/lib/tenantStorage';

export async function isSuperadminSession(): Promise<boolean> {
  const res = await apiFetch('/auth/superadmin');
  return res.ok;
}

export async function redirectAfterAuth(navigate: NavigateFunction) {
  const res = await apiFetch('/tenant/bootstrap');
  if (res.ok) {
    const data = (await res.json()) as {
      orgSlug: string;
      branchId: string | null;
      role: string;
      orgName?: string;
      branches?: unknown[];
    };
    setStoredTenant(data.orgSlug, data.branchId);
    writeBootstrapCache(data as Record<string, unknown>);
    if (data.branchId) {
      void apiFetch(`dashboard/detail?branchId=${encodeURIComponent(data.branchId)}`);
    }
    navigate(homeRouteForRole(data.role), { replace: true });
    return;
  }

  if (await isSuperadminSession()) {
    navigate('/platform', { replace: true });
    return;
  }

  navigate('/access-pending', { replace: true });
}