import { ThemeToggle } from '@/components/ThemeToggle';
import { BranchSwitcher } from '@/layout/BranchSwitcher';
import { useTenant } from '@/context/TenantContext';
import { TopbarJumpSearch } from '@/layout/TopbarJumpSearch';
import { TopbarNotifications } from '@/layout/TopbarNotifications';
import { BOOK_APPOINTMENT_EVENT } from '@/lib/bookAppointment';
import { hasPermission } from '@lon-crm/shared';
import { Menu, Plus, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

type Props = {
  onMenuClick: () => void;
};

export function LonSaTopbar({ onMenuClick }: Props) {
  const tenant = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const canBook = Boolean(tenant.role && hasPermission(tenant.role, 'calendar:write'));
  const [mobileSearch, setMobileSearch] = useState(false);

  function openNewAppointment() {
    if (location.pathname === '/calendar') {
      window.dispatchEvent(new CustomEvent(BOOK_APPOINTMENT_EVENT));
      return;
    }
    navigate('/calendar?book=1');
  }

  return (
    <header className="topbar topbar-responsive shrink-0 flex items-center gap-2 sm:gap-3 relative z-30">
      <div className="topbar-start flex items-center gap-2 min-w-0">
        <button
          type="button"
          className="topbar-icon-btn lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className="topbar-mobile-brand lg:hidden flex items-center gap-2 min-w-0">
          <div className="logo-mark logo-mark--sm">L</div>
          <span className="font-bold text-ink text-[15px] truncate">LonSa</span>
        </div>
      </div>

      {tenant.branches.length > 1 ? (
        <BranchSwitcher variant="topbar" className="hidden md:block shrink-0" />
      ) : null}

      <div
        className={`topbar-search-wrap hidden sm:flex flex-1 justify-center min-w-0 px-1 ${mobileSearch ? '!flex sm:!flex' : ''}`}
      >
        <TopbarJumpSearch />
      </div>

      <button
        type="button"
        className="topbar-icon-btn sm:hidden"
        aria-label="Search"
        onClick={() => setMobileSearch((v) => !v)}
      >
        <Search size={20} />
      </button>

      <div className="topbar-actions flex items-center gap-1 sm:gap-2 shrink-0">
        <ThemeToggle variant="topbar" />
        <TopbarNotifications />
        {canBook ? (
          <button type="button" className="btn-primary topbar-cta shrink-0" onClick={openNewAppointment}>
            <Plus size={16} />
            <span className="topbar-cta-label">New appointment</span>
          </button>
        ) : null}
      </div>

      {mobileSearch ? (
        <div className="topbar-search-mobile sm:hidden absolute left-0 right-0 top-full px-3 py-3 border-b border-[var(--shell-border)] bg-[var(--topbar-surface)] shadow-lg backdrop-blur-md">
          <TopbarJumpSearch />
        </div>
      ) : null}
    </header>
  );
}