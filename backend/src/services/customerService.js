import { mapCustomerRow } from '../lib/formatters.js';
import * as crmModel from '../models/crmModel.js';

export async function listCustomers(orgId, { q = '', tier = 'all' } = {}) {
  const [rows, total] = await Promise.all([
    crmModel.listCustomers(orgId, { q, tier }),
    crmModel.countCustomers(orgId),
  ]);

  return {
    customers: rows.map((row) => mapCustomerRow(row, row.branch?.name)),
    total,
  };
}