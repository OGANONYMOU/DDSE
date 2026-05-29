// DDSE Offline Inspection Sync System
// Uses IndexedDB to persist inspection drafts when the user is offline.
// Queues sync operations and replays them when connectivity is restored.

const DB_NAME    = 'ddse_offline';
const DB_VERSION = 1;

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'conflict' | 'error';

export interface OfflineDraft {
  id:          string;        // local draft ID (uuid-style)
  type:        'inspection' | 'hazard_assessment' | 'report';
  entityId?:   string;        // server entity ID if editing existing
  title:       string;
  data:        Record<string, unknown>;
  createdAt:   number;
  updatedAt:   number;
  syncStatus:  SyncStatus;
  syncError?:  string;
  retryCount:  number;
}

export interface SyncQueueEntry {
  id:         string;
  draftId:    string;
  operation:  'create' | 'update' | 'delete';
  endpoint?:  string;
  queuedAt:   number;
  attempts:   number;
}

// ─── IndexedDB access ─────────────────────────────────────────────────────────

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('drafts')) {
        const store = db.createObjectStore('drafts', { keyPath: 'id' });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('type',       'type',       { unique: false });
      }

      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function generateId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Draft CRUD ───────────────────────────────────────────────────────────────

export async function saveDraft(
  draft: Omit<OfflineDraft, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'retryCount'>
): Promise<OfflineDraft> {
  const db     = await openDb();
  const now    = Date.now();
  const record: OfflineDraft = {
    ...draft,
    id:         generateId(),
    createdAt:  now,
    updatedAt:  now,
    syncStatus: 'pending',
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const tx    = db.transaction('drafts', 'readwrite');
    const req   = tx.objectStore('drafts').put(record);
    req.onsuccess = () => resolve(record);
    req.onerror   = () => reject(req.error);
  });
}

export async function updateDraft(
  id:      string,
  updates: Partial<Pick<OfflineDraft, 'data' | 'title' | 'syncStatus' | 'syncError' | 'retryCount'>>
): Promise<void> {
  const db   = await openDb();
  const now  = Date.now();

  return new Promise((resolve, reject) => {
    const tx    = db.transaction('drafts', 'readwrite');
    const store = tx.objectStore('drafts');
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const existing: OfflineDraft = getReq.result;
      if (!existing) { reject(new Error('Draft not found')); return; }
      const updated = { ...existing, ...updates, updatedAt: now };
      const putReq  = store.put(updated);
      putReq.onsuccess = () => resolve();
      putReq.onerror   = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function getDraft(id: string): Promise<OfflineDraft | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('drafts', 'readonly');
    const req = tx.objectStore('drafts').get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror   = () => reject(req.error);
  });
}

export async function getAllDrafts(): Promise<OfflineDraft[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('drafts', 'readonly');
    const req = tx.objectStore('drafts').getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror   = () => reject(req.error);
  });
}

export async function getPendingDrafts(): Promise<OfflineDraft[]> {
  const drafts = await getAllDrafts();
  return drafts.filter((d) => d.syncStatus === 'pending' || d.syncStatus === 'error');
}

export async function deleteDraft(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('drafts', 'readwrite');
    const req = tx.objectStore('drafts').delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ─── Sync engine ──────────────────────────────────────────────────────────────

export async function syncDrafts(
  onSync: (draft: OfflineDraft) => Promise<{ entityId: string }>,
  opts: { maxRetries?: number } = {}
): Promise<{ synced: number; failed: number }> {
  const maxRetries = opts.maxRetries ?? 3;
  const pending    = await getPendingDrafts();
  let synced = 0;
  let failed = 0;

  for (const draft of pending) {
    if (draft.retryCount >= maxRetries) {
      await updateDraft(draft.id, { syncStatus: 'error', syncError: 'Max retries exceeded' });
      failed++;
      continue;
    }

    try {
      await updateDraft(draft.id, { syncStatus: 'syncing' });
      const result = await onSync(draft);
      await updateDraft(draft.id, {
        syncStatus: 'synced',
        ...(result.entityId ? {} : {}),
      });
      synced++;
    } catch (err) {
      await updateDraft(draft.id, {
        syncStatus:  'error',
        syncError:   err instanceof Error ? err.message : String(err),
        retryCount:  draft.retryCount + 1,
      });
      failed++;
    }
  }

  return { synced, failed };
}

// ─── Storage stats ────────────────────────────────────────────────────────────

export async function getOfflineStats(): Promise<{
  totalDrafts:   number;
  pendingSync:   number;
  syncedDrafts:  number;
  conflicted:    number;
}> {
  const drafts = await getAllDrafts();
  return {
    totalDrafts:  drafts.length,
    pendingSync:  drafts.filter((d) => d.syncStatus === 'pending').length,
    syncedDrafts: drafts.filter((d) => d.syncStatus === 'synced').length,
    conflicted:   drafts.filter((d) => d.syncStatus === 'conflict').length,
  };
}
