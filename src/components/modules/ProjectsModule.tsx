import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Calendar, DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { UserRole } from '../../App';

const C = { red:'#ff3131', dark:'#1800ad', light:'#38b6ff' };

interface Project { id:string; name:string; directorate:string; status:'on_track'|'at_risk'|'delayed'|'completed'; progress:number; budget:number; spent:number; startDate:string; endDate:string; }
const MOCK: Project[] = [
  {id:'PRJ-001',name:'Communications Infrastructure Upgrade',directorate:'Project Monitoring',status:'on_track',progress:75,budget:2500000,spent:1800000,startDate:'2023-06-01',endDate:'2024-06-01'},
  {id:'PRJ-002',name:'Vehicle Fleet Modernization',directorate:'Standard & Evaluation',status:'at_risk',progress:45,budget:5000000,spent:2400000,startDate:'2023-04-01',endDate:'2024-12-01'},
  {id:'PRJ-003',name:'Secure Data Center Migration',directorate:'Project Monitoring',status:'on_track',progress:90,budget:1800000,spent:1650000,startDate:'2023-08-01',endDate:'2024-02-01'},
  {id:'PRJ-004',name:'Training Facility Renovation',directorate:'Safety & Manual',status:'delayed',progress:30,budget:1200000,spent:450000,startDate:'2023-09-01',endDate:'2024-05-01'},
];

const statusCfg: Record<string,{bg:string;bd:string;tx:string;icon:typeof CheckCircle}> = {
  on_track:{bg:'rgba(34,197,94,0.15)',bd:'#22c55e',tx:'#22c55e',icon:CheckCircle},
  at_risk: {bg:'rgba(245,158,11,0.15)',bd:'#f59e0b',tx:'#f59e0b',icon:AlertCircle},
  delayed: {bg:`${C.red}20`,bd:C.red,tx:C.red,icon:Clock},
  completed:{bg:`${C.light}20`,bd:C.light,tx:C.light,icon:CheckCircle},
};
const fmt = (n: number) => `₦${(n/1000000).toFixed(1)}M`;

export default function ProjectsModule({ }: { userRole: UserRole|null }) {
  const [data] = useState(MOCK);
  const [search, setSearch] = useState('');
  const filtered = data.filter(p => p.name.toLowerCase().includes(search.toLowerCase())||p.directorate.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div><h1 className="text-2xl font-black text-white">Projects</h1><p className="text-sm text-slate-500 mt-0.5">Monitor all departmental projects</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[['Total',data.length,'#fff'],['On Track',data.filter(p=>p.status==='on_track').length,'#22c55e'],
          ['At Risk',data.filter(p=>p.status==='at_risk').length,'#f59e0b'],['Delayed',data.filter(p=>p.status==='delayed').length,C.red]].map(([l,v,c],i)=>(
          <div key={i} className="rounded-xl p-4" style={{background:'rgba(4,6,22,0.8)',border:`1px solid ${C.dark}50`}}>
            <p className="text-xs uppercase tracking-wider text-slate-600 mb-1">{l}</p>
            <p className="text-2xl font-black" style={{color:c as string}}>{v}</p>
          </div>
        ))}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"/>
        <Input placeholder="Search projects..." value={search} onChange={e=>setSearch(e.target.value)}
          className="pl-9 bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
      </div>
      <div className="space-y-4">
        {filtered.map(p=>{
          const s = statusCfg[p.status];
          const pct = Math.round((p.spent/p.budget)*100);
          return (
            <div key={p.id} className="rounded-2xl p-6 transition-all duration-200"
              style={{background:'rgba(4,6,22,0.8)',border:`1px solid ${C.dark}40`}}
              onMouseEnter={e=>(e.currentTarget.style.borderColor=`${C.light}40`)}
              onMouseLeave={e=>(e.currentTarget.style.borderColor=`${C.dark}40`)}>
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-black text-white">{p.name}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{background:s.bg,border:`1px solid ${s.bd}50`,color:s.tx}}>
                      <s.icon className="w-3 h-3"/>{p.status.replace('_',' ')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">{p.directorate}</p>
                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500">Progress</span>
                      <span className="font-bold" style={{color:p.progress>=70?'#22c55e':p.progress>=40?'#f59e0b':C.red}}>{p.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}>
                      <div className="h-full rounded-full transition-all"
                        style={{width:`${p.progress}%`,background:`linear-gradient(90deg,${C.dark},${p.progress>=70?'#22c55e':p.progress>=40?'#f59e0b':C.red})`}}/>
                    </div>
                  </div>
                  {/* Budget */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500">Budget utilisation</span>
                      <span className="font-bold" style={{color:pct>90?C.red:pct>70?'#f59e0b':'#22c55e'}}>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}>
                      <div className="h-full rounded-full"
                        style={{width:`${pct}%`,background:pct>90?C.red:pct>70?'#f59e0b':'#22c55e'}}/>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5"/>Budget: {fmt(p.budget)}</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5"/>Spent: {fmt(p.spent)}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/>Due: {p.endDate}</span>
                  </div>
                </div>
                <button onClick={()=>toast.info(`Viewing ${p.id}`)}
                  className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{background:`${C.light}15`,border:`1px solid ${C.light}30`,color:C.light}}>
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
