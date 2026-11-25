import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

type Props = {
  variant?: 'topbar' | 'public';
  className?: string;
};

export function ThemeToggle({ variant = 'public', className = '' }: Props) {
  const { resolved, toggle } = useTheme();
  const isDark = resolved === 'dark';

  if (variant === 'topbar') {
    return (
      <button
        type="button"
        className={`top-btn !px-3 ${className}`}
        onClick={toggle}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`theme-toggle-public ${className}`}
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}