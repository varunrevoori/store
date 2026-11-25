import { FormAlert, Input, Label } from '@/components/ui/Field';
import { AuthLayout } from './AuthLayout';
import { apiFetch } from '@/lib/api';
import { Eye, EyeOff } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

export function RequestAccessPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch('/public/access-request', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          phone,
          companyName,
          password,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error?.message ?? body.message ?? `HTTP ${res.status}`);
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit request');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Request access (business owner)"
      subtitle="For new salons/stores only. Managers and staff are added by your owner inside the CRM."
      footer={
        <p className="text-center text-sm text-muted">
          Already on staff?{' '}
          <Link to="/login" className="font-semibold text-sky2">
            Sign in
          </Link>
        </p>
      }
    >
      {done ? (
        <div className="text-sm space-y-3">
          <FormAlert tone="success">
            Request received. Superadmin will review your business. Your login is ready with the password you
            chose.
          </FormAlert>
          <p className="text-muted">After approval, sign in — you&apos;ll go to your salon dashboard as owner.</p>
          <Link to="/" className="inline-block text-sky2 font-semibold">
            Back to home
          </Link>
        </div>
      ) : (
        <>
          {error ? <FormAlert>{error}</FormAlert> : null}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="ra-name">Full name</Label>
              <Input id="ra-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="ra-email">Work email</Label>
              <Input
                id="ra-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="ra-pass">Password</Label>
              <div className="relative">
                <Input
                  id="ra-pass"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
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
            <div>
              <Label htmlFor="ra-confirm">Confirm password</Label>
              <Input
                id="ra-confirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <div>
              <Label htmlFor="ra-phone">Phone</Label>
              <Input
                id="ra-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 …"
              />
            </div>
            <div>
              <Label htmlFor="ra-company">Company / salon name</Label>
              <Input
                id="ra-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary btn-full !h-11">
              {loading ? 'Submitting…' : 'Submit for superadmin review'}
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}