import { getSupabaseAdmin, isSupabaseConfigured } from '../lib/supabase.js';
import { createTtlCache } from '../lib/ttlCache.js';

export const isDatabaseConfigured = isSupabaseConfigured;

const orgByKeyCache = createTtlCache(45_000);

function admin() {
  return getSupabaseAdmin();
}

export async function findOrganizationByIdOrSlug(idOrSlug) {
  if (!isSupabaseConfigured() || !idOrSlug) return null;

  const cached = orgByKeyCache.get(String(idOrSlug));
  if (cached) return cached;

  const sb = admin();
  const { data: org, error } = await sb
    .from('organization')
    .select('*')
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .maybeSingle();

  if (error || !org) return null;

  const { data: branches } = await sb
    .from('branch')
    .select('id, name, area, timezone, is_active, org_id, created_at, pricing_factor')
    .eq('org_id', org.id)
    .eq('is_active', true);

  const record = {
    id: org.id,
    name: org.name,
    slug: org.slug,
    vertical: org.vertical,
    branches: (branches ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      area: b.area,
      factor: Number(b.pricing_factor ?? 1),
    })),
  };
  orgByKeyCache.set(String(idOrSlug), record);
  orgByKeyCache.set(record.id, record);
  orgByKeyCache.set(record.slug, record);
  return record;
}

export async function findFirstOrganization() {
  if (!isSupabaseConfigured()) return null;

  const sb = admin();
  const { data: org } = await sb
    .from('organization')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!org) return null;
  return findOrganizationByIdOrSlug(org.id);
}

export async function upsertProfile(user) {
  if (!isSupabaseConfigured()) return null;

  const phone = user.phone ?? user.user_metadata?.phone ?? null;
  const fullName = user.user_metadata?.full_name ?? null;
  const email = user.email ?? null;

  const sb = admin();
  const { data, error } = await sb.from('profile').upsert(
    {
      id: user.id,
      phone,
      email,
      full_name: fullName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  ).select().maybeSingle();

  if (error) throw error;
  return data;
}

export async function findPrimaryMembershipForProfile(profileId) {
  if (!isSupabaseConfigured() || !profileId) return null;

  const sb = admin();
  const { data: member, error } = await sb
    .from('org_member')
    .select('id, org_id, profile_id, role, created_at')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !member) return null;

  const [org, memberBranchesResult] = await Promise.all([
    findOrganizationByIdOrSlug(member.org_id),
    sb.from('org_member_branch').select('branch_id').eq('member_id', member.id),
  ]);
  if (!org) return null;

  const { data: memberBranches } = memberBranchesResult;

  return {
    orgId: member.org_id,
    role: member.role,
    org,
    branches: (memberBranches ?? []).map((row) => ({ branchId: row.branch_id })),
  };
}

export async function findMembershipForOrg(profileId, orgIdOrSlug) {
  if (!isSupabaseConfigured()) return null;

  const org = await findOrganizationByIdOrSlug(orgIdOrSlug);
  if (!org) return null;

  const sb = admin();
  const { data: member, error } = await sb
    .from('org_member')
    .select('id, org_id, profile_id, role, created_at')
    .eq('profile_id', profileId)
    .eq('org_id', org.id)
    .maybeSingle();

  if (error || !member) return null;

  const { data: memberBranches } = await sb
    .from('org_member_branch')
    .select('branch_id')
    .eq('member_id', member.id);

  return {
    orgId: member.org_id,
    role: member.role,
    org: {
      id: org.id,
      slug: org.slug,
      name: org.name,
      vertical: org.vertical,
      branches: org.branches,
    },
    branches: (memberBranches ?? []).map((row) => ({ branchId: row.branch_id })),
  };
}