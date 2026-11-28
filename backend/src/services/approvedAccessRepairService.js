import { getSupabaseAdmin } from '../lib/supabase.js';
import { findPrimaryMembershipForProfile, upsertProfile } from '../models/tenantModel.js';
import { provisionOwnerOrg } from './ownerOrgProvisionService.js';

/**
 * Approved in superadmin but no org_member (manual SQL approve, partial failure, or auth user id drift).
 * Idempotent — safe to run on every bootstrap miss.
 */
export async function repairApprovedOwnerIfNeeded(authUser) {
  if (!authUser?.id) return false;

  const existing = await findPrimaryMembershipForProfile(authUser.id);
  if (existing) return false;

  const sb = getSupabaseAdmin();
  const email = String(authUser.email ?? '').trim().toLowerCase();
  if (!email) return false;

  let approved = null;
  const { data: byAuth, error: byAuthErr } = await sb
    .from('access_request')
    .select('*')
    .eq('status', 'APPROVED')
    .eq('auth_user_id', authUser.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!byAuthErr) {
    approved = byAuth;
  }

  if (!approved) {
    const { data: byEmail } = await sb
      .from('access_request')
      .select('*')
      .eq('status', 'APPROVED')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    approved = byEmail;
  }

  if (!approved) return false;

  if (approved.auth_user_id == null) {
    const { error: linkErr } = await sb
      .from('access_request')
      .update({ auth_user_id: authUser.id, updated_at: new Date().toISOString() })
      .eq('id', approved.id);
    if (linkErr) {
      console.warn('[repair] could not link auth_user_id on access_request', linkErr.message);
    }
  }

  await upsertProfile(authUser);

  const { data: profiles } = await sb.from('profile').select('id').eq('email', email);
  for (const prof of profiles ?? []) {
    if (prof.id === authUser.id) continue;
    const { data: members } = await sb.from('org_member').select('id').eq('profile_id', prof.id);
    for (const member of members ?? []) {
      const { error } = await sb.from('org_member').update({ profile_id: authUser.id }).eq('id', member.id);
      if (!error) return true;
    }
  }

  await provisionOwnerOrg({
    userId: authUser.id,
    email: approved.email ?? email,
    fullName: approved.full_name,
    phone: approved.phone,
    companyName: approved.company_name,
    vertical: undefined,
    orgRole: approved.requested_role ?? 'OWNER',
  });
  return true;
}