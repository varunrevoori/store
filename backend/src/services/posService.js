import { getBranchPricingFactor } from '../lib/resolveBranch.js';
import * as crmModel from '../models/crmModel.js';

export async function getPosCatalog(orgId, branchId) {
  const [{ factor }, items, gstin] = await Promise.all([
    getBranchPricingFactor(orgId, branchId),
    crmModel.listCatalog(orgId),
    crmModel.getOrgGstin(orgId),
  ]);

  const services = items
    .filter((i) => i.item_type === 'SERVICE')
    .map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      price: Math.round(Number(s.price) * factor),
      durationHours: Number(s.duration_hours ?? 0.5),
      description: s.metadata?.description ?? '',
      meta: `${Math.round(Number(s.duration_hours ?? 0.5) * 60)} min`,
    }));

  const retail = items
    .filter((i) => i.item_type === 'PRODUCT' && i.price != null)
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category || 'Retail',
      price: Math.round(Number(p.price ?? 0) * factor),
      meta: p.unit ? `Retail · ${p.unit}` : 'Retail',
      description: p.metadata?.description ?? '',
    }));

  return {
    services,
    retail,
    invoiceNo: Math.floor(Date.now() / 1000) % 100000,
    gstin: gstin ?? '',
  };
}