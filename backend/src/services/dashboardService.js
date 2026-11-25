import { appointmentStatusToApi, startsAtToSlot } from '../lib/formatters.js';
import { getBranchPricingFactor } from '../lib/resolveBranch.js';
import * as crmModel from '../models/crmModel.js';
const { COUNTABLE_APPT_STATUSES } = crmModel;

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfTodayIso() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function isCountableStatus(status) {
  return COUNTABLE_APPT_STATUSES.includes(status);
}

/** Same-day service value: completed or currently in chair (excludes scheduled-only). */
function appointmentRevenue(appts) {
  return appts
    .filter((a) => isCountableStatus(a.status))
    .reduce((s, a) => s + Number(a.price ?? 0), 0);
}

function summaryFromAppointments(appts, factor) {
  const active = appts.filter((a) => a.status !== 'CANCELLED');
  const revenueToday = appointmentRevenue(appts);
  const noShows = appts.filter((a) => a.status === 'NO_SHOW').length;
  const withOutcome = appts.filter((a) => a.status === 'COMPLETED' || a.status === 'NO_SHOW');
  const noShowRate = withOutcome.length ? (noShows / withOutcome.length) * 100 : 0;

  return {
    revenueToday: Math.round(revenueToday * factor),
    bookingsToday: active.length,
    noShowRate: Number(noShowRate.toFixed(1)),
    servicesDone: appts.filter((a) => isCountableStatus(a.status)).length,
  };
}

export async function getDashboardSummary(orgId, branchId) {
  const { factor } = await getBranchPricingFactor(orgId, branchId);
  const from = startOfTodayIso();
  const to = endOfTodayIso();

  const appts = await crmModel.listAppointmentsForBranch(orgId, branchId, { from, to });
  const newCustomers = await crmModel.countNewCustomersSince(orgId, from, branchId);

  return {
    ...summaryFromAppointments(appts, factor),
    newCustomers,
  };
}

export async function getDashboardDetail(orgId, branchId) {
  const { branch, factor, org, branches } = await getBranchPricingFactor(orgId, branchId);
  const from = startOfTodayIso();
  const to = endOfTodayIso();

  const [allAppts, staffRows, newCustomers] = await Promise.all([
    crmModel.listAppointmentsForOrg(orgId, { from, to }),
    crmModel.listStaffForOrg(orgId),
    crmModel.countNewCustomersSince(orgId, from, branchId),
  ]);

  const appts = allAppts.filter((a) => a.branch_id === branchId);
  const summaryBase = {
    ...summaryFromAppointments(appts, factor),
    newCustomers,
  };

  const factorByBranch = new Map(branches.map((b) => [b.id, b.factor ?? 1]));
  const revenueByBranch = new Map();
  for (const a of allAppts) {
    if (!isCountableStatus(a.status)) continue;
    const id = a.branch_id;
    revenueByBranch.set(id, (revenueByBranch.get(id) ?? 0) + Number(a.price ?? 0));
  }

  const branchesPulse = branches.map((b) => ({
    id: b.id,
    name: b.name,
    revenueToday: Math.round((revenueByBranch.get(b.id) ?? 0) * (factorByBranch.get(b.id) ?? 1)),
  }));

  const upcoming = appts
    .filter((a) => a.status !== 'COMPLETED' && a.status !== 'CANCELLED')
    .slice(0, 6)
    .map((a) => ({
      id: a.id,
      stylistId: a.staff_member_id,
      customer: a.customer_name,
      service: a.service_name,
      start: startsAtToSlot(a.starts_at),
      duration: Number(a.duration_hours),
      status: appointmentStatusToApi(a.status),
      price: Math.round(Number(a.price) * factor),
      stylist: staffRows.find((s) => s.id === a.staff_member_id)?.profile?.full_name ?? '—',
    }));

  const todayByStaff = new Map();
  for (const a of appts) {
    if (!isCountableStatus(a.status)) continue;
    const id = a.staff_member_id;
    if (!id) continue;
    const prev = todayByStaff.get(id) ?? { revenue: 0, services: 0 };
    prev.revenue += Number(a.price ?? 0);
    prev.services += 1;
    todayByStaff.set(id, prev);
  }

  const topStylists = staffRows
    .map((s) => {
      const stats = s.stats ?? {};
      const day = todayByStaff.get(s.id) ?? { revenue: 0, services: 0 };
      return {
        id: s.id,
        name: s.profile?.full_name ?? 'Staff',
        role: s.job_title ?? 'Stylist',
        color: s.display_color ?? '#3598CB',
        rating: stats.rating ?? null,
        revenue: Math.round(day.revenue * factor),
        services: day.services,
        attendance: stats.attendance ?? null,
        shift: stats.shift ?? null,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    summary: summaryBase,
    branch: branch ?? { id: branchId, name: '—', area: '—', factor: 1 },
    branchesPulse,
    upcoming,
    topStylists,
    orgName: org?.name,
  };
}