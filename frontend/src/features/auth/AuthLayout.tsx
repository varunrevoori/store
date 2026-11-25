import { ThemeToggle } from '@/components/ThemeToggle';
import { LonSaBackground } from '@/layout/LonSaBackground';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="auth-shell">
      <LonSaBackground />
      <header className="auth-topbar">
        <Link to="/" className="auth-topbar-brand">
          <span className="logo-mark">L</span>
          <span className="font-display font-bold text-lg">LonSa</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/" className="auth-topbar-link hidden sm:inline">
            Home
          </Link>
          <Link to="/login" className="auth-topbar-link hidden md:inline">
            Sign in
          </Link>
        </div>
      </header>

      <aside className="auth-brand-panel">
        <div className="auth-brand-panel-content">
          <p className="auth-brand-eyebrow">AI Salon OS</p>
          <h2 className="auth-brand-headline">
            Run branches,
            <br />
            calendar &amp; POS
            <br />
            from one login
          </h2>
          <p className="auth-brand-tagline">
            Owners onboard here; managers and stylists sign in after you add them in Staff.
          </p>
        </div>
        <div className="auth-brand-foot">
          <Sparkles size={16} className="text-sky-2 shrink-0" strokeWidth={1.75} />
          <span>Built for Indian salons — GST-ready billing &amp; multi-branch CRM</span>
        </div>
      </aside>

      <main className="auth-form-col">
        <div className="glass-auth-card">
          <h1 className="font-display text-2xl font-extrabold text-ink text-center">{title}</h1>
          {subtitle ? <p className="text-sm text-muted mt-2 text-center leading-relaxed">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
          {footer ? <div className="mt-6 pt-1">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}