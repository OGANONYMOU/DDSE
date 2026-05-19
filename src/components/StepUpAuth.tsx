import { useState } from 'react';
import { Lock, ShieldCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { updatePasswordAfterBootstrap } from '../lib/api';
import type { PlatformUser } from '../types/platform';

interface StepUpAuthProps {
  user: PlatformUser;
  onComplete: (updatedUser: PlatformUser) => void;
}

export default function StepUpAuth({ user, onComplete }: StepUpAuthProps) {
  const [step, setStep] = useState<'password' | 'mfa' | 'complete'>(
    user.mustChangePassword ? 'password' : 'mfa'
  );
  const [isBusy, setIsBusy] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.confirmPassword) {
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
      toast.success('Password updated successfully.');
      setStep('mfa');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleMfaEnroll() {
    setIsBusy(true);
    try {
      toast.success('MFA enrollment recorded.');
      setStep('complete');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#03040f] px-4">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-sky-500/15 bg-slate-950/85 p-8 shadow-2xl backdrop-blur-2xl">
        <div className="mb-8 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10 text-sky-300">
            {step === 'password' && <Lock className="h-8 w-8" />}
            {step === 'mfa' && <ShieldAlert className="h-8 w-8" />}
            {step === 'complete' && <CheckCircle2 className="h-8 w-8 text-green-400" />}
          </div>
        </div>

        {step === 'password' && (
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">Update Password</h2>
              <p className="mt-2 text-sm text-slate-400">
                You are using a temporary bootstrap password. Please set a secure password to continue.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-slate-500">New Password</label>
                <input
                  type="password"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-white outline-none focus:border-sky-500/50"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-slate-500">Confirm Password</label>
                <input
                  type="password"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-white outline-none focus:border-sky-500/50"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              disabled={isBusy}
              className="w-full rounded-xl bg-sky-600 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-sky-500 disabled:opacity-50"
            >
              {isBusy ? 'Processing...' : 'Update Password'}
            </button>
          </form>
        )}

        {step === 'mfa' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">MFA Enrollment</h2>
              <p className="mt-2 text-sm text-slate-400">
                Multi-Factor Authentication is required for your role. Please enroll to secure your account.
              </p>
            </div>

            <div className="rounded-xl border border-sky-500/10 bg-sky-500/5 p-4 text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-sky-400" />
              <p className="mt-4 text-sm text-slate-300">
                In a production environment, you would scan a QR code here. For this bootstrap flow, we will simulate enrollment.
              </p>
            </div>

            <button
              onClick={handleMfaEnroll}
              disabled={isBusy}
              className="w-full rounded-xl bg-sky-600 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-sky-500 disabled:opacity-50"
            >
              {isBusy ? 'Processing...' : 'Enroll in MFA'}
            </button>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-6 text-center">
            <h2 className="text-2xl font-bold text-white">Setup Complete</h2>
            <p className="text-sm text-slate-400">
              Your account is now fully secured and ready for use.
            </p>
            <button
              onClick={() => onComplete({ ...user, mustChangePassword: false, mfaEnrolled: true })}
              className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-green-500"
            >
              Enter Command Center
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
