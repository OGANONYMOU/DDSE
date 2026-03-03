import { useState } from 'react';
import { Plus, Search, Filter, Calendar, CheckCircle, FileText, MoreHorizontal, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { UserRole } from '../../App';

const C = { red:'#ff3131', dark:'#1800ad', light:'#38b6ff' };

interface Inspection {
  id:string; directorate:string; type:string; evaluator:string;
  date:string; score:number; riskLevel:'low'|'medium'|'high'; status:'draft'|'in_progress'|'completed';
}
const MOCK: Inspection[] = [
  {id:'INS-2024-001',directorate:'Standard & Evaluation',type:'Operational Readiness',evaluator:'Maj. Johnson',date:'2024-01-15',score:87,riskLevel:'low',status:'completed'},
  {id:'INS-2024-002',directorate:'Safety & Manual',type:'Supply Chain Audit',evaluator:'Capt. Smith',date:'2024-01-18',score:72,riskLevel:'medium',status:'in_progress'},
  {id:'INS-2024-003',directorate:'Project Monitoring',type:'Security Compliance',evaluator:'Lt. Davis',date:'2024-01-20',score:0,riskLevel:'high',status:'draft'},
  {id:'INS-2024-004',directorate:'Standard & Evaluation',type:'Data Security',evaluator:'Maj. Wilson',date:'2024-01-22',score:94,riskLevel:'low',status:'completed'},
  {id:'INS-2024-005',directorate:'Safety & Manual',type:'Facility Safety',evaluator:'Capt. Brown',date:'2024-01-25',score:68,riskLevel:'medium',status:'in_progress'},
];

const risk: Record<string,string> = {
  low:`rgba(34,197,94,0.15)`, medium:`rgba(245,158,11,0.15)`, high:`rgba(239,68,68,0.15)`
};
const riskBorder: Record<string,string> = { low:'#22c55e', medium:'#f59e0b', high:'#ef4444' };
const statusStyle: Record<string,{bg:string;bd:string;tx:string}> = {
  draft:      {bg:'rgba(100,116,139,0.15)',bd:'#64748b',tx:'#94a3b8'},
  in_progress:{bg:`${C.light}20`,        bd:C.light,   tx:C.light},
  completed:  {bg:'rgba(34,197,94,0.15)',bd:'#22c55e',  tx:'#22c55e'},
};

export default function InspectionsModule({ }: { userRole: UserRole|null }) {
  const [data]     = useState(MOCK);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [open, setOpen]   = useState(false);

  const filtered = data.filter(i =>
    (filter==='all'||i.status===filter) &&
    (i.directorate.toLowerCase().includes(search.toLowerCase())||i.id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Inspections</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and track all inspection activities</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold text-white"
              style={{background:`linear-gradient(135deg,${C.dark},${C.light}cc)`,boxShadow:`0 4px 18px ${C.dark}80`}}>
              <Plus className="w-4 h-4 mr-2"/>New Inspection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" style={{background:'#060818',border:`1px solid ${C.dark}60`}}>
            <DialogHeader><DialogTitle className="text-white">Create New Inspection</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider">Directorate</label>
                <Select>
                  <SelectTrigger style={{background:'rgba(0,0,0,0.4)',borderColor:`${C.dark}60`,color:'#fff'}}>
                    <SelectValue placeholder="Select directorate"/>
                  </SelectTrigger>
                  <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
                    {['Standard & Evaluation','Safety & Manual','Project Monitoring'].map(d=>(
                      <SelectItem key={d} value={d} className="text-white hover:bg-white/5">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider">Inspection Type</label>
                <Select>
                  <SelectTrigger style={{background:'rgba(0,0,0,0.4)',borderColor:`${C.dark}60`,color:'#fff'}}>
                    <SelectValue placeholder="Select type"/>
                  </SelectTrigger>
                  <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
                    {['Operational Readiness','Security Compliance','Supply Chain Audit','Safety Assessment'].map(t=>(
                      <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={()=>setOpen(false)} className="flex-1 border-slate-700 text-slate-300">Cancel</Button>
                <Button onClick={()=>{toast.success('Inspection created');setOpen(false);}} className="flex-1 text-white"
                  style={{background:`linear-gradient(135deg,${C.dark},${C.light}cc)`}}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'Total',value:data.length,c:'#fff'},
          {label:'Completed',value:data.filter(i=>i.status==='completed').length,c:'#22c55e'},
          {label:'In Progress',value:data.filter(i=>i.status==='in_progress').length,c:C.light},
          {label:'Drafts',value:data.filter(i=>i.status==='draft').length,c:'#64748b'},
        ].map((s,i)=>(
          <div key={i} className="rounded-xl p-4" style={{background:'rgba(4,6,22,0.8)',border:`1px solid ${C.dark}50`}}>
            <p className="text-xs uppercase tracking-wider text-slate-600 mb-1">{s.label}</p>
            <p className="text-2xl font-black" style={{color:s.c}}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 p-4 rounded-xl" style={{background:'rgba(4,6,22,0.6)',border:`1px solid ${C.dark}40`}}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"/>
          <Input placeholder="Search inspections..." value={search} onChange={e=>setSearch(e.target.value)}
            className="pl-9 bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40" style={{background:'rgba(0,0,0,0.4)',borderColor:`${C.dark}60`,color:'#fff'}}>
            <Filter className="w-3.5 h-3.5 mr-2"/><SelectValue/>
          </SelectTrigger>
          <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
            {[['all','All Status'],['draft','Draft'],['in_progress','In Progress'],['completed','Completed']].map(([v,l])=>(
              <SelectItem key={v} value={v} className="text-white">{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(ins=>{
          const ss = statusStyle[ins.status];
          return (
            <div key={ins.id} className="rounded-xl p-5 transition-all duration-200 group"
              style={{background:'rgba(4,6,22,0.8)',border:`1px solid ${C.dark}40`}}
              onMouseEnter={e=>(e.currentTarget.style.borderColor=`${C.light}40`)}
              onMouseLeave={e=>(e.currentTarget.style.borderColor=`${C.dark}40`)}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-base font-black text-white">{ins.id}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{background:ss.bg,border:`1px solid ${ss.bd}50`,color:ss.tx}}>
                      {ins.status.replace('_',' ')}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{background:risk[ins.riskLevel],border:`1px solid ${riskBorder[ins.riskLevel]}50`,color:riskBorder[ins.riskLevel]}}>
                      {ins.riskLevel} risk
                    </span>
                  </div>
                  <p className="font-semibold text-slate-200">{ins.directorate}</p>
                  <p className="text-sm text-slate-500">{ins.type} · {ins.evaluator}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/>{ins.date}</span>
                    {ins.status==='completed'&&(
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5"/>Score: {ins.score}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>toast.info(`Viewing ${ins.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{background:`${C.light}15`,border:`1px solid ${C.light}30`,color:C.light}}>
                    <FileText className="w-3.5 h-3.5"/>View
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
