import { hasPermission } from '@lon-crm/shared';

function authSkipped() {
  return process.env.SKIP_AUTH === 'true' || process.env.SKIP_AUTH === '1';
}

function devRoleFromRequest(req) {
  const raw = String(req.headers['x-dev-role'] ?? 'manager').toLowerCase();
  if (['owner', 'manager', 'team', 'receptionist', 'accountant', 'viewer'].includes(raw)) {
    return raw;
  }
  return 'manager';
}

/** Staff add + platform requests: manager or owner only. */
export default function requireManagerOrOwner(req, res, next) {
  if (authSkipped()) {
    req.context = req.context ?? {
      role: devRoleFromRequest(req),
      orgId: req.headers['x-org-id'] ?? 'demo-org',
      profileId: req.authUser?.id ?? '00000000-0000-0000-0000-000000000001',
    };
    const role = req.context.role;
    if (role === 'manager' || role === 'owner') {
      next();
      return;
    }
    res.status(403).send({ message: 'Only manager or owner can perform this action' });
    return;
  }

  const role = req.context?.role;
  if (!role) {
    res.status(400).send({ message: 'Tenant context missing (X-Org-Id + membership)' });
    return;
  }

  if (hasPermission(role, 'staff:write') || hasPermission(role, 'platform_request:write')) {
    if (role === 'manager' || role === 'owner') {
      next();
      return;
    }
  }

  res.status(403).send({ message: 'Only manager or owner can perform this action' });
}