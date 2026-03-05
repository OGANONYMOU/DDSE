import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Plus, Search, Calendar, CheckCircle, Clock, User,
  Trash2, Layers, MoreHorizontal, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { UserRole } from '../../App';

const C = { red: '#ff3131', dark: '#1800ad', light: '#38b6ff' };

interface Task {
  id: string; title: string; description: string; assignee: string;
  directorate: string; priority: 'low'|'medium'|'high'|'critical';
  status: 'todo'|'in_progress'|'review'|'done';
  dueDate: string; tags: string[]; progress: number;
}

const INIT: Task[] = [
  { id:'TSK-001', title:'Q1 Standards Evaluation', description:'Full evaluation of all facilities against DSE standards for Q1 2026.', assignee:'Maj. Okafor', directorate:'Standard & Evaluation', priority:'high', status:'in_progress', dueDate:'2026-03-15', tags:['Evaluation','DSE'], progress:65 },
  { id:'TSK-002', title:'Update Safety Manual Chapter 4', description:'Revise chemical handling procedures following new NAFDAC regulations.', assignee:'Capt. Nwosu', directorate:'Safety & Manual', priority:'critical', status:'todo', dueDate:'2026-03-08', tags:['Safety','Documentation'], progress:0 },
  { id:'TSK-003', title:'Project Milestone Review — PRJ-001', description:'Review Phase 3 installation milestones and update project status board.', assignee:'Lt. Adeyemi', directorate:'Project Monitoring', priority:'medium', status:'review', dueDate:'2026-03-20', tags:['Projects','Review'], progress:90 },
  { id:'TSK-004', title:'Armoury Serviceability Report', description:'Compile monthly serviceability report for all weapons inventory.', assignee:'Sgt. Eze', directorate:'Standard & Evaluation', priority:'medium', status:'done', dueDate:'2026-02-28', tags:['Armoury','Report'], progress:100 },
  { id:'TSK-005', title:'Emergency Lighting Inspection', description:'Verify all emergency lighting systems across all facility blocks.', assignee:'Maj. Okafor', directorate:'Safety & Manual', priority:'high', status:'in_progress', dueDate:'2026-03-10', tags:['Safety','Inspection'], progress:45 },
  { id:'TSK-006', title:'Fleet Modernization Phase 3 Brief', description:'Prepare briefing document for fleet modernization phase 3 commencement.', assignee:'Col. Aliyu', directorate:'Project Monitoring', priority:'low', status:'todo', dueDate:'2026-04-01', tags:['Projects','Brief'], progress:0 },
];

const P_CFG = {
  low:      { bg:`${C.light}15`, bd:`${C.light}40`, tx:C.light },
  medium:   { bg:'rgba(245,158,11,0.12)', bd:'#f59e0b50', tx:'#f59e0b' },
  high:     { bg:`${C.red}15`,   bd:`${C.red}40`,   tx:C.red },
  critical: { bg:`${C.red}28`,   bd:`${C.red}60`,   tx:'#ff6060' },
};
const S_CFG = {
  todo:        { bg:'rgba(100,116,139,0.12)', bd:'#64748b40', tx:'#94a3b8', label:'To Do' },
  in_progress: { bg:`${C.dark}25`, bd:`${C.dark}60`, tx:C.light, label:'In Progress' },
  review:      { bg:'rgba(245,158,11,0.12)', bd:'#f59e0b50', tx:'#f59e0b', label:'In Review' },
  done:        { bg:'rgba(34,197,94,0.12)',  bd:'#22c55e50', tx:'#22c55e', label:'Done' },
};
const DIRS = ['Standard & Evaluation','Safety & Manual','Project Monitoring'];
const COLS: {id:Task['status'];label:string}[] = [
  {id:'todo',label:'To Do'},{id:'in_progress',label:'In Progress'},
  {id:'review',label:'In Review'},{id:'done',label:'Done'},
];

export default function TasksModule({ userRole }: { userRole: UserRole|null }) {
  const [tasks,setTasks] = useState<Task[]>(INIT);
  const [viewMode,setVM] = useState<'list'|'kanban'>('list');
  const [search,setSrch] = useState('');
  const [filter,setFilt] = useState('all');
  const [open,setOpen]   = useState(false);
  const [form,setForm]   = useState({title:'',description:'',assignee:'',directorate:'',priority:'medium',dueDate:'',tags:''});
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    if(!listRef.current) return;
    gsap.fromTo(Array.from(listRef.current.children),
      {y:20,opacity:0},{y:0,opacity:1,duration:0.35,stagger:0.05,ease:'power2.out'});
  },[viewMode,filter,search]);

  const filtered = tasks.filter(t =>
    (filter==='all'||t.status===filter) &&
    (t.title.toLowerCase().includes(search.toLowerCase())||t.assignee.toLowerCase().includes(search.toLowerCase()))
  );

  const create = () => {
    if(!form.title||!form.directorate){toast.error('Title and directorate required');return;}
    setTasks(p=>[{
      id:`TSK-${String(p.length+1).padStart(3,'0')}`,title:form.title,description:form.description,
      assignee:form.assignee||'Unassigned',directorate:form.directorate,
      priority:form.priority as Task['priority'],status:'todo',
      dueDate:form.dueDate||'2026-12-31',
      tags:form.tags?form.tags.split(',').map(t=>t.trim()):[],progress:0,
    },...p]);
    toast.success('Task created'); setOpen(false);
    setForm({title:'',description:'',assignee:'',directorate:'',priority:'medium',dueDate:'',tags:''});
  };

  const moveTask = (id:string,status:Task['status'])=>{
    setTasks(p=>p.map(t=>t.id===id?{...t,status,progress:status==='done'?100:t.progress}:t));
    toast.success(`Moved to ${S_CFG[status].label}`);
  };

  const del = (id:string)=>{setTasks(p=>p.filter(t=>t.id!==id));toast.info('Task removed');};

  const Card = ({bg='rgba(4,6,22,0.85)',bd=`${C.dark}40`,...rest}:{bg?:string,bd?:string,[k:string]:any}) => (
    <div className="rounded-2xl p-5 transition-all duration-200"
      style={{background:bg,border:`1px solid ${bd}`,...rest.style}}
      onMouseEnter={e=>(e.currentTarget.style.borderColor=`${C.light}40`)}
      onMouseLeave={e=>(e.currentTarget.style.borderColor=bd)}
      {...rest}/>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Tasks & Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">Assign, track and close operational tasks</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-xl p-1" style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${C.dark}50`}}>
            {(['list','kanban'] as const).map(v=>(
              <button key={v} onClick={()=>setVM(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={viewMode===v?{background:`linear-gradient(135deg,${C.dark},${C.light}bb)`,color:'#fff'}:{color:'#64748b'}}>
                {v==='list'?'☰ List':'⊞ Board'}
              </button>
            ))}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="font-bold text-white text-sm"
                style={{background:`linear-gradient(135deg,${C.dark},${C.light}cc)`,boxShadow:`0 4px 18px ${C.dark}80`}}>
                <Plus className="w-4 h-4 mr-2"/>New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg" style={{background:'#060818',border:`1px solid ${C.dark}60`}}>
              <DialogHeader><DialogTitle className="text-white font-black">Create Task</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  {[['title','Title *','Task title...'],['assignee','Assignee','e.g. Maj. Okafor']].map(([k,l,p])=>(
                    <div key={k} className={k==='title'?'col-span-2':''}>
                      <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">{l}</label>
                      <Input value={form[k as keyof typeof form]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={p}
                        className="bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Priority</label>
                    <Select value={form.priority} onValueChange={v=>setForm({...form,priority:v})}>
                      <SelectTrigger style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:'#fff'}}>
                        <SelectValue/>
                      </SelectTrigger>
                      <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
                        {['low','medium','high','critical'].map(p=>(
                          <SelectItem key={p} value={p} className="text-white capitalize">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Due Date</label>
                    <Input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}
                      className="bg-black/40 border-slate-800 text-white"/>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Directorate *</label>
                    <Select value={form.directorate} onValueChange={v=>setForm({...form,directorate:v})}>
                      <SelectTrigger style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:form.directorate?'#fff':'#6b7280'}}>
                        <SelectValue placeholder="Select directorate"/>
                      </SelectTrigger>
                      <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
                        {DIRS.map(d=><SelectItem key={d} value={d} className="text-white">{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Description</label>
                    <Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
                      placeholder="Describe the task..." className="bg-black/40 border-slate-800 text-white placeholder:text-slate-700 min-h-[70px]"/>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Tags (comma-separated)</label>
                    <Input value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} placeholder="Safety, Review, DSE..."
                      className="bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={()=>setOpen(false)} className="flex-1 border-slate-700 text-slate-300">Cancel</Button>
                  <Button onClick={create} className="flex-1 text-white font-bold"
                    style={{background:`linear-gradient(135deg,${C.dark},${C.light}cc)`}}>Create Task</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{label:'Total',val:tasks.length,c:'#f1f5f9'},
          {label:'In Progress',val:tasks.filter(t=>t.status==='in_progress').length,c:C.light},
          {label:'In Review',val:tasks.filter(t=>t.status==='review').length,c:'#f59e0b'},
          {label:'Done',val:tasks.filter(t=>t.status==='done').length,c:'#22c55e'},
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
          <Input placeholder="Search tasks…" value={search} onChange={e=>setSrch(e.target.value)}
            className="pl-9 bg-black/40 border-slate-800 text-white placeholder:text-slate-700"/>
        </div>
        <Select value={filter} onValueChange={setFilt}>
          <SelectTrigger className="w-40" style={{background:'rgba(0,0,0,0.5)',borderColor:`${C.dark}60`,color:'#fff'}}>
            <SelectValue/>
          </SelectTrigger>
          <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
            {[['all','All Status'],['todo','To Do'],['in_progress','In Progress'],['review','In Review'],['done','Done']].map(([v,l])=>(
              <SelectItem key={v} value={v} className="text-white">{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* LIST VIEW */}
      {viewMode==='list'&&(
        <div ref={listRef} className="space-y-3">
          {filtered.map(task=>{
            const pc=P_CFG[task.priority]; const sc=S_CFG[task.status];
            return (
              <div key={task.id} className="rounded-2xl p-5 transition-all duration-200"
                style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}40`}}
                onMouseEnter={e=>(e.currentTarget.style.borderColor=`${C.light}40`)}
                onMouseLeave={e=>(e.currentTarget.style.borderColor=`${C.dark}40`)}>
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-mono text-slate-600">{task.id}</span>
                      <span className="text-base font-black text-white">{task.title}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{background:pc.bg,border:`1px solid ${pc.bd}`,color:pc.tx}}>
                        <Flag className="w-2.5 h-2.5 inline mr-1"/>{task.priority}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{background:sc.bg,border:`1px solid ${sc.bd}`,color:sc.tx}}>{sc.label}</span>
                    </div>
                    <p className="text-sm text-slate-400 mb-2 line-clamp-1">{task.description}</p>
                    {task.status!=='todo'&&(
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600">Progress</span>
                          <span style={{color:task.progress===100?'#22c55e':C.light}}>{task.progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}>
                          <div className="h-full rounded-full transition-all"
                            style={{width:`${task.progress}%`,background:`linear-gradient(90deg,${C.dark},${C.light})`}}/>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5"/>{task.assignee}</span>
                      <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5"/>{task.directorate}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/>Due: {task.dueDate}</span>
                    </div>
                    {task.tags.length>0&&(
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {task.tags.map(tag=>(
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{background:`${C.dark}25`,border:`1px solid ${C.dark}50`,color:`${C.light}bb`}}>#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Select value={task.status} onValueChange={v=>moveTask(task.id,v as Task['status'])}>
                      <SelectTrigger className="w-32 text-xs h-8" style={{background:'rgba(0,0,0,0.4)',borderColor:`${C.dark}60`,color:'#fff'}}>
                        <SelectValue/>
                      </SelectTrigger>
                      <SelectContent style={{background:'#060818',borderColor:`${C.dark}60`}}>
                        {COLS.map(col=>(
                          <SelectItem key={col.id} value={col.id} className="text-white text-xs">{col.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button onClick={()=>del(task.id)}
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
              <Layers className="w-10 h-10 mx-auto mb-3 opacity-30"/>
              <p className="font-semibold">No tasks found</p>
            </div>
          )}
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode==='kanban'&&(
        <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLS.map(col=>{
            const colTasks=tasks.filter(t=>t.status===col.id);
            const sc=S_CFG[col.id];
            return (
              <div key={col.id} className="rounded-2xl overflow-hidden"
                style={{background:'rgba(4,6,22,0.6)',border:`1px solid ${C.dark}40`}}>
                <div className="px-4 py-3 flex items-center justify-between"
                  style={{borderBottom:`1px solid ${C.dark}40`,background:`${C.dark}20`}}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{background:sc.tx}}/>
                    <span className="text-xs font-bold" style={{color:sc.tx}}>{col.label}</span>
                  </div>
                  <span className="text-xs font-black rounded-full px-2 py-0.5"
                    style={{background:`${C.dark}40`,color:C.light}}>{colTasks.length}</span>
                </div>
                <div className="p-3 space-y-3 min-h-[200px]">
                  {colTasks.map(task=>{
                    const pc=P_CFG[task.priority];
                    return (
                      <div key={task.id} className="rounded-xl p-3 transition-all duration-200"
                        style={{background:'rgba(4,6,22,0.92)',border:`1px solid ${C.dark}50`}}
                        onMouseEnter={e=>(e.currentTarget.style.borderColor=`${C.light}40`)}
                        onMouseLeave={e=>(e.currentTarget.style.borderColor=`${C.dark}50`)}>
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <span className="text-xs font-black text-white leading-snug flex-1">{task.title}</span>
                          <div className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
                            style={{background:pc.tx,boxShadow:`0 0 6px ${pc.tx}`}}/>
                        </div>
                        {task.status!=='todo'&&(
                          <div className="h-1 rounded-full overflow-hidden mb-2"
                            style={{background:'rgba(255,255,255,0.06)'}}>
                            <div className="h-full rounded-full"
                              style={{width:`${task.progress}%`,background:`linear-gradient(90deg,${C.dark},${C.light})`}}/>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-slate-600">
                          <span>{task.assignee}</span>
                          <span style={{color:`${C.light}70`}}>{task.dueDate}</span>
                        </div>
                      </div>
                    );
                  })}
                  {colTasks.length===0&&<div className="text-center py-8 text-slate-700 text-xs">Drop tasks here</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
