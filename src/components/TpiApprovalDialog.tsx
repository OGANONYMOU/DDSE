// N-5: Two-Person Integrity (TPI) approval dialog.
// Displayed when a critical action requires a second authorized officer's confirmation.

import { useState, useEffect } from 'react';
import { ShieldCheck, X, Clock, UserCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import {
  createTpiRequest, confirmTpiRequest, rejectTpiRequest, getPendingTpiRequests,
  type TpiActionType, type TpiRequest,
} from '../services/tpi';

const ACTION_LABELS: Record<TpiActionType, string> = {
  report_approval:    'TOP SECRET Report Approval',
  armoury_inspection: 'Armoury Security Inspection',
  emergency_lockdown: 'Emergency System Lockdown',
  role_change:        'Privileged Role Assignment',
  data_export:        'Classified Data Export',
  budget_approval:    'Major Budget Approval',
};

interface InitiateProps {
  actionType:  TpiActionType;
  entityType:  string;
  entityId?:   string;
  description: string;
  onConfirmed: () => void;
  onCancel:    () => void;
}

export function TpiInitiateDialog({ actionType, entityType, entityId, description, onConfirmed, onCancel }: InitiateProps) {
  const { user }   = useAuth();
  const [request,  setRequest]  = useState<TpiRequest | null>(null);
  const [polling,  setPolling]  = useState(false);
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    setCreating(true);
    try {
      const req = await createTpiRequest(
        { actionType, entityType, entityId, description, classification: 'TOP_SECRET' },
        user.id,
        user.roleCode
      );
      setRequest(req);
      setPolling(true);
      toast.success('TPI request created. Awaiting second-officer confirmation.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create TPI request.');
    } finally {
      setCreating(false);
    }
  }

  // Poll every 5 seconds for confirmation
  useEffect(() => {
    if (!polling || !request) return;
    const id = setInterval(async () => {
      const { data } = await import('../lib/supabase').then(({ supabase }) =>
        supabase.from('tpi_requests').select('status').eq('id', request.id).maybeSingle()
      );
      if (data?.status === 'confirmed') {
        clearInterval(id);
        setPolling(false);
        onConfirmed();
      } else if (data?.status === 'rejected' || data?.status === 'expired') {
        clearInterval(id);
        setPolling(false);
        toast.error(`TPI request ${data.status}.`);
      }
    }, 5_000);
    return () => clearInterval(id);
  }, [polling, request, onConfirmed]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-950/98 p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/70">
                Two-Person Integrity Required
              </p>
              <p className="text-sm font-black text-white">{ACTION_LABELS[actionType]}</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} className="text-slate-500 hover:text-slate-300 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4 mb-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/70 mb-1">Action</p>
          <p className="text-[12px] text-slate-300">{description}</p>
        </div>

        {!request ? (
          <>
            <div className="mb-5 space-y-2">
              {[
                'This action requires confirmation from a second authorized officer.',
                'You will initiate the request. A peer officer (not yourself) must confirm.',
                'The request expires in 1 hour if unconfirmed.',
              ].map((txt, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                  <p className="text-[11px] font-mono text-slate-400">{txt}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onCancel}
                className="flex-1 rounded-xl border border-slate-700/60 py-2.5 text-[10px] font-black uppercase text-slate-500 hover:text-slate-300 transition">
                Cancel
              </button>
              <button type="button" onClick={() => void handleCreate()} disabled={creating}
                className="flex-1 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2.5 text-[10px] font-black uppercase text-amber-300 hover:bg-amber-500/15 transition disabled:opacity-50">
                {creating ? 'Creating…' : 'Initiate TPI Request'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            </div>
            <p className="text-[12px] font-mono text-slate-400">
              Waiting for second-officer confirmation…
            </p>
            <div className="flex items-center justify-center gap-2 text-[9px] font-mono text-slate-600">
              <Clock className="h-3 w-3" />
              Request ID: {request.id.slice(0, 8).toUpperCase()}
            </div>
            <button type="button" onClick={() => { setPolling(false); onCancel(); }}
              className="text-[10px] text-slate-600 hover:text-slate-400 transition">
              Cancel request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Confirmer view: shows pending TPI requests for a second officer to approve ─

interface ConfirmerProps {
  onClose: () => void;
}

export function TpiPendingPanel({ onClose }: ConfirmerProps) {
  const { user }    = useAuth();
  const [requests,  setRequests]  = useState<TpiRequest[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [reason,    setReason]    = useState('');

  useEffect(() => {
    getPendingTpiRequests()
      // Only show requests the current user DID NOT initiate
      .then((r) => setRequests(r.filter((x) => x.initiatorId !== user.id)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  async function confirm(id: string) {
    try {
      await confirmTpiRequest(id, user.id, user.roleCode);
      toast.success('TPI action confirmed.');
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Confirmation failed.');
    }
  }

  async function reject(id: string) {
    if (!reason.trim()) { toast.error('Provide a rejection reason.'); return; }
    try {
      await rejectTpiRequest(id, reason, user.id);
      toast.success('TPI request rejected.');
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setReason('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Rejection failed.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800/60 bg-slate-950/98 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-sky-400" />
            <p className="text-[12px] font-black uppercase tracking-wider text-white">Pending TPI Confirmations</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-300 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          </div>
        ) : requests.length === 0 ? (
          <p className="py-8 text-center text-[12px] font-mono text-slate-600">No pending TPI requests</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {requests.map((r) => (
              <div key={r.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-400/70">
                    {ACTION_LABELS[r.actionType]}
                  </p>
                  <p className="text-[12px] font-bold text-white mt-1">{r.description}</p>
                  <p className="text-[9px] font-mono text-slate-600 mt-1">
                    Initiated by {r.initiatorRole} · Expires {new Date(r.expiresAt).toLocaleTimeString()}
                  </p>
                </div>
                <textarea
                  rows={2} placeholder="Optional notes or rejection reason…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full resize-none rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-[10px] font-mono text-slate-300 outline-none"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => void reject(r.id)}
                    className="flex-1 rounded-lg border border-rose-500/30 py-2 text-[10px] font-black uppercase text-rose-400 hover:bg-rose-500/10 transition">
                    Reject
                  </button>
                  <button type="button" onClick={() => void confirm(r.id)}
                    className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2 text-[10px] font-black uppercase text-emerald-400 hover:bg-emerald-500/15 transition">
                    Confirm
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
