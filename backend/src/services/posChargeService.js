import { getBranchPricingFactor } from '../lib/resolveBranch.js';
import * as crmModel from '../models/crmModel.js';
import * as customerVisitService from './customerVisitService.js';

function nowIso() {
  return new Date().toISOString();
}

export async function chargePos(orgId, branchId, body) {
  const staffMemberId = body.stylistId ?? body.staffMemberId ?? null;
  const lines = Array.isArray(body.lines) ? body.lines : [];
  if (!lines.length) {
    const err = new Error('At least one line item is required');
    err.status = 400;
    throw err;
  }

  const discountPct = Math.min(100, Math.max(0, Number(body.discountPercent ?? 0)));
  const discountFactor = 1 - discountPct / 100;
  const { factor } = await getBranchPricingFactor(orgId, branchId);

  const linkedCustomer = await customerVisitService.ensureCustomerForCheckout(orgId, branchId, body);
  const customerId = linkedCustomer?.id ?? null;
  const customerName =
    String(body.customerName ?? '').trim() || linkedCustomer?.full_name || 'Walk-in';

  const created = [];

  for (const line of lines) {
    const qty = Math.max(1, Math.round(Number(line.qty ?? 1)));
    let baseUnit = 0;
    let durationHours = 0.5;
    let catalogItemId = line.catalogItemId ?? line.id ?? null;
    let serviceName = String(line.name ?? 'Item').trim() || 'Item';

    if (catalogItemId) {
      const item = await crmModel.getCatalogItemById(orgId, catalogItemId);
      if (item) {
        baseUnit = Math.round(Number(item.price ?? 0));
        serviceName = serviceName || item.name;
        durationHours = Number(item.duration_hours ?? 0.5);
        if (item.item_type === 'PRODUCT') {
          durationHours = 0.25;
          const stock = Math.max(0, (item.stock ?? 0) - qty);
          await crmModel.updateCatalogItem(orgId, catalogItemId, { stock });
        }
      }
    }
    if (!baseUnit) {
      baseUnit = Math.round(Number(line.price ?? 0) / (factor || 1));
    }

    const unitAfterDiscount = Math.max(0, Math.round(baseUnit * discountFactor));

    for (let i = 0; i < qty; i++) {
      const row = {
        org_id: orgId,
        branch_id: branchId,
        staff_member_id: staffMemberId,
        customer_id: customerId,
        customer_name: customerName,
        service_name: serviceName,
        catalog_item_id: catalogItemId,
        starts_at: nowIso(),
        duration_hours: durationHours,
        status: 'COMPLETED',
        price: unitAfterDiscount,
      };
      const appt = await crmModel.insertAppointment(row);
      created.push(appt);
    }
  }

  const visitTotal = created.reduce((s, a) => s + Number(a.price ?? 0), 0);
  if (customerId && visitTotal > 0) {
    const topLine = lines[0];
    await customerVisitService.recordCustomerVisit(orgId, customerId, visitTotal, {
      favouriteItem: topLine?.name ? String(topLine.name).trim() : undefined,
    });
  }

  return {
    ok: true,
    appointmentsCreated: created.length,
    totalBase: visitTotal,
    paymentMethod: String(body.paymentMethod ?? 'cash'),
    customerName,
    customerId,
  };
}