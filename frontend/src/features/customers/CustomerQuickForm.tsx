import { apiFetch, invalidateApiCache } from '@/lib/api';
import { FormEvent, useEffect, useState } from 'react';

export type CustomerFormValues = {
  id: string;
  name: string;
  phone: string;
  email?: string;
};

type Props = {
  branchId: string | null;
  compact?: boolean;
  editCustomer?: CustomerFormValues | null;
  onCreated?: (customer: CustomerFormValues) => void;
  onSaved?: () => void;
  onCancel?: () => void;
};

export function CustomerQuickForm({
  branchId,
  compact,
  editCustomer,
  onCreated,
  onSaved,
  onCancel,
}: Props) {
  const isEdit = !!editCustomer?.id;
  const [open, setOpen] = useState(!compact && !isEdit);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editCustomer) {
      setFullName(editCustomer.name);
      setPhone(editCustomer.phone);
      setEmail(editCustomer.email ?? '');
      setOpen(true);
      setError(null);
    }
  }, [editCustomer]);

  if (!open && compact && !isEdit) {
    return (
      <button
        type="button"
        className={compact ? 'text-[12px] font-bold text-hot' : 'btn-ghost btn-sm'}
        onClick={() => setOpen(true)}
      >
        + New customer
      </button>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const payload = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      branchId,
    };
    const res = await apiFetch(isEdit ? `/customers/${editCustomer!.id}` : '/customers', {
      method: isEdit ? 'PATCH' : 'POST',
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error?.message ?? `HTTP ${res.status}`);
      return;
    }
    invalidateApiCache();
    const body = await res.json().catch(() => ({}));
    const saved = body?.customer as CustomerFormValues | undefined;

    if (isEdit) {
      onSaved?.();
    } else {
      onCreated?.(
        saved ?? {
          id: '',
          name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
        },
      );
      setOpen(false);
      setFullName('');
      setPhone('');
      setEmail('');
    }
  }

  function cancel() {
    if (onCancel) onCancel();
    else setOpen(false);
    if (!isEdit) {
      setFullName('');
      setPhone('');
      setEmail('');
    }
    setError(null);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="lbl" htmlFor="cust-name">
          Full name
        </label>
        <input
          id="cust-name"
          className="inp"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="lbl" htmlFor="cust-phone">
          Phone
        </label>
        <input
          id="cust-phone"
          className="inp"
          placeholder="10-digit mobile"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="lbl" htmlFor="cust-email">
          Email
        </label>
        <input
          id="cust-email"
          className="inp"
          placeholder="Optional"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {error ? <p className="text-[12px] text-hot">{error}</p> : null}
      <div className="flex gap-2 pt-1">
        <button type="button" className="btn-ghost flex-1" onClick={cancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Saving…' : isEdit ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  );
}