import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { FormAlert } from '@/components/ui/Field';
import { PageError, PageLoading } from '@/components/ui/PageState';
import { AddStaffMemberForm } from '@/features/staff/AddStaffMemberForm';
import { useTenant } from '@/context/TenantContext';
import { useFetch } from '@/hooks/useFetch';
import { inr } from '@/lib/format';
import { SearchField } from '@/components/ui/SearchField';
import { Modal } from '@/components/ui/Modal';
import { EditStaffMemberForm } from '@/features/staff/EditStaffMemberForm';
import { apiFetch, invalidateApiCache } from '@/lib/api';
import { IndianRupee, Pencil, Trash2, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';

type StaffRow = {
  id: string;
  name: string;
  email?: string;
  memberRole?: string;
  role: string;
  color: string;
  rating: number | null;
  shift: string | null;
  attendance: string | null;
  revenue: number;
  netPay: number;
};

function isEditableMember(memberRole?: string) {
  return String(memberRole ?? '').toUpperCase() !== 'OWNER';
}

function StaffStat({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <div className="staff-stat" style={{ '--staff-accent': accent } as CSSProperties}>
      <div className="staff-stat-ic">
        <Icon size={18} />
      </div>
      <div>
        <div className="staff-stat-label">{label}</div>
        <div className="staff-stat-value">{value}</div>
        {sub ? <div className="staff-stat-sub">{sub}</div> : null}
      </div>
    </div>
  );
}

export function StaffPage() {
  const { ready, branchId, role } = useTenant();
  const canManage = role === 'owner' || role === 'manager';
  const [reloadKey, setReloadKey] = useState(0);
  const [q, setQ] = useState('');
  const [editTarget, setEditTarget] = useState<StaffRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const path = branchId ? `staff?branchId=${encodeURIComponent(branchId)}` : '';
  const { data, loading, error } = useFetch<{ staff: StaffRow[]; payrollTotal: number }>(
    path,
    [ready, branchId, reloadKey],
  );

  const staff = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return data.staff;
    return data.staff.filter(
      (s) => s.name.toLowerCase().includes(needle) || s.role.toLowerCase().includes(needle),
    );
  }, [data, q]);

  const totalRevenue = useMemo(() => staff.reduce((sum, s) => sum + s.revenue, 0), [staff]);
  const maxRevenue = Math.max(...staff.map((s) => s.revenue), 1);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await apiFetch(`/staff/members/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setDeleteError(j?.error?.message ?? `HTTP ${res.status}`);
      return;
    }
    invalidateApiCache();
    setDeleteTarget(null);
    setReloadKey((k) => k + 1);
  }

  if (loading) return <PageLoading label="Loading staff…" />;
  if (error || !data) return <PageError>Could not load staff.</PageError>;

  return (
    <div className="staff-page">
      <PageHeader
        title="Staff & Payroll"
        subtitle="Manage team logins, chair revenue, and monthly net pay for this branch."
      />

      <div className="staff-stats grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StaffStat label="Team size" value={String(staff.length)} sub="Active on branch" icon={Users} accent="#3598CB" />
        <StaffStat
          label="Net payroll"
          value={inr(data.payrollTotal)}
          sub="This month"
          icon={IndianRupee}
          accent="#7B5CFF"
        />
        <StaffStat
          label="Chair revenue"
          value={inr(totalRevenue)}
          sub="From listed staff"
          icon={IndianRupee}
          accent="#12A594"
        />
      </div>

      <div
        className={
          canManage
            ? 'staff-split grid grid-cols-1 lg:grid-cols-[minmax(300px,380px)_1fr] gap-6 items-start'
            : ''
        }
      >
        {canManage ? (
          <aside className="lg:sticky lg:top-4 min-w-0 order-2 lg:order-1">
            <AddStaffMemberForm actorRole={role} onAdded={() => setReloadKey((k) => k + 1)} />
          </aside>
        ) : null}

        <section className="min-w-0 order-1 lg:order-2">
          <Card padding={false} className="staff-team-panel overflow-hidden">
            <div className="staff-team-head">
              <div>
                <h2 className="text-[15px] font-semibold text-ink">Team roster</h2>
                <p className="text-[12px] text-muted mt-0.5">
                  {staff.length} member{staff.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="staff-team-search">
                <SearchField
                  value={q}
                  onChange={setQ}
                  placeholder="Search name or role"
                  aria-label="Search staff"
                  size="sm"
                />
              </div>
            </div>

            <div className="staff-team-body">
              {staff.length === 0 ? (
                <p className="text-[13px] text-muted py-10 text-center">
                  {q.trim() ? 'No staff match your search.' : 'No staff on this branch yet.'}
                </p>
              ) : (
                <ul className="staff-roster">
                  {staff.map((s) => (
                    <li key={s.id} className="staff-card">
                      <div className="staff-card-main">
                        <Avatar name={s.name} color={s.color} size={44} />
                        <div className="staff-card-info min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-ink text-[15px]">{s.name}</span>
                            <span className="chip" style={{ background: 'rgba(53,152,203,.1)', color: '#2a7ba8' }}>
                              {s.role}
                            </span>
                          </div>
                          {(s.shift || s.attendance) && (
                            <p className="text-[12px] text-muted mt-1">
                              {[s.shift, s.attendance ? `Attendance: ${s.attendance}` : null]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          )}
                        </div>
                        <div className="staff-card-pay text-right shrink-0 flex flex-col items-end gap-2">
                          {canManage && isEditableMember(s.memberRole) ? (
                            <div className="tbl-actions">
                              <button
                                type="button"
                                className="icon-btn"
                                title="Edit"
                                aria-label={`Edit ${s.name}`}
                                onClick={() => setEditTarget(s)}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                className="icon-btn icon-btn-danger"
                                title="Remove"
                                aria-label={`Remove ${s.name}`}
                                onClick={() => {
                                  setDeleteError(null);
                                  setDeleteTarget(s);
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ) : null}
                          <div>
                            <p className="font-display text-[20px] font-bold tabular-nums text-ink leading-none">
                              {inr(s.netPay)}
                            </p>
                            <p className="text-[11px] text-muted mt-1">Net pay</p>
                          </div>
                        </div>
                      </div>
                      <div className="staff-card-foot">
                        <div>
                          <span className="text-[11px] text-muted uppercase tracking-wide block">Revenue</span>
                          <span className="text-[13px] font-semibold text-ink tabular-nums">{inr(s.revenue)}</span>
                        </div>
                        <div className="bar flex-1 max-w-[140px] !h-1.5">
                          <span
                            style={{
                              width: `${Math.round((s.revenue / maxRevenue) * 100)}%`,
                              background: s.color,
                              boxShadow: `0 0 8px ${s.color}`,
                            }}
                          />
                        </div>
                        <span className="text-[12px] text-secondary whitespace-nowrap">
                          {s.rating != null ? `★ ${s.rating}` : 'No rating yet'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </section>
      </div>

      <Modal open={!!editTarget && canManage} onClose={() => setEditTarget(null)} title="Edit staff member" size="sm">
        {editTarget ? (
          <EditStaffMemberForm
            actorRole={role}
            staff={{
              id: editTarget.id,
              name: editTarget.name,
              email: editTarget.email,
              role: editTarget.role,
              color: editTarget.color,
              shift: editTarget.shift,
              attendance: editTarget.attendance,
              memberRole: editTarget.memberRole,
            }}
            onSaved={() => {
              setEditTarget(null);
              setReloadKey((k) => k + 1);
            }}
            onCancel={() => setEditTarget(null)}
          />
        ) : null}
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        title="Remove staff member"
        size="sm"
      >
        {deleteTarget ? (
          <div className="grid gap-4">
            <p className="text-[13px] text-secondary leading-relaxed">
              Remove <strong className="text-ink">{deleteTarget.name}</strong> from this organization? They will lose
              access immediately. This cannot be undone.
            </p>
            {deleteError ? <FormAlert>{deleteError}</FormAlert> : null}
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn-ghost" disabled={deleting} onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" className="btn-danger" disabled={deleting} onClick={() => void confirmDelete()}>
                {deleting ? 'Removing…' : 'Remove member'}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}