import { Spinner } from '@/components/ui/Spinner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from './AuthProvider';
import { isSuperadminSession, redirectAfterAuth } from './redirectAfterAuth';
import { apiFetchWithTimeout, getApiBaseUrl } from '@/lib/api';
import { LonSaBackground } from '@/layout/LonSaBackground';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export function AccessPendingPage() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = session?.user.email;
  const apiUnreachable = searchParams.get('reason') === 'api';
  const apiFromQuery = searchParams.get('api');
  const apiBase = apiFromQuery || getApiBaseUrl();
  const [checking, setChecking] = useState(!apiUnreachable);
  const [syncing, setSyncing] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  useEffect(() => {
    if (apiUnreachable) return;

    let cancelled = false;
    void (async () => {
      try {
        const boot = await apiFetchWithTimeout('/tenant/bootstrap', {}, 12_000);
        if (!cancelled && boot.ok) {
          await redirectAfterAuth(navigate);
          return;
        }
        const isAdmin = await isSuperadminSession();
        if (!cancelled) {
          setIsSuperadmin(isAdmin);
          if (isAdmin) {
            navigate('/platform', { replace: true });
            return;
          }
        }
      } catch {
        if (!cancelled) {
          const params = new URLSearchParams({ reason: 'api', api: getApiBaseUrl() });
          navigate(`/access-pending?${params.toString()}`, { replace: true });
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, apiUnreachable]);

  if (checking) {
    return <Spinner label="Checking access…" />;
  }

  if (apiUnreachable) {
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
          <div className="glass-auth-card max-w-md text-left">
            <h1 className="font-display text-xl font-bold text-ink text-center">Can&apos;t reach the API</h1>
            <p className="mt-3 text-sm text-muted leading-relaxed">
              You&apos;re signed in with Supabase, but the app could not load your workspace from the backend.
            </p>
            <p className="mt-3 text-sm text-muted">
              Current API URL: <code className="text-xs break-all">{apiBase}</code>
            </p>
            <ol className="mt-4 text-sm text-muted list-decimal pl-5 space-y-2">
              <li>
                <strong className="text-ink">Local:</strong> copy <code className="text-xs">.env.example</code> →{' '}
                <code className="text-xs">.env</code> and keep{' '}
                <code className="text-xs">VITE_API_URL=http://localhost:8080</code>.
              </li>
              <li>
                <strong className="text-ink">Production (one Vercel app):</strong> leave{' '}
                <code className="text-xs">VITE_API_URL</code> unset — the app calls the API on the same domain.
              </li>
              <li>
                Set Supabase vars on the host (
                <code className="text-xs">SUPABASE_URL</code>,{' '}
                <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code>, and the{' '}
                <code className="text-xs">VITE_*</code> pair). Redeploy after env changes.
              </li>
            </ol>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                className="btn-primary !h-11"
                onClick={() => navigate('/app', { replace: true })}
              >
                Try again
              </button>
              <button type="button" onClick={() => void signOut()} className="btn-ghost !h-11">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
            <button
              type="button"
              className="btn-primary !h-11"
              disabled={syncing}
              onClick={() => {
                setSyncing(true);
                void redirectAfterAuth(navigate).finally(() => setSyncing(false));
              }}
            >
              {syncing ? 'Syncing workspace…' : 'Sync my workspace'}
            </button>
            <Link to="/request-access" className="btn-ghost no-underline !h-11 text-center">
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