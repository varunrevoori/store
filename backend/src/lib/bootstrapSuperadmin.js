/**
 * Dev / first-run: grant super_admin when login matches env (server only).
 * BOOTSTRAP_SUPERADMIN_EMAIL or BOOTSTRAP_SUPERADMIN_USER_ID in root .env
 */
export function shouldBootstrapSuperadmin(user) {
  if (!user?.id) return false;

  const emailEnv = process.env.BOOTSTRAP_SUPERADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = user.email?.trim().toLowerCase();
  if (emailEnv && userEmail && userEmail === emailEnv) return true;

  const idEnv = process.env.BOOTSTRAP_SUPERADMIN_USER_ID?.trim();
  if (idEnv && user.id === idEnv) return true;

  return false;
}