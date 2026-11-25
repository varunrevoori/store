import { getSupabaseAdmin } from '../lib/supabase.js';
import { assertCanAssignStaffRole } from '../lib/staffRolePolicy.js';
import { ensureAuthUserWithPassword } from './authUserService.js';
import { upsertProfile } from '../models/tenantModel.js';

export async function provisionStaffMember(ctx, body) {
  const email = body.email?.trim();
  const fullName = body.fullName?.trim() ?? body.full_name?.trim();
  const password = body.password;
  const jobTitle = body.jobTitle?.trim() ?? body.job_title?.trim() ?? 'Staff';

  if (!email || !fullName) {
    const err = new Error('email and fullName are required');
    err.status = 400;
    throw err;
  }
  if (!password || String(password).length < 6) {
    const err = new Error('password is required for new staff (min 6 characters)');
    err.status = 400;
    throw err;
  }

  const orgRole = assertCanAssignStaffRole(ctx.role, body.role);
  const sb = getSupabaseAdmin();
  const normalized = email.toLowerCase();

  const { data: prof } = await sb.from('profile').select('id').eq('email', normalized).maybeSingle();
  if (prof?.id) {
    const { data: existingMember } = await sb
      .from('org_member')
      .select('id')
      .eq('org_id', ctx.orgId)
      .eq('profile_id', prof.id)
      .maybeSingle();
    if (existingMember?.id) {
      const err = new Error('This email is already a member of this organization');
      err.status = 409;
      throw err;
    }
  }

  const userId = await ensureAuthUserWithPassword({ email: normalized, password, fullName });
  await upsertProfile({ id: userId, email: normalized, user_metadata: { full_name: fullName } });

  const branchIds = Array.isArray(body.branchIds)
    ? body.branchIds
    : ctx.branchId
      ? [ctx.branchId]
      : ctx.branchIds?.length
        ? [ctx.branchIds[0]]
        : [];

  const { data: member, error: memErr } = await sb
    .from('org_member')
    .insert({
      org_id: ctx.orgId,
      profile_id: userId,
      role: orgRole,
    })
    .select('id')
    .single();
  if (memErr) throw memErr;

  for (const branchId of branchIds) {
    if (!branchId) continue;
    await sb.from('org_member_branch').insert({ member_id: member.id, branch_id: branchId });
  }

  await sb.from('staff_invite').upsert(
    {
      org_id: ctx.orgId,
      added_by_id: ctx.profileId,
      email: normalized,
      full_name: fullName,
      job_title: jobTitle,
      role: orgRole,
      branch_ids: branchIds,
      status: 'active',
    },
    { onConflict: 'org_id,email' },
  );

  return {
    id: member.id,
    profileId: userId,
    email: normalized,
    fullName,
    role: orgRole,
    branchIds,
  };
}