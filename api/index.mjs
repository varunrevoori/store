/**
 * Vercel serverless entry — one deployment: Express API + built React app (native ESM).
 */
import '../backend/src/config/env.js';
import { createApp } from '../backend/src/app.js';
import { attachFrontendDist, shouldServeFrontend } from '../backend/src/serveFrontend.js';

const app = createApp();
if (shouldServeFrontend()) {
  attachFrontendDist(app);
}

export default app;