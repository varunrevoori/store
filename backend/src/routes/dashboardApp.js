import { API_PREFIX } from '@lon-crm/shared';
import express from 'express';
import verifyToken from '../Middlewares/verifyToken.js';
import attachTenantContext from '../Middlewares/attachTenantContext.js';
import { requireDatabase } from '../lib/requireDatabase.js';
import { resolveBranchId } from '../lib/resolveBranch.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as dashboardService from '../services/dashboardService.js';

const dashboardApp = express.Router();

dashboardApp.use(verifyToken);
dashboardApp.use(requireDatabase);
dashboardApp.use(attachTenantContext);

dashboardApp.get(
  `${API_PREFIX}/dashboard/summary`,
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
    res.json(await dashboardService.getDashboardSummary(req.context.orgId, branchId));
  }),
);

dashboardApp.get(
  `${API_PREFIX}/dashboard/detail`,
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
    res.json(await dashboardService.getDashboardDetail(req.context.orgId, branchId));
  }),
);

export default dashboardApp;