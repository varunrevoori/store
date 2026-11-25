import * as crmModel from '../models/crmModel.js';

function tierAfterVisit(customer, visits, spend) {
  if (visits >= 10 || spend >= 50000) return 'VIP';
  if (visits >= 3) return 'Regular';
  if (visits >= 1 && customer.tier === 'New') return 'Regular';
  return customer.tier ?? 'New';
}

export async function resolveCustomerForSale(orgId, { customerId, phone } = {}) {
  if (customerId) {
    return crmModel.getCustomerById(orgId, customerId);
  }
  if (phone) {
    return crmModel.findCustomerByPhone(orgId, phone);
  }
  return null;
}

/** Link sale to an existing profile, or create one from walk-in details. */
export async function ensureCustomerForCheckout(orgId, branchId, body) {
  const linked = await resolveCustomerForSale(orgId, {
    customerId: body.customerId,
    phone: body.customerPhone ?? body.phone,
  });
  if (linked) return linked;

  const raw = body.newCustomer ?? body.walkIn ?? null;
  if (!raw) return null;

  const fullName = String(raw.fullName ?? raw.name ?? body.customerName ?? '').trim();
  const phone = String(raw.phone ?? '').replace(/\s+/g, ' ').trim();
  if (!fullName || !phone) return null;

  const existing = await crmModel.findCustomerByPhone(orgId, phone);
  if (existing) return existing;

  try {
    return await crmModel.insertCustomer(orgId, {
      full_name: fullName,
      phone,
      email: raw.email ? String(raw.email).trim() || null : null,
      branch_id: raw.branchId ?? branchId ?? null,
      tier: 'New',
    });
  } catch (e) {
    const again = await crmModel.findCustomerByPhone(orgId, phone);
    if (again) return again;
    throw e;
  }
}

/** Increment visits, lifetime spend, and last visit for a linked profile. */
export async function recordCustomerVisit(orgId, customerId, amountRupees, { favouriteItem } = {}) {
  if (!customerId) return null;
  const customer = await crmModel.getCustomerById(orgId, customerId);
  if (!customer) return null;

  const add = Math.max(0, Math.round(Number(amountRupees)));
  const visits = (customer.visit_count ?? 0) + 1;
  const spend = (customer.lifetime_spend ?? 0) + add;
  const now = new Date().toISOString();

  const patch = {
    visit_count: visits,
    lifetime_spend: spend,
    last_visit_at: now,
    tier: tierAfterVisit(customer, visits, spend),
  };
  if (favouriteItem) {
    patch.favourite_item = favouriteItem;
  }

  return crmModel.updateCustomer(orgId, customerId, patch);
}