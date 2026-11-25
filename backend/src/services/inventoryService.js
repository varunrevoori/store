import * as crmModel from '../models/crmModel.js';

export async function getInventory(orgId) {
  const items = await crmModel.listCatalog(orgId, { productsOnly: true });
  const products = items.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku ?? '',
    category: p.category,
    stock: p.stock ?? 0,
    min: p.min_stock ?? 0,
    cost: p.cost ?? 0,
    supplier: p.supplier ?? '',
    price: p.price ?? 0,
    unit: p.unit ?? '',
    description: p.metadata?.description ?? '',
  }));

  const lowStock = products.filter((p) => p.stock < p.min);
  const stockValue = products.reduce((s, p) => s + p.stock * p.cost, 0);

  return { products, lowStock, stockValue };
}