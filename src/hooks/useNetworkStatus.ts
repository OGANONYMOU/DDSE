import { useCallback, useEffect, useRef, useState } from 'react';
import { flushAuditQueue } from '../services/auditLogger';

export interface NetworkStatus {
  online:        boolean;
  wasOffline:    boolean;
  reconnectedAt: number | null;
  latency:       number | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [online,        setOnline]        = useState(navigator.onLine);
  const [wasOffline,    setWasOffline]    = useState(false);
  const [reconnectedAt, setReconnectedAt] = useState<number | null>(null);
  const [latency,       setLatency]       = useState<number | null>(null);
  const wentOfflineRef  = useRef(false);

  const handleOnline = useCallback(() => {
    setOnline(true);
    if (wentOfflineRef.current) {
      const now = Date.now();
      setWasOffline(true);
      setReconnectedAt(now);
      // Flush any queued offline audit events
      void flushAuditQueue();
    }
    wentOfflineRef.current = false;
  }, []);

  const handleOffline = useCallback(() => {
    setOnline(false);
    wentOfflineRef.current = true;
  }, []);

  // Latency check via a lightweight HEAD ping (every 30s when online)
  useEffect(() => {
    if (!online) { setLatency(null); return; }

    async function measureLatency() {
      try {
        const start = performance.now();
        await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
        setLatency(Math.round(performance.now() - start));
      } catch {
        setLatency(null);
      }
    }

    void measureLatency();
    const id = setInterval(() => void measureLatency(), 30_000);
    return () => clearInterval(id);
  }, [online]);

  useEffect(() => {
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { online, wasOffline, reconnectedAt, latency };
}
