import { getCachedAuthUser, setCachedAuthUser } from '../lib/authUserCache.js';
import { getSupabaseAdmin, isSupabaseConfigured } from '../lib/supabase.js';

function authSkipped() {
  return process.env.SKIP_AUTH === 'true' || process.env.SKIP_AUTH === '1';
}

/** Validates Supabase access JWT (Authorization: Bearer). */
export default async function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  const hasBearer = header?.startsWith('Bearer ');

  // SKIP_AUTH bypasses only when no Bearer token (dev CRM with X-Dev-Role). Real login always validates JWT.
  if (authSkipped() && !hasBearer) {
    next();
    return;
  }

  if (!isSupabaseConfigured()) {
    res.status(503).send({
      message: 'Supabase is not configured on the server (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)',
    });
    return;
  }

  if (!hasBearer) {
    res.status(401).send({ message: 'token missing' });
    return;
  }

  const token = header.slice(7);

  try {
    let user = getCachedAuthUser(token);
    let error = null;
    if (!user) {
      const result = await getSupabaseAdmin().auth.getUser(token);
      user = result.data?.user ?? null;
      error = result.error;
      if (user && !error) setCachedAuthUser(token, user);
    }

    if (error || !user) {
      res.status(401).send({ message: 'invalid or expired token' });
      return;
    }

    req.authUser = user;
    next();
  } catch {
    res.status(500).send({ message: 'could not verify session' });
  }
}