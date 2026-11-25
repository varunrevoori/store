import { RevenueTipsCard } from '@/components/RevenueTipsCard';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { CardHeader } from '@/components/CardHeader';
import { KpiCard } from '@/components/KpiCard';
import { PageHeader } from '@/components/PageHeader';
import { StatusChip } from '@/components/StatusChip';
import { useAuth } from '@/features/auth/AuthProvider';
import { useTenant } from '@/context/TenantContext';
import { useFetch } from '@/hooks/useFetch';
import { displayName, timeGreeting } from '@/lib/greeting';
import { inr, fmtTime } from '@/lib/format';
import {
  ArrowUpRight,
  CalendarCheck,
  CalendarPlus,
  IndianRupee,
  ReceiptIndianRupee,
  UserRoundPlus,
  UserRoundX,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type DashboardDetail = {
  summary: {
    revenueToday: number;
    bookingsToday: number;
    noShowRate: number;
    newCustomers: number;
    servicesDone?: number;
  };
  branch: { name: string; area: string };
  orgName?: string;
  branchesPulse: { id: string; name: string; revenueToday: number }[];
  upcoming: {
    id: string;
    customer: string;
    service: string;
    stylist: string;
    start: number;
    status: string;
    color?: string;
  }[];
  topStylists: {
    id?: string;
    name: string;
    revenue: number;
    rating: number | null;
    color: string;
  }[];
};

function DashBar({
  pct,
  color = '#3598CB',
  height = 6,
}: {
  pct: number;
  color?: string;
  height?: number;
}) {
  const w = Math.max(pct > 0 ? 4 : 0, Math.min(100, Math.round(pct)));
  return (
    <div className="dash-bar" style={{ height }}>
      <span style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

export function DashboardPage() {
  const { session } = useAuth();
  const { ready, branchId } = useTenant();
  const path = branchId ? `dashboard/detail?branchId=${encodeURIComponent(branchId)}` : '';
  const { data, loading, error } = useFetch<DashboardDetail>(path, [ready, branchId]);

  const firstName = displayName(session?.user.user_metadata, session?.user.email ?? null);
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (loading) {
    return (
      <div className="grid gap-5">
        <div className="h-16 rounded-[22px] border border-[var(--line)] bg-[var(--bg-glass)] animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[120px] rounded-[18px] border border-[var(--line)] bg-[var(--bg-glass)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-[13px] text-hot">Could not load dashboard.</p>;
  }

  const maxStylistRev = Math.max(...data.topStylists.map((s) => s.revenue), 1);
  const maxBranchRev = Math.max(...data.branchesPulse.map((b) => b.revenueToday), 1);
  const branchTotal = data.branchesPulse.reduce((s, b) => s + b.revenueToday, 0);

  return (
    <div className="dash-page">
      <PageHeader
        title={`${timeGreeting()}, ${firstName}`}
        subtitle={
          <>
            <span className="text-ink font-medium">{data.branch.name}</span>
            <span className="text-muted"> · {today} · IST</span>
          </>
        }
        actions={
          <>
            <Link to="/pos" className="btn-ghost no-underline">
              <ReceiptIndianRupee size={16} />
              New bill
            </Link>
            <Link to="/calendar?book=1" className="btn-primary no-underline">
              <CalendarPlus size={16} />
              New appointment
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        <KpiCard
          label="Today's revenue"
          value={inr(data.summary.revenueToday)}
          icon={IndianRupee}
          color="#3598CB"
          sub={`${data.branch.name} · in-chair & POS`}
        />
        <KpiCard
          label="Appointments today"
          value={String(data.summary.bookingsToday)}
          icon={CalendarCheck}
          color="#7B5CFF"
          sub="Excluding cancelled"
        />
        <KpiCard
          label="No-show rate"
          value={`${data.summary.noShowRate}%`}
          icon={UserRoundX}
          color="#D13095"
          good={data.summary.noShowRate < 10}
          sub="Finished visits today"
        />
        <KpiCard
          label="New customers"
          value={String(data.summary.newCustomers)}
          icon={UserRoundPlus}
          color="#F07B3F"
          sub="Joined today"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card className="p-5 lg:col-span-2 dash-revenue-card">
          <CardHeader
            title="Revenue by branch"
            subtitle={`Org total today · ${inr(branchTotal)}`}
          />
          <ul className="dash-branch-list">
            {data.branchesPulse.length === 0 ? (
              <li className="text-[13px] text-muted py-8 text-center">No revenue recorded yet today.</li>
            ) : (
              data.branchesPulse.map((b) => {
                const pct = (b.revenueToday / maxBranchRev) * 100;
                const active = b.id === branchId;
                return (
                  <li key={b.id} className={active ? 'dash-branch-row is-active' : 'dash-branch-row'}>
                    <div className="dash-branch-meta">
                      <span className="dash-branch-name">
                        {b.name}
                        {active ? <span className="dash-branch-tag">Viewing</span> : null}
                      </span>
                      <span className="dash-branch-amt tabular-nums">{inr(b.revenueToday)}</span>
                    </div>
                    <DashBar pct={pct} color={active ? '#3598CB' : '#7B5CFF'} />
                  </li>
                );
              })
            )}
          </ul>
        </Card>
        <RevenueTipsCard servicesDone={data.summary.servicesDone} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card className="p-5">
          <CardHeader
            title="Top stylists"
            subtitle="Today's chair revenue"
            action={
              <Link to="/staff" className="icon-btn" aria-label="Staff">
                <ArrowUpRight size={16} />
              </Link>
            }
          />
          <ul className="dash-rank-list">
            {data.topStylists.length === 0 ? (
              <li className="text-[13px] text-muted py-6 text-center">No stylist data yet.</li>
            ) : (
              data.topStylists.map((s, i) => (
                <li key={s.name} className="dash-rank-row">
                  <span className="dash-rank-num">{i + 1}</span>
                  <Avatar name={s.name} color={s.color} size={34} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2 text-[13px]">
                      <span className="font-semibold text-ink truncate">{s.name}</span>
                      <span className="font-semibold tabular-nums shrink-0">{inr(s.revenue)}</span>
                    </div>
                    <DashBar pct={(s.revenue / maxStylistRev) * 100} color={s.color} height={5} />
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card className="p-5">
          <CardHeader
            title="Up next"
            subtitle={`${data.upcoming.length} on the floor`}
            action={
              <Link to="/calendar" className="icon-btn" aria-label="Calendar">
                <CalendarCheck size={16} />
              </Link>
            }
          />
          <ul className="dash-upcoming">
            {data.upcoming.length === 0 ? (
              <li className="text-[13px] text-muted py-6 text-center">No upcoming appointments today.</li>
            ) : (
              data.upcoming.map((a) => (
                <li key={a.id}>
                  <Link to="/calendar" className="dash-upcoming-row no-underline text-inherit">
                    <time className="dash-upcoming-time tabular-nums">{fmtTime(a.start)}</time>
                    <div className="dash-upcoming-body min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-ink truncate">{a.customer}</div>
                      <div className="text-[11.5px] text-muted truncate">
                        {a.service} · {a.stylist.split(' ')[0]}
                      </div>
                    </div>
                    <StatusChip status={a.status} />
                  </Link>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card className="p-5">
          <CardHeader title="Today at a glance" subtitle={data.branch.name} />
          <dl className="dash-glance">
            <div className="dash-glance-row">
              <dt>Revenue (branch)</dt>
              <dd className="tabular-nums">{inr(data.summary.revenueToday)}</dd>
            </div>
            <div className="dash-glance-row">
              <dt>Visits counted</dt>
              <dd>{data.summary.servicesDone ?? 0}</dd>
            </div>
            <div className="dash-glance-row">
              <dt>Scheduled today</dt>
              <dd>{data.summary.bookingsToday}</dd>
            </div>
            <div className="dash-glance-row">
              <dt>Branches live</dt>
              <dd>{data.branchesPulse.length}</dd>
            </div>
          </dl>
          <p className="text-[11.5px] text-muted mt-4 pt-4 border-t border-[var(--line)] leading-snug">
            Switch branch in the top bar to compare locations.
          </p>
        </Card>
      </div>
    </div>
  );
}