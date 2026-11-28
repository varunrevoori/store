import { getSupabaseAdmin } from '../lib/supabase.js';

/** Create or update Supabase Auth user with password (email confirmed, no invite email). */
export async function ensureAuthUserWithPassword({ email, password, fullName, phone }) {
  const sb = getSupabaseAdmin();
  const normalized = String(email).trim().toLowerCase();

  if (!password || String(password).length < 6) {
    const err = new Error('Password must be at least 6 characters');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const userMetadata = { full_name: fullName };
  if (phone) {
    userMetadata.phone = phone;
  }

  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email: normalized,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (!createErr && created?.user?.id) {
    return created.user.id;
  }

  const msg = createErr?.message?.toLowerCase() ?? '';
  if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
    const userId = await findAuthUserIdByEmail(normalized);
    if (!userId) {
      const err = new Error(createErr?.message ?? 'Could not create user');
      err.status = 400;
      throw err;
    }
    const { error: updateErr } = await sb.auth.admin.updateUserById(userId, {
      password,
      user_metadata: userMetadata,
    });
    if (updateErr) throw updateErr;
    return userId;
  }

  const err = new Error(createErr?.message ?? 'Could not create user');
  err.status = 400;
  err.code = 'AUTH_CREATE_FAILED';
  throw err;
}

async function findAuthUserIdByEmail(email) {
  const sb = getSupabaseAdmin();
  const { data: prof } = await sb.from('profile').select('id').eq('email', email).maybeSingle();
  if (prof?.id) return prof.id;

  let page = 1;
  const perPage = 200;
  for (let i = 0; i < 10; i += 1) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users?.find((u) => u.email?.toLowerCase() === email);
    if (match?.id) return match.id;
    if ((data.users?.length ?? 0) < perPage) break;
    page += 1;
  }
  return null;
}