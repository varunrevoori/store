import { z } from 'zod';

export const OrgRoleSchema = z.enum([
  'owner',
  'manager',
  'team',
  'receptionist',
  'accountant',
  'viewer',
]);

export const PermissionSchema = z.enum([
  'dashboard:read',
  'calendar:read',
  'calendar:write',
  'customers:read',
  'customers:write',
  'pos:read',
  'pos:write',
  'staff:read',
  'staff:write',
  'inventory:read',
  'inventory:write',
  'marketing:read',
  'marketing:write',
  'ai:read',
  'ai:write',
  'settings:read',
  'settings:write',
  'org:admin',
  'platform_request:read',
  'platform_request:write',
]);

const ALL_PERMISSIONS = PermissionSchema.options;

export const ROLE_PERMISSIONS = {
  owner: ALL_PERMISSIONS,
  manager: [
    'dashboard:read',
    'calendar:read',
    'calendar:write',
    'customers:read',
    'customers:write',
    'pos:read',
    'pos:write',
    'staff:read',
    'staff:write',
    'inventory:read',
    'inventory:write',
    'marketing:read',
    'marketing:write',
    'ai:read',
    'ai:write',
    'settings:read',
    'settings:write',
    'platform_request:read',
    'platform_request:write',
  ],
  team: [
    'dashboard:read',
    'calendar:read',
    'calendar:write',
    'customers:read',
    'customers:write',
    'pos:read',
    'pos:write',
    'inventory:read',
    'ai:read',
    'staff:read',
  ],
  receptionist: [
    'dashboard:read',
    'calendar:read',
    'calendar:write',
    'customers:read',
    'customers:write',
    'pos:read',
  ],
  accountant: ['dashboard:read', 'pos:read', 'inventory:read', 'customers:read'],
  viewer: ['dashboard:read', 'calendar:read', 'customers:read', 'pos:read'],
};

export function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

/** First screen after sign-in (tenant CRM, not platform admin). */
export const ROLE_HOME_ROUTES = {
  owner: '/dashboard',
  manager: '/dashboard',
  team: '/calendar',
  receptionist: '/pos',
  accountant: '/dashboard',
  viewer: '/dashboard',
};

export function homeRouteForRole(role) {
  return ROLE_HOME_ROUTES[role] ?? '/dashboard';
}

export const PRISMA_ROLE_TO_API = {
  OWNER: 'owner',
  MANAGER: 'manager',
  TEAM: 'team',
  RECEPTIONIST: 'receptionist',
  ACCOUNTANT: 'accountant',
  VIEWER: 'viewer',
};

export const API_ROLE_TO_PRISMA = {
  owner: 'OWNER',
  manager: 'MANAGER',
  team: 'TEAM',
  receptionist: 'RECEPTIONIST',
  accountant: 'ACCOUNTANT',
  viewer: 'VIEWER',
};