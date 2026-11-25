import { ThemeToggle } from '@/components/ThemeToggle';
import { LonSaBackground } from '@/layout/LonSaBackground';
import { Outlet, Link } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="public-gradient-shell min-h-screen relative overflow-hidden">
      <LonSaBackground />
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="public-page-header !max-w-3xl">
          <Link to="/" className="flex items-center gap-2 text-ink no-underline text-sm font-semibold">
            ← Home
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-12 flex justify-center">
          <div className="w-full max-w-lg">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}