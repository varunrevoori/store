import { useAuth } from '@/features/auth/AuthProvider';
import { Avatar } from '@/components/Avatar';
import { LonSaBackground } from '@/layout/LonSaBackground';
import { LonSaTopbar } from '@/layout/LonSaTopbar';
import { displayName } from '@/lib/greeting';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Package,
  ReceiptIndianRupee,
  Sparkles,
  UserCog,
  UsersRound,
} from 'lucide-react';
import { TenantProvider, useTenant } from '@/context/TenantContext';
import { hasPermission } from '@lon-crm/shared';
import { ROUTE_PERMISSIONS } from '@/lib/routeAccess';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

const operate = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/pos', label: 'POS & Billing', icon: ReceiptIndianRupee },
  { to: '/customers', label: 'Customers', icon: UsersRound },
  { to: '/staff', label: 'Staff & Payroll', icon: UserCog },
  { to: '/inventory', label: 'Inventory', icon: Package },
];

const grow = [
  { to: '/marketing', label: 'Marketing', icon: Megaphone },
  { to: '/ai', label: 'AI Studio', icon: Sparkles },
];

function filterNav(items: typeof operate, role: string | null) {
  if (!role) return items;
  return items.filter((item) => {
    const perm = ROUTE_PERMISSIONS[item.to];
    return !perm || hasPermission(role, perm);
  });
}

export function AppShell() {
  return (
    <TenantProvider>
      <AppShellInner />
    </TenantProvider>
  );
}

function AppShellInner() {
  const { signOut, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const tenant = useTenant();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = tenant.role;
  const operateNav = filterNav(operate, role);
  const growNav = filterNav(grow, role);

  const userName =
    session?.user.user_metadata?.full_name?.trim() ||
    displayName(undefined, session?.user.email ?? session?.user.phone);
  const branchCount = tenant.branches.length;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('lonsa-nav-open');
    } else {
      document.body.classList.remove('lonsa-nav-open');
    }
    return () => document.body.classList.remove('lonsa-nav-open');
  }, [mobileOpen]);

  async function logout() {
    await signOut();
    navigate('/');
  }

  const rail = isDesktop && !mobileOpen;

  const sidebarClasses = [
    'sidebar',
    rail ? 'sidebar--rail' : '',
    mobileOpen ? 'sidebar--mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ShellFrame>
      <LonSaBackground />
      <div className="lonsa-app app-chrome relative z-10 h-full flex min-h-0">
        {mobileOpen ? (
          <button
            type="button"
            className="sidebar-scrim"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <aside className={sidebarClasses} aria-label="Main navigation">
          <div className="sidebar-head">
            <div className="sidebar-brand">
              <div className="logo-mark shrink-0">L</div>
              <div className="sidebar-brand-text">
                <div className="sidebar-brand-title">LonSa</div>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2 min-h-0">
            <NavGroup label="Operate" items={operateNav} iconOnly={rail} />
            {growNav.length > 0 ? (
              <NavGroup label="Grow" items={growNav} iconOnly={rail} withRailSpacer={rail} />
            ) : null}
          </nav>

          <div className={`sidebar-user ${rail ? 'sidebar-user--rail' : ''}`}>
            <Avatar name={userName} color="#D13095" size={rail ? 32 : 36} />
            <div className="sidebar-user-text flex-1 min-w-0">
              <div className="sidebar-user-name truncate">{userName}</div>
              <div className="sidebar-user-meta truncate">
                {role ?? 'Member'}
                {branchCount > 0 ? ` · ${branchCount} branch${branchCount === 1 ? '' : 'es'}` : ''}
              </div>
            </div>
            <button type="button" className="icon-btn shrink-0 sidebar-logout" title="Log out" onClick={logout}>
              <LogOut size={17} strokeWidth={1.75} />
            </button>
          </div>
        </aside>

        <div className="app-main-column flex-1 flex flex-col min-w-0 min-h-0">
          <LonSaTopbar onMenuClick={() => setMobileOpen(true)} />
          <main key={location.pathname} className="app-main flex-1 overflow-y-auto view-enter">
            <div className="app-viewport">
              {tenant.error ? (
                <p className="mb-4 text-[13px] text-hot rounded-xl px-4 py-3 border border-hot/20 form-alert-error">
                  {tenant.error}
                </p>
              ) : null}
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </ShellFrame>
  );
}

function ShellFrame({ children }: { children: ReactNode }) {
  return <div className="h-full min-h-dvh">{children}</div>;
}

function NavGroup({
  label,
  items,
  iconOnly,
  withRailSpacer,
}: {
  label: string;
  items: { to: string; label: string; icon: LucideIcon }[];
  iconOnly?: boolean;
  withRailSpacer?: boolean;
}) {
  return (
    <>
      <div
        className={`nav-group ${iconOnly ? 'nav-group--rail' : ''} ${withRailSpacer ? 'nav-group--rail-spacer' : ''}`}
      >
        {label}
      </div>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          title={iconOnly ? item.label : undefined}
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''} ${iconOnly ? 'nav-item--rail' : ''}`
          }
        >
          <span className="nav-ic-wrap" aria-hidden>
            <item.icon size={20} strokeWidth={1.75} className="nav-ic" />
          </span>
          <span className="nav-item-label">{item.label}</span>
        </NavLink>
      ))}
    </>
  );
}