import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { PageLoading } from '@/components/ui/PageState';
import { apiFetch } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';

type PlatformRequest = {
  id: string;
  orgId: string;
  type: string;
  title: string;
  description?: string | null;
  payload: Record<string, unknown>;
  status: string;
  createdAt: string;
};

export function PlatformRequestsPage() {
  const [requests, setRequests] = useState<PlatformRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch('/admin/platform-requests?status=PENDING');
    if (!res.ok) {
      setError('Could not load platform requests.');
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { requests: PlatformRequest[] };
    setRequests(data.requests ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, action: 'approve' | 'reject') {
    setBusyId(id);
    setError(null);
    const res = await apiFetch(`/admin/platform-requests/${id}/${action}`, {
      method: 'POST',
      body: JSON.stringify({ reviewNote: note[id]?.trim() || undefined }),
    });
    setBusyId(null);
    if (!res.ok) {
      setError(`Could not ${action} request.`);
      return;
    }
    setRequests((rows) => rows.filter((r) => r.id !== id));
  }

  return (
    <div>
      <PageHeader title="Platform requests" subtitle="Changes managers asked for across all organizations." />
      {error ? <p className="text-sm form-alert form-alert-error mb-4">{error}</p> : null}
      {loading ? <PageLoading /> : null}
      {!loading && requests.length === 0 ? (
        <p className="text-sm text-muted">No pending platform requests.</p>
      ) : null}
      <ul className="space-y-4">
        {requests.map((r) => (
          <li key={r.id}>
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{r.title}</p>
                  <p className="text-xs text-muted mt-1">
                    {r.type} · org {r.orgId.slice(0, 8)}…
                  </p>
                  {r.description ? <p className="text-sm text-secondary mt-2">{r.description}</p> : null}
                  {Object.keys(r.payload ?? {}).length > 0 ? (
                    <pre className="mt-2 text-xs panel-inset overflow-x-auto text-secondary">
                      {JSON.stringify(r.payload, null, 2)}
                    </pre>
                  ) : null}
                </div>
                <span className="chip-status">{r.status}</span>
              </div>
              <textarea
                className="mt-4 inp text-sm"
                placeholder="Review note (optional)"
                rows={2}
                value={note[r.id] ?? ''}
                onChange={(e) => setNote((prev) => ({ ...prev, [r.id]: e.target.value }))}
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