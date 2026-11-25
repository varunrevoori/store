import { FormAlert, Input, Label } from '@/components/ui/Field';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { clearDevSession } from './devSession';
import { clearStoredTenant } from '@/lib/tenantStorage';
import { Eye, EyeOff } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { SupabaseConfigNotice } from './SupabaseConfigNotice';
import { redirectAfterAuth } from './redirectAfterAuth';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (!isSupabaseConfigured || !supabase) {
    return (
      <AuthLayout
        title="Sign-in isn’t ready yet"
        subtitle="Supabase authentication keys are missing from this deployment."
      >
        <SupabaseConfigNotice />
      </AuthLayout>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    clearDevSession();
    clearStoredTenant();

    try {
      const client = supabase!;
      const { error: signInError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      await redirectAfterAuth(navigate);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Use the email and password for your Supabase account"
      footer={
        <p className="text-center text-sm text-muted">
          Need access?{' '}
          <Link to="/request-access" className="font-semibold text-sky2">
            Request access from superadmin
          </Link>
        </p>
      }
    >
      {error ? <FormAlert>{error}</FormAlert> : null}

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="login-password">Password</Label>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="!pr-11"
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 icon-btn"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary btn-full !h-11">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}