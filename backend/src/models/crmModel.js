import { getSupabaseAdmin } from '../lib/supabase.js';

function sb() {
  return getSupabaseAdmin();
}

const APPT_PULSE_COLUMNS =
  'id, branch_id, staff_member_id, customer_name, service_name, starts_at, duration_hours, status, price';

export async function listBranches(orgId) {
  const { data, error } = await sb()
    .from('branch')
    .select('id, name, area, pricing_factor, is_active')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return (data ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    area: b.area,
    factor: Number(b.pricing_factor ?? 1),
  }));
}

export async function getOrgGstin(orgId) {
  const { data } = await sb().from('organization').select('gstin').eq('id', orgId).maybeSingle();
  return data?.gstin ?? null;
}

export async function listCustomers(orgId, { q, tier }) {
  let query = sb()
    .from('customer')
    .select('*, branch:branch_id(name)')
    .eq('org_id', orgId)
    .order('full_name')
    .limit(100);

  if (tier && tier !== 'all') query = query.eq('tier', tier);
  if (q) {
    const esc = String(q).trim().replace(/%/g, '');
    if (esc) {
      query = query.or(`full_name.ilike.%${esc}%,phone.ilike.%${esc}%`);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function countCustomers(orgId) {
  const { count, error } = await sb()
    .from('customer')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId);
  if (error) throw error;
  return count ?? 0;
}

export async function listCatalog(orgId, { servicesOnly, productsOnly } = {}) {
  let query = sb().from('catalog_item').select('*').eq('org_id', orgId).order('name');
  if (servicesOnly) query = query.eq('item_type', 'SERVICE');
  if (productsOnly) query = query.eq('item_type', 'PRODUCT');
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function listAppointmentsForBranch(orgId, branchId, { from, to } = {}) {
  let query = sb()
    .from('appointment')
    .select(APPT_PULSE_COLUMNS)
    .eq('org_id', orgId)
    .eq('branch_id', branchId)
    .order('starts_at');

  if (from) query = query.gte('starts_at', from);
  if (to) query = query.lte('starts_at', to);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** One round-trip for dashboard pulse (all branches). */
export async function listAppointmentsForOrg(orgId, { from, to } = {}) {
  let query = sb()
    .from('appointment')
    .select(APPT_PULSE_COLUMNS)
    .eq('org_id', orgId)
    .order('starts_at');

  if (from) query = query.gte('starts_at', from);
  if (to) query = query.lte('starts_at', to);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function listStaffForOrg(orgId) {
  const { data, error } = await sb()
    .from('org_member')
    .select('id, role, job_title, display_color, stats, profile:profile_id(full_name, email)')
    .eq('org_id', orgId)
    .in('role', ['TEAM', 'MANAGER', 'RECEPTIONIST'])
    .order('created_at');
  if (error) throw error;
  return data ?? [];
}

export async function getOrgMember(orgId, memberId) {
  const { data, error } = await sb()
    .from('org_member')
    .select('id, org_id, role, job_title, display_color, stats, profile_id, profile:profile_id(full_name, email)')
    .eq('org_id', orgId)
    .eq('id', memberId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateOrgMember(orgId, memberId, row) {
  const { data, error } = await sb()
    .from('org_member')
    .update(row)
    .eq('org_id', orgId)
    .eq('id', memberId)
    .select('id, role, job_title, display_color, stats, profile:profile_id(full_name, email)')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteOrgMember(orgId, memberId) {
  const { error } = await sb().from('org_member').delete().eq('org_id', orgId).eq('id', memberId);
  if (error) throw error;
}

export async function updateProfileFields(profileId, fields) {
  const { error } = await sb()
    .from('profile')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', profileId);
  if (error) throw error;
}

export async function listCampaigns(orgId) {
  const { data, error } = await sb()
    .from('campaign')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Appointments that count toward same-day revenue on the dashboard. */
export const COUNTABLE_APPT_STATUSES = ['COMPLETED', 'IN_PROGRESS'];

/** Revenue + completed service count per staff_member.id for a period. */
export async function staffAppointmentRollup(orgId, { from, to, branchId } = {}) {
  let query = sb()
    .from('appointment')
    .select('staff_member_id, price, status')
    .eq('org_id', orgId)
    .gte('starts_at', from)
    .lte('starts_at', to)
    .in('status', COUNTABLE_APPT_STATUSES);

  if (branchId) query = query.eq('branch_id', branchId);

  const { data, error } = await query;
  if (error) throw error;

  const byStaff = new Map();
  for (const row of data ?? []) {
    const id = row.staff_member_id;
    if (!id) continue;
    const prev = byStaff.get(id) ?? { revenue: 0, services: 0 };
    prev.revenue += Number(row.price ?? 0);
    prev.services += 1;
    byStaff.set(id, prev);
  }
  return byStaff;
}

export async function countNewCustomersSince(orgId, sinceIso, branchId = null) {
  let query = sb()
    .from('customer')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gte('created_at', sinceIso);
  if (branchId) query = query.eq('branch_id', branchId);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function insertCatalogItem(orgId, row) {
  const { data, error } = await sb()
    .from('catalog_item')
    .insert({ org_id: orgId, ...row })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function insertCustomer(orgId, row) {
  const { data, error } = await sb().from('customer').insert({ org_id: orgId, ...row }).select('*').single();
  if (error) throw error;
  return data;
}

export async function getCustomerById(orgId, id) {
  const { data, error } = await sb()
    .from('customer')
    .select('*, branch:branch_id(name)')
    .eq('org_id', orgId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Match stored phone (exact or same digits, e.g. +91 vs 10-digit). */
export async function findCustomerByPhone(orgId, phone) {
  const trimmed = String(phone ?? '').trim();
  if (!trimmed) return null;

  const { data: exact, error: exactErr } = await sb()
    .from('customer')
    .select('*')
    .eq('org_id', orgId)
    .eq('phone', trimmed)
    .maybeSingle();
  if (exactErr) throw exactErr;
  if (exact) return exact;

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 6) return null;

  const { data: rows, error } = await sb()
    .from('customer')
    .select('*')
    .eq('org_id', orgId)
    .ilike('phone', `%${digits.slice(-10)}%`)
    .limit(20);
  if (error) throw error;

  const norm = digits.length >= 10 ? digits.slice(-10) : digits;
  return (
    (rows ?? []).find((r) => {
      const d = String(r.phone ?? '').replace(/\D/g, '');
      if (!d) return false;
      return d === digits || d.endsWith(norm) || digits.endsWith(d.slice(-10));
    }) ?? null
  );
}

export async function updateCustomer(orgId, id, row) {
  const { data, error } = await sb()
    .from('customer')
    .update(row)
    .eq('org_id', orgId)
    .eq('id', id)
    .select('*, branch:branch_id(name)')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCustomer(orgId, id) {
  const { error } = await sb().from('customer').delete().eq('org_id', orgId).eq('id', id);
  if (error) throw error;
}

export async function getCatalogItemById(orgId, id) {
  const { data, error } = await sb()
    .from('catalog_item')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateCatalogItem(orgId, id, row) {
  const { data, error } = await sb()
    .from('catalog_item')
    .update(row)
    .eq('org_id', orgId)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCatalogItem(orgId, id) {
  const { error } = await sb().from('catalog_item').delete().eq('org_id', orgId).eq('id', id);
  if (error) throw error;
}

export async function insertAppointment(row) {
  const { data, error } = await sb().from('appointment').insert(row).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateAppointment(orgId, id, patch) {
  const { data, error } = await sb()
    .from('appointment')
    .update(patch)
    .eq('org_id', orgId)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function getAppointment(orgId, id) {
  const { data, error } = await sb()
    .from('appointment')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Count appointments per IST day offset for one branch (inclusive range). */
export async function listAppointmentStartsForRange(orgId, branchId, from, to) {
  const { data, error } = await sb()
    .from('appointment')
    .select('starts_at')
    .eq('org_id', orgId)
    .eq('branch_id', branchId)
    .gte('starts_at', from)
    .lt('starts_at', to);
  if (error) throw error;
  return data ?? [];
}

export async function countLapsedCustomers(orgId, days = 60) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await sb()
    .from('customer')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gte('visit_count', 3)
    .lt('last_visit_at', cutoff);
  if (error) throw error;
  return count ?? 0;
}