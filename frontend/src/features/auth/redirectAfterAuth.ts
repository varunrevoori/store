import { homeRouteForRole } from '@lon-crm/shared';
import type { NavigateFunction } from 'react-router-dom';
import { apiFetchWithTimeout, getApiBaseUrl } from '@/lib/api';
import { writeBootstrapCache } from '@/lib/apiCache';
import { setStoredTenant } from '@/lib/tenantStorage';

export async function isSuperadminSession(): Promise<boolean> {
  const res = await apiFetchWithTimeout('/auth/superadmin', {}, 12_000);
  return res.ok;
}

function goApiUnreachable(navigate: NavigateFunction) {
  const params = new URLSearchParams({ reason: 'api' });
  const base = getApiBaseUrl();
  if (base) params.set('api', base);
  navigate(`/access-pending?${params.toString()}`, { replace: true });
}

export async function redirectAfterAuth(navigate: NavigateFunction) {
  try {
    const res = await apiFetchWithTimeout('/tenant/bootstrap', {}, 12_000);
    if (res.status >= 500) {
      navigate(`/access-pending?reason=api&api=${encodeURIComponent(getApiBaseUrl())}`, { replace: true });
      return;
    }
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
        void apiFetchWithTimeout(`dashboard/detail?branchId=${encodeURIComponent(data.branchId)}`, {}, 12_000);
      }
      navigate(homeRouteForRole(data.role), { replace: true });
      return;
    }

    try {
      if (await isSuperadminSession()) {
        navigate('/platform', { replace: true });
        return;
      }
    } catch {
      /* network — fall through */
    }

    navigate('/access-pending', { replace: true });
  } catch {
    goApiUnreachable(navigate);
  }
}