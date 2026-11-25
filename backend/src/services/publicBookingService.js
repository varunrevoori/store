import { findOrganizationByIdOrSlug } from '../models/tenantModel.js';
import * as crmModel from '../models/crmModel.js';

const BOOKING_SLOTS = [10, 10.5, 11, 12, 14, 15.5, 17, 18.5, 19];

export async function getBookingOptions(orgSlug) {
  const org = await findOrganizationByIdOrSlug(orgSlug);
  if (!org) {
    const err = new Error('Organization not found');
    err.status = 404;
    throw err;
  }

  const [branches, services, staff] = await Promise.all([
    crmModel.listBranches(org.id),
    crmModel.listCatalog(org.id, { servicesOnly: true }),
    crmModel.listStaffForOrg(org.id),
  ]);

  return {
    branches,
    services: services.slice(0, 12).map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      price: s.price,
      durationHours: Number(s.duration_hours ?? 0.5),
    })),
    stylists: staff.slice(0, 8).map((s) => ({
      id: s.id,
      name: s.profile?.full_name ?? 'Staff',
      role: s.job_title ?? 'Stylist',
      color: s.display_color ?? '#3598CB',
    })),
    slots: BOOKING_SLOTS,
  };
}

export async function createBooking({ name, phone, serviceId, slot, orgSlug }) {
  if (!name || !phone || !serviceId || slot == null) {
    const err = new Error('Missing booking fields');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const org = await findOrganizationByIdOrSlug(orgSlug ?? 'lon-demo');
  const services = org ? await crmModel.listCatalog(org.id, { servicesOnly: true }) : [];
  const service = services.find((s) => s.id === serviceId);

  return {
    ok: true,
    confirmation: {
      name,
      phone,
      service: service?.name ?? serviceId,
      slot,
      message: 'Booking recorded (connect WhatsApp in production)',
    },
  };
}

export function submitFeedback({ stars, text }) {
  if (!stars) {
    const err = new Error('Rating required');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  return { ok: true, points: stars >= 4 ? 50 : 10, message: 'Thank you!', text };
}