import { useRef, useState } from 'react';
import {
  Eye, EyeOff, Shield, User, Phone, Lock, Mail,
  ChevronDown, ChevronUp, Fingerprint, Building2, BadgeCheck,
  CheckCircle2, XCircle, Star, ArrowLeft, MessageSquare,
  RefreshCw, KeyRound, Terminal,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  completeSignIn,
  registerPersonnel,
  requestPasswordResetOTP,
  verifyOTPAndResetPassword,
} from '../lib/api';
import {
  assessPassword,
  validateEmail,
  validatePhone,
  validateServiceNumber,
  validateRegistrationForm,
  validateForgotForm,
  type RegistrationFields,
  type ForgotFields,
} from '../lib/validation';
import { MOCK_ACCOUNTS, type MockAccount } from '../lib/mockAuth';
import type { PlatformUser } from '../types/platform';

// ─── Static data ─────────────────────────────────────────────────────────────

const RANKS = [
  { code: 'pte',   label: 'Private'               },
  { code: 'lcpl',  label: 'Lance Corporal'         },
  { code: 'cpl',   label: 'Corporal'               },
  { code: 'sgt',   label: 'Sergeant'               },
  { code: 'ssgt',  label: 'Staff Sergeant'         },
  { code: 'wo',    label: 'Warrant Officer'        },
  { code: 'mwo',   label: 'Master Warrant Officer' },
  { code: 'awo',   label: 'Army Warrant Officer'   },
  { code: '2lt',   label: 'Second Lieutenant'      },
  { code: 'lt',    label: 'Lieutenant'             },
  { code: 'capt',  label: 'Captain'                },
  { code: 'maj',   label: 'Major'                  },
  { code: 'ltcol', label: 'Lieutenant Colonel'     },
  { code: 'col',   label: 'Colonel'                },
  { code: 'brig',  label: 'Brigadier General'      },
  { code: 'mgen',  label: 'Major General'          },
  { code: 'ltgen', label: 'Lieutenant General'     },
  { code: 'gen',   label: 'General'                },
] as const;

const DIRECTORATES = [
  { code: 'standard_evaluation', name: 'Standard & Evaluation' },
  { code: 'safety_manual',       name: 'Safety & Manual'       },
  { code: 'project_monitoring',  name: 'Project Monitoring'    },
] as const;

// ─── Initial state ────────────────────────────────────────────────────────────

const INIT_SIGN_IN: { serviceNumber: string; password: string } =
  { serviceNumber: '', password: '' };

const INIT_REGISTER: RegistrationFields = {
  fullName: '', email: '', serviceNumber: '', phoneNumber: '',
  rankCode: '', directorateCode: '', password: '', confirmPassword: '',
};

const INIT_FORGOT: ForgotFields = {
  serviceNumber: '', phoneNumber: '', newPassword: '', confirmPassword: '',
};

const EMPTY_OTP = '      '; // 6 spaces — one per digit slot

// ─── View type ────────────────────────────────────────────────────────────────

type View = 'sign_in' | 'register' | 'forgot_request' | 'forgot_verify';

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuthPage({
  onAuthenticated,
}: {
  onAuthenticated: (user: PlatformUser) => void;
}) {
  // ── Shared ────────────────────────────────────────────────────────────────
  const [view,      setView]      = useState<View>('sign_in');
  const [isBusy,    setIsBusy]    = useState(false);
  const [shakeKey,  setShakeKey]  = useState(0);

  // ── Sign In ───────────────────────────────────────────────────────────────
  const [signIn,    setSignIn]    = useState(INIT_SIGN_IN);
  const [showSIPw,  setShowSIPw]  = useState(false);

  // ── Registration ──────────────────────────────────────────────────────────
  const [reg,       setReg]       = useState(INIT_REGISTER);
  const [regErrs,   setRegErrs]   = useState<Record<string, string>>({});
  const [showRegPw, setShowRegPw] = useState(false);
  const [showCfmPw, setShowCfmPw] = useState(false);

  // ── Forgot Password ───────────────────────────────────────────────────────
  const [forgot,        setForgot]        = useState(INIT_FORGOT);
  const [forgotErrs,    setForgotErrs]    = useState<Record<string, string>>({});
  const [showFPw,       setShowFPw]       = useState(false);
  const [showFCPw,      setShowFCPw]      = useState(false);
  const [otpValue,      setOtpValue]      = useState(EMPTY_OTP);
  const [pendingPhone,  setPendingPhone]  = useState('');

  // Derived
  const regPwStrength    = assessPassword(reg.password);
  const forgotPwStrength = assessPassword(forgot.newPassword);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function shake() { setShakeKey((k) => k + 1); }

  function numbersOnly(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.ctrlKey || e.metaKey) return;
    const nav = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End','Enter'];
    if (!nav.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
  }

  function setRegField<K extends keyof RegistrationFields>(field: K, value: string) {
    setReg((r) => ({ ...r, [field]: value }));
    setRegErrs((p) => { const n = { ...p }; delete n[field]; return n; });
  }

  function blurRegField(field: keyof RegistrationFields) {
    let err: string | null = null;
    switch (field) {
      case 'fullName':        err = reg.fullName.trim()                   ? null : 'Full name is required.';  break;
      case 'email':           err = validateEmail(reg.email);                                                  break;
      case 'serviceNumber':   err = validateServiceNumber(reg.serviceNumber);                                  break;
      case 'phoneNumber':     err = validatePhone(reg.phoneNumber);                                            break;
      case 'rankCode':        err = reg.rankCode                          ? null : 'Rank is required.';        break;
      case 'directorateCode': err = reg.directorateCode                   ? null : 'Directorate is required.'; break;
      case 'password':        err = regPwStrength.isValid                 ? null : 'Password too weak.';       break;
      case 'confirmPassword': err = reg.password === reg.confirmPassword  ? null : 'Passwords do not match.';  break;
    }
    if (err) setRegErrs((p) => ({ ...p, [field]: err! }));
    else     setRegErrs((p) => { const n = { ...p }; delete n[field]; return n; });
  }

  function setForgotField<K extends keyof ForgotFields>(field: K, value: string) {
    setForgot((f) => ({ ...f, [field]: value }));
    setForgotErrs((p) => { const n = { ...p }; delete n[field]; return n; });
  }

  function blurForgotField(field: keyof ForgotFields) {
    let err: string | null = null;
    switch (field) {
      case 'serviceNumber':   err = validateServiceNumber(forgot.serviceNumber);                                           break;
      case 'phoneNumber':     err = validatePhone(forgot.phoneNumber);                                                     break;
      case 'newPassword':     err = forgotPwStrength.isValid               ? null : 'Password too weak.';                 break;
      case 'confirmPassword': err = forgot.newPassword === forgot.confirmPassword ? null : 'Passwords do not match.';     break;
    }
    if (err) setForgotErrs((p) => ({ ...p, [field]: err! }));
    else     setForgotErrs((p) => { const n = { ...p }; delete n[field]; return n; });
  }

  function goToView(v: View) {
    setView(v);
    setRegErrs({});
    setForgotErrs({});
  }

  // ── Sign In ────────────────────────────────────────────────────────────────

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsBusy(true);
    try {
      const result = await completeSignIn(signIn);
      onAuthenticated(result.user);
      toast.success('Secure session established.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed.');
      setSignIn(INIT_SIGN_IN);
      shake();
    } finally {
      setIsBusy(false);
    }
  }

  // ── Register ───────────────────────────────────────────────────────────────

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errors = validateRegistrationForm(reg);
    if (Object.keys(errors).length > 0) {
      setRegErrs(errors);
      toast.error('Please correct the highlighted fields.');
      shake();
      return;
    }
    setIsBusy(true);
    try {
      await registerPersonnel(reg);
      toast.success('Registration submitted. Await administrator approval before signing in.');
      setReg(INIT_REGISTER);
      setRegErrs({});
      goToView('sign_in');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed.');
      setReg(INIT_REGISTER);
      setRegErrs({});
      shake();
    } finally {
      setIsBusy(false);
    }
  }

  // ── Forgot: Step 1 — request OTP ──────────────────────────────────────────

  async function handleForgotRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errors = validateForgotForm(forgot);
    if (Object.keys(errors).length > 0) {
      setForgotErrs(errors);
      toast.error('Please correct the highlighted fields.');
      shake();
      return;
    }
    setIsBusy(true);
    try {
      await requestPasswordResetOTP({
        serviceNumber: forgot.serviceNumber,
        phoneNumber:   forgot.phoneNumber,
      });
      setPendingPhone(forgot.phoneNumber);
      setOtpValue(EMPTY_OTP);
      goToView('forgot_verify');
      toast.success(`OTP sent to ***${forgot.phoneNumber.slice(-4)}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send OTP.');
      setForgot(INIT_FORGOT);
      setForgotErrs({});
      shake();
    } finally {
      setIsBusy(false);
    }
  }

  // ── Forgot: Step 2 — verify OTP ───────────────────────────────────────────

  async function handleForgotVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const otp = otpValue.replace(/ /g, '');
    if (otp.length < 6) {
      toast.error('Enter the complete 6-digit OTP.');
      shake();
      return;
    }
    setIsBusy(true);
    try {
      await verifyOTPAndResetPassword({
        serviceNumber: forgot.serviceNumber,
        phoneNumber:   pendingPhone,
        otp,
        newPassword:   forgot.newPassword,
      });
      toast.success('Password reset successfully. You can now sign in.');
      setForgot(INIT_FORGOT);
      setOtpValue(EMPTY_OTP);
      setPendingPhone('');
      goToView('sign_in');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'OTP verification failed.');
      setOtpValue(EMPTY_OTP);
      shake();
    } finally {
      setIsBusy(false);
    }
  }

  async function handleResendOtp() {
    if (isBusy) return;
    setIsBusy(true);
    try {
      await requestPasswordResetOTP({
        serviceNumber: forgot.serviceNumber,
        phoneNumber:   pendingPhone,
      });
      setOtpValue(EMPTY_OTP);
      toast.success(`New OTP sent to ***${pendingPhone.slice(-4)}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resend OTP.');
    } finally {
      setIsBusy(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isForgotFlow = view === 'forgot_request' || view === 'forgot_verify';

  return (
    <div
      className="relative flex min-h-screen items-start justify-center overflow-x-hidden overflow-y-auto px-4 py-10"
      style={{
        background:
          'radial-gradient(ellipse 80% 45% at 50% 0%, rgba(14,165,233,0.11) 0%, transparent 70%),' +
          'radial-gradient(ellipse 60% 35% at 50% 110%, rgba(99,102,241,0.07) 0%, transparent 70%),' +
          '#020817',
      }}
    >
      {/* Tactical grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(56,182,255,0.033) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(56,182,255,0.033) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-sky-500/[0.055] blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4  h-[300px] w-[450px] rounded-full bg-indigo-600/[0.05]  blur-[110px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[250px] w-[350px] rounded-full bg-sky-600/[0.04]    blur-[100px]" />

      {/* ── Content column: card + dev panel ─────────────────────────────── */}
      <div className="relative z-10 flex w-full max-w-[520px] flex-col gap-3">

        {/* ── Card ──────────────────────────────────────────────────────────── */}
        <div
          key={shakeKey}
          style={{ animation: shakeKey > 0 ? 'auth-shake 0.45s ease' : undefined }}
        >
        {/* Top accent stripe */}
        <div className="h-[2px] rounded-t-3xl bg-gradient-to-r from-red-600 via-indigo-600 to-sky-400" />

        {/* Glass panel */}
        <div
          className="rounded-b-3xl border border-t-0 border-white/[0.07]"
          style={{
            background:           'rgba(2,8,23,0.80)',
            backdropFilter:       'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            boxShadow:
              '0 40px 120px rgba(0,0,0,0.6),' +
              '0 0 0 1px rgba(56,182,255,0.04) inset,' +
              '0 1px 0 rgba(255,255,255,0.05) inset',
          }}
        >
          <div className="max-h-[92vh] overflow-y-auto px-7 pb-7 pt-6">

            {/* ── Logo + Title ──────────────────────────────────────────── */}
            <div className="mb-6 flex flex-col items-center text-center">
              <div
                className="mb-4 h-[70px] w-[70px] overflow-hidden rounded-2xl border border-sky-400/20"
                style={{
                  boxShadow: '0 0 0 1px rgba(56,182,255,0.07), 0 0 28px rgba(56,182,255,0.13)',
                  background: 'rgba(14,165,233,0.07)',
                }}
              >
                <img src="/images/ddse_logo.jpeg" alt="DDSE" className="h-full w-full object-cover" />
              </div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.42em] text-sky-400/60">
                Defence Standards &amp; Safety Evaluation
              </p>
              <h1 className="mt-1 text-[15px] font-black tracking-[0.1em] text-white">
                DDSE PERSONNEL SYSTEM
              </h1>
              <div className="mt-2 flex items-center gap-2.5">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-sky-500/30" />
                <Shield className="h-3 w-3 text-sky-500/35" />
                <p className="text-[8px] font-medium uppercase tracking-[0.34em] text-slate-600">
                  Secure Access Terminal
                </p>
                <Shield className="h-3 w-3 text-sky-500/35" />
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-sky-500/30" />
              </div>
            </div>

            {/* ── Tab switcher — only shown for sign_in / register ──────── */}
            {!isForgotFlow && (
              <div className="mb-5 flex gap-1.5 rounded-xl border border-white/[0.05] bg-white/[0.025] p-1">
                {(['sign_in', 'register'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => goToView(v)}
                    className="flex-1 rounded-lg py-[7px] text-[10px] font-bold uppercase tracking-[0.16em] transition-all duration-200"
                    style={
                      view === v
                        ? {
                            background: 'linear-gradient(135deg,rgba(24,0,173,0.88) 0%,rgba(14,165,233,0.82) 100%)',
                            color: '#fff',
                            boxShadow: '0 0 16px rgba(14,165,233,0.16)',
                          }
                        : { color: 'rgba(148,163,184,0.6)' }
                    }
                  >
                    {v === 'sign_in' ? 'Sign In' : 'Register'}
                  </button>
                ))}
              </div>
            )}

            {/* ── Forgot flow header — Back button + section title ─────── */}
            {isForgotFlow && (
              <div className="mb-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    view === 'forgot_verify' ? goToView('forgot_request') : goToView('sign_in')
                  }
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-slate-400 transition-colors hover:border-sky-500/30 hover:text-sky-400"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <div className="flex-1">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.32em] text-sky-400/60">
                    {view === 'forgot_verify' ? 'Step 2 of 2' : 'Step 1 of 2'}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-white">
                    {view === 'forgot_verify' ? 'Enter Verification Code' : 'Password Reset'}
                  </p>
                </div>

                {/* Step indicator dots */}
                <div className="flex gap-1.5">
                  {[0, 1].map((i) => {
                    const active =
                      (i === 0 && view === 'forgot_request') ||
                      (i === 1 && view === 'forgot_verify');
                    const done   = i === 0 && view === 'forgot_verify';
                    return (
                      <div
                        key={i}
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: active ? '18px' : '6px',
                          background: done
                            ? '#10b981'
                            : active
                              ? 'rgba(14,165,233,0.9)'
                              : 'rgba(255,255,255,0.12)',
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══ SIGN IN FORM ════════════════════════════════════════════ */}
            {view === 'sign_in' && (
              <form className="space-y-4" onSubmit={handleSignIn}>
                <GlassField
                  label="Service Number"
                  icon={<User className="h-[15px] w-[15px] text-sky-400/55" />}
                >
                  <input
                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                    placeholder="Enter your service number"
                    inputMode="numeric"
                    autoComplete="username"
                    value={signIn.serviceNumber}
                    onKeyDown={numbersOnly}
                    onPaste={(e) => {
                      e.preventDefault();
                      setSignIn((s) => ({
                        ...s,
                        serviceNumber: e.clipboardData.getData('text').replace(/\D/g, ''),
                      }));
                    }}
                    onChange={(e) =>
                      setSignIn((s) => ({ ...s, serviceNumber: e.target.value.replace(/\D/g, '') }))
                    }
                    required
                  />
                </GlassField>

                <GlassField
                  label="Password"
                  icon={<Lock className="h-[15px] w-[15px] text-sky-400/55" />}
                  suffix={<EyeToggle show={showSIPw} onToggle={() => setShowSIPw((v) => !v)} />}
                >
                  <input
                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                    type={showSIPw ? 'text' : 'password'}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    value={signIn.password}
                    onChange={(e) => setSignIn((s) => ({ ...s, password: e.target.value }))}
                    required
                  />
                </GlassField>

                <div className="pt-1">
                  <GlassButton busy={isBusy} icon={<Fingerprint className="h-4 w-4" />}>
                    Secure Sign In
                  </GlassButton>
                </div>

                {/* Forgot password link */}
                <p className="text-center">
                  <button
                    type="button"
                    onClick={() => goToView('forgot_request')}
                    className="text-[10px] font-medium text-slate-500 transition-colors hover:text-sky-400 focus:outline-none"
                  >
                    Forgot password?
                  </button>
                </p>
              </form>
            )}

            {/* ══ REGISTER FORM ═══════════════════════════════════════════ */}
            {view === 'register' && (
              <form className="space-y-3" onSubmit={handleRegister} noValidate>

                {/* Row 1 — Full Name + Email */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <GlassField
                    label="Full Name"
                    icon={<User className="h-[15px] w-[15px] text-sky-400/55" />}
                    error={regErrs.fullName}
                  >
                    <input
                      className="flex-1 min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                      placeholder="Full name"
                      autoComplete="name"
                      value={reg.fullName}
                      onChange={(e) => setRegField('fullName', e.target.value)}
                      onBlur={() => blurRegField('fullName')}
                    />
                  </GlassField>

                  <GlassField
                    label="Email Address"
                    icon={<Mail className="h-[15px] w-[15px] text-sky-400/55" />}
                    error={regErrs.email}
                  >
                    <input
                      className="flex-1 min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                      type="email"
                      placeholder="name@domain.com"
                      autoComplete="email"
                      value={reg.email}
                      onChange={(e) => setRegField('email', e.target.value)}
                      onBlur={() => blurRegField('email')}
                    />
                  </GlassField>
                </div>

                {/* Row 2 — Service Number + Phone */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <GlassField
                    label="Service Number"
                    icon={<BadgeCheck className="h-[15px] w-[15px] text-sky-400/55" />}
                    error={regErrs.serviceNumber}
                  >
                    <input
                      className="flex-1 min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                      placeholder="Digits only"
                      inputMode="numeric"
                      value={reg.serviceNumber}
                      onKeyDown={numbersOnly}
                      onPaste={(e) => {
                        e.preventDefault();
                        setRegField('serviceNumber', e.clipboardData.getData('text').replace(/\D/g, ''));
                      }}
                      onChange={(e) => setRegField('serviceNumber', e.target.value.replace(/\D/g, ''))}
                      onBlur={() => blurRegField('serviceNumber')}
                    />
                  </GlassField>

                  <GlassField
                    label="Phone Number"
                    icon={<Phone className="h-[15px] w-[15px] text-sky-400/55" />}
                    error={regErrs.phoneNumber}
                  >
                    <input
                      className="flex-1 min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                      placeholder="Digits only"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={reg.phoneNumber}
                      onKeyDown={numbersOnly}
                      onPaste={(e) => {
                        e.preventDefault();
                        setRegField('phoneNumber', e.clipboardData.getData('text').replace(/\D/g, ''));
                      }}
                      onChange={(e) => setRegField('phoneNumber', e.target.value.replace(/\D/g, ''))}
                      onBlur={() => blurRegField('phoneNumber')}
                    />
                  </GlassField>
                </div>

                {/* Row 3 — Rank + Directorate */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <GlassField
                    label="Rank"
                    icon={<Star className="h-[15px] w-[15px] text-sky-400/55" />}
                    suffix={
                      <ChevronDown className="h-[15px] w-[15px] flex-shrink-0 text-slate-500 pointer-events-none" />
                    }
                    error={regErrs.rankCode}
                  >
                    <select
                      className="flex-1 min-w-0 appearance-none bg-transparent text-sm text-white outline-none"
                      style={{ colorScheme: 'dark' }}
                      value={reg.rankCode}
                      onChange={(e) => setRegField('rankCode', e.target.value)}
                      onBlur={() => blurRegField('rankCode')}
                    >
                      <option value="" disabled style={{ background: '#0d1117', color: '#64748b' }}>
                        Select rank...
                      </option>
                      {RANKS.map((r) => (
                        <option key={r.code} value={r.code} style={{ background: '#0d1117', color: '#f1f5f9' }}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </GlassField>

                  <GlassField
                    label="Directorate"
                    icon={<Building2 className="h-[15px] w-[15px] text-sky-400/55" />}
                    suffix={
                      <ChevronDown className="h-[15px] w-[15px] flex-shrink-0 text-slate-500 pointer-events-none" />
                    }
                    error={regErrs.directorateCode}
                  >
                    <select
                      className="flex-1 min-w-0 appearance-none bg-transparent text-sm text-white outline-none"
                      style={{ colorScheme: 'dark' }}
                      value={reg.directorateCode}
                      onChange={(e) => setRegField('directorateCode', e.target.value)}
                      onBlur={() => blurRegField('directorateCode')}
                    >
                      <option value="" disabled style={{ background: '#0d1117', color: '#64748b' }}>
                        Select directorate...
                      </option>
                      {DIRECTORATES.map((d) => (
                        <option key={d.code} value={d.code} style={{ background: '#0d1117', color: '#f1f5f9' }}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </GlassField>
                </div>

                {/* Row 4 — Passwords */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <GlassField
                    label="Password"
                    icon={<Lock className="h-[15px] w-[15px] text-sky-400/55" />}
                    suffix={<EyeToggle show={showRegPw} onToggle={() => setShowRegPw((v) => !v)} />}
                    error={regErrs.password}
                  >
                    <input
                      className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                      type={showRegPw ? 'text' : 'password'}
                      placeholder="Min 8 chars"
                      autoComplete="new-password"
                      value={reg.password}
                      onChange={(e) => setRegField('password', e.target.value)}
                      onBlur={() => blurRegField('password')}
                    />
                  </GlassField>

                  <GlassField
                    label="Confirm Password"
                    icon={<Lock className="h-[15px] w-[15px] text-sky-400/55" />}
                    suffix={
                      reg.confirmPassword ? (
                        reg.password === reg.confirmPassword
                          ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                          : <XCircle      className="h-4 w-4 flex-shrink-0 text-rose-400"    />
                      ) : (
                        <EyeToggle show={showCfmPw} onToggle={() => setShowCfmPw((v) => !v)} />
                      )
                    }
                    error={regErrs.confirmPassword}
                  >
                    <input
                      className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                      type={showCfmPw ? 'text' : 'password'}
                      placeholder="Repeat password"
                      autoComplete="new-password"
                      value={reg.confirmPassword}
                      onChange={(e) => setRegField('confirmPassword', e.target.value)}
                      onBlur={() => blurRegField('confirmPassword')}
                    />
                  </GlassField>
                </div>

                {reg.password.length > 0 && <PasswordSection strength={regPwStrength} />}

                <div className="pt-1">
                  <GlassButton busy={isBusy} icon={<Shield className="h-4 w-4" />}>
                    Submit Registration
                  </GlassButton>
                </div>
              </form>
            )}

            {/* ══ FORGOT — STEP 1: Request OTP ════════════════════════════ */}
            {view === 'forgot_request' && (
              <form className="space-y-3.5" onSubmit={handleForgotRequest} noValidate>
                <p className="text-[11px] leading-5 text-slate-400">
                  Enter your service number and registered phone number.
                  A 6-digit OTP will be sent to verify your identity before
                  changing your password.
                </p>

                <GlassField
                  label="Service Number"
                  icon={<BadgeCheck className="h-[15px] w-[15px] text-sky-400/55" />}
                  error={forgotErrs.serviceNumber}
                >
                  <input
                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                    placeholder="Enter your service number"
                    inputMode="numeric"
                    value={forgot.serviceNumber}
                    onKeyDown={numbersOnly}
                    onPaste={(e) => {
                      e.preventDefault();
                      setForgotField('serviceNumber', e.clipboardData.getData('text').replace(/\D/g, ''));
                    }}
                    onChange={(e) => setForgotField('serviceNumber', e.target.value.replace(/\D/g, ''))}
                    onBlur={() => blurForgotField('serviceNumber')}
                  />
                </GlassField>

                <GlassField
                  label="Registered Phone Number"
                  icon={<Phone className="h-[15px] w-[15px] text-sky-400/55" />}
                  error={forgotErrs.phoneNumber}
                >
                  <input
                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                    placeholder="OTP will be sent here"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={forgot.phoneNumber}
                    onKeyDown={numbersOnly}
                    onPaste={(e) => {
                      e.preventDefault();
                      setForgotField('phoneNumber', e.clipboardData.getData('text').replace(/\D/g, ''));
                    }}
                    onChange={(e) => setForgotField('phoneNumber', e.target.value.replace(/\D/g, ''))}
                    onBlur={() => blurForgotField('phoneNumber')}
                  />
                </GlassField>

                {/* Divider */}
                <div className="flex items-center gap-3 py-0.5">
                  <div className="h-px flex-1 bg-white/[0.06]" />
                  <span className="text-[9px] font-medium uppercase tracking-[0.25em] text-slate-600">
                    New Password
                  </span>
                  <div className="h-px flex-1 bg-white/[0.06]" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <GlassField
                    label="New Password"
                    icon={<KeyRound className="h-[15px] w-[15px] text-sky-400/55" />}
                    suffix={<EyeToggle show={showFPw} onToggle={() => setShowFPw((v) => !v)} />}
                    error={forgotErrs.newPassword}
                  >
                    <input
                      className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                      type={showFPw ? 'text' : 'password'}
                      placeholder="Min 8 chars"
                      autoComplete="new-password"
                      value={forgot.newPassword}
                      onChange={(e) => setForgotField('newPassword', e.target.value)}
                      onBlur={() => blurForgotField('newPassword')}
                    />
                  </GlassField>

                  <GlassField
                    label="Confirm Password"
                    icon={<Lock className="h-[15px] w-[15px] text-sky-400/55" />}
                    suffix={
                      forgot.confirmPassword ? (
                        forgot.newPassword === forgot.confirmPassword
                          ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                          : <XCircle      className="h-4 w-4 flex-shrink-0 text-rose-400"    />
                      ) : (
                        <EyeToggle show={showFCPw} onToggle={() => setShowFCPw((v) => !v)} />
                      )
                    }
                    error={forgotErrs.confirmPassword}
                  >
                    <input
                      className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                      type={showFCPw ? 'text' : 'password'}
                      placeholder="Repeat password"
                      autoComplete="new-password"
                      value={forgot.confirmPassword}
                      onChange={(e) => setForgotField('confirmPassword', e.target.value)}
                      onBlur={() => blurForgotField('confirmPassword')}
                    />
                  </GlassField>
                </div>

                {forgot.newPassword.length > 0 && <PasswordSection strength={forgotPwStrength} />}

                <div className="pt-1">
                  <GlassButton busy={isBusy} icon={<MessageSquare className="h-4 w-4" />}>
                    Send OTP to Phone
                  </GlassButton>
                </div>
              </form>
            )}

            {/* ══ FORGOT — STEP 2: Verify OTP ═════════════════════════════ */}
            {view === 'forgot_verify' && (
              <form className="space-y-5" onSubmit={handleForgotVerify}>
                {/* Destination hint */}
                <div
                  className="flex items-center gap-3 rounded-xl border border-sky-500/15 px-4 py-3"
                  style={{ background: 'rgba(14,165,233,0.05)' }}
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-sky-400/20 bg-sky-500/10">
                    <MessageSquare className="h-4 w-4 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-sky-400/70">
                      OTP Dispatched
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-300">
                      6-digit code sent to{' '}
                      <span className="font-bold text-white">
                        ***{pendingPhone.slice(-4)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* OTP boxes */}
                <div className="space-y-2">
                  <p className="text-center text-[8.5px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Verification Code
                  </p>
                  <OtpInput value={otpValue} onChange={setOtpValue} />
                </div>

                <div className="pt-1">
                  <GlassButton busy={isBusy} icon={<Shield className="h-4 w-4" />}>
                    Verify &amp; Reset Password
                  </GlassButton>
                </div>

                {/* Resend */}
                <p className="text-center text-[10px] text-slate-500">
                  Didn&apos;t receive it?{' '}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1 font-semibold text-sky-400 transition-colors hover:text-sky-300 disabled:opacity-40 focus:outline-none"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Resend OTP
                  </button>
                </p>
              </form>
            )}

            {/* Footer */}
            <p className="mt-5 text-center text-[9px] font-medium uppercase tracking-[0.24em] text-slate-700">
              Encrypted &nbsp;·&nbsp; Secure &nbsp;·&nbsp; Classified
            </p>
          </div>
        </div>
        </div>{/* end card wrapper */}

        <DevAccessPanel onAuthenticated={onAuthenticated} />

      </div>{/* end content column */}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GlassField({
  label,
  icon,
  suffix,
  error,
  children,
}: {
  label:    string;
  icon:     React.ReactNode;
  suffix?:  React.ReactNode;
  error?:   string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[8.5px] font-semibold uppercase tracking-[0.3em] text-slate-500">
        {label}
      </span>
      <div
        className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-[10px] transition-all duration-200 focus-within:bg-sky-500/[0.025] ${
          error
            ? 'border-rose-500/40 bg-rose-500/[0.04]'
            : 'border-white/[0.07] bg-white/[0.035] focus-within:border-sky-500/35'
        }`}
        onFocus={(e) => {
          if (!error)
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              '0 0 0 1px rgba(56,182,255,0.13), 0 0 18px rgba(56,182,255,0.06)';
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node))
            (e.currentTarget as HTMLDivElement).style.boxShadow = '';
        }}
      >
        <span className="flex-shrink-0">{icon}</span>
        {children}
        {suffix && <span className="ml-auto flex-shrink-0">{suffix}</span>}
      </div>
      {error && (
        <p className="mt-1 flex items-center gap-1 text-[9.5px] leading-tight text-rose-400">
          <XCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </label>
  );
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? 'Hide password' : 'Show password'}
      className="text-slate-600 transition-colors hover:text-sky-400 focus:outline-none"
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

function GlassButton({
  busy,
  children,
  icon,
}: {
  busy:     boolean;
  children: React.ReactNode;
  icon?:    React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="group relative w-full overflow-hidden rounded-xl py-[11px] text-[10px] font-black uppercase tracking-[0.22em] text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-55"
      style={{
        background: 'linear-gradient(135deg, rgba(24,0,173,0.92) 0%, rgba(14,165,233,0.88) 100%)',
        boxShadow:  '0 0 28px rgba(14,165,233,0.12), 0 1px 0 rgba(255,255,255,0.07) inset',
      }}
      onMouseEnter={(e) => {
        if (!busy)
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            '0 0 36px rgba(14,165,233,0.22), 0 1px 0 rgba(255,255,255,0.07) inset';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          '0 0 28px rgba(14,165,233,0.12), 0 1px 0 rgba(255,255,255,0.07) inset';
      }}
    >
      <span className="pointer-events-none absolute inset-0 bg-white/0 transition-all duration-200 group-hover:bg-white/[0.04]" />
      <span className="relative flex items-center justify-center gap-2">
        {!busy && icon}
        {busy ? (
          <span className="flex items-center gap-2">
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Processing...
          </span>
        ) : (
          children
        )}
      </span>
    </button>
  );
}

// ─── 6-digit OTP input ────────────────────────────────────────────────────────
// value is always exactly 6 chars; spaces represent empty slots.

function OtpInput({
  value,
  onChange,
}: {
  value:    string;
  onChange: (v: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  function focusBox(i: number) {
    containerRef.current
      ?.querySelectorAll<HTMLInputElement>('input')
      [i]?.focus();
  }

  // Normalise to exactly 6 chars (pad with spaces if shorter)
  const safe = (value + '      ').slice(0, 6);

  function setDigit(i: number, digit: string) {
    const arr = safe.split('');
    arr[i]    = digit || ' ';
    onChange(arr.join(''));
  }

  return (
    <div ref={containerRef} className="flex items-center justify-center gap-2.5">
      {Array.from({ length: 6 }, (_, i) => {
        const char  = safe[i];
        const empty = char === ' ';
        return (
          <input
            key={i}
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={empty ? '' : char}
            aria-label={`OTP digit ${i + 1}`}
            className="h-[54px] w-[46px] rounded-xl border text-center text-xl font-bold font-mono text-white outline-none transition-all duration-150 focus:shadow-[0_0_0_2px_rgba(56,182,255,0.22)]"
            style={{
              background:   empty ? 'rgba(255,255,255,0.04)' : 'rgba(14,165,233,0.09)',
              borderColor:  empty ? 'rgba(255,255,255,0.08)' : 'rgba(56,182,255,0.35)',
              caretColor:   'rgba(56,182,255,0.9)',
            }}
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, '').slice(-1);
              setDigit(i, d);
              if (d && i < 5) focusBox(i + 1);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace') {
                if (!empty) {
                  setDigit(i, '');
                } else if (i > 0) {
                  setDigit(i - 1, '');
                  focusBox(i - 1);
                }
              } else if (e.key === 'ArrowLeft'  && i > 0) { focusBox(i - 1); }
              else if  (e.key === 'ArrowRight' && i < 5) { focusBox(i + 1); }
            }}
            onPaste={(e) => {
              e.preventDefault();
              const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
              const padded = (digits + '      ').slice(0, 6);
              onChange(padded);
              focusBox(Math.min(digits.length, 5));
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Password strength section ────────────────────────────────────────────────

const PW_CRITERIA = [
  { key: 'minLength',    label: '8+ chars'  },
  { key: 'hasUppercase', label: 'Uppercase' },
  { key: 'hasLowercase', label: 'Lowercase' },
  { key: 'hasNumber',    label: 'Number'    },
  { key: 'hasSpecial',   label: 'Special'   },
] as const;

function PasswordSection({
  strength,
}: {
  strength: ReturnType<typeof assessPassword>;
}) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-[3px] flex-1 rounded-full transition-all duration-300"
              style={{
                background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.07)',
              }}
            />
          ))}
        </div>
        {strength.label && (
          <span className="text-[9px] font-semibold" style={{ color: strength.color }}>
            {strength.label}
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-x-2 gap-y-1 sm:grid-cols-5">
        {PW_CRITERIA.map(({ key, label }) => {
          const met = strength.criteria[key];
          return (
            <div key={key} className="flex items-center gap-1">
              {met
                ? <CheckCircle2 className="h-[10px] w-[10px] flex-shrink-0 text-emerald-400" />
                : <XCircle      className="h-[10px] w-[10px] flex-shrink-0 text-slate-600"   />
              }
              <span className={`text-[8px] leading-none ${met ? 'text-emerald-400' : 'text-slate-600'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Dev Access Panel ─────────────────────────────────────────────────────────

function DevAccessPanel({
  onAuthenticated,
}: {
  onAuthenticated: (user: PlatformUser) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="w-full overflow-hidden rounded-2xl border border-amber-500/15"
      style={{ background: 'rgba(245,158,11,0.03)' }}
    >
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 px-4 py-3 transition-colors hover:bg-amber-500/[0.04]"
      >
        <Terminal className="h-3.5 w-3.5 flex-shrink-0 text-amber-500/70" />
        <span className="flex-1 text-left text-[9px] font-bold uppercase tracking-[0.3em] text-amber-500/70">
          Dev Access Panel
        </span>
        <span className="mr-1 text-[8px] font-medium uppercase tracking-wider text-amber-700/50">
          ⚠ Remove before prod
        </span>
        {open
          ? <ChevronUp   className="h-3.5 w-3.5 flex-shrink-0 text-amber-600/40" />
          : <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-amber-600/40" />
        }
      </button>

      {open && (
        <div className="border-t border-amber-500/10 px-4 pb-5 pt-3.5">
          <p className="mb-4 text-[9px] leading-5 text-amber-600/60">
            Instant login bypass — calls <code className="font-mono">onAuthenticated()</code> directly,
            no Supabase round-trip. Use to navigate all role-based dashboards during development.
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {MOCK_ACCOUNTS.map((acct) => (
              <DevAccountCard key={acct.user.id} account={acct} onEnter={onAuthenticated} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DevAccountCard({
  account,
  onEnter,
}: {
  account: MockAccount;
  onEnter: (user: PlatformUser) => void;
}) {
  return (
    <div
      className="flex flex-col gap-2.5 rounded-xl border border-white/[0.06] p-3"
      style={{ background: 'rgba(255,255,255,0.022)' }}
    >
      {/* Role badge + service number */}
      <div className="flex items-center gap-1.5">
        <span
          className={`rounded-md px-2 py-[3px] text-[7.5px] font-black uppercase tracking-[0.22em] border border-current/25 ${account.badgeColor} ${account.badgeText}`}
        >
          {account.roleLabel}
        </span>
        <span className="ml-auto font-mono text-[8px] text-slate-600">
          {account.user.serviceNumber}
        </span>
      </div>

      {/* Name + rank / directorate */}
      <div>
        <p className="text-[11px] font-bold leading-tight text-white">{account.user.fullName}</p>
        <p className="mt-[3px] text-[9px] text-slate-500">
          {account.rankLabel}&nbsp;·&nbsp;{account.dirLabel}
        </p>
      </div>

      {/* Credential chip */}
      <div className="rounded-lg bg-black/25 px-2.5 py-2 font-mono text-[9.5px]">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">SVC</span>
          <span className="text-slate-300">{account.user.serviceNumber}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between">
          <span className="text-slate-600">PWD</span>
          <span className="text-slate-300">{account.password}</span>
        </div>
      </div>

      {/* Enter button */}
      <button
        type="button"
        onClick={() => onEnter(account.user)}
        className={`w-full rounded-lg py-2 text-[8.5px] font-bold uppercase tracking-[0.2em] transition-all duration-150 hover:brightness-125 ${account.badgeColor} ${account.badgeText}`}
      >
        ↵ Enter as {account.roleLabel}
      </button>
    </div>
  );
}
