import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Plus, AlertTriangle, XCircle, Clock, CheckCircle,
  Search, TrendingUp, Layers, User, Calendar, Filter, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { UserRole } from '../../App';

const C = { red: '#ff3131', dark: '#1800ad', light: '#38b6ff' };

type Impact   = 'low'|'medium'|'high'|'critical';
type CtStatus = 'open'|'in_review'|'mitigated'|'resolved'|'escalated';
type CtType   = 'resource'|'technical'|'regulatory'|'personnel'|'budget'|'timeline';

interface Constraint {
  id: string; title: string; description: string;
  type: CtType; impact: Impact; status: CtStatus;
  raisedBy: string; directorate: string; raisedDate: string;
  targetResolution: string; mitigation?: string; relatedTo?: string;
}

const INIT: Constraint[] = [
  { id:'CON-001', title:'Insufficient Inspection Personnel', description:'Only 3 qualified inspectors available for DSE; minimum required is 6 for Q1 coverage.', type:'personnel', impact:'high', status:'in_review', raisedBy:'Maj. Okafor', directorate:'Standard & Evaluation', raisedDate:'2026-01-10', targetResolution:'2026-03-31', mitigation:'Temporary assignment of 2 officers from DSM requested.', relatedTo:'INS-2026-003' },
  { id:'CON-002', title:'Vehicle Fleet Awaiting Procurement', description:'Phase 3 of fleet modernization blocked pending procurement board approval.', type:'budget', impact:'critical', status:'escalated', raisedBy:'Lt. Adeyemi', directorate:'Project Monitoring', raisedDate:'2026-01-18', targetResolution:'2026-02-28', relatedTo:'PRJ-002' },
  { id:'CON-003', title:'Outdated Safety Regulation Manual', description:'Current Safety & Manual handbook references superseded regulations from 2025.', type:'regulatory', impact:'medium', status:'in_review', raisedBy:'Capt. Nwosu', directorate:'Safety & Manual', raisedDate:'2026-01-22', targetResolution:'2026-03-15', mitigation:'Interim advisory notice issued. Full revision in progress.' },
  { id:'CON-004', title:'Database Server Capacity Limit', description:'DDSE database server reaching 92% capacity, risking performance degradation.', type:'technical', impact:'high', status:'mitigated', raisedBy:'Sgt. Eze', directorate:'Standard & Evaluation', raisedDate:'2026-02-05', targetResolution:'2026-03-01', mitigation:'Archive of 2025 records completed. Server upgraded to 2TB storage.' },
  { id:'CON-005', title:'Budget Overrun — Training Block Renovation', description:'Training block renovation (PRJ-004) projected to exceed approved budget by 18%.', type:'budget', impact:'high', status:'open', raisedBy:'Col. Aliyu', directorate:'Project Monitoring', raisedDate:'2026-02-12', targetResolution:'2026-04-15', relatedTo:'PRJ-004' },
  { id:'CON-006', title:'Chemical Storage Ventilation Repair Delay', description:'Permanent repair of ventilation system delayed due to contractor non-availability.', type:'timeline', impact:'critical', status:'escalated', raisedBy:'Capt. Nwosu', directorate:'Safety & Manual', raisedDate:'2026-02-18', targetResolution:'2026-03-07', mitigation:'Temporary fans installed. Area access restricted.', relatedTo:'HZD-003' },
];

const IMP_CFG: Record<Impact, {bg:string;bd:string;tx:string}> = {
  low:      {bg:`${C.light}12`,bd:`${C.light}35`,tx:C.light},
  medium:   {bg:'rgba(245,158,11,0.12)',bd:'#f59e0b40',tx:'#f59e0b'},
  high:     {bg:`${C.red}15`,bd:`${C.red}40`,tx:C.red},
  critical: {bg:`${C.red}28`,bd:`${C.red}60`,tx:'#ff6060'},
};
const ST_CFG: Record<CtStatus,{bg:string;bd:string;tx:string;label:string;icon:typeof AlertTriangle}> = {
  open:       {bg:'rgba(100,116,139,0.12)',bd:'#64748b40',tx:'#94a3b8',label:'Open',           icon:AlertTriangle},
  in_review:  {bg:`${C.dark}25`,bd:`${C.dark}60`,tx:C.light,label:'In Review',    icon:Clock},
  mitigated:  {bg:'rgba(245,158,11,0.12)',bd:'#f59e0b40',tx:'#f59e0b',label:'Mitigated',     icon:TrendingUp},
  resolved:   {bg:'rgba(34,197,94,0.12)',bd:'#22c55e40',tx:'#22c55e',label:'Resolved',       icon:CheckCircle},
  escalated:  {bg:`${C.red}20`,bd:`${C.red}50`,tx:C.red,label:'Escalated',     icon:XCircle},
};
const TYPE_COLOR: Record<CtType,string> = {
  resource:'#a78bfa',technical:'#38b6ff',regulatory:'#f59e0b',
  personnel:'#22c55e',budget:'#ff3131',timeline:'#fb7185',
};
const DIRS=['Standard & Evaluation','Safety & Manual','Project Monitoring'];
const TYPES:CtType[]=['resource','technical','regulatory','personnel','budget','timeline'];
const IMPACTS:Impact[]=['low','medium','high','critical'];
const STATUSES:CtStatus[]=['open','in_review','mitigated','resolved','escalated'];

export default function ConstraintsModule({ userRole }: { userRole: UserRole|null }) {
  const [items,setItems]   = useState<Constraint[]>(INIT);
  const [search,setSearch] = useState('');
  const [statFilt,setStFl] = useState('all');
  const [impFilt,setImpFl] = useState('all');
  const [open,setOpen]     = useState(false);
  const [editing,setEdit]  = useState<Constraint|null>(null);
  const [form,setForm]     = useState({title:'',description:'',type:'resource' as CtType,
    impact:'medium' as Impact,directorate:'',raisedBy:'',targetResolution:'',mitigation:'',relatedTo:''});
  const listRef  = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    if(statsRef.current)
      gsap.fromTo(Array.from(statsRef.current.children),
        {y:24,opacity:0},{y:0,opacity:1,duration:0.45,stagger:0.08,ease:'power2.out'});
  },[]);

  useEffect(()=>{
    if(!listRef.current) return;
    gsap.fromTo(Array.from(listRef.current.children),
      {y:20,opacity:0},{y:0,opacity:1,duration:0.35,stagger:0.05,ease:'power2.out'});
  },[statFilt,impFilt,search]);

  const filtered = items.filter(c=>
    (statFilt==='all'||c.status===statFilt) &&
    (impFilt==='all'||c.impact===impFilt) &&
    (c.title.toLowerCase().includes(search.toLowerCase())||
     c.directorate.toLowerCase().includes(search.toLowerCase())||
     c.raisedBy.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreate = () => {
    setEdit(null);
    setForm({title:'',description:'',type:'resource',impact:'medium',directorate:'',raisedBy:'',targetResolution:'',mitigation:'',relatedTo:''});
    setOpen(true);
  };

  const openEdit = (c: Constraint) => {
    setEdit(c);
    setForm({title:c.title,description:c.description,type:c.type,impact:c.impact,
      directorate:c.directorate,raisedBy:c.raisedBy,targetResolution:c.targetResolution,
      mitigation:c.mitigation||'',relatedTo:c.relatedTo||''});
    setOpen(true);
  };

  const save = () => {
    if(!form.title||!form.directorate){toast.error('Title and directorate required');return;}
    if(editing){
      setItems(p=>p.map(c=>c.id===editing.id?{...c,...form}:c));
      toast.success('Constraint updated');
    } else {
      setItems(p=>[{
        id:`CON-${String(p.length+1).padStart(3,'0')}`,
        ...form, status:'open' as CtStatus,
        raisedDate:new Date().toISOString().split('T')[0],
      },...p]);
      toast.success('Constraint logged');
    }
    setOpen(false);
  };

  const updateStatus = (id:string,status:CtStatus)=>{
    setItems(p=>p.map(c=>c.id===id?{...c,status}:c));
    toast.success(`Status updated to ${ST_CFG[status].label}`);
  };

  const del = (id:string)=>{setItems(p=>p.filter(c=>c.id!==id));toast.info('Constraint removed');};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Constraints Register</h1>
          <p className="text-sm text-slate-500 mt-0.5">Log, track and resolve operational constraints and blockers</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="font-bold text-white"
              style={{background:`linear-gradient(135deg,${C.dark},${C.light}cc)`,boxShadow:`0 4px 18px ${C.dark}80`}}>
              <Plus className="w-4 h-4 mr-2"/>Log Constraint
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl" style={{background:'#060818',border:`1px solid ${C.dark}60`}}>
            <DialogHeader>
              <DialogTitle className="text-white font-black">
                {editing?'Edit Constraint':'Log New Constraint'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Title *</label>
                <Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Constraint title..."
                  className="bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Type</label>
                  <Select value={form.type} onValueChange={v=>setForm({...form,type:v as CtType})}>
                    <SelectTrigger style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:'#fff',fontSize:'12px'}}>
                      <SelectValue/>
                    </SelectTrigger>
                    <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
                      {TYPES.map(t=><SelectItem key={t} value={t} className="text-white capitalize">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Impact</label>
                  <Select value={form.impact} onValueChange={v=>setForm({...form,impact:v as Impact})}>
                    <SelectTrigger style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:'#fff',fontSize:'12px'}}>
                      <SelectValue/>
                    </SelectTrigger>
                    <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
                      {IMPACTS.map(i=><SelectItem key={i} value={i} className="text-white capitalize">{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Target Date</label>
                  <Input type="date" value={form.targetResolution}
                    onChange={e=>setForm({...form,targetResolution:e.target.value})}
                    className="bg-black/40 border-slate-800 text-white text-xs h-10"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Directorate *</label>
                  <Select value={form.directorate} onValueChange={v=>setForm({...form,directorate:v})}>
                    <SelectTrigger style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:form.directorate?'#fff':'#6b7280',fontSize:'12px'}}>
                      <SelectValue placeholder="Select"/>
                    </SelectTrigger>
                    <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
                      {DIRS.map(d=><SelectItem key={d} value={d} className="text-white text-xs">{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Raised By</label>
                  <Input value={form.raisedBy} onChange={e=>setForm({...form,raisedBy:e.target.value})} placeholder="e.g. Maj. Okafor"
                    className="bg-black/40 border-slate-800 text-white placeholder:text-slate-700 text-xs"/>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Description</label>
                <Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
                  placeholder="Describe the constraint in detail..." className="bg-black/40 border-slate-800 text-white placeholder:text-slate-700 min-h-[70px] text-sm"/>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Mitigation Plan (optional)</label>
                <Textarea value={form.mitigation} onChange={e=>setForm({...form,mitigation:e.target.value})}
                  placeholder="Describe mitigation steps..." className="bg-black/40 border-slate-800 text-white placeholder:text-slate-700 min-h-[55px] text-sm"/>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Related Item (e.g. PRJ-002, INS-2026-001)</label>
                <Input value={form.relatedTo} onChange={e=>setForm({...form,relatedTo:e.target.value})} placeholder="Optional..."
                  className="bg-black/40 border-slate-800 text-white placeholder:text-slate-700 text-xs"/>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={()=>setOpen(false)} className="flex-1 border-slate-700 text-slate-300">Cancel</Button>
                <Button onClick={save} className="flex-1 text-white font-bold"
                  style={{background:`linear-gradient(135deg,${C.dark},${C.light}cc)`}}>
                  {editing?'Save Changes':'Log Constraint'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {label:'Total',     val:items.length,                                c:'#f1f5f9'},
          {label:'Open',      val:items.filter(c=>c.status==='open').length,   c:'#94a3b8'},
          {label:'Escalated', val:items.filter(c=>c.status==='escalated').length,c:C.red},
          {label:'Mitigated', val:items.filter(c=>c.status==='mitigated').length,c:'#f59e0b'},
          {label:'Resolved',  val:items.filter(c=>c.status==='resolved').length,c:'#22c55e'},
        ].map((s,i)=>(
          <div key={i} className="rounded-xl p-4 text-center"
            style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
            <p className="text-2xl font-black" style={{color:s.c}}>{s.val}</p>
            <p className="text-xs uppercase tracking-wider text-slate-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Impact heat indicator */}
      <div className="p-4 rounded-2xl" style={{background:'rgba(4,6,22,0.7)',border:`1px solid ${C.dark}40`}}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:`${C.light}80`}}>Impact Distribution</p>
        <div className="flex gap-2 flex-wrap">
          {IMPACTS.map(imp=>{
            const cnt=items.filter(c=>c.impact===imp).length;
            const cfg=IMP_CFG[imp];
            return (
              <div key={imp} className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{background:cfg.bg,border:`1px solid ${cfg.bd}`}}>
                <div className="w-2 h-2 rounded-full" style={{background:cfg.tx}}/>
                <span className="text-xs font-bold capitalize" style={{color:cfg.tx}}>{imp}</span>
                <span className="text-xs font-black" style={{color:cfg.tx}}>{cnt}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 p-4 rounded-xl"
        style={{background:'rgba(4,6,22,0.6)',border:`1px solid ${C.dark}40`}}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"/>
          <Input placeholder="Search constraints…" value={search} onChange={e=>setSearch(e.target.value)}
            className="pl-9 bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
        </div>
        <Select value={statFilt} onValueChange={setStFl}>
          <SelectTrigger className="w-36" style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:'#fff'}}>
            <SelectValue placeholder="Status"/>
          </SelectTrigger>
          <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
            <SelectItem value="all" className="text-white">All Status</SelectItem>
            {STATUSES.map(s=><SelectItem key={s} value={s} className="text-white">{ST_CFG[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={impFilt} onValueChange={setImpFl}>
          <SelectTrigger className="w-32" style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:'#fff'}}>
            <SelectValue placeholder="Impact"/>
          </SelectTrigger>
          <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
            <SelectItem value="all" className="text-white">All Impact</SelectItem>
            {IMPACTS.map(i=><SelectItem key={i} value={i} className="text-white capitalize">{i}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Constraint Cards */}
      <div ref={listRef} className="space-y-4">
        {filtered.map(c=>{
          const ic=IMP_CFG[c.impact]; const sc=ST_CFG[c.status]; const tc=TYPE_COLOR[c.type];
          const StatusIcon = sc.icon;
          return (
            <div key={c.id} className="rounded-2xl p-5 transition-all duration-200"
              style={{background:'rgba(4,6,22,0.88)',border:`1px solid ${c.status==='escalated'?C.red+'60':C.dark+'40'}`}}
              onMouseEnter={e=>(e.currentTarget.style.borderColor=`${C.light}40`)}
              onMouseLeave={e=>(e.currentTarget.style.borderColor=c.status==='escalated'?`${C.red}60`:`${C.dark}40`)}>

              {/* Top row */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-slate-600">{c.id}</span>
                    <h3 className="text-base font-black text-white">{c.title}</h3>
                    {/* Impact */}
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                      style={{background:ic.bg,border:`1px solid ${ic.bd}`,color:ic.tx}}>{c.impact}</span>
                    {/* Type */}
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                      style={{background:`${tc}18`,border:`1px solid ${tc}40`,color:tc}}>{c.type}</span>
                    {/* Status */}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{background:sc.bg,border:`1px solid ${sc.bd}`,color:sc.tx}}>
                      <StatusIcon className="w-3 h-3"/>{sc.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{c.description}</p>

                  {/* Mitigation */}
                  {c.mitigation&&(
                    <div className="p-3 rounded-xl mb-3"
                      style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.25)'}}>
                      <p className="text-[10px] uppercase tracking-widest text-yellow-600 mb-1 font-bold">Mitigation</p>
                      <p className="text-xs text-yellow-200/60">{c.mitigation}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5"/>Raised by: {c.raisedBy}</span>
                    <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5"/>{c.directorate}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/>Raised: {c.raisedDate}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/>Target: {c.targetResolution}</span>
                    {c.relatedTo&&<span className="flex items-center gap-1" style={{color:`${C.light}70`}}>🔗 {c.relatedTo}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Select value={c.status} onValueChange={v=>updateStatus(c.id,v as CtStatus)}>
                    <SelectTrigger className="w-32 text-xs h-8" style={{background:'rgba(0,0,0,0.4)',borderColor:`${C.dark}60`,color:'#fff'}}>
                      <SelectValue/>
                    </SelectTrigger>
                    <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
                      {STATUSES.map(s=>(
                        <SelectItem key={s} value={s} className="text-white text-xs">{ST_CFG[s].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button onClick={()=>openEdit(c)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-sky-400 transition-colors"
                    style={{border:`1px solid ${C.dark}30`}}>
                    <Edit2 className="w-3.5 h-3.5"/>
                  </button>
                  <button onClick={()=>del(c.id)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 transition-colors"
                    style={{border:`1px solid rgba(255,49,49,0.15)`}}>
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length===0&&(
          <div className="text-center py-16 text-slate-600">
            <Filter className="w-10 h-10 mx-auto mb-3 opacity-30"/>
            <p className="font-semibold">No constraints found</p>
          </div>
        )}
      </div>
    </div>
  );
}
