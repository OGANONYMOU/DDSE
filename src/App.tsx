import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import AuthPage from './components/AuthPage';
import CommandCenter from './components/CommandCenter';
import LoadingScreen from './components/LoadingScreen';
import { appConfig } from './lib/sessionBroker';
import { bootstrapPlatform, restoreSession, signOut } from './lib/api';
import type { PlatformUser } from './types/platform';

function App() {
  const [status, setStatus] = useState<'loading' | 'auth' | 'ready'>('loading');
  const [user, setUser] = useState<PlatformUser | null>(null);

  useEffect(() => {
    if (!appConfig.isValid) {
      setStatus('auth');
      return;
    }

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
      {!appConfig.isValid && (
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="max-w-2xl rounded-3xl border border-rose-500/20 bg-slate-950/85 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-rose-300/80">Configuration Required</p>
            <h1 className="mt-2 text-2xl font-black text-white">Local environment is incomplete</h1>
            <p className="mt-4 text-sm text-slate-300">
              Add the missing variables to `.env.local` before starting DDSE locally.
            </p>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-200">
              {appConfig.missing.join(', ')}
            </div>
          </div>
        </div>
      )}
      {status === 'auth' && appConfig.isValid && (
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
