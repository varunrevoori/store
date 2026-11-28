export const API_PREFIX: '/api/v1';

export const LOCAL_API_BASE: 'http://localhost:8080';
export const LOCAL_WEB_ORIGIN: 'http://localhost:5173';

export function trimTrailingSlash(value: unknown): string;
export function resolveWebOrigins(env?: Record<string, string | undefined>): string[];
export function resolveApiBase(options: {
  apiUrlFromEnv?: string;
  isDev: boolean;
  browserOrigin?: string;
}): string;
export function deploymentLabel(env?: Record<string, string | undefined>): 'local' | 'production' | 'vercel';

export type OrgRole =
  | 'owner'
  | 'manager'
  | 'team'
  | 'receptionist'
  | 'accountant'
  | 'viewer';

export type Permission =
  | 'dashboard:read'
  | 'calendar:read'
  | 'calendar:write'
  | 'customers:read'
  | 'customers:write'
  | 'pos:read'
  | 'pos:write'
  | 'staff:read'
  | 'staff:write'
  | 'inventory:read'
  | 'inventory:write'
  | 'marketing:read'
  | 'marketing:write'
  | 'ai:read'
  | 'ai:write'
  | 'settings:read'
  | 'settings:write'
  | 'org:admin'
  | 'platform_request:read'
  | 'platform_request:write';

export const ROLE_HOME_ROUTES: Record<OrgRole, string>;

export function homeRouteForRole(role: string): string;
export function hasPermission(role: string, permission: string): boolean;