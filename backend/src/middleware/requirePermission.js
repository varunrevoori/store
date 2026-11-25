import { hasPermission } from '@lon-crm/shared';
import { isDatabaseConfigured } from '../models/tenantModel.js';

function authSkipped() {
  return process.env.SKIP_AUTH === 'true' || process.env.SKIP_AUTH === '1';
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!isDatabaseConfigured() || authSkipped()) {
      next();
      return;
    }

    const ctx = req.context;
    if (!ctx) {
      res.status(400).json({
        error: { code: 'CONTEXT_REQUIRED', message: 'Tenant context missing; use attachContext middleware' },
      });
      return;
    }

    if (!hasPermission(ctx.role, permission)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Role ${ctx.role} cannot ${permission}`,
        },
      });
      return;
    }

    next();
  };
}