import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Eye, EyeOff, Lock, User, Phone, ChevronDown, Check,
  ArrowRight, ArrowLeft, ShieldAlert, KeyRound, MessageSquareCode, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import type { UserRole } from '../App';

const C = { red:'#ff3131', dark:'#1800ad', light:'#38b6ff' };

interface AuthPageProps { onLogin:(role:UserRole, appointment:string, name:string)=>void; }
type View = 'login'|'register'|'forgot'|'otp'|'reset';

const RANKS = ['Private','Lance Corporal','Corporal','Sergeant','Staff Sergeant',
  'Warrant Officer','Second Lieutenant','Lieutenant','Captain','Major',
  'Lieutenant Colonel','Colonel','Brigadier General','Major General','Lieutenant General','General'];

const DIRS = [
  { label:'DSE — Standard & Evaluation', value:'Standard & Evaluation', prefix:'DSE' },
  { label:'DSM — Safety & Manual',       value:'Safety & Manual',       prefix:'DSM' },
  { label:'DPM — Project Monitoring',    value:'Project Monitoring',    prefix:'DPM' },
];

const ROLE_OPTS: { label:string; value:UserRole; hint:string; color:string }[] = [
  { label:'Super Admin',          value:'super_admin',         hint:'Full system access', color:C.red },
  { label:'Inspector / Evaluator',value:'evaluator',           hint:'Conduct inspections', color:C.light },
  { label:'Directorate Officer',  value:'directorate_officer', hint:'Directorate dashboard', color:'#f59e0b' },
  { label:'Base Soldier',         value:'base_soldier',        hint:'Tasks & field ops', color:'#22c55e' },
];

export default function AuthPage({ onLogin }:AuthPageProps) {
  const [view, setView]   = useState<View>('login');
  const [oCtx, setOCtx]   = useState<'register'|'forgot'>('register');
  const [showP, setShowP] = useState(false);
  const [showP2,setShowP2]= useState(false);
  const [loading,setLoad] = useState(false);
  const [remember,setRem] = useState(false);
  const [otp,  setOtp]    = useState(['','','','','','']);
  const [cd,   setCd]     = useState(0);
  const [lf,   setLf]     = useState({ appointment:'', password:'' });
  const [rf,   setRf]     = useState({ fullName:'', appointment:'', rank:'', directorate:'', phone:'', role:'evaluator' as UserRole });
  const [ff,   setFf]     = useState({ appointment:'', phone:'' });
  const [pf,   setPf]     = useState({ password:'', confirm:'' });
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const otpR    = useRef<(HTMLInputElement|null)[]>([]);

  useEffect(()=>{
    gsap.fromTo(wrapRef.current,{opacity:0},{opacity:1,duration:0.7});
    gsap.fromTo(cardRef.current,{y:50,opacity:0,rotateX:10,scale:0.96},
      {y:0,opacity:1,rotateX:0,scale:1,duration:0.8,delay:0.15,ease:'power3.out'});
  },[]);

  useEffect(()=>{ if(cd<=0) return; const t=setTimeout(()=>setCd(n=>n-1),1000); return()=>clearTimeout(t); },[cd]);

  const go=(next:View)=>{
    gsap.fromTo(cardRef.current,{x:35,opacity:0},{x:0,opacity:1,duration:0.38,ease:'power2.out'});
    setView(next); setOtp(['','','','','','']);
  };

  const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));

  const doLogin = async (e:React.FormEvent) => {
    e.preventDefault();
    if(!lf.appointment||!lf.password){toast.error('Fill in all fields');return;}
    setLoad(true); await sleep(1400);
    // Role detection by prefix
    let role:UserRole = 'base_soldier';
    const ap = lf.appointment.toUpperCase();
    if(ap.includes('ADMIN')||ap.startsWith('DSE-SA')) role='super_admin';
    else if(ap.startsWith('DSE')||ap.startsWith('DSM')||ap.startsWith('DPM')) {
      if(ap.includes('EV')) role='evaluator';
      else if(ap.includes('DO')) role='directorate_officer';
      else role='evaluator';
    }
    if(lf.password==='admin')    role='super_admin';
    if(lf.password==='eval')     role='evaluator';
    if(lf.password==='director') role='directorate_officer';
    if(lf.password==='soldier')  role='base_soldier';
    setLoad(false);
    onLogin(role, lf.appointment, lf.appointment);
  };

  const doRegister = async (e:React.FormEvent) => {
    e.preventDefault();
    if(!rf.fullName||!rf.appointment||!rf.rank||!rf.directorate||!rf.phone){toast.error('Fill in all required fields');return;}
    setLoad(true); await sleep(1200); setLoad(false);
    setOCtx('register'); setCd(60); toast.success(`OTP sent to ${rf.phone}`); go('otp');
  };

  const doForgot = async (e:React.FormEvent) => {
    e.preventDefault();
    if(!ff.appointment||!ff.phone){toast.error('Fill in all fields');return;}
    setLoad(true); await sleep(1200); setLoad(false);
    setOCtx('forgot'); setCd(60); toast.success(`OTP sent to ${ff.phone}`); go('otp');
  };

  const doVerify = async (e:React.FormEvent) => {
    e.preventDefault();
    if(otp.some(d=>!d)){toast.error('Enter the full 6-digit OTP');return;}
    setLoad(true); await sleep(1500); setLoad(false);
    if(oCtx==='register'){toast.success('Verified! Submitted for admin approval.');await sleep(1400);go('login');}
    else go('reset');
  };

  const doReset = async (e:React.FormEvent) => {
    e.preventDefault();
    if(!pf.password||!pf.confirm){toast.error('Fill in both fields');return;}
    if(pf.password!==pf.confirm){toast.error('Passwords do not match');return;}
    if(pf.password.length<8){toast.error('Min. 8 characters');return;}
    setLoad(true); await sleep(1400); setLoad(false);
    toast.success('Password reset!'); await sleep(800); go('login');
  };

  const otpChange=(i:number,v:string)=>{
    if(!/^\d*$/.test(v)) return;
    const n=[...otp]; n[i]=v.slice(-1); setOtp(n);
    if(v&&i<5) otpR.current[i+1]?.focus();
  };
  const otpKey=(i:number,e:React.KeyboardEvent)=>{ if(e.key==='Backspace'&&!otp[i]&&i>0) otpR.current[i-1]?.focus(); };
  const mask=(p:string)=>p.replace(/(\+?\d{1,3})\d+(\d{4})/,'$1••••$2');

  const SB=({label,loadLabel}:{label:string,loadLabel:string})=>(
    <button type="submit" disabled={loading}
      className="w-full py-3 mt-1 rounded-xl font-black text-sm flex items-center justify-center gap-2 text-white transition-all duration-300"
      style={{background:`linear-gradient(135deg,${C.dark},${C.light}cc)`,
        boxShadow:`0 4px 22px ${C.dark}90`,opacity:loading?0.75:1,letterSpacing:'0.04em'}}>
      {loading?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>{loadLabel}</>
              :<>{label}<ArrowRight className="w-4 h-4"/></>}
    </button>
  );

  return (
    <div ref={wrapRef} className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{background:`linear-gradient(135deg,#03040f 0%,#060818 55%,#020309 100%)`}}>
      {/* Grid bg */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({length:18}).map((_,i)=>(
          <div key={`h${i}`} className="absolute left-0 right-0 h-px"
            style={{top:`${(i+1)*5.5}%`,opacity:0.04,background:`linear-gradient(90deg,transparent,${C.dark}90,${C.light}60,transparent)`}}/>
        ))}
        {[0,1,2,3].map(i=>(
          <div key={i} className={`absolute w-10 h-10 ${['top-8 left-8 border-l border-t','top-8 right-8 border-r border-t','bottom-8 left-8 border-l border-b','bottom-8 right-8 border-r border-b'][i]}`}
            style={{borderColor:`${C.light}30`}}/>
        ))}
      </div>

      <div ref={cardRef} className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl overflow-hidden"
          style={{background:'rgba(6,8,24,0.96)',backdropFilter:'blur(24px)',
            border:`1px solid ${C.dark}70`,
            boxShadow:`0 0 0 1px ${C.dark}20,0 30px 90px rgba(0,0,0,0.8),0 0 120px ${C.dark}15`}}>
          <div className="h-1" style={{background:`linear-gradient(90deg,${C.red},${C.dark},${C.light})`}}/>

          {/* Header */}
          <div className="px-8 pt-7 pb-0">
            <div className="flex flex-col items-center mb-5">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2"
                  style={{borderColor:`${C.light}70`,boxShadow:`0 0 25px ${C.dark}cc,0 0 55px ${C.dark}44`}}>
                  <img src="/images/ddse_logo.jpeg" alt="DDSE" className="w-full h-full object-cover"/>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  style={{background:'#03040f',borderColor:C.light}}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{background:C.light}}/>
                </div>
              </div>
              <h1 className="text-lg font-black tracking-wide text-white">DDSE</h1>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5" style={{color:`${C.light}90`}}>
                Defense Department of Standards and Evaluation
              </p>
              <p className="text-xs mt-1 text-slate-500">Secure Access Portal</p>
            </div>

            {(view==='login'||view==='register')&&(
              <div className="flex rounded-xl p-1" style={{background:'rgba(0,0,0,0.4)',border:`1px solid ${C.dark}50`}}>
                {(['login','register'] as const).map(tab=>(
                  <button key={tab} onClick={()=>go(tab)}
                    className="flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-300"
                    style={view===tab
                      ?{background:`linear-gradient(135deg,${C.dark},${C.light}bb)`,color:'#fff',boxShadow:`0 4px 18px ${C.dark}90`}
                      :{color:'#64748b'}}>
                    {tab==='login'?<Lock className="w-3.5 h-3.5"/>:<User className="w-3.5 h-3.5"/>}
                    {tab==='login'?'Login':'Register'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* LOGIN */}
          {view==='login'&&(
            <form onSubmit={doLogin} className="px-8 pt-5 pb-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Appointment</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"/>
                  <Input type="text" value={lf.appointment} onChange={e=>setLf({...lf,appointment:e.target.value})}
                    placeholder="e.g. DSE-78432" className="pl-9 bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"/>
                  <Input type={showP?'text':'password'} value={lf.password} onChange={e=>setLf({...lf,password:e.target.value})}
                    placeholder="Enter password" className="pl-9 pr-10 bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
                  <button type="button" onClick={()=>setShowP(!showP)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">
                    {showP?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="rem" checked={remember} onCheckedChange={v=>setRem(v as boolean)} className="border-slate-700"/>
                  <label htmlFor="rem" className="text-xs cursor-pointer text-slate-500">Remember device</label>
                </div>
                <button type="button" onClick={()=>go('forgot')} className="text-xs font-semibold hover:opacity-70" style={{color:C.light}}>Forgot Password?</button>
              </div>
              <SB label="Login" loadLabel="Authenticating..."/>
              {/* Demo hints */}
              <div className="rounded-xl p-3 text-[10px] space-y-1" style={{background:`${C.dark}15`,border:`1px solid ${C.dark}40`}}>
                <p className="font-bold uppercase tracking-wider" style={{color:`${C.light}80`}}>Demo Passwords</p>
                {[['admin','Super Admin'],['eval','Evaluator'],['director','Directorate Officer'],['soldier','Base Soldier']].map(([pw,role])=>(
                  <p key={pw} className="text-slate-600">pw: <span style={{color:C.light}}>{pw}</span> → {role}</p>
                ))}
              </div>
            </form>
          )}

          {/* REGISTER */}
          {view==='register'&&(
            <form onSubmit={doRegister} className="px-8 pt-5 pb-8 space-y-4">
              {[['fullName','Full Name *','text','e.g. Maj. Okafor'],['appointment','Appointment *','text','DSE-78432']].map(([k,l,t,p])=>(
                <div key={k} className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{l}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"/>
                    <Input type={t} value={rf[k as keyof typeof rf] as string} onChange={e=>setRf({...rf,[k]:e.target.value})}
                      placeholder={p} className="pl-9 bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rank *</label>
                  <select value={rf.rank} onChange={e=>setRf({...rf,rank:e.target.value})}
                    className="w-full px-3 py-2.5 rounded-lg text-sm border appearance-none"
                    style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:rf.rank?'#fff':'#6b7280'}}>
                    <option value="">Select</option>
                    {RANKS.map(r=><option key={r} value={r} style={{background:'#060818'}}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Role *</label>
                  <select value={rf.role} onChange={e=>setRf({...rf,role:e.target.value as UserRole})}
                    className="w-full px-3 py-2.5 rounded-lg text-sm border appearance-none"
                    style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:'#fff'}}>
                    {ROLE_OPTS.map(r=><option key={r.value} value={r.value} style={{background:'#060818'}}>{r.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Directorate *</label>
                <select value={rf.directorate} onChange={e=>setRf({...rf,directorate:e.target.value})}
                  className="w-full px-3 py-2.5 rounded-lg text-sm border appearance-none"
                  style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:rf.directorate?'#fff':'#6b7280'}}>
                  <option value="">Select directorate</option>
                  {DIRS.map(d=><option key={d.value} value={d.value} style={{background:'#060818'}}>{d.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"/>
                  <Input type="tel" value={rf.phone} onChange={e=>setRf({...rf,phone:e.target.value})}
                    placeholder="+234 000 000 0000" className="pl-9 bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl" style={{background:`${C.dark}20`,border:`1px solid ${C.dark}60`}}>
                <MessageSquareCode className="w-4 h-4 mt-0.5 flex-shrink-0" style={{color:C.light}}/>
                <p className="text-xs" style={{color:`${C.light}bb`}}>An OTP will be sent to verify your phone number.</p>
              </div>
              <SB label="Continue to Verification" loadLabel="Sending OTP..."/>
            </form>
          )}

          {/* FORGOT */}
          {view==='forgot'&&(
            <div className="px-8 pt-5 pb-8">
              <button onClick={()=>go('login')} className="flex items-center gap-1.5 text-xs mb-5 hover:opacity-70" style={{color:C.light}}>
                <ArrowLeft className="w-3.5 h-3.5"/> Back
              </button>
              <form onSubmit={doForgot} className="space-y-4">
                <p className="text-sm font-black text-white mb-4">Password Reset</p>
                {[['appointment','Appointment',KeyRound,'DSE-78432'],['phone','Registered Phone',Phone,'+234 000 000 0000']].map(([k,l,Icon,p])=>(
                  <div key={k} className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{l}</label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"/>
                      <Input type="text" value={ff[k as 'appointment'|'phone']} onChange={e=>setFf({...ff,[k]:e.target.value})}
                        placeholder={p} className="pl-9 bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
                    </div>
                  </div>
                ))}
                <SB label="Send OTP" loadLabel="Sending..."/>
              </form>
            </div>
          )}

          {/* OTP */}
          {view==='otp'&&(
            <div className="px-8 pt-5 pb-8">
              <button onClick={()=>go(oCtx==='register'?'register':'forgot')} className="flex items-center gap-1.5 text-xs mb-5 hover:opacity-70" style={{color:C.light}}>
                <ArrowLeft className="w-3.5 h-3.5"/> Back
              </button>
              <div className="text-center mb-7">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 border-2"
                  style={{background:`${C.dark}40`,borderColor:`${C.light}60`}}>
                  <MessageSquareCode className="w-7 h-7" style={{color:C.light}}/>
                </div>
                <p className="text-base font-black text-white">OTP Verification</p>
                <p className="text-xs text-slate-500 mt-1">Code sent to {mask(oCtx==='register'?rf.phone:ff.phone)}</p>
              </div>
              <form onSubmit={doVerify} className="space-y-5">
                <div className="flex gap-2 justify-center">
                  {otp.map((d,i)=>(
                    <input key={i} ref={el=>{otpR.current[i]=el;}} type="text" inputMode="numeric"
                      maxLength={1} value={d} onChange={e=>otpChange(i,e.target.value)} onKeyDown={e=>otpKey(i,e)}
                      className="text-center text-xl font-black rounded-xl border-2 outline-none transition-all"
                      style={{width:46,height:54,background:'rgba(0,0,0,0.6)',color:'#fff',
                        borderColor:d?C.light:`${C.dark}80`,boxShadow:d?`0 0 16px ${C.light}55`:'none'}}/>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-slate-600">Didn't receive it?</span>
                  <button type="button" onClick={()=>{if(cd>0)return;setCd(60);setOtp(['','','','','','']);toast.success('New OTP sent');}}
                    disabled={cd>0} className="text-xs font-semibold flex items-center gap-1"
                    style={{color:cd>0?'#334155':C.light,cursor:cd>0?'not-allowed':'pointer'}}>
                    <RefreshCw className="w-3 h-3"/>{cd>0?`Resend in ${cd}s`:'Resend OTP'}
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2 py-2 rounded-xl" style={{background:`${C.red}15`,border:`1px solid ${C.red}35`}}>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:C.red}}/>
                  <p className="text-xs" style={{color:`${C.red}cc`}}>OTP expires in 10 minutes</p>
                </div>
                <SB label={oCtx==='register'?'Verify & Submit':'Verify & Continue'} loadLabel="Verifying..."/>
              </form>
            </div>
          )}

          {/* RESET */}
          {view==='reset'&&(
            <div className="px-8 pt-5 pb-8 space-y-4">
              <p className="text-sm font-black text-white">Set New Password</p>
              <form onSubmit={doReset} className="space-y-4">
                {[['password','New Password',showP,setShowP],['confirm','Confirm Password',showP2,setShowP2]].map(([k,l,sp,setSp])=>(
                  <div key={k as string} className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{l as string}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"/>
                      <Input type={sp?'text':'password'} value={pf[k as 'password'|'confirm']}
                        onChange={e=>setPf({...pf,[k]:e.target.value})}
                        placeholder="Min. 8 characters" className="pl-9 pr-10 bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
                      <button type="button" onClick={()=>(setSp as any)(!sp)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">
                        {sp?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                      </button>
                    </div>
                  </div>
                ))}
                {pf.password&&(
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[0,1,2,3].map(i=>{
                        const checks=[pf.password.length>=8,/[A-Z]/.test(pf.password),/[0-9]/.test(pf.password),/[^A-Za-z0-9]/.test(pf.password)];
                        const score=checks.filter(Boolean).length;
                        return <div key={i} className="h-1 flex-1 rounded-full transition-all"
                          style={{background:i<score?[C.red,'#f59e0b',C.light,'#22c55e'][score-1]:'rgba(255,255,255,0.08)'}}/>;
                      })}
                    </div>
                  </div>
                )}
                <SB label="Reset Password" loadLabel="Saving..."/>
              </form>
            </div>
          )}
        </div>
        <p className="text-center text-[9px] mt-4 tracking-widest text-slate-800">© 2026 DDSE — RESTRICTED</p>
      </div>
    </div>
  );
}
