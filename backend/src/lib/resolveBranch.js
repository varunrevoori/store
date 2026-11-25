import { findOrganizationByIdOrSlug } from '../models/tenantModel.js';

/**
 * @param {string} orgId
 * @param {string | undefined} queryBranchId
 * @param {string | null} contextBranchId
 * @param {string[]} allowedBranchIds
 */
export async function resolveBranchId(orgId, queryBranchId, contextBranchId, allowedBranchIds) {
  const allowed = allowedBranchIds?.length
    ? allowedBranchIds
    : (await findOrganizationByIdOrSlug(orgId))?.branches?.map((b) => b.id) ?? [];

  const candidate = queryBranchId || contextBranchId;
  if (candidate && allowed.includes(candidate)) return candidate;
  return allowed[0] ?? null;
}

export async function getBranchPricingFactor(orgId, branchId) {
  const org = await findOrganizationByIdOrSlug(orgId);
  if (!org) return { branch: null, factor: 1, org: null, branches: [] };
  const branch = org.branches.find((b) => b.id === branchId) ?? org.branches[0] ?? null;
  const factor = branch?.factor ?? 1;
  return { branch, factor, org, branches: org.branches ?? [] };
}