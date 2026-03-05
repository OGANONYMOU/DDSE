import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { CheckCircle, Clock, AlertTriangle, Shield, Star, LogOut,
  Bell, ChevronRight, Flame, Target, Send, Camera, FileText,
  Award, Calendar, TrendingUp, User, Zap, Lock, Trophy,
  BookOpen, ClipboardCheck, Package, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { UserRole } from '../App';

const C = { red:'#ff3131', dark:'#1800ad', light:'#38b6ff' };

interface Props { userRole:UserRole|null; appointment:string; userName:string; onLogout:()=>void; }

interface Task {
  id:string; title:string; description:string; priority:'low'|'medium'|'high'|'critical';
  status:'pending'|'in_progress'|'submitted'|'approved';
  dueDate:string; points:number; category:string; submittedNote?:string;
  pdfRef:string;
}

// Tasks sourced from PDF checklists
const INIT_TASKS: Task[] = [
  {id:'TSK-S001',title:'Daily Personal Appearance Inspection',pdfRef:'PDF Sec 2 — Individual Soldier',
   description:'Ensure proper haircut/neck shave, correct physique, clean fingernails. Verify name tag, ID card, and correct uniform.',
   category:'Personal Conduct',priority:'high',status:'pending',dueDate:'2026-03-05',points:25},
  {id:'TSK-S002',title:'Morning PT & Evening Games',pdfRef:'PDF Sec 2 — Regimental Activities',
   description:'Complete scheduled morning physical training and evening games session. Report to Sgt. if unable to participate.',
   category:'Physical Fitness',priority:'high',status:'in_progress',dueDate:'2026-03-05',points:30},
  {id:'TSK-S003',title:'Assigned Weapon Serviceability Check',pdfRef:'PDF — Evaluation of Armouries',
   description:'Inspect your assigned weapon (G3/FN/AK-47). Verify it is serviceable, clean, properly racked and chained. Update armoury inspection book.',
   category:'Armoury',priority:'critical',status:'pending',dueDate:'2026-03-06',points:50},
  {id:'TSK-S004',title:'Perimeter Fence Patrol Report',pdfRef:'PDF — General Security',
   description:'Conduct assigned perimeter fence patrol. Check watch towers, entrance/exit gates, and lighting system. Submit written report.',
   category:'Security',priority:'high',status:'pending',dueDate:'2026-03-06',points:40},
  {id:'TSK-S005',title:'Barracks Hazard Identification',pdfRef:'PDF Section 4 — Hazard Assessment',
   description:'Walk through assigned barracks and flag any safety hazards. Check flooring, electrical outlets, fire equipment, and sanitation.',
   category:'Safety',priority:'medium',status:'submitted',submittedNote:'Loose floor tile in Block B corridor. Fire extinguisher Room 12 — expired tag.',
   dueDate:'2026-03-04',points:35},
  {id:'TSK-S006',title:'Minor Offence Book — Personal Record Check',pdfRef:'PDF Sec 2 — Discipline',
   description:'Visit orderly room and verify no outstanding minor offence entries against your personal record for this month.',
   category:'Discipline',priority:'medium',status:'approved',dueDate:'2026-03-03',points:20},
  {id:'TSK-S007',title:'Full Kit Inspection — QM Stores',pdfRef:'PDF Sec 2 — Logistics/Kitting',
   description:'Verify full kit inventory with QM Stores: Uniforms x2, Boots, Frag Jacket, Ballistic Helmet. Log any deficiencies.',
   category:'Logistics',priority:'medium',status:'pending',dueDate:'2026-03-07',points:30},
  {id:'TSK-S008',title:'10km Route March — Full Kit',pdfRef:'PDF Sec 2 — Regimental Activities',
   description:'Complete scheduled 10km route march with full kit (rifle + webbing + rucksack). Meet at parade ground 05:30hrs.',
   category:'Physical Fitness',priority:'low',status:'pending',dueDate:'2026-03-10',points:45},
  {id:'TSK-S009',title:'Orderly Room Drill Attendance',pdfRef:'PDF Sec 2 — Regimental Activities',
   description:'Attend weekly orderly room procedure drill. Ensure uniform and appearance meet standard before parade.',
   category:'Regimental',priority:'medium',status:'pending',dueDate:'2026-03-08',points:20},
  {id:'TSK-S010',title:'MT Yard Vehicle Check — Assigned Vehicle',pdfRef:'PDF Sec 2 — MT Yard',
   description:'Complete daily vehicle inspection on assigned vehicle (A/B veh). Check serviceability, major faults, vehicle documents, and fire point.',
   category:'Logistics',priority:'high',status:'in_progress',dueDate:'2026-03-05',points:35},
];

const CAT_COLOR: Record<string,string> = {
  'Personal Conduct':'#38b6ff','Physical Fitness':'#22c55e','Armoury':'#a78bfa',
  'Security':'#ff3131','Safety':'#f97316','Discipline':'#f59e0b',
  'Logistics':'#06b6d4','Regimental':'#ec4899',
};
const P_CFG = {
  low:{c:C.light,bg:`${C.light}12`,bd:`${C.light}35`},
  medium:{c:'#f59e0b',bg:'rgba(245,158,11,0.12)',bd:'#f59e0b40'},
  high:{c:C.red,bg:`${C.red}12`,bd:`${C.red}35`},
  critical:{c:'#ff6060',bg:`${C.red}25`,bd:`${C.red}55`},
};
const RANKS = ['Private','L/Corporal','Corporal','Sergeant','Staff Sergeant'];

// Achievements for soldiers
const SOLDIER_ACHIEVEMENTS = [
  {id:'SA001',title:'First Task Submitted',     icon:Send,   points:50,   earned:true,  tier:'bronze'},
  {id:'SA002',title:'Safety Scout',             icon:Shield, points:100,  earned:true,  tier:'silver'},
  {id:'SA003',title:'Perfect Attendance',       icon:Calendar,points:200, earned:false, progress:22,target:30,tier:'gold'},
  {id:'SA004',title:'Armoury Discipline',       icon:Package,points:150,  earned:false, progress:4,target:5,tier:'silver'},
  {id:'SA005',title:'Physical Excellence',      icon:Flame,  points:300,  earned:false, progress:6,target:10,tier:'gold'},
  {id:'SA006',title:'Report Champion',          icon:FileText,points:75,  earned:true,  tier:'bronze'},
];
const TIER_C = {bronze:'#cd7f32',silver:'#c0c0c0',gold:'#ffd700',platinum:C.light};

type Tab = 'tasks'|'achievements'|'logbook';

interface DailyLog { date:string; checkIn:string; tasksCompleted:number; points:number; notes:string; }
const DAILY_LOGS: DailyLog[] = [
  {date:'2026-03-04',checkIn:'06:02',tasksCompleted:2,points:55,notes:'Completed hazard check and discipline record.'},
  {date:'2026-03-03',checkIn:'05:58',tasksCompleted:1,points:20,notes:'Minor offence book review done.'},
  {date:'2026-03-02',checkIn:'06:15',tasksCompleted:3,points:90,notes:'PT completed. Weapon check. Patrol report submitted.'},
  {date:'2026-03-01',checkIn:'06:05',tasksCompleted:2,points:65,notes:'Kit inspection. Vehicle serviceability check.'},
];

export default function SoldierDash({ userRole, appointment, userName, onLogout }: Props) {
  const [tasks, setTasks]     = useState<Task[]>(INIT_TASKS);
  const [tab, setTab]         = useState<Tab>('tasks');
  const [submitting, setSub]  = useState<string|null>(null);
  const [subNote, setSubNote] = useState('');
  const [checkedIn, setCI]    = useState(false);
  const [todayLog, setTL]     = useState({ checkIn:'', notes:'' });
  const headerRef             = useRef<HTMLElement>(null);
  const contentRef            = useRef<HTMLDivElement>(null);
  const taskRef               = useRef<HTMLDivElement>(null);

  const done     = tasks.filter(t=>t.status==='approved').length;
  const submitted= tasks.filter(t=>t.status==='submitted').length;
  const pending  = tasks.filter(t=>t.status==='pending'||t.status==='in_progress').length;
  const totalPts = tasks.filter(t=>t.status==='approved').reduce((s,t)=>s+t.points,0);
  const allPts   = tasks.reduce((s,t)=>s+t.points,0);
  const progress = Math.round((totalPts/allPts)*100);

  useEffect(()=>{
    gsap.fromTo(headerRef.current,{y:-50,opacity:0},{y:0,opacity:1,duration:0.6,ease:'power3.out'});
    gsap.fromTo('.sol-stat',{scale:0.8,opacity:0},{scale:1,opacity:1,duration:0.5,stagger:0.1,delay:0.3,ease:'back.out(1.4)'});
    gsap.fromTo('.sol-task',{x:-20,opacity:0},{x:0,opacity:1,duration:0.35,stagger:0.06,delay:0.4});
  },[]);

  useEffect(()=>{
    if(!taskRef.current) return;
    gsap.fromTo(Array.from(taskRef.current.children),{y:15,opacity:0},{y:0,opacity:1,duration:0.3,stagger:0.05,ease:'power2.out'});
  },[tab]);

  const checkIn = () => {
    const now = new Date().toLocaleTimeString('en-NG',{hour:'2-digit',minute:'2-digit'});
    setCI(true); setTL(p=>({...p,checkIn:now}));
    toast.success(`Daily check-in recorded at ${now}`);
    gsap.fromTo('.checkin-badge',{scale:0,rotate:-10},{scale:1,rotate:0,duration:0.5,ease:'back.out(1.5)'});
  };

  const submitTask = (id: string) => {
    if(!subNote.trim()){toast.error('Please add a completion note before submitting');return;}
    setTasks(p=>p.map(t=>t.id===id?{...t,status:'submitted',submittedNote:subNote}:t));
    toast.success('Task submitted for review');
    setSub(null); setSubNote('');
  };

  const startTask = (id: string) => {
    setTasks(p=>p.map(t=>t.id===id?{...t,status:'in_progress'}:t));
    toast.info('Task started — progress updated');
  };

  const catTasks = (cat: string) => tasks.filter(t=>t.category===cat);
  const cats = [...new Set(tasks.map(t=>t.category))];

  return (
    <div className="min-h-screen" style={{background:'#03040f'}}>
      {/* Header */}
      <header ref={headerRef} className="h-16 flex items-center px-4 md:px-6 gap-4 sticky top-0 z-50 border-b"
        style={{background:'rgba(3,4,15,0.97)',backdropFilter:'blur(20px)',borderColor:`${C.dark}50`}}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2" style={{borderColor:'#22c55e60'}}>
            <img src="/images/ddse_logo.jpeg" alt="DDSE" className="w-full h-full object-cover"/>
          </div>
          <div>
            <p className="text-sm font-black text-white leading-none">DDSE Field Portal</p>
            <p className="text-[9px] uppercase tracking-wider mt-0.5 text-emerald-500">Base Soldier Access</p>
          </div>
        </div>
        <div className="flex-1"/>
        {/* Check-in button */}
        {!checkedIn?(
          <button onClick={checkIn} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
            style={{background:'linear-gradient(135deg,#14532d,#22c55e)',boxShadow:'0 4px 14px rgba(34,197,94,0.4)'}}>
            ✓ Daily Check-In
          </button>
        ):(
          <div className="checkin-badge flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{background:'rgba(34,197,94,0.15)',border:'1px solid rgba(34,197,94,0.4)'}}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-xs font-bold text-emerald-400">Checked in {todayLog.checkIn}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{appointment||'SOL-00000'}</p>
            <p className="text-[9px] text-emerald-500">Base Soldier</p>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 font-black text-xs text-white"
            style={{background:'rgba(34,197,94,0.2)',borderColor:'rgba(34,197,94,0.6)'}}>
            {(appointment||'S').charAt(0)}
          </div>
        </div>
        <button onClick={onLogout} className="p-2 rounded-xl text-slate-600 hover:text-red-400 transition-colors"
          style={{border:'1px solid rgba(255,49,49,0.15)'}}>
          <LogOut className="w-4 h-4"/>
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-5">
        {/* Welcome Banner */}
        <div className="rounded-2xl p-5 relative overflow-hidden"
          style={{background:`linear-gradient(135deg,${C.dark}40,rgba(34,197,94,0.15))`,border:`1px solid ${C.dark}50`}}>
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20" style={{background:'#22c55e'}}/>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Welcome back, Soldier</p>
              <h1 className="text-xl font-black text-white">{appointment||'Base Soldier'}</h1>
              <p className="text-xs text-slate-400 mt-1">
                {new Date().toLocaleDateString('en-NG',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-1">Daily Progress</p>
              <p className="text-3xl font-black" style={{color:C.light}}>{progress}%</p>
              <p className="text-xs text-slate-500">{totalPts}/{allPts} pts</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.08)'}}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{width:`${progress}%`,background:`linear-gradient(90deg,${C.dark},${C.light},#22c55e)`}}/>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            {label:'Pending', val:pending,   c:'#94a3b8', icon:Clock},
            {label:'Active',  val:tasks.filter(t=>t.status==='in_progress').length, c:C.light, icon:Activity},
            {label:'Submitted',val:submitted,c:'#f59e0b', icon:Send},
            {label:'Approved',val:done,      c:'#22c55e', icon:CheckCircle},
          ].map((s,i)=>(
            <div key={i} className="sol-stat rounded-xl p-3 text-center"
              style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${s.c}25`}}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-2"
                style={{background:`${s.c}18`,border:`1px solid ${s.c}30`}}>
                <s.icon className="w-3.5 h-3.5" style={{color:s.c}}/>
              </div>
              <p className="text-lg font-black" style={{color:s.c}}>{s.val}</p>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${C.dark}50`}}>
          {([
            ['tasks','My Tasks',ClipboardCheck],
            ['achievements','Achievements',Trophy],
            ['logbook','Daily Logbook',BookOpen],
          ] as const).map(([id,label,Icon])=>(
            <button key={id} onClick={()=>setTab(id as Tab)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold flex-1 justify-center transition-all"
              style={tab===id?{background:`linear-gradient(135deg,${C.dark},${C.light}bb)`,color:'#fff'}:{color:'#64748b'}}>
              <Icon className="w-3.5 h-3.5"/>{label}
            </button>
          ))}
        </div>

        {/* TASKS */}
        {tab==='tasks'&&(
          <div ref={taskRef} className="space-y-3">
            {cats.map(cat=>{
              const cTasks = catTasks(cat);
              const catC = CAT_COLOR[cat]||C.light;
              return (
                <div key={cat} className="rounded-2xl overflow-hidden" style={{background:'rgba(4,6,22,0.75)',border:`1px solid ${C.dark}40`}}>
                  <div className="flex items-center gap-3 px-4 py-3" style={{borderBottom:`1px solid ${C.dark}35`,background:`${C.dark}20`}}>
                    <div className="w-2 h-2 rounded-full" style={{background:catC}}/>
                    <p className="text-xs font-black" style={{color:catC}}>{cat}</p>
                    <span className="text-[10px] text-slate-600 ml-auto">{cTasks.length} task{cTasks.length!==1?'s':''}</span>
                  </div>
                  <div className="divide-y" style={{divideColor:`${C.dark}25`}}>
                    {cTasks.map(task=>{
                      const pc=P_CFG[task.priority];
                      const isExpanded = submitting===task.id;
                      const statusCfg = {
                        pending:   {c:'#94a3b8',bg:'rgba(100,116,139,0.12)',label:'Pending'},
                        in_progress:{c:C.light, bg:`${C.dark}25`,label:'In Progress'},
                        submitted:  {c:'#f59e0b',bg:'rgba(245,158,11,0.12)',label:'Submitted'},
                        approved:   {c:'#22c55e',bg:'rgba(34,197,94,0.12)',label:'Approved ✓'},
                      }[task.status];

                      return (
                        <div key={task.id} className="p-4 transition-all duration-200">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <span className="text-xs font-mono text-slate-600">{task.id}</span>
                                <span className="text-sm font-black text-white">{task.title}</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                                  style={{background:pc.bg,border:`1px solid ${pc.bd}`,color:pc.c}}>{task.priority}</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                                  style={{background:statusCfg.bg,color:statusCfg.c}}>{statusCfg.label}</span>
                              </div>
                              <p className="text-xs text-slate-500 mb-1.5 leading-relaxed">{task.description}</p>
                              <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-600">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>Due: {task.dueDate}</span>
                                <span className="flex items-center gap-1" style={{color:`${C.light}70`}}>
                                  <BookOpen className="w-3 h-3"/>{task.pdfRef}
                                </span>
                                <span className="font-bold" style={{color:'#ffd700'}}>+{task.points} pts</span>
                              </div>
                              {task.submittedNote&&(
                                <div className="mt-2 p-2 rounded-lg text-xs text-yellow-300/70 italic"
                                  style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)'}}>
                                  Note: {task.submittedNote}
                                </div>
                              )}
                            </div>
                            {/* Action */}
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              {task.status==='pending'&&(
                                <button onClick={()=>startTask(task.id)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
                                  style={{background:`${C.dark}60`,border:`1px solid ${C.dark}80`}}>
                                  Start →
                                </button>
                              )}
                              {task.status==='in_progress'&&(
                                <button onClick={()=>setSub(task.id===submitting?null:task.id)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
                                  style={{background:`linear-gradient(135deg,${C.dark},${C.light}cc)`,boxShadow:`0 4px 12px ${C.dark}60`}}>
                                  Submit ↑
                                </button>
                              )}
                              {task.status==='approved'&&(
                                <div className="flex items-center gap-1 text-green-400 text-xs font-bold">
                                  <CheckCircle className="w-3.5 h-3.5"/>Done
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Submit form */}
                          {isExpanded&&(
                            <div className="mt-3 pt-3 border-t" style={{borderColor:`${C.dark}40`}}>
                              <p className="text-xs text-slate-500 mb-2">Add completion note (required):</p>
                              <Textarea value={subNote} onChange={e=>setSubNote(e.target.value)}
                                placeholder="Describe what you did, any observations or issues found..."
                                className="bg-black/40 border-slate-800 text-white placeholder:text-slate-700 min-h-[70px] text-sm mb-3"/>
                              <div className="flex gap-2">
                                <button onClick={()=>{setSub(null);setSubNote('');}}
                                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 border border-slate-700">Cancel</button>
                                <button onClick={()=>submitTask(task.id)}
                                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white flex-1"
                                  style={{background:`linear-gradient(135deg,${C.dark},${C.light}cc)`}}>
                                  Submit for Review
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ACHIEVEMENTS */}
        {tab==='achievements'&&(
          <div ref={taskRef}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {SOLDIER_ACHIEVEMENTS.map((ach,i)=>{
                const tc = TIER_C[ach.tier as keyof typeof TIER_C];
                return (
                  <div key={i} className="rounded-2xl p-4 relative overflow-hidden transition-all"
                    style={{background:'rgba(4,6,22,0.88)',
                      border:`1px solid ${ach.earned?`${tc}60`:`${C.dark}40`}`,
                      boxShadow:ach.earned?`0 0 25px ${tc}25`:'none',
                      opacity:ach.earned?1:0.7}}>
                    {ach.earned&&<div className="absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl opacity-20" style={{background:tc}}/>}
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                        style={{background:ach.earned?`${tc}20`:'rgba(255,255,255,0.04)',
                          border:`2px solid ${ach.earned?`${tc}50`:`${C.dark}40`}`}}>
                        <ach.icon className="w-6 h-6" style={{color:ach.earned?tc:'#334155'}}/>
                        {!ach.earned&&<Lock className="w-3 h-3 text-slate-700 absolute"/>}
                      </div>
                      <p className="text-sm font-black leading-snug" style={{color:ach.earned?'#fff':'#475569'}}>{ach.title}</p>
                      <p className="text-[10px] uppercase font-bold mt-1 mb-2" style={{color:`${tc}aa`}}>{ach.tier}</p>
                      {ach.earned?(
                        <p className="text-xs font-black" style={{color:tc}}>+{ach.points} pts ✓</p>
                      ):(
                        <>
                          <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{background:'rgba(255,255,255,0.06)'}}>
                            <div className="h-full rounded-full" style={{width:`${((ach as any).progress/(ach as any).target)*100}%`,background:`linear-gradient(90deg,${C.dark}80,${tc}60)`}}/>
                          </div>
                          <p className="text-[10px] text-slate-600">{(ach as any).progress}/{(ach as any).target} — +{ach.points} pts</p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 rounded-2xl text-center" style={{background:`${C.dark}20`,border:`1px solid ${C.dark}50`}}>
              <p className="text-lg font-black" style={{color:'#ffd700'}}>{SOLDIER_ACHIEVEMENTS.filter(a=>a.earned).reduce((s,a)=>s+a.points,0)} pts</p>
              <p className="text-xs text-slate-500 mt-1">Total Points Earned • {SOLDIER_ACHIEVEMENTS.filter(a=>a.earned).length}/{SOLDIER_ACHIEVEMENTS.length} Achievements</p>
            </div>
          </div>
        )}

        {/* DAILY LOGBOOK */}
        {tab==='logbook'&&(
          <div ref={taskRef} className="space-y-4">
            {!checkedIn?(
              <div className="p-6 rounded-2xl text-center" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
                <Activity className="w-10 h-10 mx-auto mb-3" style={{color:`${C.light}40`}}/>
                <p className="text-sm font-bold text-slate-400 mb-3">You haven't checked in today.</p>
                <button onClick={checkIn}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{background:'linear-gradient(135deg,#14532d,#22c55e)'}}>
                  ✓ Check In Now
                </button>
              </div>
            ):(
              <div className="p-4 rounded-2xl" style={{background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.3)'}}>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400"/>
                  <div>
                    <p className="text-sm font-black text-green-400">Today's Check-in Recorded</p>
                    <p className="text-xs text-slate-500">{new Date().toLocaleDateString('en-NG',{weekday:'long',day:'numeric',month:'long'})} at {todayLog.checkIn}</p>
                  </div>
                </div>
              </div>
            )}
            {DAILY_LOGS.map((log,i)=>(
              <div key={i} className="p-4 rounded-2xl" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}40`}}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{background:`${C.light}15`,border:`1px solid ${C.light}30`}}>
                      <Calendar className="w-4 h-4" style={{color:C.light}}/>
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{log.date}</p>
                      <p className="text-xs text-slate-600">Check-in: {log.checkIn}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black" style={{color:'#ffd700'}}>+{log.points} pts</p>
                    <p className="text-xs text-slate-600">{log.tasksCompleted} tasks done</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 pl-12">{log.notes}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
