import * as dashboardService from './dashboardService.js';
import * as inventoryService from './inventoryService.js';

export async function getNotifications(orgId, branchId) {
  const [inventory, detail] = await Promise.all([
    inventoryService.getInventory(orgId),
    dashboardService.getDashboardDetail(orgId, branchId),
  ]);

  const items = [];

  for (const p of inventory.lowStock.slice(0, 6)) {
    items.push({
      id: `low-stock-${p.id}`,
      type: 'low_stock',
      title: p.stock <= 0 ? 'Out of stock' : 'Low stock',
      body: `${p.name} · ${p.stock} on hand (min ${p.min})`,
      to: '/inventory',
      severity: p.stock <= 0 ? 'urgent' : 'warn',
    });
  }

  for (const a of detail.upcoming.slice(0, 6)) {
    items.push({
      id: `appt-${a.id}`,
      type: 'appointment',
      title: 'Upcoming today',
      body: `${a.customer} · ${a.service}`,
      meta: a.stylist,
      to: '/calendar',
      severity: a.status === 'confirmed' ? 'info' : 'info',
      startSlot: a.start,
    });
  }

  if (detail.summary.newCustomers > 0) {
    items.push({
      id: 'new-customers-today',
      type: 'customers',
      title: 'New customers',
      body: `${detail.summary.newCustomers} profile${detail.summary.newCustomers === 1 ? '' : 's'} added today`,
      to: '/customers',
      severity: 'info',
    });
  }

  return {
    items,
    count: items.length,
    branchName: detail.branch?.name ?? 'Branch',
  };
}