import { ThemeToggle } from '@/components/ThemeToggle';
import { Link } from 'react-router-dom';

type Active = 'home' | 'login' | 'request';

export function PublicSiteHeader({ active }: { active?: Active }) {
  return (
    <header className="public-site-header">
      <div className="public-site-header-inner">
        <Link to="/" className="public-site-brand">
          <span className="logo-mark">L</span>
          <span className="public-site-brand-text">
            <span className="public-site-brand-name">LonSa</span>
            <span className="public-site-brand-tag">AI Salon OS · India</span>
          </span>
        </Link>
        <nav className="public-site-nav" aria-label="Public">
          <ThemeToggle />
          {active !== 'login' ? (
            <Link to="/login" className="public-nav-link">
              Sign in
            </Link>
          ) : null}
          {active !== 'request' ? (
            <Link to="/request-access" className="btn-primary no-underline public-site-cta !h-10">
              Request access
            </Link>
          ) : (
            <Link to="/" className="public-nav-link">
              Home
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}