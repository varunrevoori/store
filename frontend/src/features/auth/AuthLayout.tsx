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
      <header className="public-page-header">
        <Link to="/" className="flex items-center gap-3 text-ink no-underline">
          <span className="logo-mark">L</span>
          <span className="font-display font-bold text-lg">LonSa</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/" className="public-nav-link hidden sm:inline">
            Home
          </Link>
        </div>
      </header>
      <div className="auth-shell-inner">
        <aside className="auth-brand-panel">
          <div className="relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">AI Salon OS</p>
            <h2 className="font-display text-4xl font-extrabold tracking-tight mt-3 leading-tight">
              Run branches,
              <br />
              calendar & POS
              <br />
              from one login
            </h2>
            <p className="text-[13px] text-white/55 mt-4 max-w-sm leading-relaxed">
              Owners onboard here; managers and stylists sign in after you add them in Staff.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-3 text-[12px] text-white/50">
            <Sparkles size={16} className="text-sky-2" />
            Built for Indian salons — GST-ready billing & multi-branch CRM
          </div>
        </aside>
        <div className="auth-form-col">
          <div className="glass-auth-card">
            <h1 className="font-display text-2xl font-extrabold text-ink text-center">{title}</h1>
            {subtitle ? <p className="text-sm text-muted mt-2 text-center">{subtitle}</p> : null}
            <div className="mt-6">{children}</div>
            {footer ? <div className="mt-6">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}