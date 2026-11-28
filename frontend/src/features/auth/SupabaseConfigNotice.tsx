import { KeyRound } from 'lucide-react';

export function SupabaseConfigNotice() {
  const isProd = import.meta.env.PROD;

  return (
    <div className="auth-config-notice" role="status">
      <div className="auth-config-notice-icon" aria-hidden>
        <KeyRound size={22} strokeWidth={1.75} />
      </div>
      <p className="auth-config-notice-lead">
        {isProd
          ? 'Add your Supabase keys in the hosting dashboard, then redeploy.'
          : 'Copy `.env.example` to `.env` at the repo root and restart the dev server.'}
      </p>
      <ol className="auth-config-notice-steps">
        {isProd ? (
          <>
            <li>
              Hosting → <strong>Environment variables</strong> (e.g. Vercel project settings)
            </li>
            <li>
              Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> from your
              Supabase project → Settings → API
            </li>
            <li>Redeploy so the build picks up the new values</li>
          </>
        ) : (
          <>
            <li>
              Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to{' '}
              <code>.env</code>
            </li>
            <li>
              Keep <code>VITE_API_URL=http://localhost:8080</code> in <code>.env</code> (see{' '}
              <code>.env.example</code>)
            </li>
            <li>Run <code>npm run dev</code> again</li>
          </>
        )}
      </ol>
    </div>
  );
}