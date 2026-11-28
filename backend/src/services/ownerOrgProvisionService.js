import { getSupabaseAdmin } from '../lib/supabase.js';

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

/** Create org + main branch + owner membership for a newly approved business owner. */
export async function provisionOwnerOrg({ userId, email, fullName, phone, companyName, vertical, orgRole }) {
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

  const profileRow = {
    id: userId,
    email,
    full_name: fullName,
    updated_at: new Date().toISOString(),
  };
  if (phone?.trim()) {
    profileRow.phone = phone.trim();
  }
  await sb.from('profile').upsert(profileRow);

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