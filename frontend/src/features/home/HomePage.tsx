import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/features/auth/AuthProvider';
import { redirectAfterAuth } from '@/features/auth/redirectAfterAuth';
import { LonSaBackground } from '@/layout/LonSaBackground';
import { PublicSiteHeader } from '@/layout/PublicSiteHeader';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ReceiptIndianRupee,
  Sparkles,
  Store,
  UsersRound,
} from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const highlights = [
  { icon: CalendarDays, title: 'Appointments', text: 'Branch calendars and stylist schedules in one view.' },
  { icon: ReceiptIndianRupee, title: 'POS & GST', text: 'Billing tuned for Indian retail and salon workflows.' },
  { icon: UsersRound, title: 'CRM', text: 'Customers, staff, and inventory connected to each branch.' },
  { icon: Sparkles, title: 'AI Studio', text: 'Insights and automations from your live data.' },
];

const stats = [
  { value: '1 login', label: 'Owners, managers & staff' },
  { value: 'Multi-branch', label: 'Calendars per location' },
  { value: 'GST-ready', label: 'POS & billing' },
];

export function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) {
      void redirectAfterAuth(navigate);
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading || isAuthenticated) {
    return <Spinner label="Opening your workspace…" />;
  }

  return (
    <div className="public-page public-gradient-shell">
      <LonSaBackground />
      <PublicSiteHeader active="home" />

      <main className="public-main">
        <section className="public-hero view-enter">
          <p className="public-eyebrow">Multi-branch CRM</p>
          <h1 className="public-hero-title">Run your salon or store from one login</h1>
          <p className="public-hero-lead">
            LonSa connects appointments, checkout, customers, and staff roles across every branch — built for Indian
            salons and retail.
          </p>
          <div className="public-hero-actions">
            <Link to="/login" className="btn-primary no-underline public-hero-btn-primary">
              Sign in to workspace
            </Link>
            <Link to="/request-access" className="btn-ghost no-underline public-hero-btn-secondary">
              Request access (owners)
            </Link>
            <Link to="/book" className="public-hero-link">
              Customer booking
              <ArrowRight size={16} strokeWidth={2} aria-hidden />
            </Link>
          </div>
          <div className="public-trust-chips" aria-label="Highlights">
            <span className="public-trust-chip">GST-ready POS</span>
            <span className="public-trust-chip">Multi-branch</span>
            <span className="public-trust-chip">Role-based access</span>
          </div>
        </section>

        <section className="public-stats" aria-label="Platform highlights">
          {stats.map((s) => (
            <div key={s.value} className="public-stat">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </section>

        <section className="public-split-showcase">
          <div className="public-split-card public-split-card--text">
            <div className="public-split-icon" aria-hidden>
              <Store size={22} strokeWidth={1.75} />
            </div>
            <div className="public-split-caption">
              <strong>Salons &amp; spas</strong>
              <p>Chairs, stylists, and day sheets tied to POS.</p>
            </div>
          </div>
          <div className="public-split-card public-split-card--text">
            <div className="public-split-icon" aria-hidden>
              <ReceiptIndianRupee size={22} strokeWidth={1.75} />
            </div>
            <div className="public-split-caption">
              <strong>Stores &amp; retail</strong>
              <p>Inventory, GST billing, and walk-in customers.</p>
            </div>
          </div>
        </section>

        <section className="public-features stagger" aria-label="Features">
          {highlights.map((item) => (
            <article key={item.title} className="feature-tile">
              <div className="feature-tile-icon" aria-hidden>
                <item.icon size={20} strokeWidth={1.75} />
              </div>
              <h2 className="feature-tile-title">{item.title}</h2>
              <p className="feature-tile-text">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="public-steps">
          <h2 className="public-steps-title">How owners get started</h2>
          <ol className="public-steps-list">
            <li>
              <CheckCircle2 size={18} strokeWidth={2} aria-hidden />
              <span>Request access and set your business password</span>
            </li>
            <li>
              <CheckCircle2 size={18} strokeWidth={2} aria-hidden />
              <span>Superadmin approves your salon or store</span>
            </li>
            <li>
              <CheckCircle2 size={18} strokeWidth={2} aria-hidden />
              <span>Add managers &amp; staff, then everyone signs in</span>
            </li>
          </ol>
        </section>

        <section className="public-cta-banner public-cta-banner--plain">
          <div className="public-cta-banner-body">
            <h2>Ready to run every branch from LonSa?</h2>
            <p>Sign in if you&apos;re already on the team, or request owner access for a new business.</p>
            <div className="public-cta-banner-actions">
              <Link to="/login" className="btn-primary no-underline !h-11">
                Sign in
              </Link>
              <Link to="/request-access" className="btn-ghost no-underline !h-11">
                Request access
              </Link>
            </div>
          </div>
        </section>

        <p className="public-footnote">
          Role-based access: managers handle platform requests and staff onboarding; team sees calendar and POS;
          reception focuses on bookings and checkout.
        </p>
      </main>
    </div>
  );
}