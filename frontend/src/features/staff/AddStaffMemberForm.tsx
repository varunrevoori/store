import { Card } from '@/components/Card';
import { FormAlert, Input, Label, Select } from '@/components/ui/Field';
import { apiFetch } from '@/lib/api';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import type { CSSProperties } from 'react';
import { FormEvent, useState } from 'react';

type Props = {
  actorRole: string | null;
  onAdded: () => void;
};

export function AddStaffMemberForm({ actorRole, onAdded }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('team');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const isOwner = actorRole === 'owner';
  const isManager = actorRole === 'manager';
  if (!isOwner && !isManager) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const res = await apiFetch('/staff/members', {
      method: 'POST',
      body: JSON.stringify({
        fullName,
        email,
        password,
        role: role === 'manager' ? 'manager' : 'employee',
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body?.error?.message ?? body?.message ?? 'Could not add member');
      return;
    }
    setFullName('');
    setEmail('');
    setPassword('');
    setOk(true);
    onAdded();
  }

  return (
    <Card className="staff-form-card h-full">
      <div className="flex items-start gap-3">
        <div className="kpi-ic shrink-0" style={{ '--c': '#3598CB' } as CSSProperties}>
          <UserPlus size={18} />
        </div>
        <div>
          <h2 className="font-semibold text-ink text-[15px]">Add staff</h2>
          <p className="text-[12.5px] text-muted mt-1 leading-snug">
        {isOwner
          ? 'Add a manager or team member. They sign in with this email and password.'
          : 'Add a team member for this store. They sign in with this email and password.'}
          </p>
        </div>
      </div>
      {error ? (
        <div className="mt-3">
          <FormAlert>{error}</FormAlert>
        </div>
      ) : null}
      {ok ? (
        <div className="mt-3">
          <FormAlert tone="success">Member added.</FormAlert>
        </div>
      ) : null}
      <form className="staff-form mt-5 grid gap-3.5" onSubmit={onSubmit}>
        <div>
          <Label htmlFor="staff-name">Full name</Label>
          <Input id="staff-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="staff-email">Email</Label>
          <Input
            id="staff-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="staff-role">Role</Label>
          <Select id="staff-role" value={role} onChange={(e) => setRole(e.target.value)}>
            {isOwner ? <option value="manager">Manager</option> : null}
            <option value="team">Team / employee</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="staff-pass">Password for sign-in</Label>
          <div className="inp-wrap">
            <Input
              id="staff-pass"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="inp-with-toggle"
              minLength={6}
              required
            />
            <button
              type="button"
              className="inp-toggle-btn icon-btn"
              onClick={() => setShowPassword((v) => !v)}
              aria-label="Toggle password"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Adding…' : 'Add member'}
          </button>
        </div>
      </form>
    </Card>
  );
}