import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/features/auth/AuthProvider';
import { LonSaBackground } from '@/layout/LonSaBackground';
import { Building2, ClipboardList, Inbox, LogOut } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const links = [
  { to: '/platform/access-requests', label: 'New org requests', icon: Inbox },
  { to: '/platform/organizations', label: 'Organizations', icon: Building2 },
  { to: '/platform/platform-requests', label: 'Platform requests', icon: ClipboardList },
];

export function PlatformShell() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function onSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <div className="lonsa-app h-full min-h-screen relative">
      <LonSaBackground />
      <div className="app-chrome relative z-10 h-full min-h-screen flex">
        <aside className="sidebar w-[250px] shrink-0 flex flex-col">
          <div className="flex items-center gap-3 px-5 h-16 shrink-0">
            <div className="logo-mark">L</div>
            <div>
              <div className="sidebar-brand-title">LonSa</div>
              <div className="sidebar-brand-sub">Superadmin</div>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 pb-3">
            <div className="nav-group">Platform</div>
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} strokeWidth={1.9} className="nav-ic shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-user px-4 py-3 flex items-center gap-2 mt-auto">
            <ThemeToggle variant="topbar" />
            <button type="button" onClick={() => void onSignOut()} className="nav-item flex-1 !px-2 !mb-0">
              <LogOut size={16} className="nav-ic shrink-0" />
              <span>Sign out</span>
            </button>
          </div>
        </aside>
        <div className="app-main-column flex-1 flex flex-col min-w-0">
          <header className="topbar h-14 shrink-0 flex items-center px-6">
            <h1 className="text-[14px] font-semibold text-ink">Platform console</h1>
          </header>
          <main className="app-main flex-1 overflow-y-auto px-7 py-6 view-enter">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}