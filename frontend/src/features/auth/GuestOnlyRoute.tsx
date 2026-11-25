import { Spinner } from '@/components/ui/Spinner';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';

/** Blocks authenticated users from login/signup (home handles its own redirect). */
export function GuestOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}