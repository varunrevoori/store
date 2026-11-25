const STORAGE_KEY = 'lon_crm_dev_session';

export type DevSession = {
  accessToken: string;
  email: string;
  userId: string;
};

export function getDevSession(): DevSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DevSession & { phone?: string };
    if (!parsed.email && parsed.phone) {
      return { ...parsed, email: parsed.phone };
    }
    return parsed as DevSession;
  } catch {
    return null;
  }
}

export function setDevSession(session: DevSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearDevSession() {
  localStorage.removeItem(STORAGE_KEY);
}