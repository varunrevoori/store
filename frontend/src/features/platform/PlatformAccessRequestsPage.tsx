import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { apiFetch } from '@/lib/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';

type AccessRequest = {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  companyName?: string | null;
  status: string;
  createdAt: string;
};

export function PlatformAccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch('/admin/access-requests?status=PENDING');
    if (!res.ok) {
      setError('Could not load access requests.');
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { requests: AccessRequest[] };
    setRequests(data.requests ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, action: 'approve' | 'reject') {
    setBusyId(id);
    setError(null);
    const res = await apiFetch(`/admin/access-requests/${id}/${action}`, {
      method: 'POST',
      body: JSON.stringify({ reviewNote: note[id]?.trim() || undefined }),
    });
    setBusyId(null);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      setError(body?.error?.message ?? `Could not ${action} request.`);
      return;
    }
    setRequests((rows) => rows.filter((r) => r.id !== id));
  }

  function onNote(e: FormEvent<HTMLTextAreaElement>, id: string) {
    setNote((prev) => ({ ...prev, [id]: e.currentTarget.value }));
  }

  return (
    <div>
      <PageHeader
        title="New organization requests"
        subtitle="Business owners only — approve to create their salon and OWNER login."
      />
      {error ? (
        <p className="text-sm form-alert form-alert-error mb-4" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-muted">Loading…</p> : null}
      {!loading && requests.length === 0 ? (
        <p className="text-sm text-muted">No pending access requests.</p>
      ) : null}
      <ul className="space-y-4">
        {requests.map((r) => (
          <li key={r.id}>
            <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{r.fullName}</p>
                <p className="text-sm text-muted">{r.email}</p>
                {r.companyName ? <p className="text-sm text-muted mt-1">{r.companyName}</p> : null}
                <p className="text-sm text-sky2 mt-1 font-medium">Role: Owner (new business)</p>
              </div>
              <span className="text-xs font-medium uppercase tracking-wide text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                {r.status}
              </span>
            </div>
            <textarea
              className="mt-4 inp text-sm"
              placeholder="Internal review note (optional)"
              rows={2}
              value={note[r.id] ?? ''}
              onChange={(e) => onNote(e, r.id)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => void decide(r.id, 'approve')}
                className="btn-primary btn-sm disabled:opacity-60"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => void decide(r.id, 'reject')}
                className="btn-ghost btn-sm disabled:opacity-60"
              >
                Reject
              </button>
            </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}