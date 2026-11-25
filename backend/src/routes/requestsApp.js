import { API_PREFIX } from '@lon-crm/shared';
import express from 'express';
import verifyToken from '../Middlewares/verifyToken.js';
import { requireDatabase } from '../lib/requireDatabase.js';
import attachTenantContext from '../Middlewares/attachTenantContext.js';
import requireManagerOrOwner from '../Middlewares/requireManagerOrOwner.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as platformRequestService from '../services/platformRequestService.js';

const requestsApp = express.Router();

requestsApp.use(verifyToken);
requestsApp.use(requireDatabase);
requestsApp.use(attachTenantContext);

requestsApp.get(
  `${API_PREFIX}/platform-requests`,
  requireManagerOrOwner,
  asyncHandler(async (req, res) => {
    const orgId = req.context.orgId;
    const requests = await platformRequestService.listRequests(orgId);
    res.json({ requests });
  }),
);

requestsApp.post(
  `${API_PREFIX}/platform-requests`,
  requireManagerOrOwner,
  asyncHandler(async (req, res) => {
    const created = await platformRequestService.createRequest(req.context, req.body ?? {});
    res.status(201).json({ message: 'request submitted for superadmin review', request: created });
  }),
);

export default requestsApp;