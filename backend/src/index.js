import './config/env.js';
import { createApp } from './app.js';
import { attachFrontendDist, shouldServeFrontend } from './serveFrontend.js';

const port = Number(process.env.PORT ?? 8080);
const app = createApp();

if (shouldServeFrontend()) {
  attachFrontendDist(app);
}

if (process.env.VERCEL) {
  // Vercel runs the app via api/index.mjs export (no listen).
} else {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Lon CRM backend (Express) listening on http://localhost:${port}`);
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        console.log(`Supabase API host: ${new URL(supabaseUrl).hostname}`);
      } catch {
        /* ignore */
      }
    } else {
      console.warn('SUPABASE_URL not set — auth and database routes will fail');
    }
  });
}