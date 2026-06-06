import { Outlet } from 'react-router-dom';
import { AuthContext, useAuth } from '../context/AuthContext';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';
import type { PlatformUser } from '../types/platform';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import SessionTimeoutModal from '../components/auth/SessionTimeoutModal';
import { useSessionTimeout } from '../hooks/useSessionTimeout';

interface AppShellProps {
  user: PlatformUser;
  onLogout: () => Promise<void> | void;
}

function ShellInner({ onLogout }: { onLogout: () => Promise<void> | void }) {
  const { isOpen, close } = useSidebar();
  const { warningVisible, secondsLeft, extendSession, dismissWarning } =
    useSessionTimeout(() => void onLogout());
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#03040f] text-white">
      {/* Skip navigation — keyboard users jump past sidebar */}
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>

      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(56,182,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(56,182,255,0.012) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <Sidebar />

      {/* Right-hand panel — offset only on lg+ */}
      <div className="lg:ml-[260px] flex min-h-screen flex-col">
        <Navbar />
        <main
          id="main-content"
          tabIndex={-1}
          className="relative z-10 flex-1 overflow-y-auto px-4 pb-10 pt-[76px] lg:px-6 focus:outline-none"
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Session expiry warning */}
      {warningVisible && (
        <SessionTimeoutModal
          secondsLeft={secondsLeft}
          clearanceLevel={user.clearanceLevel ?? 1}
          onExtend={extendSession}
          onLogout={() => { dismissWarning(); void onLogout(); }}
        />
      )}
    </div>
  );
}

export default function AppShell({ user, onLogout }: AppShellProps) {
  return (
    <AuthContext.Provider value={{ user, onLogout }}>
      <SidebarProvider>
        <ShellInner onLogout={onLogout} />
      </SidebarProvider>
    </AuthContext.Provider>
  );
}
