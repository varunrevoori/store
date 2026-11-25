import { API_ROLE_TO_PRISMA } from '@lon-crm/shared';

/** Request form values → Postgres org_role enum. */
const FORM_TO_DB = {
  owner: 'OWNER',
  manager: 'MANAGER',
  employee: 'TEAM',
  team: 'TEAM',
  receptionist: 'RECEPTIONIST',
  accountant: 'ACCOUNTANT',
  viewer: 'VIEWER',
};

export function normalizeRequestedRole(input) {
  if (!input) return 'MANAGER';
  const key = String(input).trim().toLowerCase();
  if (FORM_TO_DB[key]) return FORM_TO_DB[key];
  const fromApi = API_ROLE_TO_PRISMA[key];
  if (fromApi) return fromApi;
  const upper = String(input).trim().toUpperCase();
  if (Object.values(FORM_TO_DB).includes(upper)) return upper;
  return 'MANAGER';
}

export const REQUEST_ACCESS_ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner (full access, new business)' },
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employee / staff' },
];

export function formatRequestedRoleForDisplay(dbRole) {
  if (!dbRole) return 'Manager';
  const map = {
    OWNER: 'Owner',
    MANAGER: 'Manager',
    TEAM: 'Employee',
    RECEPTIONIST: 'Receptionist',
    ACCOUNTANT: 'Accountant',
    VIEWER: 'Viewer',
  };
  return map[String(dbRole).toUpperCase()] ?? dbRole;
}