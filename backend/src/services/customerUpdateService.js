import { mapCustomerRow } from '../lib/formatters.js';
import * as crmModel from '../models/crmModel.js';

export async function updateCustomer(orgId, id, body) {
  const existing = await crmModel.getCustomerById(orgId, id);
  if (!existing) {
    const err = new Error('Customer not found');
    err.status = 404;
    throw err;
  }

  const fullName = String(body.fullName ?? body.name ?? existing.full_name).trim();
  const phone = String(body.phone ?? existing.phone)
    .replace(/\s+/g, ' ')
    .trim();
  if (!fullName || !phone) {
    const err = new Error('fullName and phone are required');
    err.status = 400;
    throw err;
  }

  const row = {
    full_name: fullName,
    phone,
    email: body.email != null ? (String(body.email).trim() || null) : existing.email,
  };
  if (body.branchId !== undefined) {
    row.branch_id = body.branchId || null;
  }

  try {
    const updated = await crmModel.updateCustomer(orgId, id, row);
    return mapCustomerRow(updated, updated.branch?.name);
  } catch (e) {
    const code = e?.code ?? e?.cause?.code;
    if (code === '23505' || String(e?.message ?? '').toLowerCase().includes('duplicate')) {
      const err = new Error('Another customer already uses this phone number');
      err.status = 409;
      throw err;
    }
    throw e;
  }
}

export async function deleteCustomer(orgId, id) {
  const existing = await crmModel.getCustomerById(orgId, id);
  if (!existing) {
    const err = new Error('Customer not found');
    err.status = 404;
    throw err;
  }
  await crmModel.deleteCustomer(orgId, id);
  return { id, deleted: true };
}