import { useEffect, useMemo, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import AuthPage from './components/AuthPage';
import LoadingScreen from './components/LoadingScreen';
import StepUpAuth from './components/StepUpAuth';
import { bootstrapPlatform, restoreSession, signOut } from './lib/api';
import { createAppRouter } from './router';
import { supabaseMisconfigured } from './lib/supabase';
import type { PlatformUser } from './types/platform';

function MisconfiguredScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#03040f] px-6">
      <div className="w-full max-w-lg rounded-3xl border border-rose-500/20 bg-slate-950/80 p-10 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-rose-400">Configuration Error</p>
        <h1 className="mt-4 text-2xl font-black text-white">Supabase Not Connected</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          Create a <code className="rounded bg-slate-800 px-1.5 py-0.5 text-sky-300">.env.local</code> file in the project root with your Supabase credentials:
        </p>
        <pre className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-left text-xs text-sky-200 leading-6">
{`VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>`}
        </pre>
        <p className="mt-4 text-xs text-slate-500">Then restart the dev server.</p>
      </div>
    </div>
  );
}

function AppRouter({ user, onLogout }: { user: PlatformUser; onLogout: () => Promise<void> }) {
  const router = useMemo(() => createAppRouter({ user, onLogout }), [user, onLogout]);
  return <RouterProvider router={router} />;
}

function App() {
  const [status, setStatus] = useState<'loading' | 'auth' | 'stepup' | 'ready'>('loading');
  const [user, setUser] = useState<PlatformUser | null>(null);

  useEffect(() => {
    if (supabaseMisconfigured) {
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
        if (session.user.mustChangePassword || (session.user.mfaRequired && !session.user.mfaEnrolled)) {
          setStatus('stepup');
        } else {
          setStatus('ready');
        }
      })
      .catch(() => {
        if (mounted) setStatus('auth');
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (supabaseMisconfigured) {
    return <MisconfiguredScreen />;
  }

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
      {status === 'loading' && (
        <LoadingScreen
          onComplete={() => {
            if (status === 'loading') setStatus('auth');
          }}
        />
      )}
      {status === 'auth' && (
        <AuthPage
          onAuthenticated={(sessionUser) => {
            setUser(sessionUser);
            if (sessionUser.mustChangePassword || (sessionUser.mfaRequired && !sessionUser.mfaEnrolled)) {
              setStatus('stepup');
            } else {
              setStatus('ready');
            }
          }}
        />
      )}
      {status === 'stepup' && user && (
        <StepUpAuth
          user={user}
          onComplete={(updatedUser) => {
            setUser(updatedUser);
            setStatus('ready');
          }}
        />
      )}
      {status === 'ready' && user && (
        <AppRouter user={user} onLogout={async () => { await signOut(); setUser(null); setStatus('auth'); }} />
      )}
    </div>
  );
}

export default App;
