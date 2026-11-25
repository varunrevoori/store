import { getSupabaseAdmin } from '../lib/supabase.js';
import { API_ROLE_TO_PRISMA } from '@lon-crm/shared';

const ALLOWED = ['team', 'receptionist', 'accountant', 'viewer'];

function sb() {
  return getSupabaseAdmin();
}

function toApiRow(row) {
  return {
    id: row.id,
    orgId: row.org_id,
    addedById: row.added_by_id,
    email: row.email,
    fullName: row.full_name,
    jobTitle: row.job_title,
    role: String(row.role).toLowerCase(),
    branchIds: row.branch_ids ?? [],
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function listByOrg(orgId) {
  const { data, error } = await sb()
    .from('staff_invite')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toApiRow);
}

export async function addMember({
  orgId,
  addedById,
  email,
  fullName,
  jobTitle,
  role,
  branchIds,
}) {
  const normalized = String(email).trim().toLowerCase();
  const memberRole = ALLOWED.includes(role) ? role : 'team';
  const prismaRole = API_ROLE_TO_PRISMA[memberRole] ?? 'TEAM';

  const { data: existing } = await sb()
    .from('staff_invite')
    .select('id')
    .eq('org_id', orgId)
    .eq('email', normalized)
    .maybeSingle();

  if (existing) return { exists: true };

  const row = {
    org_id: orgId,
    added_by_id: addedById,
    email: normalized,
    full_name: fullName ?? normalized.split('@')[0],
    job_title: jobTitle ?? 'Staff',
    role: prismaRole,
    branch_ids: Array.isArray(branchIds) ? branchIds : [],
    status: 'active',
  };

  const { data, error } = await sb().from('staff_invite').insert(row).select().single();
  if (error) throw error;
  return { exists: false, member: toApiRow(data) };
}