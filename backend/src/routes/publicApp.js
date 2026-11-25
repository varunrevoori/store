import { API_PREFIX } from '@lon-crm/shared';
import express from 'express';
import { requireDatabase } from '../lib/requireDatabase.js';
import * as publicBookingService from '../services/publicBookingService.js';
import * as accessRequestService from '../services/accessRequestService.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const publicApp = express.Router();

publicApp.use(requireDatabase);

publicApp.get(
  `${API_PREFIX}/public/booking/options`,
  asyncHandler(async (req, res) => {
    const org = String(req.query.org ?? 'lon-demo');
    res.json(await publicBookingService.getBookingOptions(org));
  }),
);

publicApp.post(
  `${API_PREFIX}/public/booking`,
  asyncHandler(async (req, res) => {
    res.json(await publicBookingService.createBooking(req.body ?? {}));
  }),
);

publicApp.post(
  `${API_PREFIX}/public/access-request`,
  asyncHandler(async (req, res) => {
    const payload = await accessRequestService.submitAccessRequest(req.body ?? {});
    res.status(201).json(payload);
  }),
);

publicApp.post(
  `${API_PREFIX}/public/feedback`,
  asyncHandler(async (req, res) => {
    res.json(publicBookingService.submitFeedback(req.body ?? {}));
  }),
);

export default publicApp;