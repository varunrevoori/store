import { getSupabaseAdmin } from '../lib/supabase.js';
import * as accessRequestModel from '../models/accessRequestModel.js';
import * as platformRequestModel from '../models/platformRequestModel.js';
import { applyApprovedPlatformRequest } from './decidePlatformRequest.js';

function slugify(text) {
  const base = String(text ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'org';
}

async function uniqueOrgSlug(name) {
  const sb = getSupabaseAdmin();
  let slug = slugify(name);
  let attempt = 0;
  for (;;) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt}`;
    const { data } = await sb.from('organization').select('id').eq('slug', candidate).maybeSingle();
    if (!data) return candidate;
    attempt += 1;
  }
}

async function resolveAuthUserIdForAccessRequest(row) {
  if (row.authUserId) {
    return { userId: row.authUserId, invited: false };
  }

  const sb = getSupabaseAdmin();
  const email = String(row.email).trim().toLowerCase();
  const { data: prof } = await sb.from('profile').select('id').eq('email', email).maybeSingle();
  if (prof?.id) {
    return { userId: prof.id, invited: false };
  }

  const err = new Error(
    'No login account linked to this request. Ask the applicant to submit a new request with a password.',
  );
  err.status = 400;
  err.code = 'NO_AUTH_USER';
  throw err;
}

async function provisionOwnerOrg({ userId, email, fullName, companyName, vertical, orgRole }) {
  if (!userId) return null;

  const sb = getSupabaseAdmin();
  const orgName = companyName?.trim() || fullName || email.split('@')[0];
  const slug = await uniqueOrgSlug(orgName);
  const vert = vertical ?? 'SALON';

  const { data: org, error: orgErr } = await sb
    .from('organization')
    .insert({ name: orgName, slug, vertical: vert, settings: {} })
    .select('id, slug, name')
    .single();
  if (orgErr) throw orgErr;

  await sb.from('profile').upsert({
    id: userId,
    email,
    full_name: fullName,
    updated_at: new Date().toISOString(),
  });

  const memberRole = orgRole ?? 'OWNER';
  await sb.from('org_member').insert({
    org_id: org.id,
    profile_id: userId,
    role: memberRole,
  });

  const { data: branch, error: branchErr } = await sb
    .from('branch')
    .insert({
      org_id: org.id,
      name: 'Main',
      area: null,
      timezone: 'Asia/Kolkata',
      is_active: true,
    })
    .select('id')
    .single();
  if (branchErr) throw branchErr;

  const { data: member } = await sb
    .from('org_member')
    .select('id')
    .eq('org_id', org.id)
    .eq('profile_id', userId)
    .single();

  if (member?.id && branch?.id) {
    await sb.from('org_member_branch').insert({ member_id: member.id, branch_id: branch.id });
  }

  return org;
}

export async function listOrganizations() {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('organization')
    .select('id, name, slug, vertical, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    vertical: row.vertical,
    createdAt: row.created_at,
  }));
}

export async function listAccessRequests(status) {
  return accessRequestModel.listByStatus(status ?? 'PENDING');
}

export async function listPlatformRequests(status) {
  return platformRequestModel.listByStatus(status ?? 'PENDING');
}

export async function getPlatformRequest(id) {
  return platformRequestModel.findById(id);
}

export async function rejectAccessRequest(id, reviewerId, reviewNote) {
  const row = await accessRequestModel.findById(id);
  if (!row) {
    const err = new Error('Request not found');
    err.status = 404;
    throw err;
  }
  if (row.status !== 'PENDING') {
    const err = new Error('Request is not pending');
    err.status = 409;
    throw err;
  }
  return accessRequestModel.decideAccessRequest(id, {
    status: 'REJECTED',
    reviewedBy: reviewerId,
    reviewNote,
  });
}

export async function approveAccessRequest(id, reviewerId, options = {}) {
  const row = await accessRequestModel.findById(id);
  if (!row) {
    const err = new Error('Request not found');
    err.status = 404;
    throw err;
  }
  if (row.status !== 'PENDING') {
    const err = new Error('Request is not pending');
    err.status = 409;
    throw err;
  }

  const createOrg = options.createOrg !== false;
  const { userId } = await resolveAuthUserIdForAccessRequest(row);
  const orgRole = 'OWNER';

  let org = null;
  if (createOrg && userId) {
    org = await provisionOwnerOrg({
      userId,
      email: row.email,
      fullName: row.fullName,
      companyName: row.companyName,
      vertical: options.vertical,
      orgRole,
    });
  } else if (userId) {
    await getSupabaseAdmin().from('profile').upsert({
      id: userId,
      email: row.email,
      full_name: row.fullName,
      updated_at: new Date().toISOString(),
    });
  }

  const updated = await accessRequestModel.decideAccessRequest(id, {
    status: 'APPROVED',
    reviewedBy: reviewerId,
    reviewNote: options.reviewNote ?? (org ? `Org ${org.slug} created` : null),
  });

  return { request: updated, org, userId };
}

export async function decidePlatformRequest(id, reviewerId, { status, reviewNote }) {
  const normalized = String(status ?? '').toUpperCase();
  if (normalized !== 'APPROVED' && normalized !== 'REJECTED') {
    const err = new Error('status must be APPROVED or REJECTED');
    err.status = 400;
    throw err;
  }

  const existing = await platformRequestModel.findById(id);
  if (!existing) {
    const err = new Error('Request not found');
    err.status = 404;
    throw err;
  }
  if (existing.status !== 'PENDING') {
    const err = new Error('Request is not pending');
    err.status = 409;
    throw err;
  }

  const updated = await platformRequestModel.decideRequest(id, {
    status: normalized,
    reviewedBy: reviewerId,
    reviewNote,
  });

  if (normalized === 'APPROVED') {
    await applyApprovedPlatformRequest(updated);
  }

  return updated;
}