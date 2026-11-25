const APPT_STATUS_API = {
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  PENDING: 'pending',
  NO_SHOW: 'no-show',
  CANCELLED: 'cancelled',
};

const CAMPAIGN_STATUS_API = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  SENT: 'sent',
  CANCELLED: 'cancelled',
};

export function appointmentStatusToApi(dbStatus) {
  return APPT_STATUS_API[dbStatus] ?? String(dbStatus).toLowerCase();
}

const APPT_STATUS_DB = {
  confirmed: 'CONFIRMED',
  'in-progress': 'IN_PROGRESS',
  completed: 'COMPLETED',
  pending: 'PENDING',
  'no-show': 'NO_SHOW',
  cancelled: 'CANCELLED',
};

export function appointmentStatusToDb(apiStatus) {
  const key = String(apiStatus ?? '').toLowerCase();
  return APPT_STATUS_DB[key] ?? 'PENDING';
}

/** Local IST calendar day [start, end) as ISO strings for DB filtering. */
export function istDayBounds(dayOffset = 0) {
  const base = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  base.setDate(base.getDate() + Number(dayOffset));
  base.setHours(0, 0, 0, 0);
  const end = new Date(base);
  end.setDate(end.getDate() + 1);
  return { from: base.toISOString(), to: end.toISOString(), date: base };
}

/** Decimal hour of day in IST → ISO timestamp on dayOffset. */
export function slotToStartsAtIso(dayOffset, startHour) {
  const base = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  base.setDate(base.getDate() + Number(dayOffset));
  const h = Math.floor(Number(startHour));
  const m = Math.round((Number(startHour) - h) * 60);
  base.setHours(h, m, 0, 0);
  return base.toISOString();
}

export function campaignStatusToApi(dbStatus) {
  return CAMPAIGN_STATUS_API[dbStatus] ?? String(dbStatus).toLowerCase();
}

/** Decimal hours since midnight in Asia/Kolkata for calendar grid */
export function startsAtToSlot(startsAt) {
  const d = new Date(startsAt);
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(d);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return hour + minute / 60;
}

export function daysSince(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

export function mapCustomerRow(row, branchName) {
  return {
    id: row.id,
    name: row.full_name,
    phone: row.phone,
    email: row.email ?? undefined,
    visits: row.visit_count,
    spend: row.lifetime_spend,
    lastVisitDays: daysSince(row.last_visit_at),
    tier: row.tier,
    branch: branchName ?? '—',
    favourite: row.favourite_item ?? '—',
  };
}