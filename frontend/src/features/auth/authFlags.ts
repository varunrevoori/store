/** Set `VITE_SKIP_AUTH=true` in root `.env` to bypass login (dev only). */
export const skipAuth =
  import.meta.env.VITE_SKIP_AUTH === 'true' || import.meta.env.VITE_SKIP_AUTH === '1';