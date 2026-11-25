import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemeSetting = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'lonsa_theme';

type ThemeContextValue = {
  setting: ThemeSetting;
  resolved: 'light' | 'dark';
  setSetting: (t: ThemeSetting) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveTheme(setting: ThemeSetting): 'light' | 'dark' {
  if (setting === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return setting;
}

export function applyResolvedTheme(resolved: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', resolved);
}

function readStoredSetting(): ThemeSetting {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s === 'light' || s === 'dark' || s === 'system') return s;
  } catch {
    /* ignore */
  }
  return 'system';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [setting, setSettingState] = useState<ThemeSetting>(readStoredSetting);
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => resolveTheme(readStoredSetting()));

  const setSetting = useCallback((t: ThemeSetting) => {
    setSettingState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setSetting(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setSetting]);

  useEffect(() => {
    const next = resolveTheme(setting);
    setResolved(next);
    applyResolvedTheme(next);
  }, [setting]);

  useEffect(() => {
    if (setting !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const next = resolveTheme('system');
      setResolved(next);
      applyResolvedTheme(next);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [setting]);

  const value = useMemo(
    () => ({ setting, resolved, setSetting, toggle }),
    [setting, resolved, setSetting, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}