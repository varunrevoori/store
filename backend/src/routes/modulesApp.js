import { API_PREFIX } from '@lon-crm/shared';
import express from 'express';
import verifyToken from '../Middlewares/verifyToken.js';
import attachTenantContext from '../Middlewares/attachTenantContext.js';
import requireManagerOrOwner from '../Middlewares/requireManagerOrOwner.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { requireDatabase } from '../lib/requireDatabase.js';
import { resolveBranchId } from '../lib/resolveBranch.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as branchService from '../services/branchService.js';
import * as calendarService from '../services/calendarService.js';
import * as posService from '../services/posService.js';
import * as posChargeService from '../services/posChargeService.js';
import * as customerService from '../services/customerService.js';
import * as inventoryService from '../services/inventoryService.js';
import * as marketingService from '../services/marketingService.js';
import * as aiService from '../services/aiService.js';
import * as catalogService from '../services/catalogService.js';
import * as customerCreateService from '../services/customerCreateService.js';
import * as customerUpdateService from '../services/customerUpdateService.js';
import * as notificationsService from '../services/notificationsService.js';

const modulesApp = express.Router();

modulesApp.use(verifyToken);
modulesApp.use(requireDatabase);
modulesApp.use(attachTenantContext);

modulesApp.get(
  `${API_PREFIX}/branches`,
  asyncHandler(async (req, res) => {
    res.json(await branchService.listBranches(req.context.orgId));
  }),
);

modulesApp.get(
  `${API_PREFIX}/calendar`,
  asyncHandler(async (req, res) => {
    const branchId = await resolveBranchId(
      req.context.orgId,
      req.query.branchId,
      req.context.branchId,
      req.context.branchIds,
    );
    if (!branchId) {
      res.status(400).json({ error: { code: 'BRANCH_REQUIRED', message: 'No branch available' } });
      return;
    }
    const dayOffset = Number(req.query.dayOffset ?? 0);
    res.json(await calendarService.getCalendar(req.context.orgId, branchId, dayOffset));
  }),
);

modulesApp.post(
  `${API_PREFIX}/calendar/appointments`,
  requirePermission('calendar:write'),
  asyncHandler(async (req, res) => {
    const branchId = await resolveBranchId(
      req.context.orgId,
      req.body?.branchId,
      req.context.branchId,
      req.context.branchIds,
    );
    if (!branchId) {
      res.status(400).json({ error: { code: 'BRANCH_REQUIRED', message: 'No branch available' } });
      return;
    }
    try {
      const appt = await calendarService.createAppointment(req.context.orgId, branchId, req.body ?? {});
      res.status(201).json(appt);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: { message: e.message ?? 'Could not create appointment' } });
    }
  }),
);

modulesApp.patch(
  `${API_PREFIX}/calendar/appointments/:id`,
  requirePermission('calendar:write'),
  asyncHandler(async (req, res) => {
    try {
      const appt = await calendarService.patchAppointmentStatus(
        req.context.orgId,
        req.params.id,
        req.body?.status,
      );
      res.json(appt);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: { message: e.message ?? 'Could not update appointment' } });
    }
  }),
);

modulesApp.post(
  `${API_PREFIX}/catalog`,
  requireManagerOrOwner,
  asyncHandler(async (req, res) => {
    try {
      const item = await catalogService.createCatalogItem(req.context.orgId, req.body ?? {});
      res.status(201).json({ item });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: { message: e.message ?? 'Could not create catalog item' } });
    }
  }),
);

modulesApp.patch(
  `${API_PREFIX}/catalog/:id`,
  requireManagerOrOwner,
  asyncHandler(async (req, res) => {
    try {
      const item = await catalogService.updateCatalogItem(req.context.orgId, req.params.id, req.body ?? {});
      res.json({ item });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: { message: e.message ?? 'Could not update catalog item' } });
    }
  }),
);

modulesApp.delete(
  `${API_PREFIX}/catalog/:id`,
  requireManagerOrOwner,
  asyncHandler(async (req, res) => {
    try {
      const result = await catalogService.deleteCatalogItem(req.context.orgId, req.params.id);
      res.json(result);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: { message: e.message ?? 'Could not delete catalog item' } });
    }
  }),
);

modulesApp.post(
  `${API_PREFIX}/customers`,
  requireManagerOrOwner,
  asyncHandler(async (req, res) => {
    try {
      const customer = await customerCreateService.createCustomer(
        req.context.orgId,
        req.body ?? {},
        req.context.branchId,
      );
      res.status(201).json({ customer });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: { message: e.message ?? 'Could not create customer' } });
    }
  }),
);

modulesApp.post(
  `${API_PREFIX}/pos/charge`,
  asyncHandler(async (req, res) => {
    const branchId = await resolveBranchId(
      req.context.orgId,
      req.body?.branchId,
      req.context.branchId,
      req.context.branchIds,
    );
    if (!branchId) {
      res.status(400).json({ error: { code: 'BRANCH_REQUIRED', message: 'No branch available' } });
      return;
    }
    try {
      res.status(201).json(await posChargeService.chargePos(req.context.orgId, branchId, req.body ?? {}));
    } catch (e) {
      res.status(e.status ?? 500).json({ error: { message: e.message ?? 'Could not record charge' } });
    }
  }),
);

modulesApp.get(
  `${API_PREFIX}/pos/catalog`,
  asyncHandler(async (req, res) => {
    const branchId = await resolveBranchId(
      req.context.orgId,
      req.query.branchId,
      req.context.branchId,
      req.context.branchIds,
    );
    if (!branchId) {
      res.status(400).json({ error: { code: 'BRANCH_REQUIRED', message: 'No branch available' } });
      return;
    }
    res.json(await posService.getPosCatalog(req.context.orgId, branchId));
  }),
);

modulesApp.get(
  `${API_PREFIX}/customers`,
  asyncHandler(async (req, res) => {
    res.json(
      await customerService.listCustomers(req.context.orgId, {
        q: String(req.query.q ?? ''),
        tier: String(req.query.tier ?? 'all'),
      }),
    );
  }),
);

modulesApp.patch(
  `${API_PREFIX}/customers/:id`,
  requireManagerOrOwner,
  asyncHandler(async (req, res) => {
    try {
      const customer = await customerUpdateService.updateCustomer(
        req.context.orgId,
        req.params.id,
        req.body ?? {},
      );
      res.json({ customer });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: { message: e.message ?? 'Could not update customer' } });
    }
  }),
);

modulesApp.delete(
  `${API_PREFIX}/customers/:id`,
  requireManagerOrOwner,
  asyncHandler(async (req, res) => {
    try {
      const result = await customerUpdateService.deleteCustomer(req.context.orgId, req.params.id);
      res.json(result);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: { message: e.message ?? 'Could not delete customer' } });
    }
  }),
);

modulesApp.get(
  `${API_PREFIX}/notifications`,
  asyncHandler(async (req, res) => {
    const branchId = await resolveBranchId(
      req.context.orgId,
      req.query.branchId,
      req.context.branchId,
      req.context.branchIds,
    );
    if (!branchId) {
      res.status(400).json({ error: { code: 'BRANCH_REQUIRED', message: 'No branch available' } });
      return;
    }
    res.json(await notificationsService.getNotifications(req.context.orgId, branchId));
  }),
);

modulesApp.get(
  `${API_PREFIX}/inventory`,
  asyncHandler(async (req, res) => {
    res.json(await inventoryService.getInventory(req.context.orgId));
  }),
);

modulesApp.get(
  `${API_PREFIX}/marketing`,
  asyncHandler(async (req, res) => {
    res.json(await marketingService.getMarketing(req.context.orgId));
  }),
);

modulesApp.get(
  `${API_PREFIX}/ai/studio`,
  asyncHandler(async (req, res) => {
    res.json(await aiService.getAiStudio(req.context.orgId));
  }),
);

export default modulesApp;