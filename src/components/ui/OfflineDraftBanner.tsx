// I-5: Offline sync UI — shows pending drafts and triggers sync on reconnect.

import { useState, useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import {
  getOfflineStats,
  syncDrafts,
  type OfflineDraft,
} from '../../lib/offlineSync';

interface Props {
  onSync?: (draft: OfflineDraft) => Promise<{ entityId: string }>;
}

export default function OfflineDraftBanner({ onSync }: Props) {
  const { online, wasOffline } = useNetworkStatus();
  const [stats,   setStats]   = useState({ totalDrafts: 0, pendingSync: 0, syncedDrafts: 0, conflicted: 0 });
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<{ synced: number; failed: number } | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      const s = await getOfflineStats();
      setStats(s);
    } catch { /* IndexedDB unavailable */ }
  }, []);

  useEffect(() => { void refreshStats(); }, [refreshStats]);

  // Auto-sync when connectivity is restored
  useEffect(() => {
    if (online && wasOffline && stats.pendingSync > 0 && onSync) {
      void handleSync();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, wasOffline]);

  async function handleSync() {
    if (!onSync) return;
    setSyncing(true);
    try {
      const result = await syncDrafts(onSync);
      setLastResult(result);
      await refreshStats();
    } catch { /* silent */ } finally {
      setSyncing(false);
    }
  }

  // Only show banner when offline or there are pending drafts
  const showOffline  = !online;
  const showPending  = online && stats.pendingSync > 0;
  const showSynced   = online && lastResult && lastResult.synced > 0;

  if (!showOffline && !showPending && !showSynced) return null;

  if (showOffline) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <WifiOff className="h-4 w-4 shrink-0 text-amber-400" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black uppercase tracking-wide text-amber-300">
            Offline Mode — Drafts are saved locally
          </p>
          {stats.pendingSync > 0 && (
            <p className="mt-0.5 text-[10px] font-mono text-amber-600">
              {stats.pendingSync} draft{stats.pendingSync !== 1 ? 's' : ''} queued for sync when connectivity returns
            </p>
          )}
        </div>
      </div>
    );
  }

  if (showPending) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3">
        <AlertCircle className="h-4 w-4 shrink-0 text-sky-400" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black uppercase tracking-wide text-sky-300">
            {stats.pendingSync} draft{stats.pendingSync !== 1 ? 's' : ''} pending sync
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleSync()}
          disabled={syncing || !onSync}
          className="flex items-center gap-1.5 rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-[10px] font-black uppercase text-sky-300 transition hover:bg-sky-500/15 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing…' : 'Sync Now'}
        </button>
      </div>
    );
  }

  if (showSynced && lastResult) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
        <p className="text-[11px] font-black uppercase tracking-wide text-emerald-300">
          {lastResult.synced} draft{lastResult.synced !== 1 ? 's' : ''} synced successfully
          {lastResult.failed > 0 && ` · ${lastResult.failed} failed`}
        </p>
      </div>
    );
  }

  return null;
}
