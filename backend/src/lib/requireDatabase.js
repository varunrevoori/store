import { isDatabaseConfigured } from '../models/tenantModel.js';

export function requireDatabase(_req, res, next) {
  if (!isDatabaseConfigured()) {
    res.status(503).json({
      error: {
        code: 'DB_NOT_CONFIGURED',
        message:
          'Supabase is not configured on the API. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then run supabase/migrations/*.sql.',
      },
    });
    return;
  }
  next();
}