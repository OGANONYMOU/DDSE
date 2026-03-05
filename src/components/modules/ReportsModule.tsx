import { useState } from 'react';
import { Download, FileBarChart, TrendingUp, Activity, CheckCircle, FileText, Clock, BarChart2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import type { UserRole } from '../../App';

const C = { red: '#ff3131', dark: '#1800ad', light: '#38b6ff' };

const trendData = [
  {month:'Aug',score:82},{month:'Sep',score:85},{month:'Oct',score:87},
  {month:'Nov',score:86},{month:'Dec',score:89},{month:'Jan',score:91},
];
const dirPerf = [
  {name:'Std & Eval',score:94},{name:'Safety',score:78},
  {name:'Projects',score:91},{name:'Overall',score:88},
];
const REPORTS = [
  {id:'RPT-2026-Q1',title:'Q1 Inspection Summary',type:'Quarterly',date:'2026-01-31',status:'published'},
  {id:'RPT-2026-SAF',title:'Safety Compliance Report',type:'Safety',date:'2026-01-28',status:'published'},
  {id:'RPT-2026-PRJ',title:'Project Monitoring Report',type:'Projects',date:'2026-01-25',status:'draft'},
  {id:'RPT-2026-ARM',title:'Armoury Serviceability',type:'Armoury',date:'2026-01-20',status:'review'},
];

export default function ReportsModule({ }: { userRole: UserRole|null }) {
  const [period, setPeriod] = useState('q1');
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-black text-[#f1f5f9]">Reports</h1><p className="text-sm text-[#475569] mt-0.5">Analytics and performance reports</p></div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40" style={{background:'rgba(0,0,0,0.7)',borderColor:`${C.dark}60`,color:'#fff'}}>
            <SelectValue/>
          </SelectTrigger>
          <SelectContent style={{background:'#03040f',borderColor:`${C.dark}60`}}>
            {[['q1','Q1 2026'],['q4','Q4 2026'],['q3','Q3 2026']].map(([v,l])=>(
              <SelectItem key={v} value={v} className="text-[#f1f5f9]">{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'Avg Score',    value:'88.5%',c:C.light,   icon:TrendingUp},
          {label:'Completed',   value:'18',   c:'#22c55e',  icon:CheckCircle},
          {label:'In Review',   value:'4',    c:'#f59e0b',  icon:Clock},
          {label:'High Risk',   value:'3',    c:C.red,      icon:Activity},
        ].map((k,i)=>(
          <div key={i} className="rounded-xl p-4 flex items-center gap-3"
            style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{background:`${k.c}20`,border:`1px solid ${k.c}30`}}>
              <k.icon className="w-4 h-4" style={{color:k.c}}/>
            </div>
            <div>
              <p className="text-xs text-[#334155] uppercase tracking-wider">{k.label}</p>
              <p className="text-xl font-black" style={{color:k.c}}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl p-5" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{color:C.light+'80'}}>
            Inspection Score Trend
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.light} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={C.light} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08"/>
              <XAxis dataKey="month" stroke="#ffffff30" tick={{fontSize:11,fill:'#64748b'}}/>
              <YAxis domain={[75,100]} stroke="#ffffff30" tick={{fontSize:11,fill:'#64748b'}}/>
              <Tooltip contentStyle={{background:'#03040f',border:`1px solid ${C.dark}60`,borderRadius:8,color:'#fff'}}/>
              <Area type="monotone" dataKey="score" stroke={C.light} strokeWidth={2} fill="url(#scoreGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl p-5" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{color:C.light+'80'}}>
            Directorate Performance
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dirPerf} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08"/>
              <XAxis dataKey="name" stroke="#ffffff30" tick={{fontSize:10,fill:'#64748b'}}/>
              <YAxis domain={[0,100]} stroke="#ffffff30" tick={{fontSize:11,fill:'#64748b'}}/>
              <Tooltip contentStyle={{background:'#03040f',border:`1px solid ${C.dark}60`,borderRadius:8,color:'#fff'}}/>
              <Bar dataKey="score" radius={[6,6,0,0]}
                fill={`url(#barGrad)`}/>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.light}/>
                  <stop offset="100%" stopColor={C.dark}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Report list */}
      <div className="rounded-2xl overflow-hidden" style={{border:`1px solid ${C.dark}50`}}>
        <div className="px-5 py-4" style={{background:`${C.dark}20`,borderBottom:`1px solid ${C.dark}40`}}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{color:C.light+'80'}}>Available Reports</p>
        </div>
        <div style={{background:'rgba(4,6,22,0.85)'}}>
          {REPORTS.map((r,i)=>(
            <div key={r.id} className={`flex items-center gap-4 px-5 py-4 transition-all ${i<REPORTS.length-1?'border-b':''}`}
              style={{borderColor:`${C.dark}30`}}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{background:`${C.dark}40`,border:`1px solid ${C.dark}60`}}>
                <FileText className="w-4 h-4" style={{color:C.light}}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#f1f5f9] text-sm truncate">{r.title}</p>
                <p className="text-xs text-[#334155]">{r.type} · {r.date}</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background:r.status==='published'?'rgba(34,197,94,0.15)':r.status==='review'?`${C.light}20`:`${C.dark}30`,
                  color:r.status==='published'?'#22c55e':r.status==='review'?C.light:'#64748b',
                  border:`1px solid ${r.status==='published'?'#22c55e40':r.status==='review'?`${C.light}40`:`${C.dark}60`}`,
                }}>
                {r.status}
              </span>
              <button onClick={()=>toast.info(`Downloading ${r.id}...`)}
                className="p-2 rounded-lg transition-all" style={{background:`${C.dark}30`,border:`1px solid ${C.dark}60`}}>
                <Download className="w-4 h-4" style={{color:C.light}}/>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
