import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { StatusChip } from '@/components/StatusChip';
import { AppointmentBookModal } from '@/features/calendar/AppointmentBookModal';
import { useTenant } from '@/context/TenantContext';
import { apiFetch, invalidateApiCache } from '@/lib/api';
import { fmtTime, inr } from '@/lib/format';
import { Modal } from '@/components/ui/Modal';
import { PageError, PageLoading } from '@/components/ui/PageState';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFetch } from '@/hooks/useFetch';
import { hasPermission } from '@lon-crm/shared';
import { BOOK_APPOINTMENT_EVENT } from '@/lib/bookAppointment';

const HOUR = 72;
const H0 = 9;
const H1 = 21;

type CalData = {
  dayOffset: number;
  dayLabel: string;
  dayCounts: Record<string, number>;
  stylists: { id: string; name: string; color: string }[];
  appointments: {
    id: string;
    stylistId: string;
    customer: string;
    service: string;
    start: number;
    duration: number;
    status: string;
    price: number;
  }[];
};

export function CalendarPage() {
  const { ready, branchId, role } = useTenant();
  const canBook = Boolean(role && hasPermission(role, 'calendar:write'));
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dayOffset, setDayOffset] = useState(0);
  const [bookOpen, setBookOpen] = useState(searchParams.get('book') === '1');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const openBook = useCallback(() => {
    setBookOpen(true);
  }, []);

  const closeBook = useCallback(() => {
    setBookOpen(false);
    if (searchParams.get('book') === '1') {
      navigate('/calendar', { replace: true });
    }
  }, [navigate, searchParams]);

  useEffect(() => {
    if (searchParams.get('book') === '1') setBookOpen(true);
  }, [searchParams]);

  useEffect(() => {
    function onBook() {
      setBookOpen(true);
    }
    window.addEventListener(BOOK_APPOINTMENT_EVENT, onBook);
    return () => window.removeEventListener(BOOK_APPOINTMENT_EVENT, onBook);
  }, []);

  const path = useMemo(() => {
    if (!branchId) return '';
    return `calendar?branchId=${encodeURIComponent(branchId)}&dayOffset=${dayOffset}`;
  }, [branchId, dayOffset]);

  const { data, loading, error } = useFetch<CalData>(ready ? path : '', [ready, path, reloadKey]);

  const stylists = data?.stylists ?? [];
  const offsets = useMemo(() => Array.from({ length: 9 }, (_, i) => i - 1), []);

  async function patchStatus(status: string) {
    if (!selectedId) return;
    const res = await apiFetch(`/calendar/appointments/${selectedId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      invalidateApiCache();
      setSelectedId(null);
      setReloadKey((k) => k + 1);
    }
  }

  const bookModal = (
    <AppointmentBookModal
      open={bookOpen && canBook}
      onClose={closeBook}
      branchId={branchId}
      dayOffset={dayOffset}
      stylists={stylists}
      onBooked={() => setReloadKey((k) => k + 1)}
    />
  );

  if (loading && !data) {
    return (
      <>
        <PageLoading label="Loading calendar…" />
        {bookModal}
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageError>{error ?? 'Could not load calendar.'}</PageError>
        {canBook ? (
          <div className="mt-4">
            <button type="button" className="btn-primary" onClick={openBook}>
              <Plus size={16} />
              New appointment
            </button>
          </div>
        ) : null}
        {bookModal}
      </>
    );
  }

  const stylistMap = new Map(data.stylists.map((s) => [s.id, s]));
  const gridCols = `64px repeat(${Math.max(data.stylists.length, 1)}, minmax(150px, 1fr))`;
  const bodyHeight = (H1 - H0) * HOUR;
  const selected = data.appointments.find((a) => a.id === selectedId);

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle={`${data.dayLabel} · ${data.stylists.length} stylists · day view`}
        actions={
          canBook ? (
            <button type="button" className="btn-primary" onClick={openBook}>
              <Plus size={16} />
              New appointment
            </button>
          ) : null
        }
      />

      <Card padding={false} className="p-3 mb-4 flex items-center gap-1.5 overflow-x-auto">
        {offsets.map((o) => {
          const d = new Date();
          d.setDate(d.getDate() + o);
          const count = data.dayCounts[String(o)] ?? 0;
          return (
            <button
              key={o}
              type="button"
              className={`date-pill ${dayOffset === o ? 'on' : ''}`}
              onClick={() => setDayOffset(o)}
            >
              <span className="text-[10.5px] uppercase tracking-wider opacity-70 font-semibold">
                {o === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' })}
              </span>
              <span className="font-display text-[19px] font-extrabold leading-none">{d.getDate()}</span>
              <span className="text-[10px] opacity-70">{count} appts</span>
            </button>
          );
        })}
      </Card>

      {data.stylists.length === 0 ? (
        <Card className="mb-4 p-6">
          <p className="text-[13px] text-secondary leading-relaxed">
            No stylists on the roster yet. Owners and managers can add team members under{' '}
            <strong className="text-ink">Staff & Payroll</strong>, then book appointments here.
          </p>
        </Card>
      ) : null}

      <Card padding={false} className="p-0 overflow-hidden">
        <div className="cal-head" style={{ gridTemplateColumns: gridCols }}>
          <div className="p-3 text-[10.5px] text-muted font-semibold uppercase">IST</div>
          {data.stylists.map((s) => {
            const mine = data.appointments.filter((a) => a.stylistId === s.id);
            const util = Math.min(
              100,
              Math.round((mine.reduce((x, a) => x + a.duration, 0) / (H1 - H0)) * 100),
            );
            return (
              <div
                key={s.id}
                className="p-3 border-l flex items-center gap-2.5"
                style={{ borderColor: 'var(--line)' }}
              >
                <Avatar name={s.name} color={s.color} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-semibold text-ink truncate">{s.name}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="bar flex-1 !h-1">
                      <span
                        style={{
                          width: `${util}%`,
                          display: 'block',
                          height: '100%',
                          borderRadius: 99,
                          background: s.color,
                        }}
                      />
                    </div>
                    <span className="text-[10.5px] text-muted">{util}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          <div className="cal-body" style={{ gridTemplateColumns: gridCols, height: bodyHeight }}>
            <div className="relative">
              {Array.from({ length: H1 - H0 }, (_, i) => (
                <div
                  key={i}
                  className="absolute right-2 text-[10.5px] text-muted font-medium"
                  style={{ top: i * HOUR - 6 }}
                >
                  {i ? fmtTime(H0 + i).replace(':00', '') : ''}
                </div>
              ))}
            </div>
            {data.stylists.map((s) => (
              <div key={s.id} className="cal-col relative">
                {data.appointments
                  .filter((a) => a.stylistId === s.id)
                  .map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className={`appt text-left ${a.status === 'in-progress' ? 'st-in' : ''}`}
                      style={{
                        ['--c' as string]: s.color,
                        top: (a.start - H0) * HOUR + 2,
                        height: a.duration * HOUR - 4,
                      }}
                      onClick={() => setSelectedId(a.id)}
                    >
                      <div className="font-semibold truncate">{a.customer}</div>
                      {a.duration >= 0.75 ? (
                        <div className="text-[10.5px] opacity-70 truncate">
                          {fmtTime(a.start)} · {a.service}
                        </div>
                      ) : null}
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Modal
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected?.service}
        size="sm"
        showClose
      >
        {selected ? (
          <>
            <StatusChip status={selected.status} />
            <p className="text-[13px] text-muted mt-2">
              {fmtTime(selected.start)} · {stylistMap.get(selected.stylistId)?.name ?? '—'} · {inr(selected.price)}
            </p>
            <p className="text-[13px] font-semibold mt-2 text-ink">{selected.customer}</p>
            <p className="text-[12px] text-muted mt-2 leading-snug">
              Revenue counts after <strong className="text-ink font-semibold">Check in</strong> or{' '}
              <strong className="text-ink font-semibold">Complete</strong>. Confirmed-only stays off the dashboard.
            </p>
            {canBook ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(
                  [
                    ['in-progress', 'Check in'],
                    ['completed', 'Complete'],
                    ['no-show', 'No-show'],
                    ['confirmed', 'Confirm'],
                  ] as const
                ).map(([st, label]) => (
                  <button key={st} type="button" className="btn-ghost !h-9 !text-[12px]" onClick={() => patchStatus(st)}>
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </Modal>

      {bookModal}
    </div>
  );
}