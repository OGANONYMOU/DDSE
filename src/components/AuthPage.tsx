import { useEffect, useState } from 'react';
import { Shield, User2, LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';
import { completeSignIn, getRegistrationFormOptions, registerPersonnel, requestPasswordReset } from '../lib/api';
import type { PlatformUser, RegistrationFormOptions } from '../types/platform';

type View = 'sign_in' | 'register' | 'forgot';

interface AuthPageProps {
  onAuthenticated: (user: PlatformUser) => void;
}

const initialRegistration = {
  fullName: '',
  serviceNumber: '',
  rankCode: '',
  requestedRoleCode: 'base_soldier',
  directorateCode: '',
  phoneNumber: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [view, setView] = useState<View>('sign_in');
  const [catalogs, setCatalogs] = useState<RegistrationFormOptions | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [signInForm, setSignInForm] = useState({ serviceNumber: '', password: '' });
  const [registrationForm, setRegistrationForm] = useState(initialRegistration);
  const [forgotServiceNumber, setForgotServiceNumber] = useState('');

  useEffect(() => {
    getRegistrationFormOptions()
      .then((result) => setCatalogs(result))
      .catch((error: Error) => toast.error(error.message));
  }, []);

  // Removed unitsForSelectedFormation since formation/unit removed

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setIsBusy(true);
    try {
      const result = await completeSignIn(signInForm);
      onAuthenticated(result.user);
      toast.success('Secure session established.');
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
      await registerPersonnel({
        ...registrationForm,
        email: registrationForm.email || undefined,
      });
      toast.success('Registration completed. Sign in with your new credentials.');
      setRegistrationForm(initialRegistration);
      setView('sign_in');
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
      await requestPasswordReset(forgotServiceNumber);
      toast.success('Password reset email sent. Check your inbox and sign in again when complete.');
      setForgotServiceNumber('');
      setView('sign_in');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not start password reset.');
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
              Loading, sign in, registration, forgot password, and password reset are powered by Supabase auth for secure access and session management.
            </p>
            <div className="mt-8 space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">Registration is captured in Supabase and requires an administrator to approve privileged access.</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">Password reset uses Supabase email workflows.</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">Inspection and operational data are being migrated from Convex to Supabase.</div>
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
                <Field label="Service Number">
                  <InputBox icon={<User2 className="h-4 w-4 text-slate-500" />}>
                    <input className="w-full bg-transparent text-sm text-white outline-none" value={signInForm.serviceNumber} onChange={(event) => setSignInForm((current) => ({ ...current, serviceNumber: event.target.value }))} required />
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
                <Field label="Service Number"><SimpleInput value={registrationForm.serviceNumber} onChange={(value) => setRegistrationForm((current) => ({ ...current, serviceNumber: value }))} /></Field>
                <Field label="Rank"><SelectBox value={registrationForm.rankCode} onChange={(value) => setRegistrationForm((current) => ({ ...current, rankCode: value }))} options={catalogs?.ranks.map((rank) => ({ value: rank.code, label: rank.label })) ?? []} /></Field>
                <Field label="Role Request"><SelectBox value={registrationForm.requestedRoleCode} onChange={(value) => setRegistrationForm((current) => ({ ...current, requestedRoleCode: value }))} options={catalogs?.roles.map((role) => ({ value: role.code, label: `${role.label}${role.privileged ? ' (Approval Required)' : ''}` })) ?? []} /></Field>
                <Field label="Directorate"><SelectBox value={registrationForm.directorateCode} onChange={(value) => setRegistrationForm((current) => ({ ...current, directorateCode: value }))} options={catalogs?.directorates.map((item) => ({ value: item.code, label: item.name })) ?? []} /></Field>
                <Field label="Phone Number"><SimpleInput value={registrationForm.phoneNumber} onChange={(value) => setRegistrationForm((current) => ({ ...current, phoneNumber: value }))} /></Field>
                <Field label="Email"><SimpleInput value={registrationForm.email} onChange={(value) => setRegistrationForm((current) => ({ ...current, email: value }))} /></Field>
                <Field label="Password"><SimpleInput type="password" value={registrationForm.password} onChange={(value) => setRegistrationForm((current) => ({ ...current, password: value }))} /></Field>
                <Field label="Confirm Password"><SimpleInput type="password" value={registrationForm.confirmPassword} onChange={(value) => setRegistrationForm((current) => ({ ...current, confirmPassword: value }))} /></Field>
                <div className="md:col-span-2">
                  <PrimaryButton busy={isBusy}>Submit Secure Registration</PrimaryButton>
                </div>
              </form>
            )}

            {view === 'forgot' && (
              <form className="space-y-5" onSubmit={handleForgotPassword}>
                <Field label="Service Number">
                  <SimpleInput value={forgotServiceNumber} onChange={setForgotServiceNumber} />
                </Field>
                <PrimaryButton busy={isBusy}>Request Password Reset</PrimaryButton>
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
