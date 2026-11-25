const ORG_SLUG = 'lon_org_slug';
const BRANCH_ID = 'lon_branch_id';

export function getStoredOrgSlug() {
  return localStorage.getItem(ORG_SLUG);
}

export function setStoredTenant(orgSlug: string, branchId: string | null) {
  localStorage.setItem(ORG_SLUG, orgSlug);
  if (branchId) localStorage.setItem(BRANCH_ID, branchId);
}

export function getStoredBranchId() {
  return localStorage.getItem(BRANCH_ID);
}

export function clearStoredTenant() {
  localStorage.removeItem(ORG_SLUG);
  localStorage.removeItem(BRANCH_ID);
  try {
    sessionStorage.removeItem('lon_bootstrap_v1');
  } catch {
    /* ignore */
  }
}