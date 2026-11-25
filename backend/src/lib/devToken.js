import crypto from 'node:crypto';

const PREFIX = 'dev1.';

function secret() {
  return process.env.DEV_JWT_SECRET || 'lon-crm-dev-only';
}

export function isDevLoginEnabled() {
  if (process.env.DEV_LOGIN === 'off' || process.env.DEV_LOGIN === 'false') return false;
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_LOGIN !== 'true') {
    return false;
  }
  return true;
}

export function getDevLoginEmail() {
  return (process.env.DEV_LOGIN_EMAIL ?? 'admin@loncrm.local').trim().toLowerCase();
}

export function getDevLoginPassword() {
  return process.env.DEV_LOGIN_PASSWORD ?? 'admin123';
}

export function signDevToken(email) {
  const normalized = email.trim().toLowerCase();
  const sub = crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 32);
  const payload = {
    sub,
    email: normalized,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${PREFIX}${body}.${sig}`;
}

export function verifyDevToken(token) {
  if (!token?.startsWith(PREFIX)) return null;
  const rest = token.slice(PREFIX.length);
  const dot = rest.lastIndexOf('.');
  if (dot < 0) return null;
  const body = rest.slice(0, dot);
  const sig = rest.slice(dot + 1);
  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function userFromDevPayload(payload) {
  return {
    id: payload.sub,
    phone: null,
    email: payload.email,
    user_metadata: { email: payload.email, full_name: null },
    app_metadata: { provider: 'dev-login' },
  };
}