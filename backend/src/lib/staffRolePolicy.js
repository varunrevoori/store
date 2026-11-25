import { API_ROLE_TO_PRISMA } from '@lon-crm/shared';

/** Map form/API values to assignable staff roles. */
export function normalizeStaffTargetRole(input) {
  const key = String(input ?? 'team').trim().toLowerCase();
  if (key === 'manager') return 'manager';
  if (key === 'employee' || key === 'team' || key === 'staff') return 'team';
  return key;
}

/**
 * Owner → manager or team. Manager → team only.
 */
export function assertCanAssignStaffRole(actorRole, targetRoleInput) {
  const target = normalizeStaffTargetRole(targetRoleInput);
  const actor = String(actorRole ?? '').toLowerCase();

  if (actor === 'owner') {
    if (target === 'manager' || target === 'team') {
      return API_ROLE_TO_PRISMA[target];
    }
    const err = new Error('Owners can add managers or team members only');
    err.status = 400;
    err.code = 'INVALID_STAFF_ROLE';
    throw err;
  }

  if (actor === 'manager') {
    if (target === 'team') {
      return API_ROLE_TO_PRISMA.team;
    }
    const err = new Error('Managers can add team members only');
    err.status = 403;
    err.code = 'FORBIDDEN_STAFF_ROLE';
    throw err;
  }

  const err = new Error('Only owner or manager can add staff');
  err.status = 403;
  throw err;
}