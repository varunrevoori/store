import { getSupabaseAdmin } from '../lib/supabase.js';

/** Apply approved platform_request side effects (service role). */
export async function applyApprovedPlatformRequest(request) {
  if (!request || request.status !== 'APPROVED') return;

  const sb = getSupabaseAdmin();
  const type = request.type;
  const payload = request.payload ?? {};
  const orgId = request.orgId;

  if (type === 'NEW_BRANCH' && orgId) {
    const name = payload.name ?? payload.branchName ?? 'New branch';
    const area = payload.area ?? null;
    const timezone = payload.timezone ?? 'Asia/Kolkata';
    const { error } = await sb.from('branch').insert({
      org_id: orgId,
      name,
      area,
      timezone,
      is_active: true,
    });
    if (error) throw error;
    return;
  }

  if (type === 'VERTICAL_CHANGE' && orgId && payload.vertical) {
    const { error } = await sb
      .from('organization')
      .update({ vertical: payload.vertical, updated_at: new Date().toISOString() })
      .eq('id', orgId);
    if (error) throw error;
    return;
  }

  if (type === 'BILLING_PLAN' && orgId) {
    const { data: org, error: readErr } = await sb
      .from('organization')
      .select('settings')
      .eq('id', orgId)
      .maybeSingle();
    if (readErr) throw readErr;
    const settings = { ...(org?.settings ?? {}), billing: { ...(org?.settings?.billing ?? {}), ...payload } };
    const { error } = await sb
      .from('organization')
      .update({ settings, updated_at: new Date().toISOString() })
      .eq('id', orgId);
    if (error) throw error;
    return;
  }

  if (type === 'FEATURE_FLAG' && orgId) {
    const { data: org, error: readErr } = await sb
      .from('organization')
      .select('settings')
      .eq('id', orgId)
      .maybeSingle();
    if (readErr) throw readErr;
    const features = { ...(org?.settings?.features ?? {}), ...(payload.features ?? payload) };
    const settings = { ...(org?.settings ?? {}), features };
    const { error } = await sb
      .from('organization')
      .update({ settings, updated_at: new Date().toISOString() })
      .eq('id', orgId);
    if (error) throw error;
  }
}