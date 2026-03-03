import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import {
  Eye, EyeOff, Lock, User, Phone, ChevronDown, Check,
  ArrowRight, ArrowLeft, ShieldAlert, KeyRound,
  MessageSquareCode, RefreshCw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import type { UserRole } from '../App';

/* ─── brand colours ─── */
const C = { red: '#ff3131', dark: '#1800ad', light: '#38b6ff' };

interface AuthPageProps { onLogin: (role: UserRole, appointment: string) => void; }

type View  = 'login' | 'register' | 'forgot' | 'otp' | 'reset';
type OCtx  = 'register' | 'forgot';

const RANKS = [
  'Private','Lance Corporal','Corporal','Sergeant','Staff Sergeant',
  'Warrant Officer','Second Lieutenant','Lieutenant','Captain',
  'Major','Lieutenant Colonel','Colonel','Brigadier General',
  'Major General','Lieutenant General','General',
];

/* ← EXACT three directorates as requested */
const DIRECTORATES = [
  'Standard & Evaluation',
  'Safety & Manual',
  'Project Monitoring',
];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [view,    setView]    = useState<View>('login');
  const [oCtx,    setOCtx]   = useState<OCtx>('register');
  const [showPwd, setShowPwd] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember,setRemember]= useState(false);
  const [otp,     setOtp]    = useState(['','','','','','']);
  const [cooldown,setCooldown]= useState(0);

  /* forms */
  const [loginF,  setLoginF]  = useState({ appointment: '', password: '' });
  const [regF,    setRegF]    = useState({ fullName: '', appointment: '', rank: '', directorate: '', phone: '' });
  const [forgotF, setForgotF] = useState({ appointment: '', phone: '' });
  const [resetF,  setResetF]  = useState({ password: '', confirm: '' });

  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const otpRefs = useRef<(HTMLInputElement|null)[]>([]);

  /* entrance */
  useEffect(() => {
    gsap.fromTo(wrapRef.current, { opacity:0 }, { opacity:1, duration:0.7 });
    gsap.fromTo(cardRef.current,
      { y:50, opacity:0, rotateX:10, scale:0.96 },
      { y:0, opacity:1, rotateX:0, scale:1, duration:0.8, delay:0.15, ease:'power3.out' }
    );
  }, []);

  /* cooldown */
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(n => n-1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  /* slide transition between views */
  const go = (next: View) => {
    gsap.fromTo(cardRef.current, { x:35, opacity:0 }, { x:0, opacity:1, duration:0.38, ease:'power2.out' });
    setView(next);
    setOtp(['','','','','','']);
  };

  /* ── handlers ── */
  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginF.appointment || !loginF.password) { toast.error('Fill in all fields'); return; }
    setLoading(true); await sleep(1400);
    let role: UserRole = 'directorate_officer';
    if (loginF.appointment.toLowerCase().includes('admin')) role = 'super_admin';
    else if (loginF.appointment.toLowerCase().includes('eval')) role = 'evaluator';
    setLoading(false);
    onLogin(role, loginF.appointment);
  };

  const doRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regF.fullName || !regF.appointment || !regF.rank || !regF.directorate || !regF.phone) {
      toast.error('Fill in all required fields'); return;
    }
    setLoading(true); await sleep(1200); setLoading(false);
    setOCtx('register'); setCooldown(60);
    toast.success(`OTP sent to ${regF.phone}`);
    go('otp');
  };

  const doForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotF.appointment || !forgotF.phone) { toast.error('Fill in all fields'); return; }
    setLoading(true); await sleep(1200); setLoading(false);
    setOCtx('forgot'); setCooldown(60);
    toast.success(`OTP sent to ${forgotF.phone}`);
    go('otp');
  };

  const doVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.some(d => !d)) { toast.error('Enter the full 6-digit OTP'); return; }
    setLoading(true); await sleep(1500); setLoading(false);
    if (oCtx === 'register') {
      toast.success('Phone verified! Registration submitted for admin approval.');
      await sleep(1400); go('login');
    } else {
      go('reset');
    }
  };

  const doReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetF.password || !resetF.confirm) { toast.error('Fill in both fields'); return; }
    if (resetF.password !== resetF.confirm) { toast.error('Passwords do not match'); return; }
    if (resetF.password.length < 8) { toast.error('Min. 8 characters'); return; }
    setLoading(true); await sleep(1400); setLoading(false);
    toast.success('Password reset successfully!');
    await sleep(800); go('login');
  };

  const otpChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const n = [...otp]; n[i] = v.slice(-1); setOtp(n);
    if (v && i < 5) otpRefs.current[i+1]?.focus();
  };
  const otpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i-1]?.focus();
  };
  const doResend = async () => {
    if (cooldown > 0) return;
    setLoading(true); await sleep(700); setLoading(false);
    setCooldown(60); setOtp(['','','','','','']);
    toast.success('New OTP sent');
  };

  const maskPhone = (p: string) => p.replace(/(\+?\d{1,3})\d+(\d{4})/, '$1••••$2');

  /* ─── render ─── */
  return (
    <div ref={wrapRef}
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{ background: 'linear-gradient(135deg,#000008 0%,#04031a 55%,#000d18 100%)' }}>

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({length:20}).map((_,i)=>(
          <div key={`h${i}`} className="absolute left-0 right-0 h-px"
            style={{top:`${(i+1)*5}%`,opacity:0.045,
              background:`linear-gradient(90deg,transparent,${C.dark}90,${C.light}60,transparent)`}}/>
        ))}
        {Array.from({length:24}).map((_,i)=>(
          <div key={`v${i}`} className="absolute top-0 bottom-0 w-px"
            style={{left:`${(i+1)*4.2}%`,opacity:0.04,
              background:`linear-gradient(180deg,transparent,${C.dark}90,${C.light}50,transparent)`}}/>
        ))}
        <div className="absolute top-1/4 -left-24 w-80 h-80 rounded-full blur-3xl opacity-12" style={{background:C.dark}}/>
        <div className="absolute bottom-1/4 -right-24 w-80 h-80 rounded-full blur-3xl opacity-10" style={{background:C.light}}/>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full blur-3xl opacity-5" style={{background:C.red}}/>
        {['top-8 left-8 border-l border-t','top-8 right-8 border-r border-t',
          'bottom-8 left-8 border-l border-b','bottom-8 right-8 border-r border-b'].map((c,i)=>(
          <div key={i} className={`absolute w-10 h-10 ${c}`} style={{borderColor:C.light+'40'}}/>
        ))}
      </div>

      {/* Card */}
      <div ref={cardRef} className="relative z-10 w-full max-w-md" style={{perspective:'1200px'}}>
        <div className="rounded-2xl overflow-hidden"
          style={{
            background:'rgba(4,6,22,0.92)',backdropFilter:'blur(24px)',
            border:`1px solid ${C.dark}70`,
            boxShadow:`0 0 0 1px ${C.dark}30,0 30px 90px ${C.dark}55,0 0 140px ${C.dark}18`,
          }}>

          {/* Top colour bar */}
          <div className="h-1" style={{background:`linear-gradient(90deg,${C.red},${C.dark},${C.light})`}}/>

          {/* ── Header (always visible) ── */}
          <div className="px-8 pt-8 pb-0">
            <div className="flex flex-col items-center mb-5">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2"
                  style={{borderColor:C.light+'70',boxShadow:`0 0 25px ${C.dark}cc,0 0 55px ${C.dark}44`}}>
                  <img src="/images/ddse_logo.jpeg" alt="DDSE" className="w-full h-full object-cover"/>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  style={{background:'#030412',borderColor:C.light}}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{background:C.light}}/>
                </div>
              </div>
              <h1 className="text-lg font-black text-white tracking-wide">DDSE</h1>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5"
                style={{color:C.light+'90'}}>
                Defense Department of Standards and Evaluation
              </p>
              <p className="text-xs text-slate-600 mt-1">Secure Access Required</p>
            </div>

            {/* Tabs — only on login / register */}
            {(view === 'login' || view === 'register') && (
              <div className="flex rounded-xl p-1"
                style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${C.dark}50`}}>
                {(['login','register'] as const).map(tab => (
                  <button key={tab} onClick={() => go(tab)}
                    className="flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-300"
                    style={view === tab
                      ? {background:`linear-gradient(135deg,${C.dark},${C.light}bb)`,color:'#fff',boxShadow:`0 4px 18px ${C.dark}90`}
                      : {color:'#ffffff44'}}>
                    {tab === 'login' ? <Lock className="w-3.5 h-3.5"/> : <User className="w-3.5 h-3.5"/>}
                    {tab === 'login' ? 'Login' : 'Register'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ══ LOGIN ══ */}
          {view === 'login' && (
            <form onSubmit={doLogin} className="px-8 pt-5 pb-8 space-y-4">
              {/* Appointment — NO "Number", NO fingerprint icon */}
              <FL label="Appointment">
                <II icon={<User className="w-4 h-4"/>} type="text"
                  value={loginF.appointment}
                  onChange={e => setLoginF({...loginF, appointment:e.target.value})}
                  placeholder="e.g. APP-78432"/>
              </FL>

              <FL label="Password">
                <div className="relative">
                  <II icon={<Lock className="w-4 h-4"/>}
                    type={showPwd ? 'text' : 'password'}
                    value={loginF.password}
                    onChange={e => setLoginF({...loginF, password:e.target.value})}
                    placeholder="Enter password"/>
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
                    {showPwd ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </FL>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="rem" checked={remember} onCheckedChange={v => setRemember(v as boolean)}
                    className="border-slate-700"/>
                  <label htmlFor="rem" className="text-xs text-slate-500 cursor-pointer">Remember device</label>
                </div>
                <button type="button" onClick={() => go('forgot')}
                  className="text-xs font-semibold hover:opacity-70 transition-opacity"
                  style={{color:C.light}}>
                  Forgot Password?
                </button>
              </div>

              <SB loading={loading} label="Login" loadLabel="Authenticating..."/>

              <p className="text-[10px] text-center text-slate-700">
                Demo: type "admin" or "eval" in Appointment for different roles
              </p>
            </form>
          )}

          {/* ══ REGISTER ══ */}
          {view === 'register' && (
            <form onSubmit={doRegister} className="px-8 pt-5 pb-8 space-y-4">
              <FL label="Full Name *">
                <II icon={<User className="w-4 h-4"/>} type="text"
                  value={regF.fullName}
                  onChange={e => setRegF({...regF, fullName:e.target.value})}
                  placeholder="Enter full name"/>
              </FL>

              {/* Appointment — NO "Number", NO fingerprint */}
              <FL label="Appointment *">
                <II icon={<KeyRound className="w-4 h-4"/>} type="text"
                  value={regF.appointment}
                  onChange={e => setRegF({...regF, appointment:e.target.value})}
                  placeholder="e.g. APP-78432"/>
              </FL>

              <div className="grid grid-cols-2 gap-3">
                <FL label="Rank *">
                  <Sel value={regF.rank} onChange={v => setRegF({...regF, rank:v})}
                    placeholder="Select rank" options={RANKS}/>
                </FL>
                {/* CORRECT 3 DIRECTORATES */}
                <FL label="Directorate *">
                  <Sel value={regF.directorate} onChange={v => setRegF({...regF, directorate:v})}
                    placeholder="Select" options={DIRECTORATES}/>
                </FL>
              </div>

              <FL label="Phone Number *">
                <II icon={<Phone className="w-4 h-4"/>} type="tel"
                  value={regF.phone}
                  onChange={e => setRegF({...regF, phone:e.target.value})}
                  placeholder="+234 000 000 0000"/>
              </FL>

              <InfoBox icon={<MessageSquareCode className="w-4 h-4"/>}>
                An OTP will be sent to your phone number to verify your identity before submission.
              </InfoBox>

              <SB loading={loading} label="Continue to Verification" loadLabel="Sending OTP..."/>
            </form>
          )}

          {/* ══ FORGOT PASSWORD ══ */}
          {view === 'forgot' && (
            <div className="px-8 pt-5 pb-8">
              <BackBtn onClick={() => go('login')}/>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{background:`${C.dark}40`,border:`1px solid ${C.dark}80`}}>
                  <ShieldAlert className="w-5 h-5" style={{color:C.light}}/>
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">Password Reset</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Enter your appointment & registered phone number</p>
                </div>
              </div>

              <form onSubmit={doForgot} className="space-y-4">
                {/* Appointment — NO "Number" */}
                <FL label="Appointment">
                  <II icon={<KeyRound className="w-4 h-4"/>} type="text"
                    value={forgotF.appointment}
                    onChange={e => setForgotF({...forgotF, appointment:e.target.value})}
                    placeholder="e.g. APP-78432"/>
                </FL>

                <FL label="Registered Phone Number">
                  <II icon={<Phone className="w-4 h-4"/>} type="tel"
                    value={forgotF.phone}
                    onChange={e => setForgotF({...forgotF, phone:e.target.value})}
                    placeholder="+234 000 000 0000"/>
                </FL>

                <InfoBox icon={<MessageSquareCode className="w-4 h-4"/>}>
                  A 6-digit OTP will be sent to your registered phone number to verify your identity.
                </InfoBox>

                <SB loading={loading} label="Send OTP" loadLabel="Sending..."/>
              </form>
            </div>
          )}

          {/* ══ OTP VERIFICATION ══ */}
          {view === 'otp' && (
            <div className="px-8 pt-5 pb-8">
              <BackBtn onClick={() => go(oCtx === 'register' ? 'register' : 'forgot')}/>

              <div className="flex flex-col items-center text-center mb-7">
                <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                  {[1,2].map(n => (
                    <div key={n} className="animate-pulse-ring absolute rounded-full border"
                      style={{width:60,height:60,
                        borderColor: n===1 ? `${C.light}70` : `${C.dark}60`,
                        animationDelay:`${(n-1)*0.65}s`}}/>
                  ))}
                  <div className="w-12 h-12 rounded-full flex items-center justify-center z-10"
                    style={{background:`${C.dark}55`,border:`2px solid ${C.light}60`}}>
                    <MessageSquareCode className="w-6 h-6" style={{color:C.light}}/>
                  </div>
                </div>
                <h2 className="text-base font-black text-white">OTP Verification</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-[260px]">
                  {oCtx === 'register'
                    ? `A 6-digit code was sent to ${maskPhone(regF.phone)}`
                    : `A 6-digit code was sent to ${maskPhone(forgotF.phone)}`}
                </p>
              </div>

              <form onSubmit={doVerifyOtp} className="space-y-5">
                {/* 6-box OTP input */}
                <div className="flex gap-2.5 justify-center">
                  {otp.map((d,i) => (
                    <input key={i} ref={el => { otpRefs.current[i] = el; }}
                      type="text" inputMode="numeric" maxLength={1} value={d}
                      onChange={e => otpChange(i, e.target.value)}
                      onKeyDown={e => otpKey(i, e)}
                      onFocus={e => e.target.select()}
                      className="text-center text-xl font-black rounded-xl border-2 outline-none transition-all duration-200"
                      style={{
                        width:46, height:54,
                        background:'rgba(0,0,0,0.55)',
                        borderColor: d ? C.light : `${C.dark}80`,
                        color:'#fff',
                        boxShadow: d ? `0 0 16px ${C.light}55` : 'none',
                      }}/>
                  ))}
                </div>

                {/* Resend */}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-slate-600">Didn't receive it?</span>
                  <button type="button" onClick={doResend} disabled={cooldown > 0}
                    className="text-xs font-semibold flex items-center gap-1 transition-opacity"
                    style={{color: cooldown > 0 ? '#ffffff28' : C.light, cursor: cooldown > 0 ? 'not-allowed' : 'pointer'}}>
                    <RefreshCw className="w-3 h-3"/>
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                  </button>
                </div>

                {/* Expiry */}
                <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl"
                  style={{background:`${C.red}15`,border:`1px solid ${C.red}35`}}>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:C.red}}/>
                  <p className="text-xs" style={{color:`${C.red}cc`}}>OTP expires in 10 minutes</p>
                </div>

                <SB loading={loading}
                  label={oCtx === 'register' ? 'Verify & Submit' : 'Verify & Continue'}
                  loadLabel="Verifying..."/>
              </form>
            </div>
          )}

          {/* ══ RESET PASSWORD ══ */}
          {view === 'reset' && (
            <div className="px-8 pt-5 pb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{background:`${C.dark}40`,border:`1px solid ${C.light}60`}}>
                  <Check className="w-5 h-5" style={{color:C.light}}/>
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">Identity Confirmed</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Set your new password below</p>
                </div>
              </div>

              <form onSubmit={doReset} className="space-y-4">
                <FL label="New Password">
                  <div className="relative">
                    <II icon={<Lock className="w-4 h-4"/>}
                      type={showPwd ? 'text' : 'password'}
                      value={resetF.password}
                      onChange={e => setResetF({...resetF, password:e.target.value})}
                      placeholder="Min. 8 characters"/>
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300">
                      {showPwd ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </button>
                  </div>
                </FL>

                <FL label="Confirm Password">
                  <div className="relative">
                    <II icon={<Lock className="w-4 h-4"/>}
                      type={showPw2 ? 'text' : 'password'}
                      value={resetF.confirm}
                      onChange={e => setResetF({...resetF, confirm:e.target.value})}
                      placeholder="Re-enter new password"/>
                    <button type="button" onClick={() => setShowPw2(!showPw2)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300">
                      {showPw2 ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </button>
                  </div>
                </FL>

                {resetF.password && <PwdMeter pwd={resetF.password}/>}

                <SB loading={loading} label="Reset Password" loadLabel="Saving..."/>
              </form>
            </div>
          )}

        </div>{/* /card */}

        <p className="text-center text-[9px] mt-4 tracking-widest" style={{color:'#ffffff18'}}>
          © {new Date().getFullYear()} DDSE — CLASSIFIED GOVERNMENT NETWORK
        </p>
      </div>
    </div>
  );
}

/* ─────────── Sub-components ─────────── */

function FL({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function II({ icon, ...rest }: { icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">{icon}</div>
      <Input {...rest}
        className="pl-9 bg-slate-950/70 border border-slate-800 text-white placeholder:text-slate-700
          focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 transition-all duration-200"/>
    </div>
  );
}

function Sel({ value, onChange, placeholder, options }: {
  value: string; onChange: (v: string) => void; placeholder: string; options: string[];
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full pl-3 pr-8 py-2.5 rounded-lg text-sm appearance-none border border-slate-800 transition-all"
        style={{ background:'rgba(2,3,12,0.7)', color: value ? '#fff' : '#4b5563' }}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o} style={{background:'#050820'}}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"/>
    </div>
  );
}

function SB({ loading, label, loadLabel }: { loading: boolean; label: string; loadLabel: string }) {
  const C2 = { dark: '#1800ad', light: '#38b6ff' };
  return (
    <button type="submit" disabled={loading}
      className="w-full py-3 mt-1 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all duration-300"
      style={{
        background: `linear-gradient(135deg,${C2.dark},#0d00ff70,${C2.light}cc)`,
        boxShadow: `0 4px 22px ${C2.dark}90`,
        opacity: loading ? 0.75 : 1,
        letterSpacing: '0.04em',
      }}>
      {loading
        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>{loadLabel}</>
        : <>{label}<ArrowRight className="w-4 h-4"/></>}
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1.5 text-xs mb-5 hover:opacity-70 transition-opacity"
      style={{ color: '#38b6ff' }}>
      <ArrowLeft className="w-3.5 h-3.5"/> Go Back
    </button>
  );
}

function InfoBox({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl"
      style={{ background: `#1800ad20`, border: `1px solid #1800ad60` }}>
      <div style={{ color: '#38b6ff' }} className="mt-0.5 flex-shrink-0">{icon}</div>
      <p className="text-xs" style={{ color: '#38b6ffbb' }}>{children}</p>
    </div>
  );
}

function PwdMeter({ pwd }: { pwd: string }) {
  const checks = [pwd.length >= 8, /[A-Z]/.test(pwd), /[0-9]/.test(pwd), /[^A-Za-z0-9]/.test(pwd)];
  const score  = checks.filter(Boolean).length;
  const cols   = ['#ff3131', '#f59e0b', '#38b6ff', '#22c55e'];
  const labs   = ['Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-400"
            style={{ background: i < score ? cols[score-1] : '#ffffff10' }}/>
        ))}
      </div>
      <p className="text-[10px]" style={{ color: score > 0 ? cols[score-1] : '#ffffff30' }}>
        {score > 0 ? labs[score-1] : ''}
        {' '}
        <span className="text-slate-700">
          {checks[0]&&'✓ 8+ '}{checks[1]&&'✓ A-Z '}{checks[2]&&'✓ 0-9 '}{checks[3]&&'✓ Symbol'}
        </span>
      </p>
    </div>
  );
}
