import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Award, Star, Trophy, Shield, Target, TrendingUp,
  CheckCircle, Zap, Medal, Crown, Lock, Users } from 'lucide-react';
import type { UserRole } from '../../App';

const C = { red: '#ff3131', dark: '#1800ad', light: '#38b6ff' };

interface Achievement {
  id: string; title: string; description: string;
  category: 'inspection'|'safety'|'projects'|'armoury'|'leadership'|'compliance';
  tier: 'bronze'|'silver'|'gold'|'platinum';
  icon: typeof Award; points: number;
  earned: boolean; earnedDate?: string; progress?: number; target?: number;
  earner?: string; directorate?: string;
}

const TIER = {
  bronze:   { bg:'rgba(205,127,50,0.15)', bd:'rgba(205,127,50,0.5)', tx:'#cd7f32', glow:'rgba(205,127,50,0.3)', star:'#cd7f32' },
  silver:   { bg:'rgba(192,192,192,0.12)', bd:'rgba(192,192,192,0.45)', tx:'#c0c0c0', glow:'rgba(192,192,192,0.25)', star:'#c0c0c0' },
  gold:     { bg:'rgba(255,215,0,0.15)',  bd:'rgba(255,215,0,0.5)',   tx:'#ffd700', glow:'rgba(255,215,0,0.35)',  star:'#ffd700' },
  platinum: { bg:`${C.light}15`,         bd:`${C.light}50`,           tx:C.light,   glow:`${C.light}30`,          star:C.light   },
};
const CAT_COLOR = {
  inspection:'#38b6ff', safety:'#ff3131', projects:'#f59e0b',
  armoury:'#a78bfa',    leadership:'#ffd700', compliance:'#22c55e',
};

const ACHIEVEMENTS: Achievement[] = [
  { id:'ACH-001', title:'First Inspection', description:'Successfully completed your first facility inspection.',
    category:'inspection', tier:'bronze', icon:ClipboardIcon, points:50, earned:true, earnedDate:'2026-01-15',
    earner:'Maj. Okafor', directorate:'Standard & Evaluation' },
  { id:'ACH-002', title:'Safety Champion', description:'Resolved 5 critical safety hazards before the deadline.',
    category:'safety', tier:'gold', icon:Shield, points:500, earned:true, earnedDate:'2026-02-10',
    earner:'Capt. Nwosu', directorate:'Safety & Manual' },
  { id:'ACH-003', title:'Project Ace', description:'Delivered 3 projects on time and within budget.',
    category:'projects', tier:'silver', icon:Target, points:200, earned:true, earnedDate:'2026-02-20',
    earner:'Lt. Adeyemi', directorate:'Project Monitoring' },
  { id:'ACH-004', title:'Compliance Streak', description:'Maintained 95%+ compliance score for 3 consecutive months.',
    category:'compliance', tier:'platinum', icon:Trophy, points:1000, earned:true, earnedDate:'2026-02-28',
    earner:'Maj. Okafor', directorate:'Standard & Evaluation' },
  { id:'ACH-005', title:'Armoury Master', description:'Achieved 100% serviceability in the armoury for a full month.',
    category:'armoury', tier:'gold', icon:Medal, points:400, earned:false, progress:87, target:100 },
  { id:'ACH-006', title:'Hazard Hunter', description:'Reported and mitigated 10 workplace hazards.',
    category:'safety', tier:'silver', icon:Zap, points:250, earned:false, progress:7, target:10 },
  { id:'ACH-007', title:'Inspection Elite', description:'Complete 20 inspections with a score above 90%.',
    category:'inspection', tier:'platinum', icon:Crown, points:1500, earned:false, progress:14, target:20 },
  { id:'ACH-008', title:'Team Leader', description:'Supervised and signed off 5 team inspection reports.',
    category:'leadership', tier:'silver', icon:Users, points:300, earned:false, progress:3, target:5 },
  { id:'ACH-009', title:'Quick Response', description:'Closed a critical incident within 24 hours.',
    category:'safety', tier:'bronze', icon:Zap, points:100, earned:false, progress:0, target:1 },
  { id:'ACH-010', title:'Budget Guardian', description:'Completed a project under budget by at least 10%.',
    category:'projects', tier:'gold', icon:TrendingUp, points:600, earned:false, progress:0, target:1 },
];

function ClipboardIcon(props: any) { return <CheckCircle {...props}/>; }

export default function AchievementsModule({ userRole }: { userRole: UserRole|null }) {
  const [filter, setFilter] = useState<'all'|'earned'|'locked'>('all');
  const [catFilter, setCat] = useState('all');
  const gridRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    if(statsRef.current){
      gsap.fromTo(Array.from(statsRef.current.children),
        {y:30,opacity:0,scale:0.9},{y:0,opacity:1,scale:1,duration:0.5,stagger:0.1,ease:'back.out(1.5)'});
    }
  },[]);

  useEffect(()=>{
    if(!gridRef.current) return;
    gsap.fromTo(Array.from(gridRef.current.children),
      {y:24,opacity:0},{y:0,opacity:1,duration:0.4,stagger:0.06,ease:'power2.out'});
  },[filter,catFilter]);

  const earned = ACHIEVEMENTS.filter(a=>a.earned);
  const totalPts = earned.reduce((s,a)=>s+a.points,0);
  const byTier = (t: string) => earned.filter(a=>a.tier===t).length;

  const visible = ACHIEVEMENTS.filter(a =>
    (filter==='all'||(filter==='earned'&&a.earned)||(filter==='locked'&&!a.earned)) &&
    (catFilter==='all'||a.category===catFilter)
  );

  const cats = ['all','inspection','safety','projects','armoury','leadership','compliance'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Achievements</h1>
          <p className="text-sm text-slate-500 mt-0.5">Operational excellence milestones and awards</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl"
          style={{background:`${C.dark}20`,border:`1px solid ${C.dark}60`}}>
          <Trophy className="w-6 h-6" style={{color:'#ffd700'}}/>
          <div>
            <p className="text-xl font-black" style={{color:'#ffd700'}}>{totalPts.toLocaleString()}</p>
            <p className="text-xs text-slate-500">Total Points</p>
          </div>
        </div>
      </div>

      {/* Tier stats */}
      <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['platinum','gold','silver','bronze'] as const).map(tier=>{
          const t=TIER[tier];
          return (
            <div key={tier} className="rounded-2xl p-4 flex items-center gap-3"
              style={{background:t.bg,border:`1px solid ${t.bd}`,boxShadow:`0 0 20px ${t.glow}`}}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{background:`${t.tx}20`,border:`1px solid ${t.bd}`}}>
                <Medal className="w-5 h-5" style={{color:t.tx}}/>
              </div>
              <div>
                <p className="text-xl font-black" style={{color:t.tx}}>{byTier(tier)}</p>
                <p className="text-xs capitalize" style={{color:`${t.tx}aa`}}>{tier}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard */}
      <div className="rounded-2xl overflow-hidden" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
        <div className="px-5 py-4 flex items-center gap-2" style={{borderBottom:`1px solid ${C.dark}40`}}>
          <Crown className="w-4 h-4" style={{color:'#ffd700'}}/>
          <p className="text-sm font-black" style={{color:C.light}}>Top Performers</p>
        </div>
        <div className="p-4 grid md:grid-cols-3 gap-3">
          {[
            {name:'Maj. Okafor',dir:'Standard & Evaluation',pts:1550,rank:1,c:'#ffd700'},
            {name:'Capt. Nwosu',dir:'Safety & Manual',pts:700,rank:2,c:'#c0c0c0'},
            {name:'Lt. Adeyemi',dir:'Project Monitoring',pts:200,rank:3,c:'#cd7f32'},
          ].map(p=>(
            <div key={p.rank} className="flex items-center gap-3 p-3 rounded-xl"
              style={{background:`${C.dark}15`,border:`1px solid ${C.dark}40`}}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-lg"
                style={{background:`${p.c}20`,border:`1px solid ${p.c}60`,color:p.c}}>
                {p.rank}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{p.name}</p>
                <p className="text-xs text-slate-500 truncate">{p.dir}</p>
              </div>
              <p className="text-sm font-black flex-shrink-0" style={{color:p.c}}>{p.pts.toLocaleString()} pts</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex rounded-xl p-1" style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${C.dark}50`}}>
          {(['all','earned','locked'] as const).map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className="px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all"
              style={filter===f?{background:`linear-gradient(135deg,${C.dark},${C.light}bb)`,color:'#fff'}:{color:'#64748b'}}>
              {f==='all'?'All'  :f==='earned'?`✓ Earned (${earned.length})`:`🔒 Locked (${ACHIEVEMENTS.length-earned.length})`}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {cats.map(c=>(
            <button key={c} onClick={()=>setCat(c)}
              className="px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all border"
              style={catFilter===c
                ?{background:`${CAT_COLOR[c as keyof typeof CAT_COLOR]||C.dark}30`,
                  borderColor:`${CAT_COLOR[c as keyof typeof CAT_COLOR]||C.light}60`,
                  color:CAT_COLOR[c as keyof typeof CAT_COLOR]||C.light}
                :{borderColor:`${C.dark}40`,color:'#64748b',background:'transparent'}}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Achievement Grid */}
      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {visible.map(ach=>{
          const t=TIER[ach.tier];
          const catC=CAT_COLOR[ach.category];
          return (
            <div key={ach.id} className="rounded-2xl p-5 relative overflow-hidden transition-all duration-300"
              style={{background:ach.earned?`rgba(4,6,22,0.92)`:'rgba(4,6,22,0.6)',
                border:`1px solid ${ach.earned?t.bd:`${C.dark}30`}`,
                boxShadow:ach.earned?`0 0 30px ${t.glow}`:'none',
                opacity:ach.earned?1:0.7}}>
              {/* Background glow */}
              {ach.earned&&<div className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-20"
                style={{background:t.tx}}/>}

              {/* Earned badge */}
              {ach.earned&&(
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-black"
                  style={{background:'rgba(34,197,94,0.2)',border:'1px solid #22c55e50',color:'#22c55e'}}>
                  ✓ EARNED
                </div>
              )}
              {!ach.earned&&(
                <div className="absolute top-3 right-3">
                  <Lock className="w-4 h-4 text-slate-600"/>
                </div>
              )}

              <div className="flex items-start gap-4 mb-4">
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
                  style={{background:ach.earned?t.bg:'rgba(255,255,255,0.04)',
                    border:`2px solid ${ach.earned?t.bd:`${C.dark}40`}`,
                    boxShadow:ach.earned?`0 0 20px ${t.glow}`:'none'}}>
                  <ach.icon className="w-7 h-7" style={{color:ach.earned?t.tx:'#334155'}}/>
                  {ach.earned&&(
                    <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{background:t.tx,boxShadow:`0 0 8px ${t.glow}`}}>
                      <Star className="w-3 h-3 text-white fill-white"/>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] uppercase tracking-widest font-black"
                      style={{color:catC}}>{ach.category}</span>
                    <span className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-full"
                      style={{background:t.bg,color:t.tx,border:`1px solid ${t.bd}`}}>{ach.tier}</span>
                  </div>
                  <h3 className="text-sm font-black leading-snug" style={{color:ach.earned?'#fff':'#475569'}}>
                    {ach.title}
                  </h3>
                  <p className="text-xs mt-1 line-clamp-2" style={{color:ach.earned?'#94a3b8':'#334155'}}>
                    {ach.description}
                  </p>
                </div>
              </div>

              {/* Progress or earned info */}
              {ach.earned?(
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-600">Earned by</p>
                    <p className="text-xs font-bold" style={{color:C.light}}>{ach.earner}</p>
                    <p className="text-[10px] text-slate-600">{ach.earnedDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-600">Points</p>
                    <p className="text-lg font-black" style={{color:t.tx}}>+{ach.points}</p>
                  </div>
                </div>
              ):(
                <div>
                  {ach.progress!==undefined&&ach.target&&(
                    <>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-600">Progress</span>
                        <span style={{color:`${C.light}80`}}>{ach.progress}/{ach.target}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.05)'}}>
                        <div className="h-full rounded-full transition-all"
                          style={{width:`${(ach.progress/ach.target)*100}%`,
                            background:`linear-gradient(90deg,${C.dark}80,${C.light}60)`}}/>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[10px] text-slate-600">
                      {ach.progress&&ach.target?`${Math.round((ach.progress/ach.target)*100)}% complete`:'Not started'}
                    </p>
                    <p className="text-sm font-black text-slate-600">+{ach.points} pts</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
