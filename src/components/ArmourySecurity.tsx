import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, Unlock, Shield, ShieldAlert, Key, Eye, Users, RefreshCw, Terminal, 
  FileText, Activity, AlertOctagon, HelpCircle, HardHat, Info
} from 'lucide-react';
import { toast } from 'sonner';

export default function ArmourySecurity() {
  const [vaultLocked, setVaultLocked] = useState<boolean>(true);
  const [securityStatus, setSecurityStatus] = useState<'SECURE' | 'BREACH_ALERT' | 'PERIMETER_STANDBY'>('SECURE');
  const [scanActive, setScanActive] = useState<boolean>(true);
  const [authorizedOfficer, setAuthorizedOfficer] = useState<string>('');
  const [authDialog, setAuthDialog] = useState<boolean>(false);
  const [securityOverrideCode, setSecurityOverrideCode] = useState('');
  const [accessLogs, setAccessLogs] = useState([
    { id: '1', officer: 'Lieutenant Colonel J. Bello', action: 'ARMOURY_ENTRY', time: '08:42:15', status: 'AUTHORIZED' },
    { id: '2', officer: 'Sergeant S. Ibrahim', action: 'ORBIT_MUNITIONS_CHECK', time: '07:15:30', status: 'AUTHORIZED' },
    { id: '3', officer: 'Corporal A. Hassan', action: 'RIFLE_UNIT_DISPATCH', time: '06:05:12', status: 'AUTHORIZED' },
  ]);

  // Weapons Inventory Database
  const [weapons, setWeapons] = useState([
    { code: 'T-91 AR', name: 'Standard Combat Assault Rifle', qty: 450, max: 500, serviceability: 98, ammoType: '5.56x45mm NATO', type: 'Assault' },
    { code: 'M-24 SWS', name: 'Tactical Precision Sniper Rifle', qty: 40, max: 45, serviceability: 92, ammoType: '7.62x51mm NATO', type: 'Sniper' },
    { code: 'MP-9 SMG', name: 'Close Quarters Defence SMG', qty: 120, max: 120, serviceability: 100, ammoType: '9x19mm Parabellum', type: 'Tactical' },
    { code: 'H-50 GL', name: 'Heavy Grenade Launcher Array', qty: 15, max: 20, serviceability: 84, ammoType: '40mm High Explosive', type: 'Heavy' },
  ]);

  const [ammoDepots, setAmmoDepots] = useState([
    { caliber: '5.56x45mm NATO', rounds: 145000, max: 150000, status: 'NOMINAL' },
    { caliber: '7.62x51mm NATO', rounds: 82000, max: 90000, status: 'NOMINAL' },
    { caliber: '9x19mm Parabellum', rounds: 42000, max: 50000, status: 'REPLENISH_REQ' },
    { caliber: '.50 BMG Anti-Material', rounds: 12000, max: 15000, status: 'NOMINAL' },
  ]);

  // Periodic sensor fluctuations
  useEffect(() => {
    const timer = setInterval(() => {
      if (scanActive) {
        setAmmoDepots((prev) =>
          prev.map((ammo) => {
            const drift = Math.floor(Math.random() * 20) - 10;
            return {
              ...ammo,
              rounds: Math.min(ammo.max, Math.max(1000, ammo.rounds + drift)),
            };
          })
        );
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [scanActive]);

  const triggerSecurePerimeterFlush = () => {
    setAuthDialog(true);
  };

  const handleSecurityOverride = () => {
    if (securityOverrideCode === '54321' || securityOverrideCode === '') {
      setVaultLocked(!vaultLocked);
      setAuthDialog(false);
      setSecurityOverrideCode('');
      
      const newLog = {
        id: String(Date.now()),
        officer: 'Platform Commander (OVERRIDE)',
        action: vaultLocked ? 'SECURE_VAULT_DECRYPT' : 'SECURE_VAULT_LOCKDOWN',
        time: new Date().toTimeString().split(' ')[0],
        status: 'SUPER_USER_AUTH',
      };
      setAccessLogs((prev) => [newLog, ...prev]);
      
      toast.success(vaultLocked ? 'SECURE VAULT DOOR DISENGAGED' : 'VAULT SECURED - PERIMETER LOCKED');
    } else {
      setSecurityStatus('BREACH_ALERT');
      toast.error('ACCESS RESTRICTED. TACTICAL BREACH PROTOCOL INITIATED.');
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-12 font-sans text-white">
      {/* ── VAULT CONTROL PANEL (XL: 4 COLS) ── */}
      <div className="xl:col-span-4 space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden shadow-2xl">
          {/* Steel Texture HUD visual design */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 to-slate-950/50 pointer-events-none"></div>
          
          <div className="flex items-center justify-between border-b border-slate-900 pb-4">
            <h3 className="text-sm font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
              <Shield className="h-5 w-5 text-sky-400" />
              VAULT SECURITY MAIN DECK
            </h3>
            <span className={`h-2.5 w-2.5 rounded-full ${securityStatus === 'SECURE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-ping'}`}></span>
          </div>

          {/* Secure Vault Locker HUD */}
          <div className="mt-8 flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-900 bg-slate-950 relative overflow-hidden">
            {scanActive && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="h-0.5 bg-sky-400/25 animate-scan-line"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(56,182,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px]"></div>
              </div>
            )}

            <div className={`relative flex h-24 w-24 items-center justify-center rounded-full border-2 ${
              vaultLocked ? 'border-rose-500/40 bg-rose-500/10 text-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
            } transition-all duration-500`}>
              {vaultLocked ? <Lock className="h-10 w-10" /> : <Unlock className="h-10 w-10 animate-bounce" />}
            </div>

            <div className="mt-6 text-center font-mono space-y-1 relative z-10">
              <p className="text-[10px] text-slate-500 uppercase">INFRASTRUCTURE POSTURE</p>
              <h4 className={`text-lg font-black ${vaultLocked ? 'text-rose-400' : 'text-emerald-400'}`}>
                {vaultLocked ? 'SECURE LOCKDOWN ACTIVE' : 'VAULT OPEN - STANDBY'}
              </h4>
              <p className="text-[9px] text-slate-400">BIOMETRIC GRID LINK: SECURED</p>
            </div>

            <button
              onClick={triggerSecurePerimeterFlush}
              className={`w-full mt-6 rounded-xl border py-3 text-xs font-black uppercase tracking-widest transition-all ${
                vaultLocked 
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20' 
                  : 'border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
              }`}
              type="button"
            >
              {vaultLocked ? 'AUTHORIZE VAULT RELEASE' : 'ENGAGE SECURE LOCKDOWN'}
            </button>
          </div>

          <div className="mt-6 text-xs text-slate-500 font-mono space-y-2 border-t border-slate-900 pt-4">
            <div className="flex justify-between">
              <span>ACTIVE PERIMETER DEFENCE:</span>
              <span className="text-white font-bold">LASER GRID ON</span>
            </div>
            <div className="flex justify-between">
              <span>Watchtower Guard Posture:</span>
              <span className="text-white font-bold">INTERCEPT Posture</span>
            </div>
            <div className="flex justify-between">
              <span>Sentry Terminal Uplink:</span>
              <span className="text-emerald-400">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Live Security Watchtowers & Guard Deployment */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
          <h3 className="text-sm font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-400" />
            Watchtower Sentry Matrix
          </h3>

          <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-center">
            {['Tower North', 'Tower South', 'Sentry Post A', 'Biometric Gate'].map((post, i) => (
              <div key={post} className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase">{post}</span>
                <span className="text-xs font-bold text-white block uppercase">DEPLOYED</span>
                <span className="text-[9px] text-emerald-400 block font-bold border border-emerald-500/10 rounded bg-emerald-500/5 py-0.5">
                  SECURE LINK
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ARMS & WEAPONS VAULT MONITOR (XL: 8 COLS) ── */}
      <div className="xl:col-span-8 space-y-6">
        {/* Asset Inventory Grid */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
          <div className="flex justify-between items-center pb-4 border-b border-slate-900">
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">SECURE ARMOURY INVENTORY</h3>
              <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">MAIN CLASSIFICATION DIRECTORY</p>
            </div>
            <button
              onClick={() => setScanActive(!scanActive)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                scanActive ? 'border-sky-500/30 bg-sky-500/10 text-sky-300' : 'border-slate-800 bg-slate-900/60 text-slate-400'
              }`}
              type="button"
            >
              {scanActive ? 'PAUSE LIVE SCAN' : 'RESUME SCAN'}
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {weapons.map((w) => {
              const capPercent = Math.round((w.qty / w.max) * 100);
              return (
                <div key={w.code} className="rounded-2xl border border-slate-900 bg-slate-950 p-5 relative overflow-hidden group hover:border-sky-500/20 transition-all duration-300">
                  <div className="absolute top-4 right-4 text-[9px] font-mono font-bold text-sky-400 border border-sky-400/20 px-2 py-0.5 rounded">
                    {w.type.toUpperCase()}
                  </div>

                  <span className="text-xs font-mono font-black text-slate-500">{w.code}</span>
                  <h4 className="text-sm font-black text-white mt-1 uppercase tracking-wide">{w.name}</h4>

                  {/* Telemetry levels */}
                  <div className="mt-4 space-y-3 font-mono text-[10px] text-slate-400">
                    <div>
                      <div className="flex justify-between">
                        <span>STOCK QUANTITY:</span>
                        <span className="text-white font-bold">{w.qty} / {w.max} ({capPercent}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-sky-400 to-sky-600 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${capPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between">
                        <span>SERVICEABILITY post:</span>
                        <span className={`font-bold ${w.serviceability >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{w.serviceability}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-500 ${w.serviceability >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${w.serviceability}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between text-[9px] border-t border-slate-900 pt-2 text-slate-500">
                      <span>MUNITIONS CALIBER: {w.ammoType}</span>
                      <span>SECURE COMPARTMENT</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ammunition Telemetry Levels */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">MUNITIONS RESERVE TELEMETRY</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ammoDepots.map((ammo) => {
              const fillPercent = Math.round((ammo.rounds / ammo.max) * 100);
              return (
                <div key={ammo.caliber} className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-3 font-mono text-center relative overflow-hidden">
                  <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{ammo.caliber.split(' ')[0]}</p>
                  
                  <div className="relative h-20 flex items-center justify-center">
                    {/* Immersive vertical loading cylinder */}
                    <div className="w-8 h-16 border border-slate-800 rounded bg-slate-900 relative overflow-hidden">
                      <div 
                        className={`absolute bottom-0 inset-x-0 transition-all duration-1000 ${
                          ammo.status === 'NOMINAL' ? 'bg-sky-500/40' : 'bg-amber-500/40'
                        }`}
                        style={{ height: `${fillPercent}%` }}
                      ></div>
                    </div>
                    <span className="absolute text-xs font-black text-white">{fillPercent}%</span>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-white block">{ammo.rounds.toLocaleString()}</span>
                    <span className="text-[8px] text-slate-500 block">TOTAL ROUNDS</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Armoury Access Logs (Classified tables with tactical hovers) */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Biometric Vault Access Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500">
                  <th className="pb-3 uppercase">Officer / Identity</th>
                  <th className="pb-3 uppercase">Action Log</th>
                  <th className="pb-3 uppercase">Timestamp</th>
                  <th className="pb-3 uppercase text-right">Biometric Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {accessLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-sky-500/5 transition-all group">
                    <td className="py-4 text-white font-bold uppercase tracking-wide group-hover:text-sky-300">{log.officer}</td>
                    <td className="py-4 text-slate-400 uppercase">{log.action}</td>
                    <td className="py-4 text-slate-500">{log.time}</td>
                    <td className="py-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase ${
                        log.status === 'AUTHORIZED' || log.status === 'SUPER_USER_AUTH'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/15'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── SECURITY DIALOG MODAL OVERLAYS ── */}
      <AnimatePresence>
        {authDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4"
            >
              <div className="text-center space-y-2">
                <div className="mx-auto h-12 w-12 rounded-2xl border border-sky-400/20 bg-sky-500/10 flex items-center justify-center text-sky-400">
                  <Key className="h-6 w-6 animate-pulse" />
                </div>
                <h4 className="text-lg font-black uppercase text-white tracking-wider">COMMAND SECURITY OVERRIDE</h4>
                <p className="text-xs text-slate-400 font-mono">Vault release requires commander decryption authorization key.</p>
              </div>

              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="Enter crypto override code..."
                  value={securityOverrideCode}
                  onChange={(e) => setSecurityOverrideCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/60 py-3 text-center text-sm text-white font-mono outline-none focus:border-sky-500/30"
                />
                <p className="text-[10px] text-slate-500 text-center font-mono uppercase">BYPASS CODE: press submit directly or enter 54321</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setAuthDialog(false)}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900/40 py-2.5 text-xs font-black uppercase text-slate-400 hover:text-white transition"
                  type="button"
                >
                  CANCEL_BYPASS
                </button>
                <button
                  onClick={handleSecurityOverride}
                  className="flex-1 rounded-xl bg-gradient-to-b from-sky-400 to-sky-600 py-2.5 text-xs font-black uppercase text-slate-950 shadow-[0_0_15px_rgba(56,182,255,0.4)]"
                  type="button"
                >
                  SUBMIT_KEY
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
