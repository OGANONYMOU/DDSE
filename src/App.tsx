import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import AuthPage from './components/AuthPage';
import CommandCenter from './components/CommandCenter';
import LoadingScreen from './components/LoadingScreen';
import { bootstrapPlatform, restoreSession, signOut } from './lib/api';
import type { PlatformUser } from './types/platform';

function App() {
  const [status, setStatus] = useState<'loading' | 'auth' | 'ready'>('loading');
  const [user, setUser] = useState<PlatformUser | null>(null);

  useEffect(() => {
    let mounted = true;

    Promise.resolve()
      .then(() => bootstrapPlatform())
      .catch(() => undefined)
      .then(() => restoreSession())
      .then((session) => {
        if (!mounted) return;
        if (!session) {
          setStatus('auth');
          return;
        }
        setUser(session.user);
        setStatus('ready');
      })
      .catch(() => {
        if (mounted) setStatus('auth');
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#03040f] font-sans text-white antialiased">
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#0d1117',
            border: '1px solid rgba(56, 182, 255, 0.2)',
            color: '#f8fafc',
          },
        }}
      />
      {status === 'loading' && <LoadingScreen onComplete={() => undefined} />}
      {status === 'auth' && (
        <AuthPage
          onAuthenticated={(sessionUser) => {
            setUser(sessionUser);
            setStatus('ready');
          }}
        />
      )}
      {status === 'ready' && user && (
        <CommandCenter
          user={user}
          onLogout={async () => {
            await signOut();
            setUser(null);
            setStatus('auth');
          }}
        />
      )}
    </div>
  );
}

export default App;
