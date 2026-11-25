import { resolveBranchId } from '../lib/resolveBranch.js';
import { findFirstOrganization, findOrganizationByIdOrSlug } from '../models/tenantModel.js';

export async function getBootstrapContext(ctx, orgHeader) {
  const org = ctx?.orgId
    ? await findOrganizationByIdOrSlug(ctx.orgId)
    : orgHeader
      ? await findOrganizationByIdOrSlug(orgHeader)
      : await findFirstOrganization();

  if (!org) {
    return null;
  }

  const branchIds = ctx?.branchIds?.length ? ctx.branchIds : org.branches.map((b) => b.id);
  const branchId = await resolveBranchId(org.id, null, ctx?.branchId ?? null, branchIds);

  return {
    orgId: org.id,
    orgSlug: org.slug,
    orgName: org.name,
    vertical: org.vertical,
    role: ctx?.role ?? 'manager',
    branches: org.branches,
    branchId,
    branchIds,
  };
}