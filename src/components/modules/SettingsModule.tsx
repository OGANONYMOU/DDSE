import { useState } from 'react';
import { Users, Shield, Bell, Lock, Smartphone, UserPlus, UserX, CheckCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { UserRole } from '../../App';

const C = { red: '#ff3131', dark: '#1800ad', light: '#38b6ff' };

const USERS = [
  {id:'USR-001',fullName:'Major James Okafor',appointment:'DSE-78432',rank:'Major',directorate:'Standard & Evaluation',role:'super_admin',status:'active',lastLogin:'2026-01-23 14:30'},
  {id:'USR-002',fullName:'Captain Amaka Nwosu',appointment:'DSM-78433',rank:'Captain',directorate:'Safety & Manual',role:'evaluator',status:'active',lastLogin:'2026-01-23 10:15'},
  {id:'USR-003',fullName:'Lieutenant Emeka Adeyemi',appointment:'DPM-78434',rank:'Lieutenant',directorate:'Project Monitoring',role:'directorate_officer',status:'pending'},
  {id:'USR-004',fullName:'Sergeant Chioma Eze',appointment:'DSE-78435',rank:'Sergeant',directorate:'Standard & Evaluation',role:'evaluator',status:'active',lastLogin:'2026-01-22 16:45'},
  {id:'USR-005',fullName:'Colonel Ibrahim Aliyu',appointment:'DSE-78436',rank:'Colonel',directorate:'Standard & Evaluation',role:'directorate_officer',status:'suspended',lastLogin:'2026-01-15 09:00'},
];

const roleLabel: Record<string,string> = {super_admin:'Super Admin',evaluator:'Evaluator',directorate_officer:'Dir. Officer'};
const statusCfg: Record<string,{bg:string;bd:string;tx:string}> = {
  active:   {bg:'rgba(34,197,94,0.15)',  bd:'#22c55e50',tx:'#22c55e'},
  pending:  {bg:`${C.light}20`,          bd:`${C.light}50`,tx:C.light},
  suspended:{bg:`${C.red}18`,            bd:`${C.red}50`,  tx:C.red},
};
const roleCfg: Record<string,string> = {super_admin:C.red,evaluator:C.light,directorate_officer:'#a855f7'};

export default function SettingsModule({ userRole }: { userRole: UserRole|null }) {
  const [tab, setTab]         = useState<'users'|'security'|'notifications'>('users');
  const [notifs, setNotifs]   = useState({ email:true, sms:true, desktop:false, riskAlerts:true });
  const [security, setSec]    = useState({ twoFactor:true, sessionTimeout:'30' });
  const [showPwd, setShowPwd] = useState(false);

  const tabs = [
    {id:'users'        as const, label:'User Management', icon:Users},
    {id:'security'     as const, label:'Security',        icon:Shield},
    {id:'notifications'as const, label:'Notifications',   icon:Bell},
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div><h1 className="text-2xl font-black text-[#f1f5f9]">Settings</h1><p className="text-sm text-[#475569] mt-0.5">System configuration and management</p></div>

      {/* Tab bar */}
      <div className="flex gap-2 p-1 rounded-xl w-fit" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
            style={tab===t.id?{
              background:`linear-gradient(135deg,${C.dark},${C.light}bb)`,color:'#fff',
              boxShadow:`0 4px 18px ${C.dark}80`
            }:{color:'#64748b'}}>
            <t.icon className="w-3.5 h-3.5"/>{t.label}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab==='users'&&(
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#f1f5f9]">{USERS.length} registered users</p>
            <button onClick={()=>toast.info('Opening invite form...')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{background:`${C.dark}40`,border:`1px solid ${C.dark}70`,color:C.light}}>
              <UserPlus className="w-4 h-4"/>Invite User
            </button>
          </div>
          {USERS.map(u=>(
            <div key={u.id} className="rounded-2xl p-5 transition-all duration-200"
              style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}40`}}
              onMouseEnter={e=>(e.currentTarget.style.borderColor=`${C.light}40`)}
              onMouseLeave={e=>(e.currentTarget.style.borderColor=`${C.dark}40`)}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-[#f1f5f9] text-sm flex-shrink-0"
                  style={{background:`${roleCfg[u.role]}25`,border:`2px solid ${roleCfg[u.role]}50`}}>
                  {u.fullName.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-[#f1f5f9] text-sm">{u.fullName}</p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{background:`${roleCfg[u.role]}20`,border:`1px solid ${roleCfg[u.role]}40`,color:roleCfg[u.role]}}>
                      {roleLabel[u.role]}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{background:statusCfg[u.status].bg,border:statusCfg[u.status].bd,color:statusCfg[u.status].tx}}>
                      {u.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#334155] mt-0.5">{u.appointment} · {u.rank} · {u.directorate}</p>
                  {u.lastLogin&&<p className="text-xs text-slate-700 mt-0.5">Last login: {u.lastLogin}</p>}
                </div>
                <div className="flex gap-2">
                  {u.status==='pending'&&(
                    <button onClick={()=>toast.success(`${u.fullName} approved`)}
                      className="p-2 rounded-lg transition-all" style={{background:'rgba(34,197,94,0.15)',border:'1px solid #22c55e40'}}>
                      <CheckCircle className="w-4 h-4 text-emerald-400"/>
                    </button>
                  )}
                  {u.status==='active'&&(
                    <button onClick={()=>toast.info(`${u.fullName} suspended`)}
                      className="p-2 rounded-lg transition-all" style={{background:`${C.red}15`,border:`1px solid ${C.red}30`}}>
                      <UserX className="w-4 h-4" style={{color:C.red}}/>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security tab */}
      {tab==='security'&&(
        <div className="space-y-4">
          {[
            {key:'twoFactor',label:'Two-Factor Authentication',desc:'Require OTP for all logins',icon:Smartphone,val:security.twoFactor,toggle:()=>setSec(s=>({...s,twoFactor:!s.twoFactor}))},
          ].map(s=>(
            <div key={s.key} className="flex items-center justify-between p-5 rounded-2xl"
              style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{background:`${C.dark}40`,border:`1px solid ${C.dark}70`}}>
                  <s.icon className="w-4 h-4" style={{color:C.light}}/>
                </div>
                <div>
                  <p className="font-semibold text-[#f1f5f9] text-sm">{s.label}</p>
                  <p className="text-xs text-[#334155]">{s.desc}</p>
                </div>
              </div>
              <Switch checked={s.val} onCheckedChange={s.toggle}/>
            </div>
          ))}
          <div className="p-5 rounded-2xl space-y-4" style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
            <p className="font-semibold text-[#f1f5f9] text-sm flex items-center gap-2">
              <Lock className="w-4 h-4" style={{color:C.light}}/>Change System Password
            </p>
            {['Current Password','New Password','Confirm Password'].map((l,i)=>(
              <div key={i}>
                <label className="text-xs text-[#334155] mb-1.5 block uppercase tracking-wider">{l}</label>
                <div className="relative">
                  <Input type={showPwd?'text':'password'} placeholder={`Enter ${l.toLowerCase()}`}
                    className="pr-10 bg-black/40 border-slate-800 text-[#f1f5f9] placeholder:text-slate-700"/>
                  <button type="button" onClick={()=>setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#334155] hover:text-[#f1f5f9]">
                    {showPwd?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>
            ))}
            <Button onClick={()=>toast.success('Password updated')} className="text-[#f1f5f9] font-bold"
              style={{background:`linear-gradient(135deg,${C.dark},${C.light}cc)`}}>
              Update Password
            </Button>
          </div>
        </div>
      )}

      {/* Notifications tab */}
      {tab==='notifications'&&(
        <div className="space-y-3">
          {[
            {key:'email',label:'Email Notifications',desc:'Receive updates via email',icon:Bell},
            {key:'sms',label:'SMS Alerts',desc:'Critical alerts sent to your phone',icon:Smartphone},
            {key:'desktop',label:'Desktop Notifications',desc:'Browser push notifications',icon:Bell},
            {key:'riskAlerts',label:'Risk Alerts',desc:'Immediate alerts for high-risk events',icon:Shield},
          ].map(n=>(
            <div key={n.key} className="flex items-center justify-between p-5 rounded-2xl"
              style={{background:'rgba(4,6,22,0.85)',border:`1px solid ${C.dark}50`}}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{background:`${C.dark}40`,border:`1px solid ${C.dark}70`}}>
                  <n.icon className="w-4 h-4" style={{color:C.light}}/>
                </div>
                <div>
                  <p className="font-semibold text-[#f1f5f9] text-sm">{n.label}</p>
                  <p className="text-xs text-[#334155]">{n.desc}</p>
                </div>
              </div>
              <Switch checked={notifs[n.key as keyof typeof notifs]}
                onCheckedChange={v=>setNotifs(o=>({...o,[n.key]:v}))}/>
            </div>
          ))}
          <Button onClick={()=>toast.success('Notification preferences saved')} className="text-[#f1f5f9] font-bold"
            style={{background:`linear-gradient(135deg,${C.dark},${C.light}cc)`}}>
            Save Preferences
          </Button>
        </div>
      )}
    </div>
  );
}
