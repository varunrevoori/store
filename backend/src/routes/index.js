import { Router } from 'express';
import authApp from './authApp.js';
import dashboardApp from './dashboardApp.js';
import internalApp from './internalApp.js';
import metaApp from './metaApp.js';
import modulesApp from './modulesApp.js';
import publicApp from './publicApp.js';
import { mountPlatformAdminRoutes } from './platformAdminApp.js';
import requestsApp from './requestsApp.js';
import staffApp from './staffApp.js';
import tenantApp from './tenantApp.js';

export const apiRouter = Router();

apiRouter.use(metaApp);
apiRouter.use(publicApp);
apiRouter.use(authApp);
mountPlatformAdminRoutes(apiRouter);
apiRouter.use(internalApp);
apiRouter.use(tenantApp);
apiRouter.use(dashboardApp);
apiRouter.use(staffApp);
apiRouter.use(requestsApp);
apiRouter.use(modulesApp);