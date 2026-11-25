import { API_PREFIX } from '@lon-crm/shared';
import express from 'express';
import verifyToken from '../Middlewares/verifyToken.js';
import attachTenantContext from '../Middlewares/attachTenantContext.js';
import requireManagerOrOwner from '../Middlewares/requireManagerOrOwner.js';
import { requireDatabase } from '../lib/requireDatabase.js';
import { resolveBranchId } from '../lib/resolveBranch.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as staffMemberService from '../services/staffMemberService.js';
import * as staffMemberUpdateService from '../services/staffMemberUpdateService.js';
import * as staffService from '../services/staffService.js';

const staffApp = express.Router();

staffApp.use(verifyToken);
staffApp.use(requireDatabase);
staffApp.use(attachTenantContext);

staffApp.get(
  `${API_PREFIX}/staff`,
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
    res.json(await staffService.getStaffPayroll(req.context.orgId, branchId));
  }),
);

staffApp.get(
  `${API_PREFIX}/staff/members`,
  requireManagerOrOwner,
  asyncHandler(async (req, res) => {
    res.json({ members: await staffMemberService.listStaffMembers(req.context.orgId) });
  }),
);

staffApp.post(
  `${API_PREFIX}/staff/members`,
  requireManagerOrOwner,
  asyncHandler(async (req, res) => {
    const member = await staffMemberService.addStaffMember(req.context, req.body ?? {});
    res.status(201).json({ message: 'staff member added', member });
  }),
);

staffApp.patch(
  `${API_PREFIX}/staff/members/:memberId`,
  requireManagerOrOwner,
  asyncHandler(async (req, res) => {
    try {
      const member = await staffMemberUpdateService.updateStaffMember(
        req.context,
        req.params.memberId,
        req.body ?? {},
      );
      res.json({ member });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: { message: e.message ?? 'Could not update staff' } });
    }
  }),
);

staffApp.delete(
  `${API_PREFIX}/staff/members/:memberId`,
  requireManagerOrOwner,
  asyncHandler(async (req, res) => {
    try {
      const result = await staffMemberUpdateService.removeStaffMember(req.context, req.params.memberId);
      res.json(result);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: { message: e.message ?? 'Could not remove staff' } });
    }
  }),
);

export default staffApp;