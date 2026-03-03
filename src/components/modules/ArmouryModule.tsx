import { useState } from 'react';
import { Search, Package, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { UserRole } from '../../App';

const C = { red:'#ff3131', dark:'#1800ad', light:'#38b6ff' };
interface Weapon { id:string; serialNumber:string; type:string; model:string; status:'operational'|'maintenance'|'unserviceable'; serviceability:number; location:string; assignedTo?:string; }
const MOCK: Weapon[] = [
  {id:'WPN-001',serialNumber:'SN-78234',type:'Rifle',model:'M4A1',status:'operational',serviceability:95,location:'Armoury A',assignedTo:'Sgt. Miller'},
  {id:'WPN-002',serialNumber:'SN-78235',type:'Rifle',model:'M4A1',status:'operational',serviceability:88,location:'Armoury A',assignedTo:'Cpl. Johnson'},
  {id:'WPN-003',serialNumber:'SN-78236',type:'Pistol',model:'M9',status:'maintenance',serviceability:65,location:'Workshop'},
  {id:'WPN-004',serialNumber:'SN-78237',type:'Machine Gun',model:'M240B',status:'operational',serviceability:92,location:'Armoury B',assignedTo:'Sgt. Davis'},
  {id:'WPN-005',serialNumber:'SN-78238',type:'Rifle',model:'M4A1',status:'unserviceable',serviceability:45,location:'Workshop'},
  {id:'WPN-006',serialNumber:'SN-78239',type:'Sniper Rifle',model:'M24',status:'operational',serviceability:98,location:'Armoury C',assignedTo:'Lt. Wilson'},
];
const svcfg: Record<string,{bg:string;bd:string;tx:string;icon:typeof CheckCircle}> = {
  operational:  {bg:'rgba(34,197,94,0.15)',  bd:'#22c55e',  tx:'#22c55e',  icon:CheckCircle},
  maintenance:  {bg:`${C.light}20`,           bd:C.light,    tx:C.light,    icon:Wrench},
  unserviceable:{bg:`${C.red}20`,             bd:C.red,      tx:C.red,      icon:AlertTriangle},
};

export default function ArmouryModule({ }: { userRole: UserRole|null }) {
  const [data]   = useState(MOCK);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const filtered = data.filter(w=>(filter==='all'||w.status===filter)&&(w.serialNumber.toLowerCase().includes(search.toLowerCase())||w.model.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div><h1 className="text-2xl font-black text-white">Armoury</h1><p className="text-sm text-slate-500 mt-0.5">Weapons and equipment inventory management</p></div>
      <div className="grid grid-cols-3 gap-4">
        {[['Operational',data.filter(w=>w.status==='operational').length,'#22c55e',CheckCircle],
          ['Maintenance',data.filter(w=>w.status==='maintenance').length,C.light,Wrench],
          ['Unserviceable',data.filter(w=>w.status==='unserviceable').length,C.red,AlertTriangle]].map(([l,v,c,Icon],i)=>(
          <div key={i} className="rounded-xl p-4" style={{background:'rgba(4,6,22,0.8)',border:`1px solid ${C.dark}50`}}>
            <div className="flex items-center gap-2 mb-1">
              {/* @ts-ignore */}
              <Icon className="w-4 h-4" style={{color:c}}/>
              <p className="text-xs uppercase tracking-wider text-slate-600">{l}</p>
            </div>
            <p className="text-2xl font-black" style={{color:c as string}}>{v}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"/>
          <Input placeholder="Search by serial or model..." value={search} onChange={e=>setSearch(e.target.value)}
            className="pl-9 bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40" style={{background:'rgba(0,0,0,0.4)',borderColor:`${C.dark}60`,color:'#fff'}}>
            <SelectValue/>
          </SelectTrigger>
          <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
            {[['all','All Status'],['operational','Operational'],['maintenance','Maintenance'],['unserviceable','Unserviceable']].map(([v,l])=>(
              <SelectItem key={v} value={v} className="text-white">{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(w=>{
          const s = svcfg[w.status];
          return (
            <div key={w.id} className="rounded-2xl p-5 transition-all duration-200"
              style={{background:'rgba(4,6,22,0.8)',border:`1px solid ${C.dark}40`}}
              onMouseEnter={e=>(e.currentTarget.style.borderColor=`${C.light}40`)}
              onMouseLeave={e=>(e.currentTarget.style.borderColor=`${C.dark}40`)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Package className="w-4 h-4" style={{color:C.light}}/>
                    <span className="font-black text-white">{w.model}</span>
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-xs text-slate-500">{w.type}</span>
                  </div>
                  <p className="text-xs text-slate-600">{w.serialNumber}</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1"
                  style={{background:s.bg,border:`1px solid ${s.bd}40`,color:s.tx}}>
                  <s.icon className="w-3 h-3"/>{w.status}
                </span>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Serviceability</span>
                  <span className="font-bold" style={{color:w.serviceability>=80?'#22c55e':w.serviceability>=60?'#f59e0b':C.red}}>{w.serviceability}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}>
                  <div className="h-full rounded-full transition-all"
                    style={{width:`${w.serviceability}%`,background:w.serviceability>=80?'#22c55e':w.serviceability>=60?'#f59e0b':C.red}}/>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>📍 {w.location}</span>
                {w.assignedTo&&<span>👤 {w.assignedTo}</span>}
              </div>
              <button onClick={()=>toast.info(`Viewing ${w.id}`)} className="mt-3 w-full py-2 rounded-lg text-xs font-bold transition-all"
                style={{background:`${C.dark}30`,border:`1px solid ${C.dark}60`,color:C.light}}>
                View Record
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
