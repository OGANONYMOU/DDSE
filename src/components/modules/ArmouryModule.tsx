import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Plus, Search, CheckCircle, AlertTriangle, Wrench, Shield,
  Book, Key, Users, Flame, FileText, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { UserRole } from '../../App';

const C = { red:'#ff3131', dark:'#1800ad', light:'#38b6ff' };

interface Weapon {
  id:string; serialNumber:string; type:string; model:string;
  qty:number; svc:number; unsvc:number;
  storage:'Racked & Chained'|'Racked'|'Chained'|'Other';
  location:string; lastCleaned:string; organic:boolean;
}

interface GuardEntry { id:string; officer:string; date:string; time:string; note:string; }
interface IssueEntry { id:string; weaponId:string; issuedTo:string; issuedDate:string; returnDate?:string; purpose:string; }

const WEAPONS: Weapon[] = [
  {id:'WPN-001',serialNumber:'A-NG-4421',type:'Rifle',       model:'G3',    qty:48,svc:45,unsvc:3, storage:'Racked & Chained',location:'Armoury A',lastCleaned:'2026-03-01',organic:true},
  {id:'WPN-002',serialNumber:'B-NG-1132',type:'Rifle',       model:'FN',    qty:24,svc:22,unsvc:2, storage:'Racked & Chained',location:'Armoury A',lastCleaned:'2026-02-28',organic:true},
  {id:'WPN-003',serialNumber:'C-NG-8821',type:'Rifle',       model:'AK-47', qty:36,svc:36,unsvc:0, storage:'Racked & Chained',location:'Armoury B',lastCleaned:'2026-03-02',organic:true},
  {id:'WPN-004',serialNumber:'D-NG-3311',type:'Pistol',      model:'Browning 9mm',qty:18,svc:16,unsvc:2,storage:'Racked',location:'Armoury A',lastCleaned:'2026-02-25',organic:true},
  {id:'WPN-005',serialNumber:'E-NG-5500',type:'Machine Gun', model:'GPMG',  qty:6, svc:5, unsvc:1, storage:'Racked & Chained',location:'Armoury B',lastCleaned:'2026-03-01',organic:true},
  {id:'WPN-006',serialNumber:'F-NG-2203',type:'Machine Gun', model:'MMG',   qty:4, svc:4, unsvc:0, storage:'Racked & Chained',location:'Armoury C',lastCleaned:'2026-02-20',organic:true},
  {id:'WPN-007',serialNumber:'G-NG-7791',type:'Rifle',       model:'SLR',   qty:12,svc:10,unsvc:2, storage:'Racked',location:'Armoury C',lastCleaned:'2026-02-15',organic:false},
];

const GUARD_LOG: GuardEntry[] = [
  {id:'GRD-001',officer:'Sgt. Eze',       date:'2026-03-05',time:'06:00',note:'Armoury secured. All weapons on rack. Keys with Adjt.'},
  {id:'GRD-002',officer:'Cpl. Abubakar',  date:'2026-03-04',time:'18:00',note:'Night duty. Perimeter check completed. No anomaly.'},
  {id:'GRD-003',officer:'Sgt. Eze',       date:'2026-03-04',time:'06:00',note:'Morning check. 1x G3 issued for range. Entry made in daily issue book.'},
  {id:'GRD-004',officer:'Cpl. Okonkwo',   date:'2026-03-03',time:'18:00',note:'All weapons returned. Daily issue book reconciled. Armoury locked.'},
];

const ISSUE_LOG: IssueEntry[] = [
  {id:'ISS-001',weaponId:'WPN-001',issuedTo:'Sgt. Eze',     issuedDate:'2026-03-05',purpose:'Range Classification Exercise',returnDate:'2026-03-05'},
  {id:'ISS-002',weaponId:'WPN-004',issuedTo:'Lt. Adeyemi',  issuedDate:'2026-03-04',purpose:'Guard Duty — HQ Gate',returnDate:'2026-03-05'},
  {id:'ISS-003',weaponId:'WPN-001',issuedTo:'Cpl. Abubakar',issuedDate:'2026-03-03',purpose:'Patrol Operation',returnDate:'2026-03-03'},
];

// PDF Armoury Evaluation Checklist
const ARMOURY_CHECKLIST = [
  {section:'Standing Orders',items:[
    {q:'Is there a standing order for the armoury?',ans:true},
    {q:'Are there guards/sentries present?',ans:true},
    {q:'Are personnel on guard conversant with standing orders?',ans:true},
    {q:'How often do guards relate to orders — Very Often?',ans:true},
  ]},
  {section:'Armoury Inspection Books',items:[
    {q:'Is there an Armoury Inspection Book maintained?',ans:true},
    {q:'Do appropriate authorities initial regularly to confirm visits?',ans:true},
    {q:'Is there a Daily Issue Book maintained?',ans:true},
    {q:'Are other books maintained (state overleaf)?',ans:false},
  ]},
  {section:'Lighting & Security',items:[
    {q:'Is the lighting system adequate?',ans:true},
    {q:'Are all weapons racked and chained?',ans:true},
    {q:'Is the armoury lock serviceable?',ans:true},
    {q:'Is there a guard house/room?',ans:true},
    {q:'Is the Mov/Inspection Register up to date?',ans:true},
    {q:'Are fire-fighting extinguishers present and serviceable?',ans:false},
  ]},
  {section:'Ammunition in Armoury',items:[
    {q:'Are there ammo of any sort stored in the armoury?',ans:false},
    {q:'All ammunition stored in magazine (correct location)?',ans:true},
  ]},
  {section:'Fire Point',items:[
    {q:'Adequate fire-fighting arrangement in place?',ans:false},
    {q:'Are there fire extinguishers (liquidized or powdered)?',ans:true},
    {q:'Are there fire points?',ans:false},
  ]},
];

const MAGAZINE_CHECKLIST = [
  {q:'Is the magazine well sited?',ans:true},{q:'Does it have double doors?',ans:true},
  {q:'Is it fenced (wall/wire)?',ans:true},{q:'Security: Adequate?',ans:true},
  {q:'Are there guards/sentries on duty?',ans:true},
  {q:'Is there a guard house?',ans:false},{q:'Are record books maintained?',ans:true},
  {q:'Are SOPs spelling out rules and regulations in place?',ans:true},
  {q:'Is the lighting system adequate?',ans:true},{q:'Is ventilation adequate?',ans:true},
  {q:'Are all ammo in cases?',ans:true},{q:'Is there a fire-fighting provision?',ans:true},
  {q:'Is communication facility available?',ans:false},
];

const WPN_TYPES = ['Rifle','Pistol','Machine Gun','Shotgun','Launcher'];
const MODELS = {Rifle:['G3','FN','AK-47','SLR','M16'],Pistol:['Browning 9mm','Beretta','Walther P99'],
  'Machine Gun':['GPMG','MMG','HMG'],'Shotgun':['Remington 870'],'Launcher':['RPG-7']};
const STORAGE_OPTS: Weapon['storage'][] = ['Racked & Chained','Racked','Chained','Other'];

type Tab = 'inventory'|'checklist'|'issuebook'|'guardlog';

export default function ArmouryModule({ userRole }: { userRole: UserRole|null }) {
  const [tab,setTab]       = useState<Tab>('inventory');
  const [weapons,setWpns]  = useState(WEAPONS);
  const [search,setSearch] = useState('');
  const [filter,setFilter] = useState('all');
  const [openAdd,setOpenAdd] = useState(false);
  const [openSec,setOpenSec] = useState<number|null>(null);
  const [form,setForm]     = useState({type:'Rifle',model:'G3',serialNumber:'',qty:'',svc:'',unsvc:'',storage:'Racked & Chained' as Weapon['storage'],location:'',organic:'true'});
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    if(!listRef.current) return;
    gsap.fromTo(Array.from(listRef.current.children),{y:20,opacity:0},{y:0,opacity:1,duration:0.35,stagger:0.04,ease:'power2.out'});
  },[tab,filter,search]);

  const totalWpns = weapons.reduce((s,w)=>s+w.qty,0);
  const totalSvc  = weapons.reduce((s,w)=>s+w.svc,0);
  const totalUnsvc= weapons.reduce((s,w)=>s+w.unsvc,0);

  const filtered = weapons.filter(w=>
    (filter==='all'||(filter==='svc'&&w.unsvc===0)||(filter==='unsvc'&&w.unsvc>0)) &&
    (w.model.toLowerCase().includes(search.toLowerCase())||w.serialNumber.toLowerCase().includes(search.toLowerCase()))
  );

  const addWeapon = () => {
    if(!form.serialNumber||!form.location){toast.error('Serial number and location required');return;}
    const q=parseInt(form.qty)||1,s=parseInt(form.svc)||q,u=parseInt(form.unsvc)||0;
    setWpns(p=>[{id:`WPN-${String(p.length+1).padStart(3,'0')}`,serialNumber:form.serialNumber,
      type:form.type,model:form.model,qty:q,svc:s,unsvc:u,storage:form.storage,
      location:form.location,lastCleaned:new Date().toISOString().split('T')[0],organic:form.organic==='true',
    },...p]);
    toast.success('Weapon added to inventory'); setOpenAdd(false);
  };

  const TABS: {id:Tab;label:string;icon:typeof Shield}[] = [
    {id:'inventory', label:'Weapons Inventory', icon:Shield},
    {id:'checklist', label:'Evaluation Checklist', icon:CheckCircle},
    {id:'issuebook', label:'Daily Issue Book',  icon:Book},
    {id:'guardlog',  label:'Guard/Inspection Log', icon:Users},
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Armoury Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Weapons inventory, evaluation checklist and guard records</p>
        </div>
        {tab==='inventory'&&(
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button className="font-bold text-white"
                style={{background:`linear-gradient(135deg,${C.dark},${C.light}cc)`,boxShadow:`0 4px 18px ${C.dark}80`}}>
                <Plus className="w-4 h-4 mr-2"/>Add Weapon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg" style={{background:'#060818',border:`1px solid ${C.dark}60`}}>
              <DialogHeader><DialogTitle className="text-white font-black">Add Weapon to Inventory</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {[['serialNumber','Serial No. *','NG-0000'],['location','Location *','Armoury A']].map(([k,l,p])=>(
                  <div key={k} className="col-span-1">
                    <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">{l}</label>
                    <Input value={form[k as keyof typeof form]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={p}
                      className="bg-black/40 border-slate-800 text-white placeholder:text-slate-700 text-sm"/>
                  </div>
                ))}
                <div>
                  <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Type</label>
                  <Select value={form.type} onValueChange={v=>setForm({...form,type:v,model:MODELS[v as keyof typeof MODELS]?.[0]||''})}>
                    <SelectTrigger style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:'#fff',fontSize:'12px'}}>
                      <SelectValue/>
                    </SelectTrigger>
                    <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
                      {WPN_TYPES.map(t=><SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Model</label>
                  <Select value={form.model} onValueChange={v=>setForm({...form,model:v})}>
                    <SelectTrigger style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:'#fff',fontSize:'12px'}}>
                      <SelectValue/>
                    </SelectTrigger>
                    <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
                      {(MODELS[form.type as keyof typeof MODELS]||[]).map(m=><SelectItem key={m} value={m} className="text-white">{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {[['qty','Total Qty','0'],['svc','Serviceable','0'],['unsvc','Unserviceable','0']].map(([k,l,p])=>(
                  <div key={k}>
                    <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">{l}</label>
                    <Input type="number" value={form[k as keyof typeof form]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={p}
                      className="bg-black/40 border-slate-800 text-white text-sm"/>
                  </div>
                ))}
                <div>
                  <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Storage Method</label>
                  <Select value={form.storage} onValueChange={v=>setForm({...form,storage:v as Weapon['storage']})}>
                    <SelectTrigger style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:'#fff',fontSize:'12px'}}>
                      <SelectValue/>
                    </SelectTrigger>
                    <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
                      {STORAGE_OPTS.map(s=><SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Organic to Unit?</label>
                  <Select value={form.organic} onValueChange={v=>setForm({...form,organic:v})}>
                    <SelectTrigger style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:'#fff',fontSize:'12px'}}>
                      <SelectValue/>
                    </SelectTrigger>
                    <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
                      <SelectItem value="true" className="text-white">Yes — Organic</SelectItem>
                      <SelectItem value="false" className="text-white">No — Non-Organic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={()=>setOpenAdd(false)} className="flex-1 border-slate-700 text-slate-300">Cancel</Button>
                <Button onClick={addWeapon} className="flex-1 text-white font-bold"
                  style={{background:`linear-gradient(135deg,${C.dark},${C.light}cc)`}}>Add to Inventory</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'Total Weapons',val:totalWpns,c:'#f1f5f9'},
          {label:'Serviceable',val:totalSvc,c:'#22c55e'},
          {label:'Unserviceable',val:totalUnsvc,c:C.red},
          {label:'Svc Rate',val:`${Math.round((totalSvc/totalWpns)*100)}%`,c:C.light},
        ].map((s,i)=>(
          <div key={i} className="rounded-xl p-4 text-center" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
            <p className="text-2xl font-black" style={{color:s.c}}>{s.val}</p>
            <p className="text-xs uppercase tracking-wider text-slate-600 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${C.dark}50`}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-1 justify-center"
            style={tab===t.id?{background:`linear-gradient(135deg,${C.dark},${C.light}bb)`,color:'#fff'}:{color:'#64748b'}}>
            <t.icon className="w-3.5 h-3.5"/>{t.label}
          </button>
        ))}
      </div>

      {/* INVENTORY TAB */}
      {tab==='inventory'&&(
        <>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"/>
              <Input placeholder="Search by model or serial..." value={search} onChange={e=>setSearch(e.target.value)}
                className="pl-9 bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40" style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:'#fff'}}>
                <SelectValue/>
              </SelectTrigger>
              <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
                {[['all','All'],['svc','Fully Svc'],['unsvc','Has Defects']].map(([v,l])=>
                  <SelectItem key={v} value={v} className="text-white">{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{borderBottom:`1px solid ${C.dark}50`,background:`${C.dark}20`}}>
                    {['S/N','Serial','Type','Model','Qty','Svc','Unsvc','Storage','Location','Organic','Last Cleaned'].map(h=>(
                      <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-widest font-black" style={{color:`${C.light}80`}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody ref={listRef}>
                  {filtered.map((w,i)=>(
                    <tr key={w.id} style={{borderBottom:`1px solid ${C.dark}25`}}
                      onMouseEnter={e=>(e.currentTarget.style.background=`${C.dark}15`)}
                      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                      <td className="px-4 py-3 text-xs text-slate-600 font-mono">{w.id}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-400 font-mono">{w.serialNumber}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{w.type}</td>
                      <td className="px-4 py-3 text-sm font-black text-white">{w.model}</td>
                      <td className="px-4 py-3 text-sm font-bold text-center" style={{color:`${C.light}bb`}}>{w.qty}</td>
                      <td className="px-4 py-3 text-sm font-bold text-center text-green-400">{w.svc}</td>
                      <td className="px-4 py-3 text-sm font-bold text-center" style={{color:w.unsvc>0?C.red:'#334155'}}>{w.unsvc}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{background:w.storage==='Racked & Chained'?'rgba(34,197,94,0.12)':'rgba(245,158,11,0.12)',
                            color:w.storage==='Racked & Chained'?'#22c55e':'#f59e0b',
                            border:`1px solid ${w.storage==='Racked & Chained'?'#22c55e50':'#f59e0b50'}`}}>
                          {w.storage}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{w.location}</td>
                      <td className="px-4 py-3 text-xs text-center">
                        <span className={`font-bold ${w.organic?'text-green-400':'text-slate-600'}`}>{w.organic?'Yes':'No'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{w.lastCleaned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* CHECKLIST TAB */}
      {tab==='checklist'&&(
        <div ref={listRef} className="space-y-4">
          <div className="p-4 rounded-xl" style={{background:`${C.dark}20`,border:`1px solid ${C.dark}50`}}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{color:`${C.light}80`}}>DDSE Armoury Evaluation Checklist</p>
            <p className="text-xs text-slate-500">Per PDF — Evaluation of Armouries & Magazines. Score responses and record remarks.</p>
          </div>
          {ARMOURY_CHECKLIST.map((sec,si)=>(
            <div key={si} className="rounded-2xl overflow-hidden" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
              <button onClick={()=>setOpenSec(openSec===si?null:si)}
                className="w-full flex items-center justify-between px-5 py-4"
                style={{borderBottom:openSec===si?`1px solid ${C.dark}50`:'none',background:`${C.dark}20`}}>
                <span className="font-black text-white text-sm">{sec.section}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{color:`${C.light}70`}}>{sec.items.filter(i=>i.ans).length}/{sec.items.length} ✓</span>
                  {openSec===si?<ChevronDown className="w-4 h-4 text-slate-500"/>:<ChevronRight className="w-4 h-4 text-slate-500"/>}
                </div>
              </button>
              {openSec===si&&(
                <div className="p-4 space-y-2">
                  {sec.items.map((item,ii)=>(
                    <div key={ii} className="flex items-center justify-between p-3 rounded-xl"
                      style={{background:item.ans?'rgba(34,197,94,0.06)':'rgba(255,49,49,0.06)',
                        border:`1px solid ${item.ans?'rgba(34,197,94,0.2)':'rgba(255,49,49,0.2)'}`}}>
                      <p className="text-sm text-slate-300 flex-1 mr-4">{item.q}</p>
                      <span className={`text-xs font-black px-3 py-1 rounded-full ${item.ans?'text-green-400':'text-red-400'}`}
                        style={{background:item.ans?'rgba(34,197,94,0.15)':'rgba(255,49,49,0.15)'}}>
                        {item.ans?'YES':'NO'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {/* Magazine section */}
          <div className="rounded-2xl overflow-hidden" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
            <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:`1px solid ${C.dark}40`,background:`${C.dark}20`}}>
              <span className="font-black text-white text-sm">Magazine Evaluation</span>
              <span className="text-xs" style={{color:`${C.light}70`}}>{MAGAZINE_CHECKLIST.filter(i=>i.ans).length}/{MAGAZINE_CHECKLIST.length} ✓</span>
            </div>
            <div className="p-4 grid md:grid-cols-2 gap-2">
              {MAGAZINE_CHECKLIST.map((item,i)=>(
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg"
                  style={{background:item.ans?'rgba(34,197,94,0.05)':'rgba(255,49,49,0.05)',border:`1px solid ${item.ans?'rgba(34,197,94,0.15)':'rgba(255,49,49,0.15)'}`}}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black ${item.ans?'text-green-400':'text-red-400'}`}
                    style={{background:item.ans?'rgba(34,197,94,0.15)':'rgba(255,49,49,0.15)'}}>
                    {item.ans?'✓':'✗'}
                  </div>
                  <p className="text-xs text-slate-400">{item.q}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DAILY ISSUE BOOK */}
      {tab==='issuebook'&&(
        <div className="space-y-4" ref={listRef}>
          <div className="p-4 rounded-xl" style={{background:`${C.dark}20`,border:`1px solid ${C.dark}50`}}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{color:`${C.light}80`}}>Daily Issue Book</p>
            <p className="text-xs text-slate-500">Records all weapon movement in/out of armoury. Per PDF — confirm movement with Daily Issue Book entries.</p>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{borderBottom:`1px solid ${C.dark}50`,background:`${C.dark}20`}}>
                  {['Issue ID','Weapon','Issued To','Date Issued','Purpose','Date Returned'].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-widest font-black" style={{color:`${C.light}80`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ISSUE_LOG.map(e=>(
                  <tr key={e.id} style={{borderBottom:`1px solid ${C.dark}20`}}
                    onMouseEnter={ev=>(ev.currentTarget.style.background=`${C.dark}15`)}
                    onMouseLeave={ev=>(ev.currentTarget.style.background='transparent')}>
                    <td className="px-4 py-3 text-xs font-mono text-slate-600">{e.id}</td>
                    <td className="px-4 py-3 text-xs font-bold text-white">
                      {weapons.find(w=>w.id===e.weaponId)?.model||e.weaponId}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">{e.issuedTo}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{e.issuedDate}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{e.purpose}</td>
                    <td className="px-4 py-3 text-xs">
                      {e.returnDate
                        ? <span className="text-green-400 font-bold">{e.returnDate} ✓</span>
                        : <span style={{color:C.red}} className="font-bold">Not Returned</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GUARD LOG */}
      {tab==='guardlog'&&(
        <div className="space-y-3" ref={listRef}>
          <div className="p-4 rounded-xl" style={{background:`${C.dark}20`,border:`1px solid ${C.dark}50`}}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{color:`${C.light}80`}}>Armoury Inspection & Guard Log</p>
            <p className="text-xs text-slate-500">Appropriate authorities initial to confirm visits. Per PDF — Armoury Inspection Book requirement.</p>
          </div>
          {GUARD_LOG.map(e=>(
            <div key={e.id} className="p-4 rounded-2xl" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}40`}}>
              <div className="flex items-start justify-between mb-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{background:`${C.light}18`,border:`1px solid ${C.light}30`}}>
                    <Key className="w-4 h-4" style={{color:C.light}}/>
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{e.officer}</p>
                    <p className="text-xs text-slate-600">{e.date} at {e.time}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.3)',color:'#22c55e'}}>
                  ✓ Initiated
                </span>
              </div>
              <p className="text-sm text-slate-400 pl-12">{e.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
