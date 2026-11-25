import {
  appointmentStatusToApi,
  appointmentStatusToDb,
  istDayBounds,
  slotToStartsAtIso,
  startsAtToSlot,
} from '../lib/formatters.js';
import { getBranchPricingFactor } from '../lib/resolveBranch.js';
import * as crmModel from '../models/crmModel.js';
import * as customerVisitService from './customerVisitService.js';

function mapStaff(row, rollup) {
  const stats = row.stats ?? {};
  const day = rollup?.get(row.id) ?? { revenue: 0, services: 0 };
  return {
    id: row.id,
    name: row.profile?.full_name ?? 'Staff',
    role: row.job_title ?? 'Stylist',
    color: row.display_color ?? '#3598CB',
    rating: stats.rating ?? null,
    revenue: day.revenue,
    services: day.services,
    attendance: stats.attendance ?? null,
    shift: stats.shift ?? null,
  };
}

function mapAppointment(a, factor) {
  return {
    id: a.id,
    stylistId: a.staff_member_id,
    customer: a.customer_name,
    service: a.service_name,
    start: startsAtToSlot(a.starts_at),
    duration: Number(a.duration_hours),
    status: appointmentStatusToApi(a.status),
    price: Math.round(Number(a.price) * factor),
  };
}

async function appointmentCountsByOffset(orgId, branchId, startOffset, endOffset) {
  const startBounds = istDayBounds(startOffset);
  const endBounds = istDayBounds(endOffset);
  const rows = await crmModel.listAppointmentStartsForRange(
    orgId,
    branchId,
    startBounds.from,
    endBounds.to,
  );

  const counts = {};
  for (let o = startOffset; o <= endOffset; o++) counts[o] = 0;

  for (const row of rows) {
    for (let o = startOffset; o <= endOffset; o++) {
      const { from, to } = istDayBounds(o);
      const t = new Date(row.starts_at).getTime();
      if (t >= new Date(from).getTime() && t < new Date(to).getTime()) {
        counts[o] = (counts[o] ?? 0) + 1;
        break;
      }
    }
  }
  return counts;
}

export async function getCalendar(orgId, branchId, dayOffset = 0) {
  const offset = Number(dayOffset) || 0;
  const { factor } = await getBranchPricingFactor(orgId, branchId);
  const { from, to, date } = istDayBounds(offset);

  const [staffRows, appts, dayCounts] = await Promise.all([
    crmModel.listStaffForOrg(orgId),
    crmModel.listAppointmentsForBranch(orgId, branchId, { from, to }),
    appointmentCountsByOffset(orgId, branchId, -1, 7),
  ]);

  const rollup = new Map();
  for (const a of appts) {
    if (a.status !== 'COMPLETED' && a.status !== 'IN_PROGRESS') continue;
    const id = a.staff_member_id;
    if (!id) continue;
    const prev = rollup.get(id) ?? { revenue: 0, services: 0 };
    prev.revenue += Number(a.price ?? 0);
    prev.services += 1;
    rollup.set(id, prev);
  }

  return {
    dayOffset: offset,
    stylists: staffRows.map((row) => mapStaff(row, rollup)),
    appointments: appts.map((a) => mapAppointment(a, factor)),
    dayCounts,
    dayLabel: date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    }),
  };
}

export async function createAppointment(orgId, branchId, body) {
  const customerName = String(body.customerName ?? '').trim();
  const staffMemberId = body.staffMemberId ?? body.stylistId;
  if (!customerName || !staffMemberId) {
    const err = new Error('customerName and staffMemberId are required');
    err.status = 400;
    throw err;
  }

  let serviceName = String(body.serviceName ?? '').trim();
  let price = body.price != null ? Math.round(Number(body.price)) : 0;
  let durationHours = body.durationHours != null ? Number(body.durationHours) : 0.5;
  let catalogItemId = body.catalogItemId ?? null;

  if (body.catalogItemId) {
    const item = await crmModel.getCatalogItemById(orgId, body.catalogItemId);
    if (item) {
      serviceName = serviceName || item.name;
      price = price || Math.round(Number(item.price ?? 0));
      durationHours = durationHours || Number(item.duration_hours ?? 0.5);
      catalogItemId = item.id;
    }
  }

  if (!serviceName) {
    const err = new Error('serviceName or catalogItemId is required');
    err.status = 400;
    throw err;
  }

  const dayOffset = Number(body.dayOffset ?? 0);
  const start =
    body.startsAt ?? slotToStartsAtIso(dayOffset, body.start ?? body.startHour ?? 10);

  const row = {
    org_id: orgId,
    branch_id: branchId,
    staff_member_id: staffMemberId,
    customer_id: body.customerId ?? null,
    customer_name: customerName,
    service_name: serviceName,
    catalog_item_id: catalogItemId,
    starts_at: start,
    duration_hours: durationHours,
    status: body.status
      ? appointmentStatusToDb(body.status)
      : body.checkInNow || body.walkInNow
        ? 'IN_PROGRESS'
        : 'CONFIRMED',
    price,
  };

  const linked = await customerVisitService.ensureCustomerForCheckout(orgId, branchId, body);
  const customerId = linked?.id ?? null;
  if (customerId) {
    row.customer_id = customerId;
    row.customer_name = linked.full_name ?? customerName;
  }

  const created = await crmModel.insertAppointment(row);
  const { factor } = await getBranchPricingFactor(orgId, branchId);
  const mapped = mapAppointment(created, factor);

  const countable = created.status === 'COMPLETED' || created.status === 'IN_PROGRESS';
  if (customerId && countable && Number(created.price ?? 0) > 0) {
    await customerVisitService.recordCustomerVisit(orgId, customerId, created.price, {
      favouriteItem: created.service_name,
    });
  }

  return mapped;
}

export async function patchAppointmentStatus(orgId, appointmentId, status) {
  const dbStatus = appointmentStatusToDb(status);
  if (!status || !dbStatus) {
    const err = new Error('Invalid status');
    err.status = 400;
    throw err;
  }
  const existing = await crmModel.getAppointment(orgId, appointmentId);
  if (!existing) {
    const err = new Error('Appointment not found');
    err.status = 404;
    throw err;
  }
  const wasCountable =
    existing.status === 'COMPLETED' || existing.status === 'IN_PROGRESS';
  const updated = await crmModel.updateAppointment(orgId, appointmentId, { status: dbStatus });
  const nowCountable = updated.status === 'COMPLETED' || updated.status === 'IN_PROGRESS';
  if (
    !wasCountable &&
    nowCountable &&
    updated.customer_id &&
    Number(updated.price ?? 0) > 0
  ) {
    await customerVisitService.recordCustomerVisit(orgId, updated.customer_id, updated.price, {
      favouriteItem: updated.service_name,
    });
  }
  const { factor } = await getBranchPricingFactor(orgId, updated.branch_id);
  return mapAppointment(updated, factor);
}