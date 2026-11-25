import * as platformRequestModel from '../models/platformRequestModel.js';

const REQUEST_TYPES = new Set([
  'NEW_BRANCH',
  'VERTICAL_CHANGE',
  'BILLING_PLAN',
  'FEATURE_FLAG',
  'OTHER',
]);

export async function listRequests(orgId) {
  return platformRequestModel.listForOrg(orgId);
}

export async function createRequest(ctx, body) {
  const type = String(body.type ?? 'OTHER').toUpperCase();
  if (!REQUEST_TYPES.has(type)) {
    const err = new Error('Invalid request type');
    err.status = 400;
    throw err;
  }
  if (!body.title?.trim()) {
    const err = new Error('Title is required');
    err.status = 400;
    throw err;
  }

  return platformRequestModel.createRequest({
    orgId: ctx.orgId,
    requestedById: ctx.profileId,
    type,
    title: body.title.trim(),
    description: body.description,
    payload: body.payload ?? {},
  });
}