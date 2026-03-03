import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  LayoutDashboard, ClipboardCheck, FolderKanban, Package,
  AlertTriangle, FileBarChart, Settings, Bell, Search,
  LogOut, User, ChevronRight, TrendingUp, TrendingDown,
  Shield, Activity, CheckCircle, Clock, Menu, X, Zap,
  Target, Radio, BarChart3, AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { UserRole } from '../App';
import InspectionsModule from './modules/InspectionsModule';
import ProjectsModule    from './modules/ProjectsModule';
import ArmouryModule     from './modules/ArmouryModule';
import SafetyModule      from './modules/SafetyModule';
import ReportsModule     from './modules/ReportsModule';
import SettingsModule    from './modules/SettingsModule';

const C = { red:'#ff3131', dark:'#1800ad', light:'#38b6ff' };

interface DashboardProps {
  userRole: UserRole | null;
  appointment: string;
  onLogout: () => void;
}

type Mod = 'overview'|'inspections'|'projects'|'armoury'|'safety'|'reports'|'settings';

const ROLE_LABEL: Record<UserRole,string> = {
  super_admin:'Super Administrator',
  evaluator:'Inspector / Evaluator',
  directorate_officer:'Directorate Officer',
};
const ROLE_COLOR: Record<UserRole,string> = {
  super_admin:`${C.red}25`,
  evaluator:`${C.dark}40`,
  directorate_officer:`${C.light}20`,
};
const ROLE_BORDER: Record<UserRole,string> = {
  super_admin:C.red,
  evaluator:C.dark,
  directorate_officer:C.light,
};

const NAV: {id:Mod;label:string;icon:typeof Shield;roles:UserRole[]}[] = [
  {id:'overview',   label:'Dashboard',   icon:LayoutDashboard, roles:['super_admin','evaluator','directorate_officer']},
  {id:'inspections',label:'Inspections', icon:ClipboardCheck,  roles:['super_admin','evaluator']},
  {id:'projects',   label:'Projects',    icon:FolderKanban,    roles:['super_admin','directorate_officer']},
  {id:'armoury',    label:'Armoury',     icon:Package,         roles:['super_admin','evaluator','directorate_officer']},
  {id:'safety',     label:'Safety',      icon:AlertTriangle,   roles:['super_admin','evaluator','directorate_officer']},
  {id:'reports',    label:'Reports',     icon:FileBarChart,    roles:['super_admin','evaluator','directorate_officer']},
  {id:'settings',   label:'Settings',    icon:Settings,        roles:['super_admin']},
];

const KPI = [
  {label:'Total Inspections',value:'24',change:'+12%',up:true, icon:ClipboardCheck,grad:`${C.dark},${C.light}`},
  {label:'Pending Reviews',  value:'7', change:'-3',  up:false,icon:Clock,         grad:`${C.dark}cc,#0d00ff`},
  {label:'Risk Alerts',      value:'2', change:'+1',  up:false,icon:AlertTriangle,  grad:`${C.red}cc,${C.red}88`},
  {label:'Compliance Score', value:'94.2%',change:'+2.3%',up:true,icon:Target,    grad:`#00c98d,${C.light}`},
];

const ACTIVITY = [
  {icon:CheckCircle,text:'Inspection INS-2024-024 completed',time:'2 min ago',c:'#22c55e'},
  {icon:AlertTriangle,text:'Risk alert raised — Armoury B',time:'18 min ago',c:C.red},
  {icon:ClipboardCheck,text:'INS-2024-023 score updated to 91%',time:'1 hr ago',c:C.light},
  {icon:User,text:'New registration pending approval',time:'3 hrs ago',c:`${C.dark}cc`},
  {icon:Shield,text:'System compliance check passed',time:'6 hrs ago',c:'#a855f7'},
];

export default function Dashboard({ userRole, appointment, onLogout }: DashboardProps) {
  const [mod, setMod]       = useState<Mod>('overview');
  const [mobile, setMobile] = useState(false);
  const [notifs, setNotifs] = useState(3);
  const contentRef          = useRef<HTMLDivElement>(null);
  const kpiRefs             = useRef<HTMLDivElement[]>([]);
  const headerRef           = useRef<HTMLElement>(null);

  const menu = NAV.filter(n => n.roles.includes(userRole ?? 'directorate_officer'));

  /* initial entrance */
  useEffect(() => {
    gsap.fromTo(headerRef.current, {y:-60,opacity:0},{y:0,opacity:1,duration:0.7,ease:'power3.out'});
    gsap.fromTo('.sidebar-nav',   {x:-30,opacity:0},{x:0,opacity:1,duration:0.5,delay:0.2,ease:'power2.out'});
    gsap.fromTo(kpiRefs.current,
      {y:40,opacity:0,rotateX:12,scale:0.95},
      {y:0,opacity:1,rotateX:0,scale:1,duration:0.6,stagger:0.1,delay:0.35,ease:'power3.out'}
    );
    gsap.fromTo('.activity-item',{x:30,opacity:0},{x:0,opacity:1,duration:0.4,stagger:0.08,delay:0.6});
    gsap.fromTo('.radar-ring',{scale:0,opacity:0},{scale:1,opacity:1,duration:0.8,stagger:0.15,delay:0.4,ease:'back.out(1.4)'});
  }, []);

  /* content transition on tab change */
  useEffect(() => {
    if (!contentRef.current) return;
    gsap.fromTo(contentRef.current,{opacity:0,y:12},{opacity:1,y:0,duration:0.35,ease:'power2.out'});
  }, [mod]);

  const switchMod = (m: Mod) => { setMod(m); setMobile(false); };

  return (
    <div className="min-h-screen flex flex-col" style={{background:'linear-gradient(160deg,#03040f 0%,#050820 60%,#020c18 100%)'}}>

      {/* ═══ HEADER ═══ */}
      <header ref={headerRef} className="h-16 flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-50 border-b"
        style={{
          background:'rgba(3,4,15,0.95)',backdropFilter:'blur(20px)',
          borderColor:`${C.dark}50`,
          boxShadow:`0 1px 0 ${C.dark}30,0 4px 30px ${C.dark}20`,
        }}>
        {/* Mobile toggle */}
        <button onClick={()=>setMobile(!mobile)} className="lg:hidden p-2 text-slate-500 hover:text-white transition-colors rounded-lg"
          style={{border:`1px solid ${C.dark}40`}}>
          {mobile?<X className="w-5 h-5"/>:<Menu className="w-5 h-5"/>}
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 flex-shrink-0"
            style={{borderColor:C.light+'70',boxShadow:`0 0 12px ${C.dark}80`}}>
            <img src="/images/ddse_logo.jpeg" alt="DDSE" className="w-full h-full object-cover"/>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-black text-white leading-none">DDSE</p>
            <p className="text-[9px] uppercase tracking-wider" style={{color:C.light+'80'}}>
              Def. Dept. of Standards & Evaluation
            </p>
          </div>
        </div>

        {/* Live indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full ml-2"
          style={{background:`${C.dark}30`,border:`1px solid ${C.dark}60`}}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:'#22c55e'}}/>
          <span className="text-[10px] font-semibold tracking-widest" style={{color:'#22c55e'}}>LIVE</span>
        </div>

        <div className="flex-1"/>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 rounded-xl px-3 py-2 w-56 border"
          style={{background:'rgba(255,255,255,0.03)',borderColor:`${C.dark}50`}}>
          <Search className="w-3.5 h-3.5 text-slate-600"/>
          <Input placeholder="Search..." className="border-0 bg-transparent text-xs text-white placeholder:text-slate-700 focus-visible:ring-0 h-4 p-0"/>
        </div>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl transition-all" onClick={()=>{setNotifs(0);toast.info('All caught up!');}}
          style={{border:`1px solid ${C.dark}50`,background:notifs?`${C.dark}30`:'transparent'}}>
          <Bell className="w-4 h-4" style={{color:notifs?C.light:'#64748b'}}/>
          {notifs>0&&(
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-white"
              style={{background:C.red,boxShadow:`0 0 8px ${C.red}`}}>{notifs}</span>
          )}
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-white leading-none">{appointment||'Officer'}</p>
            <p className="text-[9px] mt-0.5 capitalize" style={{color:C.light+'80'}}>
              {ROLE_LABEL[userRole??'directorate_officer']}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 font-black text-xs text-white"
            style={{
              background:`${ROLE_COLOR[userRole??'directorate_officer']}`,
              borderColor:ROLE_BORDER[userRole??'directorate_officer']+'80',
            }}>
            {(appointment||'U').charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ═══ SIDEBAR ═══ */}
        {mobile&&<div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={()=>setMobile(false)}/>}
        <aside className={`fixed lg:static top-16 bottom-0 left-0 z-40 w-64 flex flex-col border-r transition-transform duration-300 ${mobile?'translate-x-0':'-translate-x-full lg:translate-x-0'}`}
          style={{background:'rgba(3,4,15,0.98)',backdropFilter:'blur(20px)',borderColor:`${C.dark}40`}}>

          {/* Role badge */}
          <div className="m-4 p-3 rounded-xl"
            style={{background:`${C.dark}25`,border:`1px solid ${C.dark}60`}}>
            <p className="text-[9px] uppercase tracking-widest mb-1" style={{color:C.light+'70'}}>Logged in as</p>
            <p className="text-xs font-bold text-white">{ROLE_LABEL[userRole??'directorate_officer']}</p>
            <p className="text-[10px] mt-0.5" style={{color:C.light+'60'}}>{appointment||'APP-00000'}</p>
          </div>

          {/* Nav */}
          <nav className="sidebar-nav flex-1 px-3 space-y-1 overflow-y-auto">
            {menu.map(item=>{
              const active = mod===item.id;
              return (
                <button key={item.id} onClick={()=>switchMod(item.id)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group"
                  style={active?{
                    background:`linear-gradient(135deg,${C.dark}60,${C.light}20)`,
                    color:C.light,border:`1px solid ${C.light}30`,
                    boxShadow:`0 0 20px ${C.dark}60`,
                  }:{color:'#64748b',border:'1px solid transparent'}}>
                  <item.icon className="w-4 h-4 flex-shrink-0 transition-colors"
                    style={active?{color:C.light}:{}}/>
                  {item.label}
                  {active&&<div className="ml-auto w-1.5 h-1.5 rounded-full" style={{background:C.light}}/>}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4">
            <button onClick={onLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-red-500/10"
              style={{color:'#64748b',border:`1px solid ${C.red}20`}}
              onMouseEnter={e=>(e.currentTarget.style.color=C.red)}
              onMouseLeave={e=>(e.currentTarget.style.color='#64748b')}>
              <LogOut className="w-4 h-4"/>Logout
            </button>
          </div>
        </aside>

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6" ref={contentRef}>
          {mod==='overview'&&<Overview kpiRefs={kpiRefs}/>}
          {mod==='inspections'&&<InspectionsModule userRole={userRole}/>}
          {mod==='projects'&&<ProjectsModule userRole={userRole}/>}
          {mod==='armoury'&&<ArmouryModule userRole={userRole}/>}
          {mod==='safety'&&<SafetyModule userRole={userRole}/>}
          {mod==='reports'&&<ReportsModule userRole={userRole}/>}
          {mod==='settings'&&<SettingsModule userRole={userRole}/>}
        </main>
      </div>
    </div>
  );
}

/* ═══ OVERVIEW ═══ */
function Overview({ kpiRefs }: { kpiRefs: React.MutableRefObject<HTMLDivElement[]> }) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Operational Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Defense Department of Standards and Evaluation</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs" style={{color:C.light+'80'}}>
          <Clock className="w-3.5 h-3.5"/>
          {new Date().toLocaleDateString('en-NG',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
        </div>
      </div>

      {/* KPI Cards with 3D tilt */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI.map((k,i)=>(
          <div key={i} ref={el=>{if(el)kpiRefs.current[i]=el;}}
            className="relative rounded-2xl p-5 overflow-hidden cursor-default"
            style={{
              background:`linear-gradient(135deg,rgba(4,6,22,0.9),rgba(4,6,22,0.6))`,
              border:`1px solid ${C.dark}60`,
              boxShadow:`0 8px 32px ${C.dark}30`,
              transform:'perspective(800px)',
              transition:'transform 0.3s,box-shadow 0.3s',
            }}
            onMouseEnter={e=>{
              (e.currentTarget as HTMLDivElement).style.transform='perspective(800px) rotateX(-3deg) rotateY(3deg) translateY(-4px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow=`0 20px 50px ${C.dark}60`;
            }}
            onMouseLeave={e=>{
              (e.currentTarget as HTMLDivElement).style.transform='perspective(800px) rotateX(0) rotateY(0) translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow=`0 8px 32px ${C.dark}30`;
            }}>
            {/* bg glow */}
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20"
              style={{background:`linear-gradient(135deg,${k.grad})`}}/>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{background:`linear-gradient(135deg,${k.grad})`,boxShadow:`0 4px 15px ${k.grad.split(',')[0]}50`}}>
                  <k.icon className="w-4 h-4 text-white"/>
                </div>
                <span className={`text-xs font-bold flex items-center gap-0.5 ${k.up?'text-emerald-400':'text-rose-400'}`}>
                  {k.up?<TrendingUp className="w-3 h-3"/>:<TrendingDown className="w-3 h-3"/>}
                  {k.change}
                </span>
              </div>
              <p className="text-2xl font-black text-white">{k.value}</p>
              <p className="text-xs mt-0.5" style={{color:C.light+'70'}}>{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Radar / Status visual */}
        <div className="rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden"
          style={{background:'rgba(4,6,22,0.8)',border:`1px solid ${C.dark}60`,minHeight:280}}>
          <p className="text-xs font-bold uppercase tracking-widest mb-6 w-full" style={{color:C.light+'80'}}>
            System Status
          </p>
          {/* Radar rings */}
          <div className="relative flex items-center justify-center" style={{width:180,height:180}}>
            {[1,2,3,4].map(n=>(
              <div key={n} className="radar-ring absolute rounded-full border"
                style={{
                  width:n*42,height:n*42,
                  borderColor:n===4?`${C.light}25`:n===3?`${C.dark}60`:n===2?`${C.light}15`:`${C.red}20`,
                  animationName:'radar-sweep', animationDuration:`${3+n}s`,
                  animationIterationCount:'infinite', animationTimingFunction:'linear',
                  animationDelay:`${n*0.3}s`,
                }}/>
            ))}
            {/* Sweep arm */}
            <div className="absolute w-px origin-bottom animate-radar"
              style={{height:82,bottom:'50%',left:'50%',transformOrigin:'bottom center',
                background:`linear-gradient(180deg,${C.light}cc,transparent)`}}/>
            {/* Center */}
            <div className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center border-2"
              style={{background:'rgba(4,6,22,0.9)',borderColor:C.light+'50',
                boxShadow:`0 0 20px ${C.dark}80`}}>
              <img src="/images/ddse_logo.jpeg" alt="DDSE" className="w-10 h-10 rounded-full object-cover"/>
            </div>
            {/* Blips */}
            {[[40,30],[120,70],[65,130],[145,100]].map(([x,y],i)=>(
              <div key={i} className="absolute w-2 h-2 rounded-full animate-pulse"
                style={{left:x,top:y,background:i===2?C.red:C.light,
                  boxShadow:`0 0 6px ${i===2?C.red:C.light}`,animationDelay:`${i*0.4}s`}}/>
            ))}
          </div>
          {/* Status rows */}
          <div className="w-full mt-4 space-y-2">
            {[
              {label:'Secure Uplink',     val:98, c:C.light},
              {label:'Data Integrity',    val:100,c:'#22c55e'},
              {label:'Active Incidents',  val:2,  c:C.red, raw:true},
            ].map((s,i)=>(
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-28 flex-shrink-0">{s.label}</span>
                {s.raw
                  ?<span className="text-xs font-black ml-auto" style={{color:s.c}}>{s.val}</span>
                  :<>
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{background:'#ffffff08'}}>
                      <div className="h-full rounded-full transition-all" style={{width:`${s.val}%`,background:s.c}}/>
                    </div>
                    <span className="text-xs font-bold w-8 text-right" style={{color:s.c}}>{s.val}%</span>
                  </>}
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="lg:col-span-2 rounded-2xl p-6"
          style={{background:'rgba(4,6,22,0.8)',border:`1px solid ${C.dark}60`}}>
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-bold uppercase tracking-widest" style={{color:C.light+'80'}}>Recent Activity</p>
            <span className="text-[10px] text-slate-600">Live updates</span>
          </div>
          <div className="space-y-3">
            {ACTIVITY.map((a,i)=>(
              <div key={i} className="activity-item flex items-start gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-white/[0.02]"
                style={{border:'1px solid transparent'}}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{background:`${a.c}18`,border:`1px solid ${a.c}30`}}>
                  <a.icon className="w-4 h-4" style={{color:a.c}}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 leading-snug">{a.text}</p>
                  <p className="text-xs mt-0.5" style={{color:C.light+'50'}}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'New Inspection',   icon:ClipboardCheck, c:C.light},
          {label:'Log Hazard',       icon:AlertTriangle,  c:C.red},
          {label:'Generate Report',  icon:FileBarChart,   c:'#a855f7'},
          {label:'Asset Check',      icon:Package,        c:'#22c55e'},
        ].map((q,i)=>(
          <button key={i} onClick={()=>toast.info(`Opening ${q.label}...`)}
            className="p-4 rounded-2xl flex items-center gap-3 transition-all duration-200 group"
            style={{
              background:'rgba(4,6,22,0.6)',border:`1px solid ${C.dark}40`,
              boxShadow:'none',
            }}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.boxShadow=`0 8px 30px ${q.c}30`;
              (e.currentTarget as HTMLButtonElement).style.borderColor=`${q.c}50`;}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.boxShadow='none';
              (e.currentTarget as HTMLButtonElement).style.borderColor=`${C.dark}40`;}}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{background:`${q.c}18`,border:`1px solid ${q.c}30`}}>
              <q.icon className="w-4 h-4" style={{color:q.c}}/>
            </div>
            <span className="text-sm font-semibold text-slate-400 group-hover:text-white transition-colors">{q.label}</span>
            <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 ml-auto transition-colors"/>
          </button>
        ))}
      </div>
    </div>
  );
}
