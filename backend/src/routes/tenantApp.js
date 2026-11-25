import { API_PREFIX } from '@lon-crm/shared';
import express from 'express';
import verifyToken from '../Middlewares/verifyToken.js';
import { requireDatabase } from '../lib/requireDatabase.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as tenantBootstrapService from '../services/tenantBootstrapService.js';

const tenantApp = express.Router();

tenantApp.get(
  `${API_PREFIX}/tenant/bootstrap`,
  verifyToken,
  requireDatabase,
  asyncHandler(async (req, res) => {
    const payload = await tenantBootstrapService.bootstrapForAuthUser(req.authUser);
    if (!payload) {
      res.status(404).json({
        error: {
          code: 'NO_ORG',
          message: 'No organization linked to this account yet.',
        },
      });
      return;
    }
    res.json(payload);
  }),
);

export default tenantApp;