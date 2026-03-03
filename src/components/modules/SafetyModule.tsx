import { useState } from 'react';
import { Plus, Search, AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { UserRole } from '../../App';

const C = { red:'#ff3131', dark:'#1800ad', light:'#38b6ff' };
interface Hazard { id:string; title:string; location:string; severity:'low'|'medium'|'high'|'critical'; category:string; reportedBy:string; reportedDate:string; status:'open'|'in_review'|'mitigated'|'closed'; description:string; }
const MOCK: Hazard[] = [
  {id:'HZD-001',title:'Uneven flooring in Armoury B',location:'Armoury B — Section 3',severity:'medium',category:'Physical Hazard',reportedBy:'Sgt. Miller',reportedDate:'2024-01-20',status:'in_review',description:'Floor tiles are loose and uneven, posing a trip hazard.'},
  {id:'HZD-002',title:'Faulty emergency lighting',location:'Operations Center',severity:'high',category:'Safety Equipment',reportedBy:'Lt. Johnson',reportedDate:'2024-01-18',status:'open',description:'Emergency exit lights not functioning in the east wing.'},
  {id:'HZD-003',title:'Chemical storage ventilation issue',location:'Maintenance Depot',severity:'critical',category:'Chemical Hazard',reportedBy:'Cpl. Davis',reportedDate:'2024-01-15',status:'mitigated',description:'Ventilation system failure in chemical storage room.'},
  {id:'HZD-004',title:'Exposed electrical wiring',location:'Training Block C',severity:'high',category:'Electrical Hazard',reportedBy:'Maj. Wilson',reportedDate:'2024-01-22',status:'open',description:'Exposed live wiring in training block corridor.'},
];
const sevcfg: Record<string,{bg:string;bd:string;tx:string}> = {
  low:     {bg:'rgba(34,197,94,0.15)',  bd:'#22c55e',tx:'#22c55e'},
  medium:  {bg:'rgba(245,158,11,0.15)',bd:'#f59e0b', tx:'#f59e0b'},
  high:    {bg:`${C.red}18`,           bd:C.red,    tx:C.red},
  critical:{bg:`${C.red}30`,           bd:C.red,    tx:'#fff'},
};
const statcfg: Record<string,{c:string;icon:typeof Clock}> = {
  open:     {c:C.red,    icon:AlertTriangle},
  in_review:{c:'#f59e0b',icon:Clock},
  mitigated:{c:C.light,  icon:Shield},
  closed:   {c:'#22c55e',icon:CheckCircle},
};

export default function SafetyModule({ }: { userRole: UserRole|null }) {
  const [data]         = useState(MOCK);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title:'', location:'', severity:'', category:'', description:'' });
  const filtered = data.filter(h => h.title.toLowerCase().includes(search.toLowerCase())||h.location.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-black text-white">Safety & Hazards</h1><p className="text-sm text-slate-500 mt-0.5">Report and track safety incidents</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold text-white" style={{background:`linear-gradient(135deg,${C.red}cc,${C.dark})`,boxShadow:`0 4px 18px ${C.red}40`}}>
              <Plus className="w-4 h-4 mr-2"/>Report Hazard
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" style={{background:'#060818',border:`1px solid ${C.dark}60`}}>
            <DialogHeader><DialogTitle className="text-white">Report New Hazard</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              {[['title','Title','text','Enter hazard title'],['location','Location','text','Where is the hazard?']].map(([k,l,t,p])=>(
                <div key={k}>
                  <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider">{l}</label>
                  <Input type={t} value={form[k as keyof typeof form]}
                    onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={p}
                    className="bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider">Severity</label>
                  <Select value={form.severity} onValueChange={v=>setForm({...form,severity:v})}>
                    <SelectTrigger style={{background:'rgba(0,0,0,0.4)',borderColor:`${C.dark}60`,color:form.severity?'#fff':'#6b7280'}}>
                      <SelectValue placeholder="Select"/>
                    </SelectTrigger>
                    <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
                      {['low','medium','high','critical'].map(s=><SelectItem key={s} value={s} className="text-white capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider">Category</label>
                  <Select value={form.category} onValueChange={v=>setForm({...form,category:v})}>
                    <SelectTrigger style={{background:'rgba(0,0,0,0.4)',borderColor:`${C.dark}60`,color:form.category?'#fff':'#6b7280'}}>
                      <SelectValue placeholder="Select"/>
                    </SelectTrigger>
                    <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
                      {['Physical Hazard','Chemical Hazard','Electrical Hazard','Safety Equipment','Fire Hazard'].map(c=>(
                        <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider">Description</label>
                <Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
                  placeholder="Describe the hazard in detail..." className="bg-black/40 border-slate-800 text-white placeholder:text-slate-700 min-h-[80px]"/>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={()=>setOpen(false)} className="flex-1 border-slate-700 text-slate-300">Cancel</Button>
                <Button onClick={()=>{toast.success('Hazard reported successfully');setOpen(false);setForm({title:'',location:'',severity:'',category:'',description:''}); }} className="flex-1 text-white"
                  style={{background:`linear-gradient(135deg,${C.red}cc,${C.dark})`}}>Submit Report</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[['Open',data.filter(h=>h.status==='open').length,C.red],
          ['In Review',data.filter(h=>h.status==='in_review').length,'#f59e0b'],
          ['Mitigated',data.filter(h=>h.status==='mitigated').length,C.light],
          ['Closed',data.filter(h=>h.status==='closed').length,'#22c55e']].map(([l,v,c],i)=>(
          <div key={i} className="rounded-xl p-4" style={{background:'rgba(4,6,22,0.8)',border:`1px solid ${C.dark}50`}}>
            <p className="text-xs uppercase tracking-wider text-slate-600 mb-1">{l}</p>
            <p className="text-2xl font-black" style={{color:c as string}}>{v}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"/>
        <Input placeholder="Search hazards..." value={search} onChange={e=>setSearch(e.target.value)}
          className="pl-9 bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
      </div>

      <div className="space-y-4">
        {filtered.map(h=>{
          const sv = sevcfg[h.severity];
          const st = statcfg[h.status];
          return (
            <div key={h.id} className="rounded-2xl p-5 transition-all duration-200"
              style={{background:'rgba(4,6,22,0.8)',border:`1px solid ${C.dark}40`}}
              onMouseEnter={e=>(e.currentTarget.style.borderColor=`${C.light}40`)}
              onMouseLeave={e=>(e.currentTarget.style.borderColor=`${C.dark}40`)}>
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-base font-black text-white">{h.title}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{background:sv.bg,border:`1px solid ${sv.bd}50`,color:sv.tx}}>{h.severity}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{background:`${st.c}18`,border:`1px solid ${st.c}40`,color:st.c}}>
                      <st.icon className="w-3 h-3"/>{h.status.replace('_',' ')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mb-1">{h.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                    <span>📍 {h.location}</span>
                    <span>🏷️ {h.category}</span>
                    <span>👤 {h.reportedBy}</span>
                    <span>📅 {h.reportedDate}</span>
                  </div>
                </div>
                <button onClick={()=>toast.info(`Viewing ${h.id}`)}
                  className="px-4 py-2 rounded-lg text-xs font-bold transition-all flex-shrink-0"
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
