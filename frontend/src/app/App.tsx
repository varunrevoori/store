import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/layout/AppShell';
import { PublicLayout } from '@/layout/PublicLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequestAccessPage } from '@/features/auth/RequestAccessPage';
import { AccessPendingPage } from '@/features/auth/AccessPendingPage';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { GuestOnlyRoute } from '@/features/auth/GuestOnlyRoute';
import { PostAuthRouter } from '@/features/auth/PostAuthRouter';
import { RequirePermission } from '@/features/auth/RequirePermission';
import { HomePage } from '@/features/home/HomePage';
import { PlatformAdminRoute } from '@/features/platform/PlatformAdminRoute';
import { PlatformShell } from '@/layout/PlatformShell';
import { PageLoading } from '@/components/ui/PageState';

const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const CalendarPage = lazy(() =>
  import('@/features/calendar/CalendarPage').then((m) => ({ default: m.CalendarPage })),
);
const PosPage = lazy(() => import('@/features/pos/PosPage').then((m) => ({ default: m.PosPage })));
const CustomersPage = lazy(() =>
  import('@/features/customers/CustomersPage').then((m) => ({ default: m.CustomersPage })),
);
const StaffPage = lazy(() => import('@/features/staff/StaffPage').then((m) => ({ default: m.StaffPage })));
const InventoryPage = lazy(() =>
  import('@/features/inventory/InventoryPage').then((m) => ({ default: m.InventoryPage })),
);
const MarketingPage = lazy(() =>
  import('@/features/marketing/MarketingPage').then((m) => ({ default: m.MarketingPage })),
);
const AiStudioPage = lazy(() =>
  import('@/features/ai-studio/AiStudioPage').then((m) => ({ default: m.AiStudioPage })),
);
const PlatformAccessRequestsPage = lazy(() =>
  import('@/features/platform/PlatformAccessRequestsPage').then((m) => ({
    default: m.PlatformAccessRequestsPage,
  })),
);
const PlatformOrganizationsPage = lazy(() =>
  import('@/features/platform/PlatformOrganizationsPage').then((m) => ({
    default: m.PlatformOrganizationsPage,
  })),
);
const PlatformRequestsPage = lazy(() =>
  import('@/features/platform/PlatformRequestsPage').then((m) => ({ default: m.PlatformRequestsPage })),
);
const PublicBookingPage = lazy(() =>
  import('@/features/public-booking/PublicBookingPage').then((m) => ({ default: m.PublicBookingPage })),
);
const PublicFeedbackPage = lazy(() =>
  import('@/features/public-feedback/PublicFeedbackPage').then((m) => ({ default: m.PublicFeedbackPage })),
);

function ModuleFallback() {
  return <PageLoading />;
}

export default function App() {
  return (
    <Suspense fallback={<ModuleFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/request-access" element={<RequestAccessPage />} />
        <Route path="/signup" element={<Navigate to="/request-access" replace />} />

        <Route element={<GuestOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<PlatformAdminRoute />}>
          <Route path="/platform" element={<PlatformShell />}>
            <Route index element={<Navigate to="/platform/access-requests" replace />} />
            <Route path="access-requests" element={<PlatformAccessRequestsPage />} />
            <Route path="organizations" element={<PlatformOrganizationsPage />} />
            <Route path="platform-requests" element={<PlatformRequestsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/access-pending" element={<AccessPendingPage />} />
          <Route path="/app" element={<PostAuthRouter />} />
          <Route element={<AppShell />}>
            <Route
              path="/dashboard"
              element={
                <RequirePermission>
                  <DashboardPage />
                </RequirePermission>
              }
            />
            <Route
              path="/calendar"
              element={
                <RequirePermission>
                  <CalendarPage />
                </RequirePermission>
              }
            />
            <Route
              path="/pos"
              element={
                <RequirePermission>
                  <PosPage />
                </RequirePermission>
              }
            />
            <Route
              path="/customers"
              element={
                <RequirePermission>
                  <CustomersPage />
                </RequirePermission>
              }
            />
            <Route
              path="/staff"
              element={
                <RequirePermission>
                  <StaffPage />
                </RequirePermission>
              }
            />
            <Route
              path="/inventory"
              element={
                <RequirePermission>
                  <InventoryPage />
                </RequirePermission>
              }
            />
            <Route
              path="/marketing"
              element={
                <RequirePermission>
                  <MarketingPage />
                </RequirePermission>
              }
            />
            <Route
              path="/ai"
              element={
                <RequirePermission>
                  <AiStudioPage />
                </RequirePermission>
              }
            />
          </Route>
        </Route>

        <Route element={<PublicLayout />}>
          <Route path="/book" element={<PublicBookingPage />} />
          <Route path="/feedback" element={<PublicFeedbackPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}