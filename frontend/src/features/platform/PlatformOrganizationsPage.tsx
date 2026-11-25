import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { PageLoading } from '@/components/ui/PageState';
import { apiFetch } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type Organization = {
  id: string;
  name: string;
  slug: string;
  vertical: string;
  createdAt: string;
};

export function PlatformOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch('/admin/organizations');
    if (!res.ok) {
      setError('Could not load organizations.');
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { organizations: Organization[] };
    setOrganizations(data.organizations ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Organizations"
        subtitle="Tenants on the platform. New ones appear after you approve access requests."
        actions={
          <Link to="/platform/access-requests" className="text-sm font-semibold text-sky2 hover:underline">
            Pending access requests →
          </Link>
        }
      />
      {error ? <p className="text-sm form-alert form-alert-error mb-4">{error}</p> : null}
      {loading ? <PageLoading /> : null}
      {!loading && organizations.length === 0 ? (
        <p className="text-sm text-muted">No organizations yet — approve an access request first.</p>
      ) : null}
      <ul className="space-y-3">
        {organizations.map((org) => (
          <li key={org.id}>
            <Card className="flex flex-wrap items-center justify-between gap-2 py-4">
              <div>
                <p className="font-semibold text-ink">{org.name}</p>
                <p className="text-sm text-muted">
                  {org.slug} · {org.vertical}
                </p>
              </div>
              <span className="text-xs text-muted">{new Date(org.createdAt).toLocaleDateString()}</span>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}