import { getSupabaseAdmin } from '../lib/supabase.js';
import { isDatabaseConfigured, upsertProfile } from './tenantModel.js';

export async function findActiveAdminUser(userId) {
  if (!isDatabaseConfigured() || !userId) return null;

  const { data, error } = await getSupabaseAdmin()
    .from('admin_users')
    .select(
      'user_id, email, full_name, role, is_active, organization_id, approved_by, created_at',
    )
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('role', 'super_admin')
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Platform Admin app — only role: super_admin */
export async function isSuperAdmin(userId) {
  const row = await findActiveAdminUser(userId);
  return Boolean(row);
}

/** @deprecated alias */
export async function isConsoleAdmin(userId) {
  return isSuperAdmin(userId);
}

export async function isPlatformAdmin(userId) {
  return isSuperAdmin(userId);
}

/**
 * If admin_users has this email but a different user_id (manual SQL mistake),
 * re-link the row to the current Auth user.
 */
export async function reconcileSuperAdminByEmail(user) {
  if (!isDatabaseConfigured() || !user?.id || !user?.email) return false;

  if (await isSuperAdmin(user.id)) return true;

  const email = user.email.trim().toLowerCase();
  const sb = getSupabaseAdmin();
  const { data: byEmail, error } = await sb
    .from('admin_users')
    .select('user_id, email, role, is_active')
    .eq('is_active', true)
    .eq('role', 'super_admin')
    .ilike('email', email)
    .maybeSingle();

  if (error) throw error;
  if (!byEmail) return false;
  if (byEmail.user_id === user.id) return true;

  await upsertProfile(user);
  const { error: delErr } = await sb.from('admin_users').delete().eq('user_id', byEmail.user_id);
  if (delErr) throw delErr;
  await grantSuperAdmin(user);
  return isSuperAdmin(user.id);
}

/** Upsert super_admin row (used after SQL grant or dev bootstrap). */
export async function grantSuperAdmin(user) {
  if (!isDatabaseConfigured() || !user?.id) return null;

  const fullName =
    user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Superadmin';

  const { data, error } = await getSupabaseAdmin()
    .from('admin_users')
    .upsert(
      {
        user_id: user.id,
        email: user.email ?? null,
        full_name: fullName,
        role: 'super_admin',
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}