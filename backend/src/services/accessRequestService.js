import * as accessRequestModel from '../models/accessRequestModel.js';
import { ensureAuthUserWithPassword } from './authUserService.js';
import { upsertProfile } from '../models/tenantModel.js';

export async function submitAccessRequest(body) {
  const email = body.email?.trim();
  const fullName = body.fullName?.trim() ?? body.full_name?.trim();
  const password = body.password;

  if (!email || !fullName) {
    const err = new Error('fullName and email are required');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  if (!password || String(password).length < 6) {
    const err = new Error('password is required (min 6 characters)');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const authUserId = await ensureAuthUserWithPassword({ email, password, fullName });

  await upsertProfile({
    id: authUserId,
    email: email.toLowerCase(),
    user_metadata: { full_name: fullName },
  });

  // Public form is for new business owners only — managers/staff join via owner/manager in CRM.
  const requestedRole = 'OWNER';

  const result = await accessRequestModel.createAccessRequest({
    email,
    fullName,
    phone: body.phone?.trim(),
    companyName: body.companyName?.trim() ?? body.company_name?.trim(),
    message: body.message?.trim(),
    authUserId,
    requestedRole,
  });

  if (result.duplicate) {
    const err = new Error('You already have a pending access request for this email');
    err.status = 409;
    err.code = 'DUPLICATE_REQUEST';
    throw err;
  }

  return {
    ok: true,
    message:
      'Request submitted. Your login is ready — after superadmin approves, sign in with this email and password.',
    request: result.request,
  };
}