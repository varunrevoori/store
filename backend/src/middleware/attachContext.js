import { PRISMA_ROLE_TO_API, PRISMA_TO_VERTICAL } from '@lon-crm/shared';
import { getCachedMembership, setCachedMembership } from '../lib/membershipCache.js';
import {
  findFirstOrganization,
  findMembershipForOrg,
  findOrganizationByIdOrSlug,
  findPrimaryMembershipForProfile,
  isDatabaseConfigured,
} from '../models/tenantModel.js';

const DEV_PROFILE_ID = '00000000-0000-0000-0000-000000000001';

function authSkipped() {
  return process.env.SKIP_AUTH === 'true' || process.env.SKIP_AUTH === '1';
}

function orgContextFromRecord(org, devRole) {
  const branchId = org.branches[0]?.id ?? null;
  return {
    profileId: DEV_PROFILE_ID,
    orgId: org.id,
    orgSlug: org.slug,
    orgName: org.name,
    vertical: PRISMA_TO_VERTICAL[org.vertical] ?? 'salon',
    role: devRole ?? 'manager',
    branchId,
    branchIds: org.branches.map((b) => b.id),
    permissions: [],
  };
}

async function resolveDevContext(orgHeader, devRole) {
  const org = orgHeader
    ? await findOrganizationByIdOrSlug(orgHeader)
    : await findFirstOrganization();
  if (!org) return null;
  return orgContextFromRecord(org, devRole);
}

function isPlatformAdminPath(req) {
  const path = (req.originalUrl ?? req.url ?? '').split('?')[0];
  return path.startsWith('/api/v1/admin');
}

function contextFromMembership(user, membership, branchHeader) {
  const role = PRISMA_ROLE_TO_API[membership.role] ?? 'viewer';
  const scopedBranches =
    membership.branches.length > 0
      ? membership.branches.map((b) => b.branchId)
      : membership.org.branches.map((b) => b.id);

  let branchId = null;
  if (branchHeader && scopedBranches.includes(branchHeader)) {
    branchId = branchHeader;
  } else if (scopedBranches.length === 1) {
    branchId = scopedBranches[0];
  } else if (branchHeader) {
    branchId = branchHeader;
  } else if (scopedBranches.length > 0) {
    branchId = scopedBranches[0];
  }

  return {
    profileId: user.id,
    orgId: membership.orgId,
    orgSlug: membership.org.slug,
    orgName: membership.org.name,
    vertical: PRISMA_TO_VERTICAL[membership.org.vertical] ?? 'salon',
    role,
    branchId,
    branchIds: scopedBranches,
    permissions: [],
  };
}

async function resolveMembershipForUser(user, orgHeader) {
  const cached = getCachedMembership(user.id, orgHeader);
  if (cached) return cached;

  let membership = null;
  if (orgHeader) {
    membership = await findMembershipForOrg(user.id, orgHeader);
  }
  if (!membership) {
    const primary = await findPrimaryMembershipForProfile(user.id);
    if (!primary) return null;
    membership = {
      orgId: primary.orgId,
      role: primary.role,
      org: primary.org,
      branches: primary.branches,
    };
  }
  setCachedMembership(user.id, orgHeader, membership);
  setCachedMembership(user.id, membership.org.slug, membership);
  return membership;
}

export async function attachContext(req, res, next) {
  if (isPlatformAdminPath(req)) {
    next();
    return;
  }

  const orgHeader = req.headers['x-org-id']?.trim();

  if (!isDatabaseConfigured()) {
    if (authSkipped() || !req.authUser) {
      const devRole = String(req.headers['x-dev-role'] ?? 'manager').toLowerCase();
      req.context = {
        profileId: req.authUser?.id ?? DEV_PROFILE_ID,
        orgId: orgHeader || 'demo-org',
        orgSlug: orgHeader || 'demo',
        orgName: 'Demo Org',
        vertical: 'salon',
        role: devRole,
        branchId: null,
        branchIds: [],
        permissions: [],
      };
    }
    next();
    return;
  }
  const branchHeader = req.headers['x-branch-id']?.trim();

  try {
    if (authSkipped() || !req.authUser) {
      const devRole = String(req.headers['x-dev-role'] ?? 'manager').toLowerCase();
      const dev = await resolveDevContext(orgHeader, devRole);
      if (dev) {
        req.context = {
          ...dev,
          branchId:
            branchHeader && dev.branchIds.includes(branchHeader) ? branchHeader : dev.branchId,
        };
      } else {
        res.status(404).json({
          error: {
            code: 'NO_ORG',
            message:
              'No organization in database. Run supabase/migrations (001–003) or send a valid X-Org-Id.',
          },
        });
        return;
      }
      next();
      return;
    }

    const user = req.authUser;

    const membership = await resolveMembershipForUser(user, orgHeader);

    if (!membership) {
      res.status(403).json({
        error: {
          code: 'NOT_A_MEMBER',
          message: 'No organization linked to this account. Ask your owner or request owner access.',
        },
      });
      return;
    }

    req.context = contextFromMembership(user, membership, branchHeader);
    next();
  } catch (err) {
    console.error('attachContext', err);
    res.status(500).json({ error: { code: 'CONTEXT_ERROR', message: 'Could not load tenant context' } });
  }
}