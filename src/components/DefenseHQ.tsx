import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, ShieldAlert, ShieldCheck, Crosshair, Radar, Globe, Radio, Cpu, 
  Layers, UserCheck, AlertTriangle, Play, Pause, ChevronRight, Activity, Zap
} from 'lucide-react';

interface DefenseHQProps {
  user: {
    fullName: string;
    rankCode?: string;
    roleCode: string;
    directorateCode: string;
  };
  metrics: Array<{ key: string; label: string; value: number; trend: string; tone: string }>;
  recentActivity: Array<{ id: string; action: string; entityType: string; createdAt: number; actorRoleCode?: string }>;
  alerts: Array<{ id: string; title: string; severity: string; moduleCode: string }>;
}

export default function DefenseHQ({ user, metrics, recentActivity, alerts }: DefenseHQProps) {
  const [defcon, setDefcon] = useState<number>(3);
  const [activeSector, setActiveSector] = useState<string>('SECTOR_BRAVO');
  const [droneZoom, setDroneZoom] = useState<number>(1.5);
  const [droneScanning, setDroneScanning] = useState<boolean>(true);
  const [satelliteCoords, setSatelliteCoords] = useState({ lat: '09°04\'21" N', lng: '07°29\'01" E' });
  const [systemUptime, setSystemUptime] = useState<string>('00:00:00');

  // Realistic coordinate drift for telemetry effect
  useEffect(() => {
    const timer = setInterval(() => {
      const latMin = Math.floor(Math.random() * 60);
      const latSec = Math.floor(Math.random() * 60);
      const lngMin = Math.floor(Math.random() * 60);
      const lngSec = Math.floor(Math.random() * 60);
      setSatelliteCoords({
        lat: `09°${latMin.toString().padStart(2, '0')}'${latSec.toString().padStart(2, '0')}" N`,
        lng: `07°${lngMin.toString().padStart(2, '0')}'${lngSec.toString().padStart(2, '0')}" E`,
      });
    }, 4000);

    const start = Date.now();
    const uptimeTimer = setInterval(() => {
      const diff = Date.now() - start;
      const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setSystemUptime(`${hours}:${mins}:${secs}`);
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(uptimeTimer);
    };
  }, []);

  const sectors = {
    SECTOR_ALPHA: { name: 'Sector Alpha (Training Command)', status: 'Optimal', readiness: 94, alert: 'Normal' },
    SECTOR_BRAVO: { name: 'Sector Bravo (Central Armoury)', status: 'Guarded', readiness: 87, alert: 'Standby' },
    SECTOR_CHARLIE: { name: 'Sector Charlie (Strategic Engineering)', status: 'Active', readiness: 91, alert: 'Normal' },
    SECTOR_DELTA: { name: 'Sector Delta (Hazard Containment)', status: 'Warning', readiness: 68, alert: 'High Risk' },
  };

  const getDefconColor = (level: number) => {
    switch (level) {
      case 5: return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
      case 4: return 'text-sky-400 border-sky-500/30 bg-sky-500/5';
      case 3: return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
      case 2: return 'text-orange-400 border-orange-500/30 bg-orange-500/5';
      case 1: return 'text-rose-500 border-rose-500/40 bg-rose-500/10 animate-pulse';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      {/* ── TOP BANNER: CLASSIFIED STATUS ── */}
      <div className="col-span-12 rounded-3xl border border-sky-500/20 bg-slate-950/80 p-6 shadow-[0_0_20px_rgba(56,182,255,0.05)] relative overflow-hidden backdrop-blur-md">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-sky-500/30 to-transparent"></div>
        
        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-500/10">
              <Radar className="h-7 w-7 text-sky-400 animate-radar" />
              <div className="absolute inset-0.5 rounded-xl border border-dashed border-sky-400/20 animate-spin" style={{ animationDuration: '20s' }}></div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 border border-rose-500/20 px-2 py-0.5 bg-rose-500/5 rounded">LEVEL 5 SECURE</span>
                <span className="text-xs font-mono text-slate-500">GRID: 31N {satelliteCoords.lat} {satelliteCoords.lng}</span>
              </div>
              <h2 className="text-2xl font-black tracking-wide text-white uppercase mt-1">Strategic Operations Headquarters</h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* DEFCON Controller */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-2 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">DEFCON SYSTEM</span>
              {[5, 4, 3, 2, 1].map((level) => (
                <button
                  key={level}
                  onClick={() => setDefcon(level)}
                  className={`h-9 w-9 rounded-xl font-mono text-xs font-bold transition-all ${
                    defcon === level 
                      ? 'bg-gradient-to-b from-sky-400 to-sky-600 text-slate-950 font-black shadow-[0_0_15px_rgba(56,182,255,0.4)] scale-110' 
                      : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                  type="button"
                >
                  {level}
                </button>
              ))}
            </div>

            <div className="text-right font-mono">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">HQ SYS UPTIME</p>
              <p className="text-lg font-bold text-sky-300">{systemUptime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── LEFT COLUMN: METRICS & OPERATIONAL MAP (XL: 8 COLS) ── */}
      <div className="xl:col-span-8 space-y-6">
        {/* Tactical Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, i) => {
            const isDanger = metric.tone === 'danger';
            const isWarning = metric.tone === 'warning';
            return (
              <motion.article 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={metric.key} 
                className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 relative overflow-hidden group hover:border-sky-500/30 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-slate-900/30 rounded-bl-full border-b border-l border-slate-800/50 pointer-events-none"></div>
                <div className={`absolute top-3 right-3 h-2 w-2 rounded-full ${isDanger ? 'bg-rose-500 animate-pulse' : isWarning ? 'bg-amber-400 animate-pulse' : 'bg-sky-400'}`}></div>
                
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{metric.label}</p>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-3xl font-black tracking-tight text-white font-mono">{metric.value}</span>
                  {metric.key === 'completion_rate' && <span className="text-sm text-slate-500">%</span>}
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    isDanger ? 'bg-rose-500/10 text-rose-400' : isWarning ? 'bg-amber-500/10 text-amber-300' : 'bg-sky-500/10 text-sky-400'
                  }`}>
                    {metric.trend}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">SYS_ACTIVE</span>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* Large Interactive Operational Map */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
          <div className="absolute top-4 left-6 z-10 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-mono font-bold tracking-widest text-slate-300">LIVE SATELLITE COMMAND STREAM</span>
          </div>

          <div className="absolute top-4 right-6 z-10 flex gap-2">
            {Object.keys(sectors).map((secKey) => (
              <button
                key={secKey}
                onClick={() => setActiveSector(secKey)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                  activeSector === secKey 
                    ? 'bg-sky-500/15 border border-sky-400/40 text-sky-300' 
                    : 'bg-slate-900/60 border border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                type="button"
              >
                {secKey.split('_')[1]}
              </button>
            ))}
          </div>

          {/* Interactive HUD Map Base */}
          <div className="mt-8 border border-slate-800/80 rounded-2xl bg-slate-950 relative overflow-hidden h-[380px] flex items-center justify-center">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(56,182,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(56,182,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>
            {/* Radar Circular rings overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[300px] h-[300px] rounded-full border border-sky-500/5 animate-pulse"></div>
              <div className="w-[200px] h-[200px] rounded-full border border-sky-500/10"></div>
              <div className="w-[100px] h-[100px] rounded-full border border-sky-500/15 animate-ping" style={{ animationDuration: '4s' }}></div>
            </div>

            {/* Radar Sweep Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/0 via-sky-500/0 to-sky-500/10 rounded-full animate-radar pointer-events-none"></div>

            {/* Render Map Assets */}
            <svg viewBox="0 0 800 400" className="w-full h-full text-slate-800 opacity-60">
              {/* Tactical landmass outlines */}
              <path d="M150,110 Q220,100 280,140 T420,180 T600,120 T700,240 T450,330 T250,290 Z" fill="none" stroke="rgba(56,182,255,0.15)" strokeWidth="1.5" strokeDasharray="5,5" />
              <path d="M300,50 Q380,120 440,90 T590,70 T680,120" fill="none" stroke="rgba(56,182,255,0.1)" strokeWidth="1" />
              
              {/* Tactical Sectors Boundaries */}
              <circle cx="280" cy="180" r="60" fill="none" stroke="rgba(245,158,11,0.15)" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="480" cy="220" r="85" fill="none" stroke="rgba(239,68,68,0.1)" strokeWidth="1.5" />
            </svg>

            {/* Tactical Sector Hotspots (Interactive click pins) */}
            {/* Sector Alpha Pin */}
            <div 
              onClick={() => setActiveSector('SECTOR_ALPHA')}
              className="absolute top-[120px] left-[250px] cursor-pointer group"
            >
              <div className={`relative flex h-8 w-8 items-center justify-center rounded-full border ${activeSector === 'SECTOR_ALPHA' ? 'border-sky-400 bg-sky-500/20 scale-110 shadow-[0_0_15px_rgba(56,182,255,0.4)]' : 'border-slate-700 bg-slate-900/60'} transition-all`}>
                <Globe className="h-4 w-4 text-sky-400 group-hover:animate-spin" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span></span>
              </div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black font-mono text-slate-400 tracking-wider">A_COMMAND</span>
            </div>

            {/* Sector Bravo Pin */}
            <div 
              onClick={() => setActiveSector('SECTOR_BRAVO')}
              className="absolute top-[200px] left-[420px] cursor-pointer group"
            >
              <div className={`relative flex h-8 w-8 items-center justify-center rounded-full border ${activeSector === 'SECTOR_BRAVO' ? 'border-sky-400 bg-sky-500/20 scale-110 shadow-[0_0_15px_rgba(56,182,255,0.4)]' : 'border-slate-700 bg-slate-900/60'} transition-all`}>
                <Shield className="h-4 w-4 text-sky-400" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5"><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span></span>
              </div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black font-mono text-slate-400 tracking-wider">B_ARMOURY</span>
            </div>

            {/* Sector Charlie Pin */}
            <div 
              onClick={() => setActiveSector('SECTOR_CHARLIE')}
              className="absolute top-[140px] left-[580px] cursor-pointer group"
            >
              <div className={`relative flex h-8 w-8 items-center justify-center rounded-full border ${activeSector === 'SECTOR_CHARLIE' ? 'border-sky-400 bg-sky-500/20 scale-110 shadow-[0_0_15px_rgba(56,182,255,0.4)]' : 'border-slate-700 bg-slate-900/60'} transition-all`}>
                <Cpu className="h-4 w-4 text-sky-400" />
              </div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black font-mono text-slate-400 tracking-wider">C_ENG</span>
            </div>

            {/* Sector Delta Pin */}
            <div 
              onClick={() => setActiveSector('SECTOR_DELTA')}
              className="absolute top-[260px] left-[310px] cursor-pointer group"
            >
              <div className={`relative flex h-8 w-8 items-center justify-center rounded-full border ${activeSector === 'SECTOR_DELTA' ? 'border-rose-400 bg-rose-500/20 scale-110 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'border-rose-900 bg-slate-900/60'} transition-all`}>
                <AlertTriangle className="h-4 w-4 text-rose-400 animate-bounce" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span></span>
              </div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black font-mono text-rose-400 tracking-wider">D_HAZARD</span>
            </div>

            {/* Target telemetry tracking window */}
            <div className="absolute bottom-4 left-4 p-4 rounded-xl border border-slate-800 bg-slate-950/90 max-w-[240px] font-mono text-[10px] text-slate-400 space-y-1 backdrop-blur-sm">
              <p className="text-white font-bold text-xs border-b border-slate-800 pb-1 flex justify-between">
                <span>SECTOR_STATUS</span>
                <span className="text-sky-400">ONLINE</span>
              </p>
              <p className="pt-1">TARGET: {sectors[activeSector as keyof typeof sectors].name}</p>
              <p>POSTURE: <span className="text-white font-bold">{sectors[activeSector as keyof typeof sectors].status}</span></p>
              <p>READINESS: <span className="text-sky-400 font-bold">{sectors[activeSector as keyof typeof sectors].readiness}%</span></p>
              <p>THREAT LVL: <span className={activeSector === 'SECTOR_DELTA' ? 'text-rose-400 font-bold' : 'text-slate-400'}>{sectors[activeSector as keyof typeof sectors].alert}</span></p>
            </div>

            {/* Compass HUD */}
            <div className="absolute bottom-4 right-4 h-16 w-16 border border-slate-800 rounded-full flex items-center justify-center bg-slate-950/80">
              <div className="h-10 w-[2px] bg-sky-400/80 animate-spin" style={{ animationDuration: '8s' }}></div>
              <span className="absolute top-1 text-[8px] font-mono font-bold text-slate-500">N</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 items-center justify-between text-xs text-slate-400 font-mono">
            <span>SATELLITE POSITION: LEO_ORBIT_4</span>
            <span>UPLINK DUPLEX: INTEGRATED (99.8% SIG)</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: INTELLIGENCE MONITOR & ALERTS (XL: 4 COLS) ── */}
      <div className="xl:col-span-4 space-y-6">
        {/* Drone Surveillance System Widget */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-500/10 to-transparent pointer-events-none"></div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-sky-400 animate-pulse" />
            Tactical Drone Feed
          </h3>

          <div className="mt-4 border border-slate-800 rounded-2xl relative overflow-hidden bg-slate-900 h-[200px]">
            {/* Mock feed background with lines */}
            <div className="absolute inset-0 bg-[#0c1510] flex items-center justify-center">
              {/* Rotating crosshairs */}
              <div className="absolute w-28 h-28 border border-dashed border-sky-400/20 rounded-full animate-spin" style={{ animationDuration: '30s' }}></div>
              <div className="absolute w-20 h-20 border border-sky-400/30 rounded-full"></div>
              {/* Scanline sweep */}
              <div className="absolute inset-x-0 h-0.5 bg-sky-400/20 animate-scan-line"></div>
              
              {/* Thermal style silhouettes represented as geometric HUD details */}
              <div className="relative z-10 text-center font-mono select-none">
                <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-400/70 block animate-flicker">TARGET_AQUISITION</span>
                <span className="text-xs font-bold text-white mt-1 block">RNG: 1,402m · ELEV: 120m</span>
              </div>
            </div>

            {/* Static Camera Glitch Effects */}
            <div className="absolute top-3 left-3 text-[9px] font-mono text-emerald-400 bg-slate-950/70 px-2 py-0.5 rounded">
              CAM_04_NORTH
            </div>
            <div className="absolute bottom-3 right-3 text-[9px] font-mono text-slate-400">
              ZOOM: {droneZoom.toFixed(1)}X
            </div>

            {/* Telemetry frame details */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-sky-500"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-sky-500"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-sky-500"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-sky-500"></div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setDroneZoom(prev => Math.min(prev + 0.5, 4.0))}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 py-2 text-xs text-white font-mono hover:bg-slate-900 transition"
              type="button"
            >
              ZOOM_IN
            </button>
            <button
              onClick={() => setDroneZoom(prev => Math.max(prev - 0.5, 1.0))}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 py-2 text-xs text-white font-mono hover:bg-slate-900 transition"
              type="button"
            >
              ZOOM_OUT
            </button>
            <button
              onClick={() => setDroneScanning(!droneScanning)}
              className={`px-4 rounded-xl border ${droneScanning ? 'border-sky-500/30 bg-sky-500/10 text-sky-400' : 'border-slate-800 bg-slate-900/60 text-slate-400'} py-2 text-xs font-mono hover:bg-slate-900 transition`}
              type="button"
            >
              {droneScanning ? 'PAUSE' : 'SCAN'}
            </button>
          </div>
        </div>

        {/* Hazard Alert / Alarm Center */}
        <div className="rounded-3xl border border-rose-500/15 bg-slate-950/80 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-rose-500/40"></div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-400 animate-bounce" />
            Classified Incident Center
          </h3>

          <div className="mt-4 space-y-3 max-h-[160px] overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono">NO CRITICAL INCIDENTS RECORDED</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="rounded-2xl border border-rose-500/15 bg-rose-500/5 p-4 relative">
                  <span className="absolute top-2 right-2 text-[8px] font-black uppercase text-rose-500 tracking-widest border border-rose-500/20 px-1 rounded">
                    {alert.severity}
                  </span>
                  <p className="text-xs font-bold text-white">{alert.title}</p>
                  <p className="mt-1 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                    MODULE: {alert.moduleCode.replaceAll('_', ' ')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-time Activity Feeds & Posture */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
          <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Radio className="h-5 w-5 text-sky-400" />
            Command Activity Feed
          </h3>

          <div className="mt-4 space-y-4 max-h-[220px] overflow-y-auto pr-1">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="text-xs border-b border-slate-900 pb-3 last:border-0 last:pb-0 relative pl-4">
                <span className="absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full bg-sky-500"></span>
                <p className="text-slate-300 font-bold">{activity.action}</p>
                <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>ROLE: {activity.actorRoleCode?.toUpperCase() ?? 'STAFF'}</span>
                  <span>{new Date(activity.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
