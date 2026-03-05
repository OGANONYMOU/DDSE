import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, BarChart, Bar, Cell } from 'recharts';
import { Shield, ClipboardCheck, AlertTriangle, FileBarChart, LogOut,
  Bell, Target, TrendingUp, Clock, CheckCircle, ChevronRight, Layers,
  Award, ShieldOff, ListTodo, Users, BookOpen, Activity, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import type { UserRole } from '../App';
import SafetyModule       from './modules/SafetyModule';
import ReportsModule      from './modules/ReportsModule';
import TasksModule        from './modules/TasksModule';
import ConstraintsModule  from './modules/ConstraintsModule';
import AchievementsModule from './modules/AchievementsModule';

const C = { red:'#ff3131', dark:'#1800ad', light:'#38b6ff' };

interface Props { userRole:UserRole|null; appointment:string; userName:string; onLogout:()=>void; }
type Mod = 'overview'|'safety'|'tasks'|'reports'|'constraints'|'achievements';

const SCORES = [
  {month:'Oct 26',score:82,target:85},{month:'Nov 26',score:87,target:85},
  {month:'Dec 26',score:79,target:85},{month:'Jan 26',score:91,target:85},
  {month:'Feb 26',score:88,target:85},{month:'Mar 26',score:94,target:85},
];
const RADAR_DATA = [
  {area:'Personnel',score:88},{area:'Discipline',score:91},{area:'Logistics',score:74},
  {area:'Training',score:83},{area:'Security',score:96},{area:'Welfare',score:78},
];
const HAZARD_TREND = [
  {week:'W1',open:4,closed:2},{week:'W2',open:6,closed:4},
  {week:'W3',open:3,closed:5},{week:'W4',open:2,closed:3},
];

// PDF Section 4 — Hazard checklist categories with current status
const SAFETY_AREAS = [
  {label:'General Work Environment',  score:92, items:11, open:1, c:'#22c55e'},
  {label:'Fire Protection',           score:78, items:18, open:3, c:'#f59e0b'},
  {label:'Electrical',                score:85, items:22, open:2, c:C.light},
  {label:'Flammable Materials',       score:82, items:16, open:2, c:'#f97316'},
  {label:'Emergency Action Plan',     score:70, items:8,  open:3, c:C.red},
  {label:'Environmental Controls',    score:88, items:14, open:1, c:'#a78bfa'},
];

// PDF Section 2 — JTF Operational Readiness items
const READINESS_ITEMS = [
  {label:'Manpower (Estb vs Holding)',  status:'ok',    val:'94%',   note:'Deficiency: 6 pers'},
  {label:'Discipline (Minor Offences)', status:'warn',  val:'7 open',note:'3 new since last visit'},
  {label:'Sick Report',                 status:'ok',    val:'12/mo', note:'Prevalent: Malaria'},
  {label:'Leave & Passes',              status:'ok',    val:'Current',note:'All registers up to date'},
  {label:'Rotation Plan',               status:'warn',  val:'Delayed',note:'Phase 3 rotation overdue 2 wks'},
  {label:'Pay & Allowances',            status:'ok',    val:'Regular',note:'Ops Allces paid Mar 2026'},
  {label:'Feeding (RCA)',               status:'ok',    val:'Adequate',note:'₦850 per man per day'},
  {label:'Sanitation',                  status:'crit',  val:'Poor',  note:'3 ablution blocks non-functional'},
];

const NAV: {id:Mod;label:string;icon:typeof Shield}[] = [
  {id:'overview',     label:'Directorate HQ',  icon:Layers},
  {id:'safety',       label:'Safety Checks',   icon:AlertTriangle},
  {id:'tasks',        label:'Tasks',           icon:ListTodo},
  {id:'constraints',  label:'Constraints',     icon:ShieldOff},
  {id:'achievements', label:'Achievements',    icon:Award},
  {id:'reports',      label:'Reports',         icon:FileBarChart},
];

export default function DirectorateDash({ userRole, appointment, userName, onLogout }: Props) {
  const [mod, setMod]  = useState<Mod>('overview');
  const [notif,setN]   = useState(4);
  const headerRef      = useRef<HTMLElement>(null);
  const contentRef     = useRef<HTMLDivElement>(null);
  const kpiRef         = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    gsap.fromTo(headerRef.current,{y:-50,opacity:0},{y:0,opacity:1,duration:0.6,ease:'power3.out'});
    gsap.fromTo('.dir-nav-item',{x:-20,opacity:0},{x:0,opacity:1,duration:0.4,stagger:0.06,delay:0.2});
    if(kpiRef.current)
      gsap.fromTo(Array.from(kpiRef.current.children),
        {y:30,opacity:0,scale:0.95},{y:0,opacity:1,scale:1,duration:0.5,stagger:0.08,delay:0.3,ease:'back.out(1.4)'});
  },[]);

  useEffect(()=>{
    if(!contentRef.current) return;
    gsap.fromTo(contentRef.current,{opacity:0,y:10},{opacity:1,y:0,duration:0.3,ease:'power2.out'});
  },[mod]);

  return (
    <div className="min-h-screen flex flex-col" style={{background:'#03040f'}}>
      {/* Header */}
      <header ref={headerRef} className="h-16 flex items-center px-6 gap-4 sticky top-0 z-50 border-b"
        style={{background:'rgba(3,4,15,0.97)',backdropFilter:'blur(20px)',borderColor:`${C.dark}50`}}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2" style={{borderColor:`${C.light}60`}}>
            <img src="/images/ddse_logo.jpeg" alt="DDSE" className="w-full h-full object-cover"/>
          </div>
          <div>
            <p className="text-sm font-black text-white leading-none">DDSE Directorate</p>
            <p className="text-[9px] uppercase tracking-wider mt-0.5" style={{color:`${C.light}70`}}>Directorate Officer Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full ml-3" style={{background:'rgba(245,158,11,0.15)',border:'1px solid rgba(245,158,11,0.4)'}}>
          <div className="w-1.5 h-1.5 rounded-full" style={{background:'#f59e0b'}}/>
          <span className="text-[10px] font-bold tracking-wider text-yellow-500">DIRECTORATE ACCESS</span>
        </div>
        <div className="flex-1"/>
        <button className="relative p-2.5 rounded-xl" onClick={()=>{setN(0);toast.info('All notifications read');}}
          style={{border:`1px solid ${notif?`${C.dark}50`:'rgba(255,255,255,0.1)'}`,background:notif?`${C.dark}30`:'transparent'}}>
          <Bell className="w-4 h-4" style={{color:notif?C.light:'#475569'}}/>
          {notif>0&&<span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-white"
            style={{background:C.red}}>{notif}</span>}
        </button>
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{appointment||'DO-00000'}</p>
            <p className="text-[9px] text-yellow-500">Directorate Officer</p>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 font-black text-xs text-white"
            style={{background:'rgba(245,158,11,0.2)',borderColor:'rgba(245,158,11,0.7)'}}>
            {(appointment||'D').charAt(0)}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-60 flex-shrink-0 flex flex-col border-r sticky top-16 h-[calc(100vh-64px)]"
          style={{background:'rgba(3,4,15,0.99)',borderColor:`${C.dark}40`}}>
          <div className="m-4 p-3 rounded-xl" style={{background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.3)'}}>
            <p className="text-[9px] uppercase tracking-widest text-yellow-600 mb-1">Logged in as</p>
            <p className="text-xs font-bold text-white">Directorate Officer</p>
            <p className="text-[10px] mt-0.5 text-yellow-600/60">{appointment}</p>
          </div>
          <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
            {NAV.map(n=>{
              const active=mod===n.id;
              return <button key={n.id} onClick={()=>setMod(n.id)} className="dir-nav-item w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={active?{background:`linear-gradient(135deg,${C.dark}60,${C.light}20)`,color:C.light,border:`1px solid ${C.light}30`}:{color:'#64748b',border:'1px solid transparent'}}>
                <n.icon className="w-4 h-4 flex-shrink-0"/>{n.label}
                {active&&<div className="w-1.5 h-1.5 rounded-full ml-auto" style={{background:C.light}}/>}
              </button>;
            })}
          </nav>
          <div className="p-4">
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-slate-600 transition-all hover:text-red-400"
              style={{border:`1px solid ${C.red}20`}}>
              <LogOut className="w-4 h-4"/>Logout
            </button>
          </div>
        </aside>

        {/* Main */}
        <main ref={contentRef} className="flex-1 overflow-y-auto p-6">
          {mod==='overview'    && <DirectorateOverview kpiRef={kpiRef} appointment={appointment}/>}
          {mod==='safety'      && <SafetyModule        userRole={userRole}/>}
          {mod==='tasks'       && <TasksModule         userRole={userRole}/>}
          {mod==='constraints' && <ConstraintsModule   userRole={userRole}/>}
          {mod==='achievements'&& <AchievementsModule  userRole={userRole}/>}
          {mod==='reports'     && <ReportsModule       userRole={userRole}/>}
        </main>
      </div>
    </div>
  );
}

function DirectorateOverview({ kpiRef, appointment }: { kpiRef: any; appointment:string }) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Directorate Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">{appointment} — Operational Readiness & Safety Overview</p>
        </div>
        <div className="text-xs text-slate-600 hidden md:flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5"/>
          {new Date().toLocaleDateString('en-NG',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
        </div>
      </div>

      {/* KPIs */}
      <div ref={kpiRef} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'Compliance Score',  val:'94.2%', delta:'+2.1%', up:true,  c:C.light,    icon:Target},
          {label:'Open Hazards',      val:'5',     delta:'+2',    up:false, c:C.red,       icon:AlertTriangle},
          {label:'Active Tasks',      val:'12',    delta:'-3',    up:true,  c:'#f59e0b',   icon:ListTodo},
          {label:'Inspections Done',  val:'24',    delta:'+6',    up:true,  c:'#22c55e',   icon:ClipboardCheck},
        ].map((k,i)=>(
          <div key={i} className="rounded-2xl p-5 relative overflow-hidden"
            style={{background:'rgba(4,6,22,0.9)',border:`1px solid ${C.dark}60`}}>
            <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl opacity-15" style={{background:k.c}}/>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:`${k.c}20`,border:`1px solid ${k.c}40`}}>
                  <k.icon className="w-4 h-4" style={{color:k.c}}/>
                </div>
                <span className={`text-xs font-bold ${k.up?'text-emerald-400':'text-rose-400'}`}>{k.delta}</span>
              </div>
              <p className="text-2xl font-black text-white">{k.val}</p>
              <p className="text-xs mt-0.5 text-slate-500">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Compliance trend */}
        <div className="rounded-2xl p-5" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}60`}}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest" style={{color:`${C.light}80`}}>Compliance Score Trend</p>
            <span className="text-[10px] text-slate-600">Target: 85%</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={SCORES}>
              <XAxis dataKey="month" tick={{fill:'#475569',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis domain={[60,100]} tick={{fill:'#475569',fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:'#060818',border:`1px solid ${C.dark}60`,borderRadius:'8px',color:'#fff',fontSize:'11px'}}/>
              <Line dataKey="target" stroke={`${C.red}50`} strokeWidth={1} strokeDasharray="4 4" dot={false}/>
              <Line dataKey="score"  stroke={C.light} strokeWidth={2.5} dot={{fill:C.light,r:3}} activeDot={{r:5}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Operational Readiness Radar */}
        <div className="rounded-2xl p-5" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}60`}}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{color:`${C.light}80`}}>
            JTF Readiness Profile (PDF Sec 2)
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke={`${C.dark}80`}/>
              <PolarAngleAxis dataKey="area" tick={{fill:'#64748b',fontSize:10}}/>
              <Radar dataKey="score" stroke={C.light} fill={`${C.dark}50`} fillOpacity={0.6}/>
              <Tooltip contentStyle={{background:'#060818',border:`1px solid ${C.dark}60`,color:'#fff',fontSize:'11px'}}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Operational Readiness Checklist */}
      <div className="rounded-2xl overflow-hidden" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
        <div className="px-5 py-4 flex items-center gap-2" style={{borderBottom:`1px solid ${C.dark}40`,background:`${C.dark}20`}}>
          <BookOpen className="w-4 h-4" style={{color:C.light}}/>
          <p className="text-sm font-black text-white">JTF Operational Readiness Status</p>
          <span className="text-xs text-slate-500 ml-2">Per PDF Section 2 — Administration/Personnel</span>
        </div>
        <div className="divide-y" style={{divideColor:`${C.dark}30`}}>
          {READINESS_ITEMS.map((item,i)=>{
            const cfg = item.status==='ok'?{c:'#22c55e',bg:'rgba(34,197,94,0.1)',label:'SATISFACTORY'}
              :item.status==='warn'?{c:'#f59e0b',bg:'rgba(245,158,11,0.1)',label:'ATTENTION'}
              :{c:C.red,bg:`${C.red}15`,label:'CRITICAL'};
            return (
              <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-white/2 transition-colors">
                <div className="flex-1">
                  <p className="text-sm text-white font-semibold">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.note}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-sm font-black" style={{color:cfg.c}}>{item.val}</span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                    style={{background:cfg.bg,border:`1px solid ${cfg.c}40`,color:cfg.c}}>{cfg.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Areas */}
      <div className="rounded-2xl overflow-hidden" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
        <div className="px-5 py-4 flex items-center gap-2" style={{borderBottom:`1px solid ${C.dark}40`,background:`${C.dark}20`}}>
          <AlertTriangle className="w-4 h-4" style={{color:C.red}}/>
          <p className="text-sm font-black text-white">Safety Assessment Areas</p>
          <span className="text-xs text-slate-500 ml-2">Per PDF Section 4 — Hazard/Safety Checklist</span>
        </div>
        <div className="p-5 space-y-3">
          {SAFETY_AREAS.map((a,i)=>(
            <div key={i} className="flex items-center gap-4">
              <p className="text-xs text-slate-400 w-48 flex-shrink-0">{a.label}</p>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}>
                <div className="h-full rounded-full transition-all"
                  style={{width:`${a.score}%`,background:`linear-gradient(90deg,${a.c}80,${a.c})`}}/>
              </div>
              <span className="text-xs font-black w-10 text-right" style={{color:a.c}}>{a.score}%</span>
              {a.open>0&&<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{background:`${C.red}15`,color:C.red,border:`1px solid ${C.red}40`}}>
                {a.open} open
              </span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
