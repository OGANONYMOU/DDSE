import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Plus, Search, AlertTriangle, CheckCircle, Clock, Shield, X,
  ChevronRight, Flame, Zap, Wind, Eye, Activity, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { UserRole } from '../../App';

const C = { red:'#ff3131', dark:'#1800ad', light:'#38b6ff' };

interface Hazard {
  id:string; title:string; location:string; category:string;
  severity:'low'|'medium'|'high'|'critical'; status:'open'|'in_review'|'mitigated'|'closed';
  reportedBy:string; date:string; description:string; action?:string;
}

const INIT:Hazard[] = [
  {id:'HZD-001',title:'Chemical Storage Ventilation Failure',location:'Block C — Lab Store',category:'Environmental Controls',severity:'critical',status:'in_review',reportedBy:'Capt. Nwosu',date:'2026-02-18',description:'Ventilation system in chemical storage area not operating. Fumes building up. Risk of inhalation exposure to acids and caustics.',action:'Temporary fans installed, area access restricted. Permanent repair scheduled.'},
  {id:'HZD-002',title:'Fire Extinguisher — Expired Inspection Tag',location:'Armoury Block B',category:'Fire Protection',severity:'high',status:'open',reportedBy:'Sgt. Eze',date:'2026-02-20',description:'3x fire extinguishers in Armoury Block B have expired inspection tags. Not confirmed fully charged.'},
  {id:'HZD-003',title:'Floor Opening Unguarded — Stairwell 2',location:'HQ Building — Floor 2',category:'Floor & Stairways',severity:'medium',status:'mitigated',reportedBy:'Maj. Okafor',date:'2026-02-15',description:'Floor opening near stairwell 2 not guarded by cover or guardrail. Personnel passing frequently.',action:'Temporary barrier placed. Permanent cover being fabricated.'},
  {id:'HZD-004',title:'Electrical Wiring — Frayed Insulation',location:'MT Yard Workshop',category:'Electrical',severity:'high',status:'open',reportedBy:'Lt. Adeyemi',date:'2026-02-22',description:'Exposed wiring with frayed insulation found near vehicle inspection pit. Risk of electrocution or fire.'},
  {id:'HZD-005',title:'NO SMOKING Sign Missing — POL Point',location:'Vehicle POL Point',category:'Flammable Materials',severity:'medium',status:'closed',reportedBy:'Capt. Nwosu',date:'2026-02-10',description:'NO SMOKING signs not posted at POL (petroleum, oil & lubricants) dispensing point.', action:'New signs installed and verified on 2026-02-12.'},
];

// PDF Section 4 — Safety Assessment Categories
const PDF_CATEGORIES = [
  {label:'General Work Environment',       icon:Eye,      color:'#22c55e'},
  {label:'Walkways',                        icon:Activity, color:C.light},
  {label:'Floor & Stairways',              icon:Activity, color:'#a78bfa'},
  {label:'Fire Protection',                icon:Flame,    color:C.red},
  {label:'Flammable Materials',            icon:Flame,    color:'#f97316'},
  {label:'Electrical',                     icon:Zap,      color:'#ffd700'},
  {label:'Environmental Controls',         icon:Wind,     color:'#38b6ff'},
  {label:'Hazardous Chemical Exposures',   icon:Shield,   color:'#f59e0b'},
  {label:'Emergency Action Plan',          icon:AlertTriangle, color:C.red},
];

// Full PDF checklist items per category
const PDF_CHECKLIST: Record<string, string[]> = {
  'General Work Environment': [
    'All worksites clean and orderly',
    'Work surfaces dry or slip-resistant',
    'Spilled materials cleaned up immediately',
    'Combustible scrap, debris and waste removed promptly',
    'Accumulated combustible dust removed from elevated surfaces',
    'Covered metal waste cans used for oily/paint-soaked waste',
    'All oil and gas fired devices have flame failure controls',
    'Minimum number of toilets and washing facilities provided',
    'All toilets and washing facilities clean and sanitary',
    'All work areas adequately illuminated',
    'Pits and floor openings covered or guarded',
  ],
  'Fire Protection': [
    'Fire prevention plan in place',
    'Fire alarm system tested at least annually and certified',
    'Interior standpipes and valves inspected regularly',
    'Outside fire hydrants flushed annually (preventive maintenance)',
    'Fire doors and shutters in good operating condition — unobstructed',
    'Fusible links in fire doors in place',
    'Automatic sprinkler system water control valves checked',
    'Sprinkler heads protected by metal guards where exposed',
    'Portable fire extinguishers provided in adequate number and type',
    'Fire extinguishers mounted in readily accessible locations',
    'Fire extinguishers recharged and tagged regularly',
    'Monthly check records maintained for extinguishers',
    'Employees trained in extinguisher use and fire protection procedures',
  ],
  'Electrical': [
    'Employees required to report obvious electrical hazards immediately',
    'Switches opened, locked-out and tagged before electrical maintenance',
    'Portable electrical tools grounded or double insulated',
    'Ground-fault circuit interrupters installed where required',
    'Exposed wiring with frayed or deteriorated insulation replaced promptly',
    'Flexible cords and cables free of splices or taps',
    'All cord, cable and raceway connections intact and secure',
    'Electrical tools appropriate for wet or damp locations',
    'All energized electrical parts guarded against accidental contact',
    'All unused openings in electrical enclosures closed with covers',
    'Employees on energized lines over 600V prohibited from working alone',
    'Employees working on energized equipment trained in CPR',
  ],
  'Flammable Materials': [
    'Combustible scrap stored in covered metal receptacles',
    'Approved containers used for flammable/combustible liquids',
    'All flammable liquids in closed containers when not in use',
    'Storage rooms for flammables have explosion-proof lights and ventilation',
    'Flammable liquids kept in fire-resistant containers until removed',
    'Fire extinguishers within 75 ft of outside flammable liquid areas',
    'Fire extinguishers within 10 ft of inside flammable storage',
    'Transfer of flammable liquids performed by trained personnel',
    'NO SMOKING signs posted in flammable/combustible areas',
    'NO SMOKING signs on liquefied petroleum gas tanks',
    'NO SMOKING rules enforced in all flammable material areas',
    'Storage tanks adequately vented and equipped with emergency venting',
  ],
  'Environmental Controls': [
    'All work areas properly illuminated',
    'Employees instructed in first aid and emergency procedures',
    'Hazardous substances identified (inhalation, ingestion, skin, contact)',
    'Employee exposure to chemicals within acceptable levels',
    'Ventilation system appropriate for work being performed',
    'Welding fumes controlled by ventilation or respirators',
    'Noise levels within acceptable limits (check 85 dBA threshold)',
    'Personal protective equipment provided, used and maintained',
    'Written SOPs for selection and use of respirators',
    'Restrooms and washrooms clean and sanitary',
    'All drinking water potable, non-potable outlets clearly marked',
    'Employees in traffic areas wear bright warning vests',
  ],
  'Hazardous Chemical Exposures': [
    'Employees trained in safe handling of acids, caustics and chemicals',
    'Eye wash fountains and safety showers in corrosive chemical areas',
    'All containers labelled with contents and hazard warnings',
    'All employees use PPE when handling chemicals',
    'Flammable/toxic chemicals in closed containers when not in use',
    'SOPs established and followed for chemical spill clean-up',
    'Respirators stored in clean, sanitary, convenient location',
    'Employees prohibited from eating in hazardous chemical areas',
    'MSDS available for each hazardous substance',
    'Employee training program for hazardous substances in place',
  ],
  'Emergency Action Plan': [
    'Emergency action plan in place and compliant with regulations',
    'Emergency escape procedures and routes communicated to all personnel',
    'Employee alarm system recognisable above ambient conditions',
    'Alarm systems properly maintained and tested regularly',
    'Emergency action plan reviewed and revised periodically',
    'Employee responsibilities for reporting emergencies defined',
    'Employee responsibilities during emergencies defined',
    'Rescue and medical duties assigned and trained',
  ],
  'Walkways': [
    'Aisles and passageways kept clear',
    'Aisles and walkways marked as appropriate',
    'Wet surfaces covered with non-slip materials',
    'Floor holes repaired, covered or made safe',
    'Safe clearance for walking in aisles near equipment',
    'Adequate headroom for entire length of aisles/walkways',
    'Standard guardrails where aisle surfaces elevated >30 inches',
  ],
  'Floor & Stairways': [
    'Floor openings guarded by cover, guardrail or equivalent',
    'Toe boards installed around permanent floor openings',
    'Standard stair rails or handrails on all stairways (4+ risers)',
    'All stairways at least 22 inches wide',
    'Stairs have at least 6\'6" overhead clearance',
    'Step risers uniform — no riser spacing >7.5 inches',
    'Stair steps slip-resistant',
    'Stairway handrails 30–34 inches above leading edge of treads',
    'Handrails capable of withstanding 200 lbs load',
  ],
};

const SEV_CFG = {
  low:     {bg:`${C.light}12`,bd:`${C.light}35`,tx:C.light,  dot:C.light},
  medium:  {bg:'rgba(245,158,11,0.12)',bd:'#f59e0b40',tx:'#f59e0b',dot:'#f59e0b'},
  high:    {bg:`${C.red}15`,bd:`${C.red}40`,tx:C.red,dot:C.red},
  critical:{bg:`${C.red}28`,bd:`${C.red}60`,tx:'#ff6060',dot:'#ff6060'},
};
const ST_CFG = {
  open:      {bg:'rgba(255,49,49,0.12)',bd:'#ff313140',tx:C.red,label:'Open'},
  in_review: {bg:`${C.dark}25`,bd:`${C.dark}60`,tx:C.light,label:'In Review'},
  mitigated: {bg:'rgba(245,158,11,0.12)',bd:'#f59e0b40',tx:'#f59e0b',label:'Mitigated'},
  closed:    {bg:'rgba(34,197,94,0.12)',bd:'#22c55e40',tx:'#22c55e',label:'Closed'},
};

export default function SafetyModule({userRole}:{userRole:UserRole|null}) {
  const [hazards,setHazards]   = useState<Hazard[]>(INIT);
  const [view,setView]         = useState<'hazards'|'checklist'>('hazards');
  const [activeChecklist,setAC]= useState<string|null>(null);
  const [checks,setChecks]     = useState<Record<string,boolean>>({});
  const [search,setSrch]       = useState('');
  const [sevFilt,setSevF]      = useState('all');
  const [open,setOpen]         = useState(false);
  const [form,setForm]         = useState({title:'',location:'',category:PDF_CATEGORIES[0].label,severity:'medium' as Hazard['severity'],description:'',reportedBy:''});
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    if(!listRef.current) return;
    gsap.fromTo(Array.from(listRef.current.children),{y:18,opacity:0},{y:0,opacity:1,duration:0.35,stagger:0.05,ease:'power2.out'});
  },[view,sevFilt,search,activeChecklist]);

  const filtered = hazards.filter(h=>
    (sevFilt==='all'||h.severity===sevFilt)&&
    (h.title.toLowerCase().includes(search.toLowerCase())||h.location.toLowerCase().includes(search.toLowerCase()))
  );

  const createHazard=()=>{
    if(!form.title||!form.location){toast.error('Title and location required');return;}
    setHazards(p=>[{
      id:`HZD-${String(p.length+1).padStart(3,'0')}`,
      ...form,status:'open',date:new Date().toISOString().split('T')[0],
    },...p]);
    toast.success('Hazard logged'); setOpen(false);
    setForm({title:'',location:'',category:PDF_CATEGORIES[0].label,severity:'medium',description:'',reportedBy:''});
  };

  const updateStatus=(id:string,status:Hazard['status'])=>{
    setHazards(p=>p.map(h=>h.id===id?{...h,status}:h));
    toast.success(`Status updated to ${ST_CFG[status].label}`);
  };

  const toggle=(key:string)=>setChecks(p=>({...p,[key]:!p[key]}));

  if(activeChecklist){
    const items=PDF_CHECKLIST[activeChecklist]||[];
    const done=items.filter((_,i)=>checks[`${activeChecklist}-${i}`]).length;
    const pct=Math.round((done/items.length)*100);
    const cat=PDF_CATEGORIES.find(c=>c.label===activeChecklist);
    return (
      <div className="space-y-5 max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={()=>setAC(null)} className="p-2 rounded-lg border text-slate-400"
            style={{borderColor:`${C.dark}50`,background:`${C.dark}20`}}><X className="w-4 h-4"/></button>
          <div>
            <h2 className="text-xl font-black text-white">{activeChecklist}</h2>
            <p className="text-xs text-slate-500">PDF Section 4 — Hazard/Safety Assessment Checklist</p>
          </div>
        </div>
        <div className="p-5 rounded-2xl" style={{background:'rgba(4,6,22,0.9)',border:`1px solid ${C.dark}60`}}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-white">Assessment Progress</p>
            <p className="text-2xl font-black" style={{color:pct>=80?'#22c55e':pct>=50?'#f59e0b':C.red}}>{pct}%</p>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}>
            <div className="h-full rounded-full transition-all"
              style={{width:`${pct}%`,background:`linear-gradient(90deg,${C.dark},${pct>=80?'#22c55e':C.light})`}}/>
          </div>
          <p className="text-xs text-slate-600 mt-2">{done}/{items.length} items checked</p>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
          <div className="px-5 py-3 flex items-center gap-2 border-b" style={{borderColor:`${C.dark}40`,background:`${C.dark}20`}}>
            {cat&&<cat.icon className="w-4 h-4" style={{color:cat.color}}/>}
            <p className="text-xs font-black uppercase tracking-widest" style={{color:cat?.color||C.light}}>{activeChecklist}</p>
          </div>
          <div className="p-4 space-y-2">
            {items.map((item,i)=>{
              const key=`${activeChecklist}-${i}`; const done=checks[key];
              return (
                <div key={i} onClick={()=>toggle(key)}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all select-none"
                  style={{background:done?`${C.dark}25`:'rgba(255,255,255,0.02)',border:`1px solid ${done?C.dark+'50':'rgba(255,255,255,0.04)'}`}}>
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                    style={{background:done?C.light:'rgba(255,255,255,0.04)',border:`1px solid ${done?C.light:C.dark+'40'}`}}>
                    {done&&<CheckCircle className="w-3 h-3 text-white"/>}
                  </div>
                  <span className="text-sm flex-1" style={{color:done?'#64748b':'#cbd5e1',textDecoration:done?'line-through':'none'}}>{item}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={()=>setAC(null)} className="border-slate-700 text-slate-300">Back</Button>
          <Button onClick={()=>{toast.success(`Assessment saved: ${pct}% compliant`);setAC(null);}}
            className="flex-1 text-white font-bold" style={{background:`linear-gradient(135deg,${C.dark},${C.light}cc)`}}>
            Save Assessment ({pct}%)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Safety & Hazard Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">PDF Section 4 — Hazard/Safety Assessment Checklists</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl p-1" style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${C.dark}50`}}>
            {(['hazards','checklist'] as const).map(v=>(
              <button key={v} onClick={()=>setView(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all"
                style={view===v?{background:`linear-gradient(135deg,${C.dark},${C.light}bb)`,color:'#fff'}:{color:'#64748b'}}>
                {v==='hazards'?'⚠ Hazards':'☑ Assessments'}
              </button>
            ))}
          </div>
          {view==='hazards'&&(
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="font-bold text-white" style={{background:`linear-gradient(135deg,${C.dark},${C.light}cc)`,boxShadow:`0 4px 18px ${C.dark}80`}}>
                  <Plus className="w-4 h-4 mr-2"/>Log Hazard
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg" style={{background:'#060818',border:`1px solid ${C.dark}60`}}>
                <DialogHeader><DialogTitle className="text-white font-black">Log Safety Hazard</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Title *</label>
                    <Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Hazard title..."
                      className="bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Location *</label>
                      <Input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Block/Area"
                        className="bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Severity</label>
                      <Select value={form.severity} onValueChange={v=>setForm({...form,severity:v as Hazard['severity']})}>
                        <SelectTrigger style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:'#fff'}}>
                          <SelectValue/>
                        </SelectTrigger>
                        <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
                          {['low','medium','high','critical'].map(s=>(
                            <SelectItem key={s} value={s} className="text-white capitalize">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Category (PDF Section)</label>
                    <Select value={form.category} onValueChange={v=>setForm({...form,category:v})}>
                      <SelectTrigger style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:'#fff'}}>
                        <SelectValue/>
                      </SelectTrigger>
                      <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
                        {PDF_CATEGORIES.map(c=>(
                          <SelectItem key={c.label} value={c.label} className="text-white">{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Reported By</label>
                    <Input value={form.reportedBy} onChange={e=>setForm({...form,reportedBy:e.target.value})} placeholder="e.g. Maj. Okafor"
                      className="bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Description</label>
                    <Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
                      placeholder="Describe the hazard in detail..." className="bg-black/40 border-slate-800 text-white placeholder:text-slate-700 min-h-[70px]"/>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={()=>setOpen(false)} className="flex-1 border-slate-700 text-slate-300">Cancel</Button>
                    <Button onClick={createHazard} className="flex-1 text-white font-bold" style={{background:`linear-gradient(135deg,${C.dark},${C.light}cc)`}}>Log Hazard</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{label:'Total',val:hazards.length,c:'#f1f5f9'},
          {label:'Open',val:hazards.filter(h=>h.status==='open').length,c:C.red},
          {label:'In Review',val:hazards.filter(h=>h.status==='in_review').length,c:C.light},
          {label:'Mitigated/Closed',val:hazards.filter(h=>h.status==='mitigated'||h.status==='closed').length,c:'#22c55e'},
        ].map((s,i)=>(
          <div key={i} className="rounded-xl p-4" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
            <p className="text-xs uppercase tracking-wider text-slate-600 mb-1">{s.label}</p>
            <p className="text-2xl font-black" style={{color:s.c}}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* HAZARDS VIEW */}
      {view==='hazards'&&(
        <>
          <div className="flex gap-3 p-4 rounded-xl" style={{background:'rgba(4,6,22,0.6)',border:`1px solid ${C.dark}40`}}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"/>
              <Input placeholder="Search hazards…" value={search} onChange={e=>setSrch(e.target.value)}
                className="pl-9 bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
            </div>
            <Select value={sevFilt} onValueChange={setSevF}>
              <SelectTrigger className="w-36" style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:'#fff'}}>
                <SelectValue/>
              </SelectTrigger>
              <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
                {[['all','All Severity'],['critical','Critical'],['high','High'],['medium','Medium'],['low','Low']].map(([v,l])=>(
                  <SelectItem key={v} value={v} className="text-white">{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div ref={listRef} className="space-y-3">
            {filtered.map(h=>{
              const sc=SEV_CFG[h.severity]; const stc=ST_CFG[h.status];
              return (
                <div key={h.id} className="rounded-2xl p-5 transition-all"
                  style={{background:'rgba(4,6,22,0.88)',border:`1px solid ${h.severity==='critical'?C.red+'50':C.dark+'40'}`}}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor=`${C.light}40`)}
                  onMouseLeave={e=>(e.currentTarget.style.borderColor=h.severity==='critical'?`${C.red}50`:`${C.dark}40`)}>
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-slate-600">{h.id}</span>
                        <span className="text-base font-black text-white">{h.title}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                          style={{background:sc.bg,border:`1px solid ${sc.bd}`,color:sc.tx}}>
                          <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle" style={{background:sc.dot}}/>
                          {h.severity}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{background:stc.bg,border:`1px solid ${stc.bd}`,color:stc.tx}}>{stc.label}</span>
                      </div>
                      <p className="text-sm text-slate-400 mb-2">{h.description}</p>
                      {h.action&&(
                        <div className="p-2.5 rounded-lg mb-2" style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)'}}>
                          <p className="text-[10px] uppercase tracking-wider text-yellow-600 mb-0.5 font-bold">Mitigation Action</p>
                          <p className="text-xs text-yellow-200/60">{h.action}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                        <span>📍 {h.location}</span>
                        <span>🏷 {h.category}</span>
                        <span>👤 {h.reportedBy}</span>
                        <span>📅 {h.date}</span>
                      </div>
                    </div>
                    <Select value={h.status} onValueChange={v=>updateStatus(h.id,v as Hazard['status'])}>
                      <SelectTrigger className="w-32 text-xs h-8 flex-shrink-0"
                        style={{background:'rgba(0,0,0,0.4)',borderColor:`${C.dark}60`,color:'#fff'}}>
                        <SelectValue/>
                      </SelectTrigger>
                      <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
                        {Object.entries(ST_CFG).map(([k,v])=>(
                          <SelectItem key={k} value={k} className="text-white text-xs">{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ASSESSMENT CHECKLIST VIEW */}
      {view==='checklist'&&(
        <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {PDF_CATEGORIES.map(cat=>{
            const items=PDF_CHECKLIST[cat.label]||[];
            const done=items.filter((_,i)=>checks[`${cat.label}-${i}`]).length;
            const pct=items.length>0?Math.round((done/items.length)*100):0;
            return (
              <div key={cat.label} onClick={()=>setAC(cat.label)}
                className="rounded-2xl p-5 cursor-pointer transition-all duration-200 group"
                style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}40`}}
                onMouseEnter={e=>(e.currentTarget.style.borderColor=`${cat.color}50`)}
                onMouseLeave={e=>(e.currentTarget.style.borderColor=`${C.dark}40`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{background:`${cat.color}18`,border:`1px solid ${cat.color}40`}}>
                    <cat.icon className="w-5 h-5" style={{color:cat.color}}/>
                  </div>
                  {pct>0&&<span className="text-sm font-black" style={{color:pct>=80?'#22c55e':pct>=50?'#f59e0b':C.red}}>{pct}%</span>}
                </div>
                <p className="text-sm font-black text-white mb-1 leading-snug">{cat.label}</p>
                <p className="text-xs text-slate-600 mb-3">{items.length} checklist items · PDF Section 4</p>
                <div className="h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}>
                  <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:cat.color}}/>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-600">{done}/{items.length} checked</span>
                  <span className="text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all"
                    style={{color:cat.color}}>Open <ChevronRight className="w-3 h-3"/></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
