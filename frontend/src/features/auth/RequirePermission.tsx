import { hasPermission, homeRouteForRole } from '@lon-crm/shared';
import { Navigate } from 'react-router-dom';
import { useTenant } from '@/context/TenantContext';
import { ROUTE_PERMISSIONS } from '@/lib/routeAccess';
import { useLocation } from 'react-router-dom';

export function RequirePermission({ children }: { children: React.ReactNode }) {
  const { role, ready } = useTenant();
  const location = useLocation();
  const needed = ROUTE_PERMISSIONS[location.pathname];

  if (!ready) {
    return (
      <div className="text-sm text-muted py-8">Loading access…</div>
    );
  }

  if (needed && role && !hasPermission(role, needed)) {
    return <Navigate to={homeRouteForRole(role)} replace />;
  }

  return children;
}