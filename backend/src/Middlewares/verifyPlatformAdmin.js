import { getSupabaseAdmin, isSupabaseConfigured } from '../lib/supabase.js';
import { shouldBootstrapSuperadmin } from '../lib/bootstrapSuperadmin.js';
import { grantSuperAdmin, isSuperAdmin, reconcileSuperAdminByEmail } from '../models/adminUserModel.js';
function authSkipped() {
  return process.env.SKIP_AUTH === 'true' || process.env.SKIP_AUTH === '1';
}

/** Bearer JWT + active admin_users row with role super_admin. */
export default async function verifyPlatformAdmin(req, res, next) {
  const header = req.headers.authorization;
  const hasBearer = header?.startsWith('Bearer ');

  if (authSkipped() && !hasBearer) {
    req.platformAdmin = { id: 'dev-platform-admin', role: 'PLATFORM_ADMIN' };
    req.authUser = { id: 'dev-platform-admin', email: 'dev@local.lon' };
    next();
    return;
  }

  if (!isSupabaseConfigured()) {
    res.status(503).json({
      error: { code: 'DB_NOT_CONFIGURED', message: 'Supabase is not configured on the server' },
    });
    return;
  }

  if (!hasBearer) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'token missing' } });
    return;
  }

  const token = header.slice(7);

  try {
    const {
      data: { user },
      error,
    } = await getSupabaseAdmin().auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'invalid or expired token' } });
      return;
    }

    let allowed = await isSuperAdmin(user.id);
    if (!allowed && shouldBootstrapSuperadmin(user)) {
      await grantSuperAdmin(user);
      allowed = await isSuperAdmin(user.id);
    }
    if (!allowed) {
      allowed = await reconcileSuperAdminByEmail(user);
    }
    if (!allowed) {
      res.status(403).json({
        error: { code: 'NOT_SUPERADMIN', message: 'No active admin_users row for this user' },
      });
      return;
    }

    req.authUser = user;
    req.platformAdmin = { id: user.id, role: 'PLATFORM_ADMIN' };
    next();
  } catch (err) {
    console.error('verifyPlatformAdmin', err);
    res.status(500).json({ error: { code: 'AUTH_ERROR', message: 'could not verify platform admin' } });
  }
}