import { API_PREFIX } from '@lon-crm/shared';
import express from 'express';
import verifyPlatformAdmin from '../Middlewares/verifyPlatformAdmin.js';
import { requireDatabase } from '../lib/requireDatabase.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as platformAdminService from '../services/platformAdminService.js';

/** Superadmin only — mounted at `${API_PREFIX}/admin` (no global tenant middleware). */
const platformAdminApp = express.Router();

platformAdminApp.use(requireDatabase);
platformAdminApp.use(verifyPlatformAdmin);

platformAdminApp.get(
  '/organizations',
  asyncHandler(async (_req, res) => {
    const organizations = await platformAdminService.listOrganizations();
    res.json({ organizations });
  }),
);

platformAdminApp.get(
  '/access-requests',
  asyncHandler(async (req, res) => {
    const status = String(req.query.status ?? 'PENDING').toUpperCase();
    const requests = await platformAdminService.listAccessRequests(status);
    res.json({ requests });
  }),
);

platformAdminApp.post(
  '/access-requests/:id/approve',
  asyncHandler(async (req, res) => {
    const reviewerId = req.authUser.id;
    const result = await platformAdminService.approveAccessRequest(req.params.id, reviewerId, {
      reviewNote: req.body?.reviewNote,
      vertical: req.body?.vertical,
      createOrg: req.body?.createOrg,
      orgRole: req.body?.orgRole ?? req.body?.role,
    });
    res.json({ message: 'access approved', ...result });
  }),
);

platformAdminApp.post(
  '/access-requests/:id/reject',
  asyncHandler(async (req, res) => {
    const reviewerId = req.authUser.id;
    const request = await platformAdminService.rejectAccessRequest(
      req.params.id,
      reviewerId,
      req.body?.reviewNote,
    );
    res.json({ message: 'access rejected', request });
  }),
);

platformAdminApp.get(
  '/platform-requests',
  asyncHandler(async (req, res) => {
    const status = String(req.query.status ?? 'PENDING').toUpperCase();
    const requests = await platformAdminService.listPlatformRequests(status);
    res.json({ requests });
  }),
);

platformAdminApp.get(
  '/platform-requests/:id',
  asyncHandler(async (req, res) => {
    const request = await platformAdminService.getPlatformRequest(req.params.id);
    if (!request) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'request not found' } });
      return;
    }
    res.json({ request });
  }),
);

platformAdminApp.post(
  '/platform-requests/:id/approve',
  asyncHandler(async (req, res) => {
    const reviewerId = req.authUser.id;
    const request = await platformAdminService.decidePlatformRequest(req.params.id, reviewerId, {
      status: 'APPROVED',
      reviewNote: req.body?.reviewNote,
    });
    res.json({ message: 'request approved', request });
  }),
);

platformAdminApp.post(
  '/platform-requests/:id/reject',
  asyncHandler(async (req, res) => {
    const reviewerId = req.authUser.id;
    const request = await platformAdminService.decidePlatformRequest(req.params.id, reviewerId, {
      status: 'REJECTED',
      reviewNote: req.body?.reviewNote,
    });
    res.json({ message: 'request rejected', request });
  }),
);

export function mountPlatformAdminRoutes(apiRouter) {
  apiRouter.use(`${API_PREFIX}/admin`, platformAdminApp);
}

export default platformAdminApp;