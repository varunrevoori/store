import { getSupabaseAdmin } from '../lib/supabase.js';

function sb() {
  return getSupabaseAdmin();
}

function isSchemaColumnError(error, column) {
  const msg = String(error?.message ?? '').toLowerCase();
  return msg.includes(column) || msg.includes('schema cache');
}

function isMissingAuthUserIdColumn(error) {
  return isSchemaColumnError(error, 'auth_user_id');
}

function isMissingRequestedRoleColumn(error) {
  return isSchemaColumnError(error, 'requested_role');
}

function mapRow(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    companyName: row.company_name,
    message: row.message,
    authUserId: row.auth_user_id ?? row.authUserId ?? null,
    requestedRole: row.requested_role ?? row.requestedRole ?? null,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function createAccessRequest({
  email,
  fullName,
  phone,
  companyName,
  message,
  authUserId,
  requestedRole,
}) {
  const normalized = String(email).trim().toLowerCase();

  const { data: existing } = await sb()
    .from('access_request')
    .select('id')
    .eq('email', normalized)
    .eq('status', 'PENDING')
    .maybeSingle();

  if (existing) {
    return { duplicate: true };
  }

  const row = {
    email: normalized,
    full_name: fullName,
    phone: phone ?? null,
    company_name: companyName ?? null,
    message: message ?? null,
  };
  if (authUserId) {
    row.auth_user_id = authUserId;
  }
  if (requestedRole) {
    row.requested_role = requestedRole;
  }

  let { data, error } = await sb().from('access_request').insert(row).select().single();

  if (error && authUserId && isMissingAuthUserIdColumn(error)) {
    delete row.auth_user_id;
    ({ data, error } = await sb().from('access_request').insert(row).select().single());
  }
  if (error && requestedRole && isMissingRequestedRoleColumn(error)) {
    delete row.requested_role;
    ({ data, error } = await sb().from('access_request').insert(row).select().single());
  }

  if (error) throw error;
  return { duplicate: false, request: mapRow(data) };
}

export async function listByStatus(status = 'PENDING') {
  let q = sb().from('access_request').select('*').order('created_at', { ascending: false });
  if (status && status !== 'ALL') {
    q = q.eq('status', status);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function findById(id) {
  const { data, error } = await sb().from('access_request').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function decideAccessRequest(id, { status, reviewedBy, reviewNote }) {
  const { data, error } = await sb()
    .from('access_request')
    .update({
      status,
      reviewed_by: reviewedBy,
      review_note: reviewNote ?? null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}