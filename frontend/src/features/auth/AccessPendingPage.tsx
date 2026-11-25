import { Spinner } from '@/components/ui/Spinner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from './AuthProvider';
import { isSuperadminSession } from './redirectAfterAuth';
import { apiFetch } from '@/lib/api';
import { LonSaBackground } from '@/layout/LonSaBackground';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function AccessPendingPage() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const email = session?.user.email;
  const [checking, setChecking] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const boot = await apiFetch('/tenant/bootstrap');
      if (!cancelled && boot.ok) {
        navigate('/app', { replace: true });
        return;
      }
      const isAdmin = await isSuperadminSession();
      if (!cancelled) {
        setIsSuperadmin(isAdmin);
        if (isAdmin) {
          navigate('/platform', { replace: true });
          return;
        }
        setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (checking) {
    return <Spinner label="Checking access…" />;
  }

  return (
    <div className="public-gradient-shell min-h-screen relative">
      <LonSaBackground />
      <div className="public-page-header">
        <Link to="/" className="flex items-center gap-3 text-ink no-underline">
          <span className="logo-mark">L</span>
          <span className="font-display font-bold text-lg">LonSa</span>
        </Link>
        <ThemeToggle />
      </div>
      <div className="relative z-10 grid place-items-center px-6 py-12 min-h-[calc(100vh-80px)]">
        <div className="glass-auth-card max-w-md text-center">
          <h1 className="font-display text-xl font-bold text-ink">No workspace access yet</h1>
          <p className="mt-3 text-sm text-muted leading-relaxed">
            Signed in as <strong className="text-ink">{email ?? 'your account'}</strong>.
          </p>
          <ul className="mt-4 text-sm text-muted text-left space-y-2 list-disc pl-5">
            <li>
              <strong className="text-ink">Business owners:</strong> wait for superadmin to approve your request,
              then sign in again.
            </li>
            <li>
              <strong className="text-ink">Managers & staff:</strong> ask your salon owner to add you under Staff,
              then sign in with the password they set.
            </li>
          </ul>
          <div className="mt-6 flex flex-col gap-2">
            {isSuperadmin ? (
              <Link to="/platform" className="btn-primary no-underline !h-11">
                Superadmin console
              </Link>
            ) : null}
            <Link to="/request-access" className="btn-primary no-underline !h-11">
              Request access (owners only)
            </Link>
            <button type="button" onClick={() => signOut()} className="btn-ghost !h-11">
              Sign out
            </button>
            <Link to="/" className="text-sm text-sky2 font-medium py-2">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}