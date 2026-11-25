import { ThemeToggle } from '@/components/ThemeToggle';
import { LonSaBackground } from '@/layout/LonSaBackground';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  page = 'login',
  formSize = 'default',
  badge,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  page?: 'login' | 'request';
  formSize?: 'default' | 'tall';
  badge?: string;
}) {
  const cardClass =
    formSize === 'tall' ? 'glass-auth-card glass-auth-card--tall' : 'glass-auth-card';
  const defaultBadge = page === 'login' ? 'Workspace sign-in' : 'Owner onboarding';

  return (
    <div className={`auth-shell auth-shell--${page}`}>
      <LonSaBackground />

      <header className="auth-mobile-bar md:hidden">
        <Link to="/" className="auth-topbar-brand">
          <span className="logo-mark">L</span>
          <span className="font-display font-bold text-lg">LonSa</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link to="/" className="auth-topbar-link">
            Home
          </Link>
        </div>
      </header>

      <aside className="auth-brand-panel">
        <div className="auth-brand-bar hidden md:flex">
          <Link to="/" className="auth-brand-logo">
            <span className="logo-mark logo-mark--on-dark">L</span>
            <span className="font-display font-bold text-lg text-white">LonSa</span>
          </Link>
        </div>
        <div className="auth-brand-panel-content">
          <p className="auth-brand-eyebrow">AI Salon OS</p>
          <h2 className="auth-brand-headline">
            Run branches, calendar &amp; POS from one login
          </h2>
          <p className="auth-brand-tagline">
            Owners onboard here; managers and stylists sign in after you add them in Staff.
          </p>
        </div>
        <ul className="auth-brand-points hidden md:block">
          <li>Multi-branch dashboard &amp; calendars</li>
          <li>POS with GST-ready billing</li>
          <li>Staff roles, CRM &amp; inventory</li>
        </ul>
        <div className="auth-brand-foot">
          <Sparkles size={16} className="text-sky-2 shrink-0" strokeWidth={1.75} />
          <span>Built for Indian salons — GST-ready billing &amp; multi-branch CRM</span>
        </div>
      </aside>

      <main className="auth-form-col">
        <header className="auth-form-bar hidden md:flex">
          <ThemeToggle />
          <Link to="/" className="auth-topbar-link">
            Home
          </Link>
          {page === 'login' ? (
            <Link to="/request-access" className="btn-primary no-underline !h-9 !px-4 text-sm">
              Request access
            </Link>
          ) : (
            <Link to="/login" className="auth-topbar-link">
              Sign in
            </Link>
          )}
        </header>

        <div className="auth-form-body">
          <div className={cardClass}>
            <header className="auth-card-head">
              <p className="auth-card-badge">{badge ?? defaultBadge}</p>
              <h1 className="auth-card-title">{title}</h1>
              {subtitle ? <p className="auth-card-subtitle">{subtitle}</p> : null}
            </header>
            <div className="auth-card-body">{children}</div>
            {footer ? <footer className="auth-card-foot">{footer}</footer> : null}
          </div>
        </div>
      </main>
    </div>
  );
}