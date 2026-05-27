import { createBrowserRouter, Navigate } from 'react-router-dom';
import type { PlatformUser } from '../types/platform';
import AppShell from '../layouts/AppShell';

import DashboardPage       from '../pages/DashboardPage';
import ProjectsPage        from '../pages/ProjectsPage';
import ProjectDetailPage   from '../pages/ProjectDetailPage';
import InspectionsPage      from '../pages/InspectionsPage';
import InspectionDetailPage from '../pages/InspectionDetailPage';
import SafetyPage       from '../pages/SafetyPage';
import ReportsPage      from '../pages/ReportsPage';
import PersonnelPage    from '../pages/PersonnelPage';
import NotificationsPage from '../pages/NotificationsPage';
import SettingsPage     from '../pages/SettingsPage';

interface RouterOptions {
  user:     PlatformUser;
  onLogout: () => Promise<void> | void;
}

/**
 * createAppRouter builds a fresh router instance each time the authenticated
 * user changes (login / logout). This keeps user & onLogout in scope for
 * the AppShell wrapper without needing a separate context provider at the
 * router level.
 */
export function createAppRouter({ user, onLogout }: RouterOptions) {
  return createBrowserRouter([
    {
      path:    '/',
      element: <AppShell user={user} onLogout={onLogout} />,
      children: [
        { index: true,           element: <DashboardPage /> },
        { path: 'projects',      element: <ProjectsPage /> },
        { path: 'projects/:id', element: <ProjectDetailPage /> },
        { path: 'inspections',        element: <InspectionsPage /> },
        { path: 'inspections/:id',   element: <InspectionDetailPage /> },
        { path: 'safety',        element: <SafetyPage /> },
        { path: 'reports',       element: <ReportsPage /> },
        { path: 'personnel',     element: <PersonnelPage /> },
        { path: 'notifications', element: <NotificationsPage /> },
        { path: 'settings',      element: <SettingsPage /> },
        { path: '*',             element: <Navigate to="/" replace /> },
      ],
    },
  ]);
}
