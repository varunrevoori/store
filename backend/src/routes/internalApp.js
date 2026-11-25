import { API_PREFIX } from '@lon-crm/shared';
import express from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as platformRequestModel from '../models/platformRequestModel.js';
import { applyApprovedPlatformRequest } from '../services/decidePlatformRequest.js';

const internalApp = express.Router();

function verifyPlatformSecret(req, res, next) {
  const expected = process.env.PLATFORM_WEBHOOK_SECRET;
  if (!expected) {
    res.status(503).send({ message: 'PLATFORM_WEBHOOK_SECRET not configured' });
    return;
  }
  if (req.headers['x-platform-secret'] !== expected) {
    res.status(401).send({ message: 'invalid platform secret' });
    return;
  }
  next();
}

/**
 * Optional webhook if an external automation approves platform requests.
 * Body: { status: "APPROVED" | "REJECTED", reviewedBy, reviewNote }
 */
internalApp.post(
  `${API_PREFIX}/internal/platform-requests/:id/decide`,
  verifyPlatformSecret,
  asyncHandler(async (req, res) => {
    const status = String(req.body?.status ?? '').toUpperCase();
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      res.status(400).send({ message: 'status must be APPROVED or REJECTED' });
      return;
    }
    const updated = await platformRequestModel.decideRequest(req.params.id, {
      status,
      reviewedBy: req.body.reviewedBy ?? 'superadmin',
      reviewNote: req.body.reviewNote,
    });
    if (!updated) {
      res.status(404).send({ message: 'request not found' });
      return;
    }
    if (status === 'APPROVED') {
      await applyApprovedPlatformRequest(updated);
    }
    res.json({ message: 'request updated', request: updated });
  }),
);

export default internalApp;