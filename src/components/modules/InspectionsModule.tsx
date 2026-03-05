import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Plus, Search, Filter, Calendar, CheckCircle, FileText,
  ClipboardCheck, ChevronDown, ChevronRight, X, AlertCircle, Target, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { UserRole } from '../../App';

const C = { red:'#ff3131', dark:'#1800ad', light:'#38b6ff' };

interface Inspection {
  id:string; directorate:string; type:string; evaluator:string;
  date:string; score:number; riskLevel:'low'|'medium'|'high';
  status:'completed'|'in_progress'|'draft'; unit?:string; formation?:string;
}

const MOCK:Inspection[] = [
  {id:'INS-2026-001',directorate:'Standard & Evaluation',type:'Operational Readiness',evaluator:'Maj. Okafor',unit:'1 Bn',formation:'3 Bde',date:'2026-01-15',score:87,riskLevel:'low',status:'completed'},
  {id:'INS-2026-002',directorate:'Safety & Manual',type:'Hazard & Safety Assessment',evaluator:'Capt. Nwosu',unit:'2 Fd Regt',formation:'1 Div',date:'2026-01-18',score:72,riskLevel:'medium',status:'in_progress'},
  {id:'INS-2026-003',directorate:'Project Monitoring',type:'Civil Project Monitoring',evaluator:'Lt. Adeyemi',unit:'Engr Bn',formation:'DHQ',date:'2026-01-20',score:0,riskLevel:'high',status:'draft'},
  {id:'INS-2026-004',directorate:'Standard & Evaluation',type:'Armoury Evaluation',evaluator:'Maj. Aliyu',unit:'4 Bn',formation:'2 Div',date:'2026-01-22',score:94,riskLevel:'low',status:'completed'},
  {id:'INS-2026-005',directorate:'Safety & Manual',type:'General Security Inspection',evaluator:'Capt. Eze',unit:'MP Coy',formation:'DHQ',date:'2026-01-25',score:68,riskLevel:'medium',status:'in_progress'},
  {id:'INS-2026-006',directorate:'Standard & Evaluation',type:'Training Establishment Inspection',evaluator:'Maj. Okafor',unit:'NDA',formation:'Army HQ',date:'2026-02-01',score:91,riskLevel:'low',status:'completed'},
];

// From PDF — real checklist sections
const PDF_CHECKLISTS: Record<string, {section:string; items:string[]}[]> = {
  'Operational Readiness': [
    {section:'Administration/Personnel', items:[
      'Manpower: Estb vs Holding vs Deficiency verified',
      'Prevalent offences in Minor Offence book checked',
      'No. of disciplinary cases since Jan 2026 confirmed',
      'Monthly sick report totals and prevalent ailment checked',
      'Leave and passes register current',
      'Rotation plan effectiveness assessed',
      'Sanitation standards verified',
      'Frequency of Durbars, Meetings & Conferences checked',
      'Feeding adequacy (RCA and disbursement) confirmed',
      'Pay and Allowances regularity — Ops Allces/RCA checked',
    ]},
    {section:'Intelligence/Security', items:[
      'Personnel security: access control verified',
      'Camp/Barracks perimeter fence and trenches inspected',
      'Defence layout checked',
      'Armoury and magazine security confirmed',
      'Information gathering and intelligence sources verified',
    ]},
    {section:'Logistics', items:[
      'Accommodation type, state and adequacy checked',
      'Kitting: Uniforms, Boots, Frag Jacket, Ballistic Helmet',
      'Vehicle repair/maintenance (A & B vehicles) confirmed',
      'Spares availability checked',
      'POL (Petroleum, Oil & Lubricants) holding verified',
      'Arms and Ammo: Type, Estb, Holding, Svc, Unsvc recorded',
      'Equipment establishment and serviceability status confirmed',
    ]},
    {section:'Training', items:[
      'Pre-deployment training verified',
      'In-theatre training schedule active',
      'Level of training assessed',
      'Special training on organic support weapons confirmed',
      'Communication training conducted',
    ]},
  ],
  'Armoury Evaluation': [
    {section:'Standing Orders', items:[
      'Armoury standing orders in place (Yes/No)',
      'Guards/sentries present and strength confirmed',
      'Personnel conversant with orders (verify)',
      'Frequency of order reference checked (Very Often/Not Often/Not at All)',
    ]},
    {section:'Armoury Inspection Books', items:[
      'Armoury Inspection Book present (Yes/No)',
      'Appropriate authorities initial frequency checked (Regular/Irregular)',
      'Daily Issue Book present and updated',
      'Other books maintained — name and verify',
    ]},
    {section:'Guards & Sentries', items:[
      'Guards/sentries on duty (Yes/No)',
      'Adequacy assessed (Adequate/Inadequate)',
      'Strength: Less than one section / One Section / More than a Section',
      'Deployment: Centralized / Dispersed confirmed',
      'Hours: 6 Hrs / 12 Hrs / 24 Hrs verified',
      'Maintenance: Centrally Fed / Self-Sustained / RCA',
      'Rotation plan for armoury companies documented',
    ]},
    {section:'Weapons General', items:[
      'Types in inventory listed: G3, FN, AK47, Pistols, GPMG, MMG',
      'Serviceability state by type recorded (Svc/Unsvc)',
      'Storage: Racked & Chained / Racked / Chained confirmed',
      'Cleaning frequency: Frequently/Less Frequently/As Required',
      'Non-organic weapons identified and documented',
      'Lighting system adequate (Yes/No)',
      'Fire extinguishers: Type, quantity, serviceability verified',
    ]},
  ],
  'Hazard & Safety Assessment': [
    {section:'General Work Environment', items:[
      'All worksites clean and orderly',
      'Work surfaces dry or slip-resistant',
      'Spilled materials cleaned up immediately',
      'Combustible scrap and waste removed promptly',
      'Minimum toilets and washing facilities provided',
      'All work areas adequately illuminated',
      'Pits and floor openings covered or guarded',
    ]},
    {section:'Fire Protection', items:[
      'Fire prevention plan in place',
      'Fire alarm system tested at least annually',
      'Fire extinguishers mounted in accessible locations',
      'Fire extinguishers fully charged and designated',
      'Monthly check records maintained for extinguishers',
      'Sprinkler system water control valves checked',
      'Employees trained in extinguisher use',
      'NO SMOKING signs posted where appropriate',
    ]},
    {section:'Electrical Safety', items:[
      'Hazardous electrical conditions reported immediately',
      'Necessary switches opened and locked-out during maintenance',
      'Portable electrical tools grounded or double-insulated',
      'Ground-fault circuit interrupters installed where required',
      'Exposed wiring with frayed insulation replaced promptly',
      'All energized electrical parts guarded',
    ]},
    {section:'Emergency Action Plan', items:[
      'Emergency action plan compliant with requirements',
      'Emergency escape procedures communicated to all personnel',
      'Employee alarm system recognisable above ambient conditions',
      'Alarm systems properly maintained and tested regularly',
      'Employee responsibilities for emergencies defined',
      'Rescue and medical duties assigned',
    ]},
  ],
  'Training Establishment Inspection': [
    {section:'Courses & Academics', items:[
      'Number of departments and courses listed',
      'Course duration confirmed and approved by NBTE/NUC',
      'Student enlistment numbers per course verified',
      'Sister services personnel percentage recorded',
      'Admission procedures reviewed',
      'Course syllabi provided to DDSE',
    ]},
    {section:'Instructors & Facilities', items:[
      'Number of instructors per course verified',
      'Academic qualifications of instructors confirmed',
      'Instructor sufficiency assessed',
      'Instructor allowances paid promptly',
      'Instructor accommodation adequate',
      'Teaching aids meet NBTE specifications',
      'Computer centre availability and serviceability checked',
    ]},
    {section:'Students & Welfare', items:[
      'Students properly accommodated and fed',
      'Industrial visits organised (frequency confirmed)',
      'Industrial attachments approved by professional bodies',
      'Student results for past 5 years reviewed',
      'External exams conducted before graduation',
      'Certificates recognised by professional bodies',
      'Local administration fund adequacy confirmed',
    ]},
  ],
  'Civil Project Monitoring': [
    {section:'Project Description', items:[
      'Project cost confirmed (split phases if applicable)',
      'Project goals/objectives clearly stated',
      'Project location, executing unit and benefiting unit specified',
      'Project duration (from fund release to handover) recorded',
      'Resources and source of funds documented',
      'Expected short-term and long-term outcomes stated',
    ]},
    {section:'Project Implementation', items:[
      'Design concept reviewed and approved (COREN certified)',
      'Work programme (Gantt chart) available and reviewed',
      'Manpower (skilled: masons, electricians, plumbers) adequate',
      'BOQ, drawing and specifications collected and studied',
      'Adherence to specifications assessed',
      'Quality of work done measured against set standards',
      'Account records reconciled with work done',
      'Soil test report provided before excavation',
    ]},
    {section:'Construction Standards', items:[
      'Foundation trench depth correctly staked per drawing/BOQ',
      'Correct foundation footing thickness followed',
      'Laterite filling sand used (not sandy/loamy soil)',
      'DPM/polythene vapour barrier laid for damp prevention',
      'Block work plumbed properly and straight',
      'Beams and columns follow design and BOQ specification',
      'Roofing members treated and laid straight',
      'Plastering sand filtered with correct mix proportion',
    ]},
  ],
  'General Security Inspection': [
    {section:'Security of Personnel', items:[
      'Manning of gates confirmed',
      'Manning of key locations (Mag/Armoury) verified',
      'Foot patrol schedule active',
      'Town pass register up to date',
      'Civilian influx controlled',
      'Vetting of dependants and ID cards current',
      'Tatoo and bugle calls observed',
    ]},
    {section:'Security of Barracks', items:[
      'Perimeter fence state inspected',
      'Watch towers manned and functional',
      'Entrance/exit gates secured',
      'Visitors book and tag system in use',
      'Communication system checked',
      'Lighting system adequate',
      'Living accommodation inspected',
      'Guard of key points/vital points active',
      'Fire fighting equipment available',
    ]},
    {section:'Magazine Security', items:[
      'Magazine well-sited (Yes/No)',
      'Magazine fenced — type of material noted',
      'Guards/sentries on duty (strength: 2/4/Section)',
      'Guard house present and kept well',
      'Record books present and well maintained',
      'SOPs spelling rules and regulations available',
      'Lighting system adequate (Yes/No)',
      'Ventilation adequate (Yes/No)',
      'Ammunition in cases (Yes/No)',
      'Fire fighting provisions in place (Yes/No)',
      'Communication facility available (Yes/No)',
    ]},
  ],
};

export default function InspectionsModule({userRole}:{userRole:UserRole|null}) {
  const [inspections,setInspections] = useState<Inspection[]>(MOCK);
  const [search,setSearch]   = useState('');
  const [filter,setFilter]   = useState('all');
  const [open,setOpen]       = useState(false);
  const [active,setActive]   = useState<Inspection|null>(null);
  const [checks,setChecks]   = useState<Record<string,boolean>>({});
  const [formData,setFD]     = useState({directorate:'',type:'',evaluator:'',unit:'',date:''});
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    if(!listRef.current) return;
    gsap.fromTo(Array.from(listRef.current.children),{y:20,opacity:0},{y:0,opacity:1,duration:0.35,stagger:0.05,ease:'power2.out'});
  },[filter,search]);

  const filtered = inspections.filter(ins=>
    (filter==='all'||ins.status===filter)&&
    (ins.id.toLowerCase().includes(search.toLowerCase())||ins.directorate.toLowerCase().includes(search.toLowerCase())||ins.type.toLowerCase().includes(search.toLowerCase()))
  );

  const toggle=(key:string)=>setChecks(p=>({...p,[key]:!p[key]}));

  const openChecklist=(ins:Inspection)=>{setActive(ins); setChecks({});};

  const getScore=(type:string)=>{
    const checklists=PDF_CHECKLISTS[type];
    if(!checklists) return 0;
    const total=checklists.reduce((s,c)=>s+c.items.length,0);
    const done=Object.values(checks).filter(Boolean).length;
    return total>0?Math.round((done/total)*100):0;
  };

  const create=()=>{
    if(!formData.directorate||!formData.type){toast.error('Directorate and type required');return;}
    const n:Inspection={
      id:`INS-2026-${String(inspections.length+1).padStart(3,'0')}`,
      ...formData, score:0, riskLevel:'medium', status:'draft'
    };
    setInspections(p=>[n,...p]);
    toast.success('Inspection created'); setOpen(false);
    setFD({directorate:'',type:'',evaluator:'',unit:'',date:''});
  };

  const TYPES = Object.keys(PDF_CHECKLISTS);
  const DIRS  = ['Standard & Evaluation','Safety & Manual','Project Monitoring'];

  const score = active ? getScore(active.type) : 0;
  const checklists = active ? PDF_CHECKLISTS[active.type] || [] : [];
  const totalItems = checklists.reduce((s,c)=>s+c.items.length,0);
  const doneItems  = Object.values(checks).filter(Boolean).length;

  if(active) return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={()=>setActive(null)} className="p-2 rounded-lg border text-slate-400"
          style={{borderColor:`${C.dark}50`,background:`${C.dark}20`}}>
          <X className="w-4 h-4"/>
        </button>
        <div>
          <h1 className="text-xl font-black text-white">{active.type}</h1>
          <p className="text-xs text-slate-500">{active.id} · {active.directorate} · {active.date}</p>
        </div>
      </div>

      {/* Score card */}
      <div className="p-5 rounded-2xl" style={{background:'rgba(4,6,22,0.9)',border:`1px solid ${C.dark}60`}}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-black text-white">Checklist Progress</p>
          <div className="text-right">
            <p className="text-2xl font-black" style={{color:score>=80?'#22c55e':score>=50?'#f59e0b':C.red}}>{score}%</p>
            <p className="text-xs text-slate-600">{doneItems}/{totalItems}</p>
          </div>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}>
          <div className="h-full rounded-full transition-all"
            style={{width:`${score}%`,background:`linear-gradient(90deg,${C.dark},${score>=80?'#22c55e':score>=50?'#f59e0b':C.light})`}}/>
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-600">
          <span>Unit: {active.unit||'—'} · Evaluator: {active.evaluator}</span>
          <span style={{color:score>=80?'#22c55e':score>=50?'#f59e0b':C.red}}>
            {score>=80?'Compliant':score>=50?'Minor Issues':'Non-Compliant'}
          </span>
        </div>
      </div>

      {/* Checklist sections from PDF */}
      <div className="space-y-4">
        {checklists.map((cat,ci)=>(
          <div key={ci} className="rounded-2xl overflow-hidden" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
            <div className="px-5 py-3 flex items-center justify-between" style={{borderBottom:`1px solid ${C.dark}40`,background:`${C.dark}20`}}>
              <p className="text-xs font-black uppercase tracking-widest" style={{color:C.light}}>{cat.section}</p>
              <p className="text-xs text-slate-600">
                {cat.items.filter(item=>checks[`${ci}-${item}`]).length}/{cat.items.length}
              </p>
            </div>
            <div className="p-4 space-y-2">
              {cat.items.map((item,ii)=>{
                const key=`${ci}-${item}`; const done=checks[key];
                return (
                  <div key={ii} onClick={()=>toggle(key)}
                    className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all select-none"
                    style={{background:done?`${C.dark}25`:'rgba(255,255,255,0.02)',border:`1px solid ${done?C.dark+'50':'rgba(255,255,255,0.04)'}`}}>
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                      style={{background:done?C.light:'rgba(255,255,255,0.04)',border:`1px solid ${done?C.light:C.dark+'40'}`}}>
                      {done&&<CheckCircle className="w-3 h-3 text-white"/>}
                    </div>
                    <span className="text-sm flex-1" style={{color:done?'#64748b':'#cbd5e1',textDecoration:done?'line-through':'none'}}>{item}</span>
                    <span className="text-[10px]" style={{color:done?'#22c55e':'#334155'}}>{ii+1}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={()=>setActive(null)} className="border-slate-700 text-slate-300">Close</Button>
        <Button onClick={()=>{
          setInspections(p=>p.map(i=>i.id===active.id?{...i,score,status:score>0?'in_progress':'draft'}:i));
          toast.success('Progress saved');setActive(null);
        }} className="flex-1 text-white font-bold" style={{background:`linear-gradient(135deg,${C.dark},${C.light}cc)`}}>
          Save Progress ({score}%)
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Inspections</h1>
          <p className="text-sm text-slate-500 mt-0.5">DDSE inspection checklists from official PDF templates</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold text-white" style={{background:`linear-gradient(135deg,${C.dark},${C.light}cc)`,boxShadow:`0 4px 18px ${C.dark}80`}}>
              <Plus className="w-4 h-4 mr-2"/>New Inspection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" style={{background:'#060818',border:`1px solid ${C.dark}60`}}>
            <DialogHeader><DialogTitle className="text-white font-black">Create Inspection</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Directorate *</label>
                  <select value={formData.directorate} onChange={e=>setFD({...formData,directorate:e.target.value})}
                    className="w-full px-3 py-2.5 rounded-lg text-sm border appearance-none"
                    style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:formData.directorate?'#fff':'#6b7280'}}>
                    <option value="">Select</option>
                    {DIRS.map(d=><option key={d} value={d} style={{background:'#060818'}}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Date</label>
                  <Input type="date" value={formData.date} onChange={e=>setFD({...formData,date:e.target.value})}
                    className="bg-black/40 border-slate-800 text-white"/>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Inspection Type *</label>
                <select value={formData.type} onChange={e=>setFD({...formData,type:e.target.value})}
                  className="w-full px-3 py-2.5 rounded-lg text-sm border appearance-none"
                  style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:formData.type?'#fff':'#6b7280'}}>
                  <option value="">Select type</option>
                  {TYPES.map(t=><option key={t} value={t} style={{background:'#060818'}}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Evaluator</label>
                  <Input value={formData.evaluator} onChange={e=>setFD({...formData,evaluator:e.target.value})}
                    placeholder="Maj. Okafor" className="bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Unit</label>
                  <Input value={formData.unit} onChange={e=>setFD({...formData,unit:e.target.value})}
                    placeholder="1 Bn" className="bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={()=>setOpen(false)} className="flex-1 border-slate-700 text-slate-300">Cancel</Button>
                <Button onClick={create} className="flex-1 text-white font-bold" style={{background:`linear-gradient(135deg,${C.dark},${C.light}cc)`}}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{label:'Total',val:inspections.length,c:'#f1f5f9'},
          {label:'Completed',val:inspections.filter(i=>i.status==='completed').length,c:'#22c55e'},
          {label:'In Progress',val:inspections.filter(i=>i.status==='in_progress').length,c:C.light},
          {label:'Draft',val:inspections.filter(i=>i.status==='draft').length,c:'#f59e0b'},
        ].map((s,i)=>(
          <div key={i} className="rounded-xl p-4" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
            <p className="text-xs uppercase tracking-wider text-slate-600 mb-1">{s.label}</p>
            <p className="text-2xl font-black" style={{color:s.c}}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 p-4 rounded-xl" style={{background:'rgba(4,6,22,0.6)',border:`1px solid ${C.dark}40`}}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"/>
          <Input placeholder="Search inspections…" value={search} onChange={e=>setSearch(e.target.value)}
            className="pl-9 bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40" style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:'#fff'}}>
            <SelectValue/>
          </SelectTrigger>
          <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
            {[['all','All'],['completed','Completed'],['in_progress','In Progress'],['draft','Draft']].map(([v,l])=>(
              <SelectItem key={v} value={v} className="text-white">{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div ref={listRef} className="space-y-3">
        {filtered.map(ins=>{
          const rc = ins.riskLevel==='high'?C.red:ins.riskLevel==='medium'?'#f59e0b':'#22c55e';
          const sc = ins.status==='completed'?{bg:'rgba(34,197,94,0.12)',bd:'#22c55e40',tx:'#22c55e',lbl:'Completed'}:
                     ins.status==='in_progress'?{bg:`${C.dark}25`,bd:`${C.dark}60`,tx:C.light,lbl:'In Progress'}:
                     {bg:'rgba(100,116,139,0.12)',bd:'#64748b40',tx:'#94a3b8',lbl:'Draft'};
          return (
            <div key={ins.id} className="rounded-2xl p-5 transition-all duration-200 cursor-pointer"
              style={{background:'rgba(4,6,22,0.88)',border:`1px solid ${C.dark}40`}}
              onMouseEnter={e=>(e.currentTarget.style.borderColor=`${C.light}40`)}
              onMouseLeave={e=>(e.currentTarget.style.borderColor=`${C.dark}40`)}
              onClick={()=>openChecklist(ins)}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-slate-600">{ins.id}</span>
                    <span className="text-base font-black text-white">{ins.type}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{background:sc.bg,border:`1px solid ${sc.bd}`,color:sc.tx}}>{sc.lbl}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={{background:`${rc}18`,border:`1px solid ${rc}40`,color:rc}}>{ins.riskLevel} risk</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5"/>{ins.directorate}</span>
                    <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5"/>Evaluator: {ins.evaluator}</span>
                    {ins.unit&&<span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5"/>Unit: {ins.unit}</span>}
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/>{ins.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {ins.score>0&&(
                    <div className="text-right">
                      <p className="text-xl font-black" style={{color:ins.score>=80?'#22c55e':ins.score>=60?'#f59e0b':C.red}}>
                        {ins.score}%
                      </p>
                      <p className="text-[10px] text-slate-600">Score</p>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs" style={{color:`${C.light}80`}}>
                    Open <ChevronRight className="w-3.5 h-3.5"/>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
