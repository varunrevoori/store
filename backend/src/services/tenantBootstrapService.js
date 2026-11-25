import { PRISMA_ROLE_TO_API } from '@lon-crm/shared';
import { createTtlCache } from '../lib/ttlCache.js';
import { findPrimaryMembershipForProfile, upsertProfile } from '../models/tenantModel.js';
import { resolveBranchId } from '../lib/resolveBranch.js';

const bootstrapCache = createTtlCache(45_000);

/** Login/bootstrap: pick the user's org from org_member (no X-Org-Id required). */
export async function bootstrapForAuthUser(authUser) {
  if (!authUser?.id) return null;

  const cached = bootstrapCache.get(authUser.id);
  if (cached) return cached;

  let membership = await findPrimaryMembershipForProfile(authUser.id);
  if (!membership) {
    await upsertProfile(authUser);
    membership = await findPrimaryMembershipForProfile(authUser.id);
    if (!membership) return null;
  }

  const branchIds =
    membership.branches.length > 0
      ? membership.branches.map((b) => b.branchId)
      : membership.org.branches.map((b) => b.id);

  const branchId = await resolveBranchId(membership.orgId, null, null, branchIds);
  const role = PRISMA_ROLE_TO_API[membership.role] ?? 'viewer';

  const payload = {
    orgId: membership.org.id,
    orgSlug: membership.org.slug,
    orgName: membership.org.name,
    vertical: membership.org.vertical,
    role,
    branches: membership.org.branches,
    branchId,
    branchIds,
  };
  bootstrapCache.set(authUser.id, payload);
  return payload;
}