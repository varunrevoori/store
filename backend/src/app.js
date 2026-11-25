import cors from 'cors';
import express from 'express';
import { errorHandler } from './Middlewares/errorHandler.js';
import { corsOptions } from './lib/cors.js';
import { tenantModel } from './models/index.js';
import { apiRouter } from './routes/index.js';

export function createApp() {
  const app = express();

  app.set('tenantModel', tenantModel);

  app.use(cors(corsOptions()));
  app.use(express.json({ limit: '512kb' }));
  app.set('etag', 'strong');

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'lon-crm-backend' });
  });

  app.use(apiRouter);
  app.use(errorHandler);

  return app;
}