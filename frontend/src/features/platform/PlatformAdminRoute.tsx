import { apiFetch } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { Spinner } from '@/components/ui/Spinner';
import { SuperadminGate } from './SuperadminGate';

export function PlatformAdminRoute() {
  const { isAuthenticated, loading: authLoading, session } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [checkStatus, setCheckStatus] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !session?.access_token) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    (async () => {
      const res = await apiFetch('/auth/superadmin');
      if (!cancelled) {
        setAllowed(res.ok);
        setCheckStatus(res.status);
        setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, session?.access_token]);

  if (authLoading || checking) {
    return <Spinner label="Verifying platform access…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!allowed) {
    return <SuperadminGate httpStatus={checkStatus} authUserId={session?.user.id} />;
  }

  return <Outlet />;
}