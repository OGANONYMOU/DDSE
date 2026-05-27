import { Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import type { PlatformUser } from '../types/platform';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface AppShellProps {
  user: PlatformUser;
  onLogout: () => Promise<void> | void;
}

/**
 * AppShell is the persistent chrome: sidebar + navbar + scrollable content area.
 * All authenticated pages render inside the <Outlet />.
 */
export default function AppShell({ user, onLogout }: AppShellProps) {
  return (
    <AuthContext.Provider value={{ user, onLogout }}>
      <div className="min-h-screen bg-[#03040f] text-white">
        {/* Subtle background grid */}
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(56,182,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(56,182,255,0.012) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <Sidebar />

        {/* Right-hand panel: navbar + page content */}
        <div className="ml-[260px] flex min-h-screen flex-col">
          <Navbar />

          {/* Page content sits below the fixed 60px navbar */}
          <main className="relative z-10 flex-1 overflow-y-auto px-6 pb-10 pt-[76px]">
            <Outlet />
          </main>
        </div>
      </div>
    </AuthContext.Provider>
  );
}
