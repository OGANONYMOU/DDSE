// C-6: Real MFA enforcement using Supabase TOTP MFA
// Handles: password change gate → TOTP enrollment → TOTP verification → completion
// Clearance 5+ and directors are required to enroll; lower clearances see a skip option.

import { useState, useEffect } from 'react';
import { Lock, ShieldCheck, ShieldAlert, CheckCircle2, QrCode, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { updatePasswordAfterBootstrap } from '../lib/api';
import type { PlatformUser } from '../types/platform';

interface StepUpAuthProps {
  user:       PlatformUser;
  onComplete: (updatedUser: PlatformUser) => void;
}

type MfaStep = 'password' | 'mfa_enroll' | 'mfa_verify' | 'complete';

// Roles that MUST enroll in MFA — no skip allowed
const MFA_REQUIRED_ROLES = new Set([
  'platform_owner', 'super_admin', 'director', 'commander',
]);

// Clearance levels that MUST enroll in MFA
const MFA_REQUIRED_CLEARANCE = 4; // 4+

function isMfaMandatory(user: PlatformUser): boolean {
  if (user.mfaRequired) return true;
  if (MFA_REQUIRED_ROLES.has(user.roleCode)) return true;
  if ((user.clearanceLevel ?? 1) >= MFA_REQUIRED_CLEARANCE) return true;
  return false;
}

export default function StepUpAuth({ user, onComplete }: StepUpAuthProps) {
  const mandatory = isMfaMandatory(user);

  const initialStep: MfaStep = user.mustChangePassword
    ? 'password'
    : user.mfaEnrolled
      ? 'mfa_verify'   // enrolled but not yet verified this session
      : 'mfa_enroll';  // not yet enrolled

  const [step,          setStep]          = useState<MfaStep>(initialStep);
  const [isBusy,        setIsBusy]        = useState(false);
  const [passwordForm,  setPasswordForm]  = useState({ password: '', confirm: '' });
  const [qrUri,         setQrUri]         = useState('');
  const [factorId,      setFactorId]      = useState('');
  const [challengeId,   setChallengeId]   = useState('');
  const [totpCode,      setTotpCode]      = useState('');
  const [secretKey,     setSecretKey]     = useState('');

  // Auto-start enrollment when reaching mfa_enroll step
  useEffect(() => {
    if (step === 'mfa_enroll') {
      startEnrollment().catch(() => {});
    } else if (step === 'mfa_verify') {
      startChallenge().catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Password change ────────────────────────────────────────────────────────

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    if (passwordForm.password.length < 12) {
      toast.error('Password must be at least 12 characters.');
      return;
    }
    setIsBusy(true);
    try {
      await updatePasswordAfterBootstrap(passwordForm.password);

      // Update user_profiles flag
      await supabase
        .from('user_profiles')
        .update({ must_change_password: false })
        .eq('id', user.id);

      toast.success('Password updated.');
      setStep(user.mfaEnrolled ? 'mfa_verify' : 'mfa_enroll');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Password update failed.');
    } finally {
      setIsBusy(false);
    }
  }

  // ── TOTP Enrollment ────────────────────────────────────────────────────────

  async function startEnrollment() {
    setIsBusy(true);
    try {
      // Check if already enrolled
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const existingTotp = factors?.totp?.find((f) => f.status === 'verified');
      if (existingTotp) {
        // Already enrolled — go straight to verify
        setFactorId(existingTotp.id);
        setStep('mfa_verify');
        return;
      }

      // Enroll a new TOTP factor
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      if (!data) throw new Error('MFA enrollment returned no data.');

      setFactorId(data.id);
      setQrUri(data.totp.qr_code);
      setSecretKey(data.totp.secret);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'MFA enrollment failed. Try again.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleVerifyEnrollment(e: React.FormEvent) {
    e.preventDefault();
    if (totpCode.length !== 6 || !/^\d{6}$/.test(totpCode)) {
      toast.error('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setIsBusy(true);
    try {
      // Create a challenge then verify it to complete enrollment
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code:        totpCode,
      });
      if (verifyError) throw verifyError;

      // Mark enrolled in user_profiles
      await supabase
        .from('user_profiles')
        .update({ mfa_enrolled: true, mfa_required: true })
        .eq('id', user.id);

      toast.success('MFA enrollment complete. Your account is now secured.');
      setStep('complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verification failed. Check your code and retry.');
      setTotpCode('');
    } finally {
      setIsBusy(false);
    }
  }

  // ── TOTP Verification (existing enrolled users) ────────────────────────────

  async function startChallenge() {
    if (!factorId) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.find((f) => f.status === 'verified');
      if (!totp) {
        setStep('mfa_enroll');
        return;
      }
      setFactorId(totp.id);
    }

    setIsBusy(true);
    try {
      const factors = await supabase.auth.mfa.listFactors();

const fid =
  factorId ??
  factors.data?.totp?.[0]?.id ??
  '';
      const { data, error } = await supabase.auth.mfa.challenge({ factorId: fid });
      if (error) throw error;
      setChallengeId(data.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start MFA challenge.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleVerifyChallenge(e: React.FormEvent) {
    e.preventDefault();
    if (!challengeId) {
      toast.error('Challenge not started. Refresh the page.');
      return;
    }
    if (totpCode.length !== 6 || !/^\d{6}$/.test(totpCode)) {
      toast.error('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setIsBusy(true);
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: totpCode,
      });
      if (error) throw error;
      setStep('complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid code. Check your authenticator app.');
      setTotpCode('');
    } finally {
      setIsBusy(false);
    }
  }

  // ── Skip MFA (non-mandatory roles only) ───────────────────────────────────

  function handleSkipMfa() {
    if (mandatory) return;
    setStep('complete');
  }

  // ── Complete ──────────────────────────────────────────────────────────────

  function handleComplete() {
    onComplete({
      ...user,
      mustChangePassword: false,
      mfaEnrolled:        step === 'complete' ? true : user.mfaEnrolled,
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const iconMap: Record<MfaStep, React.ReactNode> = {
    password:   <Lock       className="h-8 w-8" />,
    mfa_enroll: <ShieldAlert className="h-8 w-8" />,
    mfa_verify: <KeyRound   className="h-8 w-8" />,
    complete:   <CheckCircle2 className="h-8 w-8 text-emerald-400" />,
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#03040f] px-4">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-sky-500/15 bg-slate-950/85 p-8 shadow-2xl backdrop-blur-2xl">

        <div className="mb-8 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10 text-sky-300">
            {iconMap[step]}
          </div>
        </div>

        {/* ── Step: Password Change ── */}
        {step === 'password' && (
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">Update Password</h2>
              <p className="mt-2 text-sm text-slate-400">
                You are using a temporary bootstrap password. Set a secure password of at least 12 characters.
              </p>
            </div>
            <div className="space-y-4">
              {(['password', 'confirm'] as const).map((field) => (
                <div key={field} className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-slate-500">
                    {field === 'password' ? 'New Password' : 'Confirm Password'}
                  </label>
                  <input
                    type="password" required autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-white outline-none focus:border-sky-500/50"
                    value={passwordForm[field]}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, [field]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <button
              type="submit" disabled={isBusy}
              className="w-full rounded-xl bg-sky-600 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-sky-500 disabled:opacity-50"
            >
              {isBusy ? 'Processing…' : 'Update Password'}
            </button>
          </form>
        )}

        {/* ── Step: MFA Enrollment ── */}
        {step === 'mfa_enroll' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">Enroll in MFA</h2>
              <p className="mt-2 text-sm text-slate-400">
                {mandatory
                  ? 'MFA is mandatory for your security clearance level. Scan the QR code with an authenticator app.'
                  : 'Secure your account with an authenticator app (optional but recommended).'}
              </p>
            </div>

            {isBusy && !qrUri && (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              </div>
            )}

            {qrUri && (
              <>
                <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
                  <QrCode className="h-5 w-5 text-slate-400" />
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Scan with your authenticator app</p>
                  <img src={qrUri} alt="TOTP QR Code" className="h-40 w-40 rounded-lg" />
                  {secretKey && (
                    <div className="mt-2 w-full">
                      <p className="text-center text-[10px] text-slate-600 uppercase tracking-widest">Manual entry key</p>
                      <p className="mt-1 break-all text-center font-mono text-xs text-slate-400">{secretKey}</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleVerifyEnrollment} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-slate-500">Enter 6-digit Code</label>
                    <input
                      type="text" inputMode="numeric" pattern="\d{6}" maxLength={6} required
                      placeholder="000000"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-center font-mono text-lg text-white tracking-[0.4em] outline-none focus:border-sky-500/50"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                  </div>
                  <button
                    type="submit" disabled={isBusy || totpCode.length !== 6}
                    className="w-full rounded-xl bg-sky-600 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-sky-500 disabled:opacity-50"
                  >
                    {isBusy ? 'Verifying…' : 'Verify & Activate MFA'}
                  </button>
                </form>

                {!mandatory && (
                  <button
                    onClick={handleSkipMfa}
                    className="w-full text-center text-xs text-slate-600 hover:text-slate-400 transition"
                  >
                    Skip for now (not recommended)
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Step: MFA Verification ── */}
        {step === 'mfa_verify' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">Verify Identity</h2>
              <p className="mt-2 text-sm text-slate-400">
                Enter the 6-digit code from your authenticator app to continue.
              </p>
            </div>
            <form onSubmit={handleVerifyChallenge} className="space-y-4">
              <input
                type="text" inputMode="numeric" pattern="\d{6}" maxLength={6} required
                placeholder="000000"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-center font-mono text-lg text-white tracking-[0.4em] outline-none focus:border-sky-500/50"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <button
                type="submit" disabled={isBusy || totpCode.length !== 6}
                className="w-full rounded-xl bg-sky-600 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-sky-500 disabled:opacity-50"
              >
                {isBusy ? 'Verifying…' : 'Verify'}
              </button>
            </form>
          </div>
        )}

        {/* ── Step: Complete ── */}
        {step === 'complete' && (
          <div className="space-y-6 text-center">
            <h2 className="text-2xl font-bold text-white">Access Granted</h2>
            <p className="text-sm text-slate-400">
              Your account is authenticated and secured. Welcome to the Command Center.
            </p>
            <button
              onClick={handleComplete}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500"
            >
              Enter Command Center
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
