import { ThemeToggle } from '@/components/ThemeToggle';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/features/auth/AuthProvider';
import { redirectAfterAuth } from '@/features/auth/redirectAfterAuth';
import { LonSaBackground } from '@/layout/LonSaBackground';
import { CalendarDays, ReceiptIndianRupee, Sparkles, UsersRound } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const highlights = [
  { icon: CalendarDays, title: 'Appointments', text: 'Branch calendars and stylist schedules in one view.' },
  { icon: ReceiptIndianRupee, title: 'POS & GST', text: 'Billing tuned for Indian retail and salon workflows.' },
  { icon: UsersRound, title: 'CRM', text: 'Customers, staff, and inventory connected to each branch.' },
  { icon: Sparkles, title: 'AI Studio', text: 'Insights and automations from your live data.' },
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
    <div className="public-page public-gradient-shell min-h-screen overflow-hidden">
      <LonSaBackground />
      <header className="public-page-header">
        <div className="flex items-center gap-3">
          <div className="logo-mark">L</div>
          <div>
            <div className="font-display font-bold text-lg leading-none">LonSa</div>
            <div className="text-[11px] text-muted mt-1">AI Salon OS · India</div>
          </div>
        </div>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className="public-nav-link">
            Sign in
          </Link>
          <Link to="/request-access" className="btn-primary no-underline !h-10">
            Request access
          </Link>
        </nav>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-8 pb-20">
        <div className="max-w-2xl view-enter">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky2">Multi-branch CRM</p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-ink">
            Run your salon or store from one login
          </h1>
          <p className="mt-4 text-lg text-muted leading-relaxed">
            Owners request a new salon on the platform; managers and staff are added by the owner in Staff, then
            everyone signs in to their dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login" className="btn-primary no-underline !h-11 !px-6">
              Sign in to workspace
            </Link>
            <Link to="/request-access" className="btn-ghost no-underline !h-11 !px-6">
              Request access (owners)
            </Link>
            <Link to="/book" className="public-nav-link self-center">
              Customer booking →
            </Link>
          </div>
        </div>

        <section className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          {highlights.map((item) => (
            <div key={item.title} className="feature-tile">
              <item.icon className="text-sky2 mb-3" size={22} />
              <h2 className="font-display font-bold text-sm text-ink">{item.title}</h2>
              <p className="text-xs text-muted mt-1 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </section>

        <p className="mt-12 text-xs text-muted">
          Role-based access: managers get platform requests and staff onboarding; team sees calendar and POS;
          reception focuses on POS and bookings.
        </p>
      </main>
    </div>
  );
}