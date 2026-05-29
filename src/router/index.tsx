import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import type { PlatformUser } from '../types/platform';
import AppShell from '../layouts/AppShell';
import { PageLoader } from '../components/ui/SkeletonLoader';
import RouteGuard from '../components/auth/RouteGuard';

// Lazy-loaded pages — each chunk only downloaded when first visited
const DashboardPage        = lazy(() => import('../pages/DashboardPage'));
const ProjectsPage         = lazy(() => import('../pages/ProjectsPage'));
const ProjectDetailPage    = lazy(() => import('../pages/ProjectDetailPage'));
const InspectionsPage      = lazy(() => import('../pages/InspectionsPage'));
const InspectionDetailPage = lazy(() => import('../pages/InspectionDetailPage'));
const SafetyPage           = lazy(() => import('../pages/SafetyPage'));
const SafetyDetailPage     = lazy(() => import('../pages/SafetyDetailPage'));
const AnalyticsPage        = lazy(() => import('../pages/AnalyticsPage'));
const ReportsPage          = lazy(() => import('../pages/ReportsPage'));
const ReportsDetailPage    = lazy(() => import('../pages/ReportsDetailPage'));
const PersonnelPage        = lazy(() => import('../pages/PersonnelPage'));
const NotificationsPage    = lazy(() => import('../pages/NotificationsPage'));
const SettingsPage         = lazy(() => import('../pages/SettingsPage'));
const AccessDeniedPage     = lazy(() => import('../pages/AccessDeniedPage'));
const AuditLogPage         = lazy(() => import('../pages/AuditLogPage'));
const NotFoundPage         = lazy(() => import('../pages/NotFoundPage'));

// Phase 11 — Enterprise Expansion
const ReadinessPage        = lazy(() => import('../pages/ReadinessPage'));
const BroadcastPage        = lazy(() => import('../pages/BroadcastPage'));
const IntelligencePage     = lazy(() => import('../pages/IntelligencePage'));

// Phase 12 — Platform Ecosystem
const SystemHealthPage     = lazy(() => import('../pages/SystemHealthPage'));
const AutomationPage       = lazy(() => import('../pages/AutomationPage'));

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

interface RouterOptions {
  user:     PlatformUser;
  onLogout: () => Promise<void> | void;
}

export function createAppRouter({ user, onLogout }: RouterOptions) {
  return createBrowserRouter([
    {
      path:    '/',
      element: <AppShell user={user} onLogout={onLogout} />,
      children: [
        { index: true,              element: <Lazy><DashboardPage /></Lazy> },
        { path: 'projects',         element: <Lazy><ProjectsPage /></Lazy> },
        { path: 'projects/:id',     element: <Lazy><ProjectDetailPage /></Lazy> },
        { path: 'inspections',      element: <Lazy><InspectionsPage /></Lazy> },
        { path: 'inspections/:id',  element: <Lazy><InspectionDetailPage /></Lazy> },
        { path: 'safety',           element: <Lazy><SafetyPage /></Lazy> },
        { path: 'safety/:id',       element: <Lazy><SafetyDetailPage /></Lazy> },
        {
          path: 'analytics',
          element: (
            <Lazy>
              <RouteGuard deck="analytics">
                <AnalyticsPage />
              </RouteGuard>
            </Lazy>
          ),
        },
        { path: 'reports',          element: <Lazy><ReportsPage /></Lazy> },
        { path: 'reports/:id',      element: <Lazy><ReportsDetailPage /></Lazy> },
        {
          path: 'personnel',
          element: (
            <Lazy>
              <RouteGuard permission="personnel.view_own">
                <PersonnelPage />
              </RouteGuard>
            </Lazy>
          ),
        },
        { path: 'notifications',    element: <Lazy><NotificationsPage /></Lazy> },
        { path: 'settings',         element: <Lazy><SettingsPage /></Lazy> },

        // ── Phase 10 additions ──────────────────────────────────────────────
        {
          path: 'audit-log',
          element: (
            <Lazy>
              <RouteGuard permission="audit.view">
                <AuditLogPage />
              </RouteGuard>
            </Lazy>
          ),
        },

        // ── Phase 11 — Enterprise Expansion ────────────────────────────────
        {
          path: 'readiness',
          element: (
            <Lazy>
              <RouteGuard permission="inspections.view_all">
                <ReadinessPage />
              </RouteGuard>
            </Lazy>
          ),
        },
        {
          path: 'broadcasts',
          element: <Lazy><BroadcastPage /></Lazy>,
        },
        {
          path: 'intelligence',
          element: (
            <Lazy>
              <RouteGuard deck="analytics">
                <IntelligencePage />
              </RouteGuard>
            </Lazy>
          ),
        },

        // ── Phase 12 — Platform Ecosystem ──────────────────────────────────
        {
          path: 'system-health',
          element: (
            <Lazy>
              <RouteGuard permission="system.audit_logs">
                <SystemHealthPage />
              </RouteGuard>
            </Lazy>
          ),
        },
        {
          path: 'automation',
          element: (
            <Lazy>
              <RouteGuard permission="system.audit_logs">
                <AutomationPage />
              </RouteGuard>
            </Lazy>
          ),
        },

        { path: 'access-denied',    element: <Lazy><AccessDeniedPage /></Lazy> },
        { path: '*',                element: <Lazy><NotFoundPage /></Lazy> },
      ],
    },
  ]);
}
