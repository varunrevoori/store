import { ThemeToggle } from '@/components/ThemeToggle';
import { LonSaBackground } from '@/layout/LonSaBackground';
import { apiFetch } from '@/lib/api';
import { Link } from 'react-router-dom';
import { useState } from 'react';

type Props = {
  httpStatus?: number | null;
  authUserId?: string;
};

/** Shown when signed in but not in admin_users (and bootstrap did not apply). */
export function SuperadminGate({ httpStatus, authUserId }: Props) {
  const [retrying, setRetrying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const authMismatch = authUserId
    ? `Your login UID is ${authUserId}. In Table Editor, admin_users.user_id must be exactly this value — not 323bc2c1 unless that is this UID.`
    : null;

  async function onRetry() {
    setRetrying(true);
    setMessage(null);
    const res = await apiFetch('/auth/superadmin');
    setRetrying(false);
    if (res.ok) {
      window.location.href = '/platform';
      return;
    }
    const body = (await res.json().catch(() => null)) as {
      error?: { message?: string; code?: string; authUserId?: string; email?: string };
    } | null;
    const err = body?.error;
    const parts = [err?.message];
    if (err?.authUserId) {
      parts.push(
        `Your login User UID is ${err.authUserId}. In Supabase, admin_users.user_id must be exactly this value (not an old id you pasted).`,
      );
    }
    setMessage(parts.filter(Boolean).join(' ') || 'Still not a superadmin.');
  }

  return (
    <div className="public-gradient-shell min-h-screen relative">
      <LonSaBackground />
      <div className="public-page-header">
        <span className="font-display font-bold text-lg text-ink">LonSa</span>
        <ThemeToggle />
      </div>
      <div className="relative z-10 grid place-items-center px-6 py-12">
        <div className="glass-auth-card max-w-lg w-full">
          <h1 className="font-display text-xl font-bold text-ink">Superadmin console</h1>
          {httpStatus === 401 ? (
            <p className="mt-3 text-sm form-alert form-alert-error">
              API returned <strong>401</strong> — the server did not accept your Supabase session. Sign out, sign
              in again, and confirm your Supabase URLs in <code className="text-xs">.env</code> match one project.
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted leading-relaxed">
              You are signed in, but this account is not in <code className="text-xs">admin_users</code> yet, or the{' '}
              <code className="text-xs">user_id</code> does not match your Auth UID.
            </p>
          )}
          {authMismatch ? <p className="mt-3 text-sm form-alert form-alert-error">{authMismatch}</p> : null}
          {message ? (
            <p className="mt-3 text-sm form-alert form-alert-error" role="status">
              {message}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              disabled={retrying}
              onClick={() => void onRetry()}
              className="btn-primary !h-11 disabled:opacity-60"
            >
              {retrying ? 'Checking…' : 'Retry superadmin check'}
            </button>
            <Link to="/access-pending" className="btn-ghost !h-11 text-center no-underline">
              Back
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}