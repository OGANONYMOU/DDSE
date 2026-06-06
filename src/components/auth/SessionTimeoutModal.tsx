// I-14: Clearance 5+ sessions require MFA re-verification on session timeout,
// not just a session extension. Lower clearances may extend normally.

import { useState } from 'react';
import { Clock, RefreshCw, LogOut, KeyRound, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

interface SessionTimeoutModalProps {
  secondsLeft:    number;
  clearanceLevel: number;
  onExtend:       () => Promise<void>;
  onLogout:       () => void;
}

const MFA_REAUTH_CLEARANCE = 5;  // I-14: clearance 5+ require MFA re-auth

export default function SessionTimeoutModal({
  secondsLeft,
  clearanceLevel,
  onExtend,
  onLogout,
}: SessionTimeoutModalProps) {
  const mins    = Math.floor(secondsLeft / 60);
  const secs    = secondsLeft % 60;
  const timeStr = mins > 0
    ? `${mins}m ${String(secs).padStart(2, '0')}s`
    : `${secs}s`;

  const urgent          = secondsLeft <= 60;
  const requiresMfaReauth = clearanceLevel >= MFA_REAUTH_CLEARANCE;

  const [mfaStep,   setMfaStep]   = useState(false);
  const [totpCode,  setTotpCode]  = useState('');
  const [verifying, setVerifying] = useState(false);

  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault();
    if (totpCode.length !== 6) return;
    setVerifying(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.find((f) => f.status === 'verified');
      if (!totp) throw new Error('No TOTP factor enrolled.');

      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: totp.id });
      if (cErr) throw cErr;

      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId:    totp.id,
        challengeId: challenge.id,
        code:        totpCode,
      });
      if (vErr) throw vErr;

      // MFA verified — now extend the session
      await onExtend();
      setMfaStep(false);
      setTotpCode('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'MFA verification failed. Try again.');
      setTotpCode('');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="timeout-title"
      aria-describedby="timeout-desc"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div className={`w-full max-w-md rounded-2xl border p-8 shadow-2xl ${urgent ? 'border-rose-500/30 bg-rose-950/60' : 'border-slate-800/60 bg-slate-950/95'}`}>

        {!mfaStep ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${urgent ? 'border-rose-500/30 bg-rose-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
                <Clock className={`h-5 w-5 ${urgent ? 'text-rose-400' : 'text-amber-400'}`} />
              </div>
              <div>
                <p id="timeout-title" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Session Expiry Warning
                </p>
                <p className="mt-0.5 text-sm font-black text-white">Your session is about to expire</p>
              </div>
            </div>

            {/* Countdown */}
            <div className={`flex items-center justify-center rounded-xl border py-5 mb-6 ${urgent ? 'border-rose-500/20 bg-rose-500/5' : 'border-slate-800/60 bg-slate-900/40'}`}>
              <p id="timeout-desc" className={`text-4xl font-black tabular-nums tracking-wider ${urgent ? 'text-rose-300' : 'text-amber-300'}`}>
                {timeStr}
              </p>
            </div>

            {/* I-14: MFA re-auth notice for high clearance */}
            {requiresMfaReauth && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
                <p className="text-[10px] font-mono text-amber-400 uppercase">
                  Clearance {clearanceLevel} — MFA verification required to re-authenticate
                </p>
              </div>
            )}

            <p className="mb-6 text-[11px] font-mono text-slate-500 uppercase text-center">
              {requiresMfaReauth
                ? 'Your clearance level requires MFA re-verification to extend this session.'
                : 'All unsaved work will be lost. Extend your session to continue.'}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => requiresMfaReauth ? setMfaStep(true) : void onExtend()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-sky-500/25 bg-sky-500/10 py-3 text-[11px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15"
              >
                {requiresMfaReauth ? <KeyRound className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {requiresMfaReauth ? 'Verify MFA' : 'Extend Session'}
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500 transition hover:text-rose-400"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* MFA Re-auth step */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10">
                <KeyRound className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">MFA Re-Verification</p>
                <p className="mt-0.5 text-sm font-black text-white">Enter your authenticator code</p>
              </div>
            </div>

            <form onSubmit={handleMfaVerify} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-center font-mono text-2xl text-white tracking-[0.4em] outline-none focus:border-sky-500/50"
                autoFocus
              />
              <button
                type="submit"
                disabled={verifying || totpCode.length !== 6}
                className="w-full rounded-xl bg-sky-600 py-3 text-[11px] font-black uppercase tracking-wider text-white transition hover:bg-sky-500 disabled:opacity-50"
              >
                {verifying ? 'Verifying…' : 'Verify & Continue'}
              </button>
              <button
                type="button"
                onClick={() => { setMfaStep(false); setTotpCode(''); }}
                className="w-full text-center text-[10px] text-slate-600 hover:text-slate-400 transition"
              >
                Back
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
