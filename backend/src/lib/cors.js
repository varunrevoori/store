import { resolveWebOrigins } from '@lon-crm/shared';

const DEV_LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function corsOptions() {
  const allowList = resolveWebOrigins(process.env);
  const isDev = process.env.NODE_ENV !== 'production';

  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowList.includes(origin)) {
        callback(null, true);
        return;
      }

      if (isDev && DEV_LOCALHOST.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Org-Id',
      'X-Branch-Id',
      'X-Dev-Role',
    ],
    optionsSuccessStatus: 204,
    maxAge: 86_400,
  };
}