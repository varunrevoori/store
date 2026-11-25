import { mapCustomerRow } from '../lib/formatters.js';
import * as crmModel from '../models/crmModel.js';

export async function createCustomer(orgId, body, defaultBranchId) {
  const fullName = String(body.fullName ?? body.name ?? '').trim();
  const phone = String(body.phone ?? '').replace(/\s+/g, ' ').trim();
  if (!fullName || !phone) {
    const err = new Error('fullName and phone are required');
    err.status = 400;
    throw err;
  }

  const row = {
    full_name: fullName,
    phone,
    email: body.email ? String(body.email).trim() : null,
    branch_id: body.branchId ?? defaultBranchId ?? null,
    tier: 'New',
  };

  try {
    const created = await crmModel.insertCustomer(orgId, row);
    return mapCustomerRow(created, null);
  } catch (e) {
    const code = e?.code ?? e?.cause?.code;
    if (code === '23505' || String(e?.message ?? '').toLowerCase().includes('duplicate')) {
      const err = new Error('A customer with this phone already exists');
      err.status = 409;
      throw err;
    }
    throw e;
  }
}