import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const WARN_MS = 5 * 60 * 1000; // warn 5 minutes before expiry

interface SessionTimeoutState {
  warningVisible: boolean;
  secondsLeft: number;
  extendSession: () => Promise<void>;
  dismissWarning: () => void;
}

export function useSessionTimeout(onExpired: () => void): SessionTimeoutState {
  const [expiresAt, setExpiresAt]     = useState<number | null>(null);
  const [warningVisible, setWarning]  = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);
  // Only expire if we actually had a real Supabase session — prevents
  // the dev-account bypass from immediately triggering logout.
  const hadSession = useRef(false);

  // Load initial expiry from Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.expires_at) {
        hadSession.current = true;
        setExpiresAt(data.session.expires_at * 1000);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.expires_at) {
        hadSession.current = true;
        setExpiresAt(session.expires_at * 1000);
        setWarning(false);
      } else if (!session && hadSession.current) {
        // Real session expired — log out
        onExpired();
      }
    });

    return () => subscription.unsubscribe();
  }, [onExpired]);

  // Countdown + warning trigger
  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        onExpired();
        return;
      }
      if (remaining <= WARN_MS) {
        setWarning(true);
        setSecondsLeft(Math.ceil(remaining / 1000));
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpired]);

  const extendSession = useCallback(async () => {
    const { data } = await supabase.auth.refreshSession();
    if (data.session?.expires_at) {
      setExpiresAt(data.session.expires_at * 1000);
      setWarning(false);
    }
  }, []);

  const dismissWarning = useCallback(() => setWarning(false), []);

  return { warningVisible, secondsLeft, extendSession, dismissWarning };
}
