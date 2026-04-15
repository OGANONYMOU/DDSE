import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, LockKeyhole, MessageSquareCode, Shield, User2 } from 'lucide-react';
import { toast } from 'sonner';
import { completeSignIn, getRegistrationFormOptions, registerPersonnel, requestPasswordReset, resendChallenge, resetPassword, verifyPasswordReset, verifyRegistration, verifySignIn } from '../lib/api';
import { appConfig } from '../lib/sessionBroker';
import type { PlatformUser, RegistrationFormOptions } from '../types/platform';

type View = 'sign_in' | 'register' | 'otp' | 'forgot' | 'reset';

interface AuthPageProps {
  onAuthenticated: (user: PlatformUser) => void;
}

const initialRegistration = {
  fullName: '',
  appointmentNumber: '',
  rankCode: '',
  requestedRoleCode: 'base_soldier',
  directorateCode: '',
  formationCode: '',
  unitCode: '',
  phoneNumber: '',
  email: '',
  branch: '',
  identityNumber: '',
  justification: '',
  password: '',
  confirmPassword: '',
};

export default function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [view, setView] = useState<View>('sign_in');
  const [catalogs, setCatalogs] = useState<RegistrationFormOptions | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [signInForm, setSignInForm] = useState({ appointmentNumber: '', password: '' });
  const [registrationForm, setRegistrationForm] = useState(initialRegistration);
  const [challengeContext, setChallengeContext] = useState<{ purpose: 'registration' | 'sign_in' | 'password_reset'; challengeId: string; destinationMasked: string; appointmentNumber?: string } | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [forgotAppointmentNumber, setForgotAppointmentNumber] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetForm, setResetForm] = useState({ password: '', confirmPassword: '' });

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = window.setTimeout(() => setResendCooldown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    getRegistrationFormOptions()
      .then((result) => setCatalogs(result))
      .catch((error: Error) => toast.error(error.message));
  }, []);

  const unitsForSelectedFormation = useMemo(
    () => catalogs?.units.filter((unit) => unit.formationCode === registrationForm.formationCode) ?? [],
    [catalogs, registrationForm.formationCode],
  );

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setIsBusy(true);
    try {
      const result = await completeSignIn(signInForm);
      if (result.user && !result.requiresOtp) {
        onAuthenticated(result.user);
        toast.success('Secure session established.');
      } else if (result.requiresOtp && result.challengeId) {
        setChallengeContext({
          purpose: 'sign_in',
          challengeId: result.challengeId,
          destinationMasked: result.destinationMasked ?? 'secured channel',
          appointmentNumber: signInForm.appointmentNumber,
        });
        setResendCooldown(60);
        setView('otp');
        if (result.previewCode && appConfig.devOtpPreview) {
          toast.info(`Dev OTP preview: ${result.previewCode}`);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign in failed.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRegistration(event: React.FormEvent) {
    event.preventDefault();
    setIsBusy(true);
    try {
      const result = await registerPersonnel({
        ...registrationForm,
        email: registrationForm.email || undefined,
        branch: registrationForm.branch || undefined,
        identityNumber: registrationForm.identityNumber || undefined,
        justification: registrationForm.justification || undefined,
      });
      setChallengeContext({
        purpose: 'registration',
        challengeId: result.challengeId,
        destinationMasked: result.destinationMasked,
        appointmentNumber: registrationForm.appointmentNumber,
      });
      setResendCooldown(60);
      setView('otp');
      toast.success('Registration submitted. Verify the one-time code to continue.');
      if (result.previewCode && appConfig.devOtpPreview) {
        toast.info(`Dev OTP preview: ${result.previewCode}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleForgotPassword(event: React.FormEvent) {
    event.preventDefault();
    setIsBusy(true);
    try {
      const result = await requestPasswordReset(forgotAppointmentNumber);
      toast.success(result.message);
      if (result.challengeId) {
        setChallengeContext({
          purpose: 'password_reset',
          challengeId: result.challengeId,
          destinationMasked: result.destinationMasked,
          appointmentNumber: forgotAppointmentNumber,
        });
        setResendCooldown(60);
        setView('otp');
        if (result.previewCode && appConfig.devOtpPreview) {
          toast.info(`Dev OTP preview: ${result.previewCode}`);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not start password reset.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleOtpVerification(event: React.FormEvent) {
    event.preventDefault();
    if (!challengeContext) return;
    setIsBusy(true);
    try {
      if (challengeContext.purpose === 'registration') {
        const result = await verifyRegistration(challengeContext.challengeId, otpCode);
        toast.success(result.message);
        setRegistrationForm(initialRegistration);
        setOtpCode('');
        setChallengeContext(null);
        setView('sign_in');
      } else if (challengeContext.purpose === 'sign_in') {
        const session = await verifySignIn(challengeContext.challengeId, otpCode);
        onAuthenticated(session.user);
        toast.success('MFA verification complete.');
      } else {
        const result = await verifyPasswordReset(challengeContext.challengeId, otpCode);
        setResetToken(result.resetToken);
        setOtpCode('');
        setView('reset');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Verification failed.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();
    if (!challengeContext?.appointmentNumber) return;
    setIsBusy(true);
    try {
      await resetPassword({
        appointmentNumber: challengeContext.appointmentNumber,
        resetToken,
        password: resetForm.password,
        confirmPassword: resetForm.confirmPassword,
      });
      toast.success('Password reset completed. Sign in with the new credential.');
      setResetForm({ password: '', confirmPassword: '' });
      setChallengeContext(null);
      setResetToken('');
      setView('sign_in');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Password reset failed.');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(56,182,255,0.18),transparent_35%),linear-gradient(180deg,#02030c_0%,#060818_65%,#03040f_100%)] px-4 py-12">
      <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-sky-500/15 bg-slate-950/85 shadow-[0_40px_140px_rgba(2,6,23,0.9)] backdrop-blur-2xl">
        <div className="h-1 bg-[linear-gradient(90deg,#ff3131_0%,#1800ad_45%,#38b6ff_100%)]" />
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.35fr]">
          <aside className="border-b border-sky-500/10 bg-slate-950/70 p-8 lg:border-b-0 lg:border-r">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10">
              <Shield className="h-7 w-7 text-sky-300" />
            </div>
            <p className="mt-6 text-xs uppercase tracking-[0.35em] text-sky-300/80">DDSE</p>
            <h1 className="mt-2 text-3xl font-black text-white">Secure Personnel Access</h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Loading, sign in, registration, forgot password, OTP verification, and reset password are restored as real backend-driven flows backed by Convex and protected by audit and approval controls.
            </p>
            <div className="mt-8 space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">Registration does not auto-grant privileged access. Sensitive roles remain pending approval.</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">OTP challenges are backend-issued and require a configured delivery channel.</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">Operational data, inspection workflows, and audit history are now backed by Convex.</div>
            </div>
          </aside>

          <section className="p-8">
            <div className="mb-6 flex flex-wrap gap-2">
              {[
                { id: 'sign_in', label: 'Sign In' },
                { id: 'register', label: 'Registration' },
                { id: 'forgot', label: 'Forgot Password' },
              ].map((item) => (
                <button
                  key={item.id}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${view === item.id ? 'bg-sky-500/20 text-sky-100' : 'bg-slate-900 text-slate-400'}`}
                  onClick={() => setView(item.id as View)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {view === 'sign_in' && (
              <form className="space-y-5" onSubmit={handleSignIn}>
                <Field label="Appointment / Service Number">
                  <InputBox icon={<User2 className="h-4 w-4 text-slate-500" />}>
                    <input className="w-full bg-transparent text-sm text-white outline-none" value={signInForm.appointmentNumber} onChange={(event) => setSignInForm((current) => ({ ...current, appointmentNumber: event.target.value }))} required />
                  </InputBox>
                </Field>
                <Field label="Password">
                  <InputBox icon={<LockKeyhole className="h-4 w-4 text-slate-500" />}>
                    <input className="w-full bg-transparent text-sm text-white outline-none" type="password" minLength={12} value={signInForm.password} onChange={(event) => setSignInForm((current) => ({ ...current, password: event.target.value }))} required />
                  </InputBox>
                </Field>
                <PrimaryButton busy={isBusy}>Secure Sign In</PrimaryButton>
              </form>
            )}

            {view === 'register' && (
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleRegistration}>
                <Field label="Full Name"><SimpleInput value={registrationForm.fullName} onChange={(value) => setRegistrationForm((current) => ({ ...current, fullName: value }))} /></Field>
                <Field label="Appointment / Service Number"><SimpleInput value={registrationForm.appointmentNumber} onChange={(value) => setRegistrationForm((current) => ({ ...current, appointmentNumber: value }))} /></Field>
                <Field label="Rank"><SelectBox value={registrationForm.rankCode} onChange={(value) => setRegistrationForm((current) => ({ ...current, rankCode: value }))} options={catalogs?.ranks.map((rank) => ({ value: rank.code, label: rank.label })) ?? []} /></Field>
                <Field label="Role Request"><SelectBox value={registrationForm.requestedRoleCode} onChange={(value) => setRegistrationForm((current) => ({ ...current, requestedRoleCode: value }))} options={catalogs?.roles.map((role) => ({ value: role.code, label: `${role.label}${role.privileged ? ' (Approval Required)' : ''}` })) ?? []} /></Field>
                <Field label="Directorate"><SelectBox value={registrationForm.directorateCode} onChange={(value) => setRegistrationForm((current) => ({ ...current, directorateCode: value }))} options={catalogs?.directorates.map((item) => ({ value: item.code, label: item.name })) ?? []} /></Field>
                <Field label="Formation"><SelectBox value={registrationForm.formationCode} onChange={(value) => setRegistrationForm((current) => ({ ...current, formationCode: value, unitCode: '' }))} options={catalogs?.formations.map((item) => ({ value: item.code, label: item.name })) ?? []} /></Field>
                <Field label="Unit"><SelectBox value={registrationForm.unitCode} onChange={(value) => setRegistrationForm((current) => ({ ...current, unitCode: value }))} options={unitsForSelectedFormation.map((item) => ({ value: item.code, label: item.name }))} /></Field>
                <Field label="Phone Number"><SimpleInput value={registrationForm.phoneNumber} onChange={(value) => setRegistrationForm((current) => ({ ...current, phoneNumber: value }))} /></Field>
                <Field label="Email"><SimpleInput value={registrationForm.email} onChange={(value) => setRegistrationForm((current) => ({ ...current, email: value }))} /></Field>
                <Field label="Service Branch"><SimpleInput value={registrationForm.branch} onChange={(value) => setRegistrationForm((current) => ({ ...current, branch: value }))} /></Field>
                <Field label="Identity / Personnel Number"><SimpleInput value={registrationForm.identityNumber} onChange={(value) => setRegistrationForm((current) => ({ ...current, identityNumber: value }))} /></Field>
                <Field label="Role Justification"><SimpleInput value={registrationForm.justification} onChange={(value) => setRegistrationForm((current) => ({ ...current, justification: value }))} /></Field>
                <Field label="Password"><SimpleInput type="password" value={registrationForm.password} onChange={(value) => setRegistrationForm((current) => ({ ...current, password: value }))} /></Field>
                <Field label="Confirm Password"><SimpleInput type="password" value={registrationForm.confirmPassword} onChange={(value) => setRegistrationForm((current) => ({ ...current, confirmPassword: value }))} /></Field>
                <div className="md:col-span-2">
                  <PrimaryButton busy={isBusy}>Submit Secure Registration</PrimaryButton>
                </div>
              </form>
            )}

            {view === 'forgot' && (
              <form className="space-y-5" onSubmit={handleForgotPassword}>
                <Field label="Appointment / Service Number">
                  <SimpleInput value={forgotAppointmentNumber} onChange={setForgotAppointmentNumber} />
                </Field>
                <PrimaryButton busy={isBusy}>Request Password Reset</PrimaryButton>
              </form>
            )}

            {view === 'otp' && challengeContext && (
              <form className="space-y-5" onSubmit={handleOtpVerification}>
                <button className="inline-flex items-center gap-2 text-sm text-sky-300" onClick={() => setView(challengeContext.purpose === 'registration' ? 'register' : challengeContext.purpose === 'sign_in' ? 'sign_in' : 'forgot')} type="button">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                  <div className="flex items-center gap-3">
                    <MessageSquareCode className="h-5 w-5 text-sky-300" />
                    <div>
                      <p className="text-sm font-semibold text-white">Verification Required</p>
                      <p className="text-xs text-slate-400">Code dispatched to {challengeContext.destinationMasked}</p>
                    </div>
                  </div>
                </div>
                <Field label="One-Time Passcode">
                  <SimpleInput value={otpCode} onChange={setOtpCode} />
                </Field>
                <button
                  className="text-sm text-sky-300 disabled:text-slate-600"
                  disabled={resendCooldown > 0}
                  onClick={() => {
                    resendChallenge(challengeContext.challengeId)
                      .then((result) => {
                        setChallengeContext((current) => current ? { ...current, destinationMasked: result.destinationMasked } : current);
                        setResendCooldown(60);
                        toast.success('A new verification code has been sent.');
                        if (result.previewCode && appConfig.devOtpPreview) {
                          toast.info(`Dev OTP preview: ${result.previewCode}`);
                        }
                      })
                      .catch((error: Error) => toast.error(error.message));
                  }}
                  type="button"
                >
                  {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend code'}
                </button>
                <PrimaryButton busy={isBusy}>Verify</PrimaryButton>
              </form>
            )}

            {view === 'reset' && (
              <form className="space-y-5" onSubmit={handleResetPassword}>
                <Field label="New Password"><SimpleInput type="password" value={resetForm.password} onChange={(value) => setResetForm((current) => ({ ...current, password: value }))} /></Field>
                <Field label="Confirm Password"><SimpleInput type="password" value={resetForm.confirmPassword} onChange={(value) => setResetForm((current) => ({ ...current, confirmPassword: value }))} /></Field>
                <PrimaryButton busy={isBusy}>Reset Password</PrimaryButton>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function InputBox({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">{icon}{children}</div>;
}

function SimpleInput({ value, onChange, type = 'text' }: { value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <input
      className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none"
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required
    />
  );
}

function SelectBox({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <select className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none" value={value} onChange={(event) => onChange(event.target.value)} required>
      <option value="">Select...</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}

function PrimaryButton({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <button className="w-full rounded-2xl border border-sky-400/30 bg-[linear-gradient(135deg,rgba(24,0,173,0.95),rgba(56,182,255,0.85))] px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70" disabled={busy} type="submit">
      {busy ? 'Processing...' : children}
    </button>
  );
}
