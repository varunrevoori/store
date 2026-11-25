import { Spinner } from '@/components/ui/Spinner';
import { useEffect } from 'react';
import { redirectAfterAuth } from './redirectAfterAuth';
import { useNavigate } from 'react-router-dom';

/** Loads tenant role and sends the user to their default module. */
export function PostAuthRouter() {
  const navigate = useNavigate();

  useEffect(() => {
    void redirectAfterAuth(navigate).catch(() => {
      navigate(`/access-pending?reason=api&api=${encodeURIComponent(import.meta.env.VITE_API_URL ?? 'http://localhost:8080')}`, {
        replace: true,
      });
    });
  }, [navigate]);

  return <Spinner label="Preparing your dashboard…" />;
}