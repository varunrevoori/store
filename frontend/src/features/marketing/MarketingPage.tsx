import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { PageError, PageLoading } from '@/components/ui/PageState';
import { useTenant } from '@/context/TenantContext';
import { useFetch } from '@/hooks/useFetch';

type Camp = { id: string; channel: string; audience: string; status: string; reach: number; sentAt: string };

export function MarketingPage() {
  const { ready } = useTenant();
  const { data, loading, error } = useFetch<{
    campaigns: Camp[];
    templates: number;
    reviews: { name: string; stars: number; text: string; source: string; when: string }[];
  }>(ready ? 'marketing' : '', [ready]);

  if (loading) return <PageLoading label="Loading marketing…" />;
  if (error || !data) return <PageError>Could not load marketing.</PageError>;

  return (
    <div>
      <PageHeader title="Marketing" subtitle={`${data.templates} WhatsApp templates synced`} />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-semibold text-ink mb-3 text-[15px]">Campaigns</h2>
          <ul className="space-y-3">
            {data.campaigns.map((c) => (
              <li key={c.id} className="panel-inset text-sm">
                <div className="flex justify-between font-semibold text-ink">
                  <span>{c.channel}</span>
                  <span className="chip-status">{c.status}</span>
                </div>
                <p className="text-secondary mt-1">{c.audience}</p>
                <p className="text-xs text-muted mt-1">
                  Reach {c.reach.toLocaleString('en-IN')} · {c.sentAt}
                </p>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold text-ink mb-3 text-[15px]">Recent reviews</h2>
          <ul className="space-y-3 text-sm">
            {data.reviews.map((r) => (
              <li key={r.name + r.when} className="panel-inset">
                <div className="flex justify-between text-ink">
                  <span className="font-semibold">{r.name}</span>
                  <span className="text-amber-400">{'★'.repeat(r.stars)}</span>
                </div>
                <p className="text-secondary mt-0.5">{r.text}</p>
                <p className="text-xs text-muted">
                  {r.source} · {r.when}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}