import { z } from 'zod';

export {
  VerticalSchema,
  VERTICAL_CODES,
  VERTICAL_LABELS,
  parseVertical,
  VERTICAL_TO_PRISMA,
  PRISMA_TO_VERTICAL,
} from './verticals.js';
export {
  OrgRoleSchema,
  PermissionSchema,
  ROLE_PERMISSIONS,
  hasPermission,
  homeRouteForRole,
  ROLE_HOME_ROUTES,
  PRISMA_ROLE_TO_API,
  API_ROLE_TO_PRISMA,
} from './rbac.js';

export const LocaleSchema = z.enum(['en', 'hi', 'kn']);

export const AppointmentStatusSchema = z.enum([
  'confirmed',
  'in-progress',
  'completed',
  'pending',
  'no-show',
]);

export const AuthLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const API_PREFIX = '/api/v1';

export {
  LOCAL_API_BASE,
  LOCAL_WEB_ORIGIN,
  trimTrailingSlash,
  resolveWebOrigins,
  resolveApiBase,
  deploymentLabel,
} from './appEnv.js';