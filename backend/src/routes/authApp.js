import { API_PREFIX } from '@lon-crm/shared';
import express from 'express';
import verifyToken from '../Middlewares/verifyToken.js';
import {
  grantSuperAdmin,
  isSuperAdmin,
  reconcileSuperAdminByEmail,
} from '../models/adminUserModel.js';
import { shouldBootstrapSuperadmin } from '../lib/bootstrapSuperadmin.js';
import { upsertProfile } from '../models/tenantModel.js';
import { isDatabaseConfigured } from '../models/tenantModel.js';

const authApp = express.Router();

authApp.get(`${API_PREFIX}/auth/me`, verifyToken, async (req, res) => {
  const u = req.authUser;
  if (!u) {
    res.status(401).send({ message: 'not signed in' });
    return;
  }

  if (isDatabaseConfigured()) {
    try {
      await upsertProfile(u);
    } catch (err) {
      console.error('profile upsert', err);
    }
  }

  res.json({
    id: u.id,
    email: u.email,
    phone: u.phone ?? null,
    metadata: u.user_metadata ?? {},
    appMetadata: u.app_metadata ?? {},
  });
});

async function respondSuperadminCheck(req, res) {
  const u = req.authUser;
  if (!u) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'not signed in' } });
    return;
  }
  if (!isDatabaseConfigured()) {
    res.status(503).json({ error: { code: 'DB_NOT_CONFIGURED', message: 'database not configured' } });
    return;
  }
  try {
    await upsertProfile(u);
    let allowed = await isSuperAdmin(u.id);
    if (!allowed && shouldBootstrapSuperadmin(u)) {
      await grantSuperAdmin(u);
      allowed = await isSuperAdmin(u.id);
    }
    if (!allowed) {
      allowed = await reconcileSuperAdminByEmail(u);
    }
    if (!allowed) {
      res.status(403).json({
        error: {
          code: 'NOT_SUPERADMIN',
          message:
            'No admin_users row for this login. user_id in the table must match Authentication → Users → User UID.',
          authUserId: u.id,
          email: u.email ?? null,
        },
      });
      return;
    }
    res.json({ ok: true, role: 'super_admin', userId: u.id });
  } catch (err) {
    console.error('auth/superadmin', err);
    res.status(500).json({ error: { code: 'AUTH_ERROR', message: 'could not verify superadmin' } });
  }
}

authApp.get(`${API_PREFIX}/auth/superadmin`, verifyToken, respondSuperadminCheck);
/** @deprecated use /auth/superadmin */
authApp.get(`${API_PREFIX}/auth/platform-admin`, verifyToken, respondSuperadminCheck);

export default authApp;