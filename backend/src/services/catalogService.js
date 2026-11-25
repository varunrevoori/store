import * as crmModel from '../models/crmModel.js';

const SERVICE_TYPES = new Set(['SERVICE', 'PROCEDURE', 'PACKAGE', 'ADDON']);
const PRODUCT_TYPES = new Set(['PRODUCT']);

export function normalizeItemType(raw) {
  const t = String(raw ?? 'SERVICE').toUpperCase();
  if (PRODUCT_TYPES.has(t) || t === 'PRODUCT') return 'PRODUCT';
  if (SERVICE_TYPES.has(t)) return t === 'SERVICE' ? 'SERVICE' : t;
  return 'SERVICE';
}

export async function createCatalogItem(orgId, body) {
  const itemType = normalizeItemType(body.itemType);
  const name = String(body.name ?? '').trim();
  if (!name) {
    const err = new Error('name is required');
    err.status = 400;
    throw err;
  }

  const row = catalogRowFromBody({ ...body, name }, itemType);
  return crmModel.insertCatalogItem(orgId, row);
}

function catalogRowFromBody(body, itemType) {
  const description = body.description != null ? String(body.description).trim() : '';
  const metadata = description ? { description } : {};

  return {
    item_type: itemType,
    name: String(body.name ?? '').trim(),
    category: String(body.category ?? (itemType === 'PRODUCT' ? 'Retail' : 'Hair')).trim(),
    price: Math.round(Number(body.price ?? 0)),
    duration_hours:
      body.durationHours != null ? Number(body.durationHours) : itemType === 'PRODUCT' ? null : 0.5,
    sku: body.sku ? String(body.sku).trim() : null,
    stock: body.stock != null ? Math.round(Number(body.stock)) : itemType === 'PRODUCT' ? 0 : null,
    min_stock: body.minStock != null ? Math.round(Number(body.minStock)) : itemType === 'PRODUCT' ? 0 : null,
    cost: body.cost != null ? Math.round(Number(body.cost)) : null,
    supplier: body.supplier ? String(body.supplier).trim() : null,
    unit: body.unit ? String(body.unit).trim() : null,
    branch_id: body.branchId ?? null,
    metadata,
  };
}

export async function updateCatalogItem(orgId, id, body) {
  const existing = await crmModel.getCatalogItemById(orgId, id);
  if (!existing) {
    const err = new Error('Catalog item not found');
    err.status = 404;
    throw err;
  }

  const itemType = body.itemType != null ? normalizeItemType(body.itemType) : existing.item_type;
  const row = catalogRowFromBody(body, itemType);
  if (!row.name) {
    const err = new Error('name is required');
    err.status = 400;
    throw err;
  }

  return crmModel.updateCatalogItem(orgId, id, row);
}

export async function deleteCatalogItem(orgId, id) {
  const existing = await crmModel.getCatalogItemById(orgId, id);
  if (!existing) {
    const err = new Error('Catalog item not found');
    err.status = 404;
    throw err;
  }
  await crmModel.deleteCatalogItem(orgId, id);
  return { id, deleted: true };
}