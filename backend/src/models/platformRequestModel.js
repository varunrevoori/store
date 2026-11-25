import { getSupabaseAdmin } from '../lib/supabase.js';

function mapRow(row) {
  if (!row) return row;
  return {
    id: row.id,
    orgId: row.org_id ?? row.orgId,
    requestedById: row.requested_by_id ?? row.requestedById,
    type: row.type,
    title: row.title,
    description: row.description,
    payload: row.payload ?? {},
    status: row.status,
    reviewedBy: row.reviewed_by ?? row.reviewedBy,
    reviewNote: row.review_note ?? row.reviewNote,
    reviewedAt: row.reviewed_at ?? row.reviewedAt,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

export async function listByStatus(status = 'PENDING') {
  let q = getSupabaseAdmin().from('platform_request').select('*').order('created_at', { ascending: false });
  if (status && status !== 'ALL') {
    q = q.eq('status', status);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function listForOrg(orgId) {
  const { data, error } = await getSupabaseAdmin()
    .from('platform_request')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function createRequest({
  orgId,
  requestedById,
  type,
  title,
  description,
  payload,
}) {
  const { data, error } = await getSupabaseAdmin()
    .from('platform_request')
    .insert({
      org_id: orgId,
      requested_by_id: requestedById,
      type,
      title,
      description: description ?? null,
      payload: payload ?? {},
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function decideRequest(id, { status, reviewedBy, reviewNote }) {
  const { data, error } = await getSupabaseAdmin()
    .from('platform_request')
    .update({
      status,
      reviewed_by: reviewedBy,
      review_note: reviewNote,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function findById(id) {
  const { data, error } = await getSupabaseAdmin()
    .from('platform_request')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data) : null;
}