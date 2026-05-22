import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, ShieldAlert, Cpu, Heart, Activity, Radio, 
  RefreshCw, FileText, CheckCircle, Flame, ShieldCheck, Siren
} from 'lucide-react';
import { toast } from 'sonner';

export default function HazardEmergency() {
  const [alarmActive, setAlarmActive] = useState<boolean>(false);
  const [activeSector, setActiveSector] = useState<string>('ZONE-C');
  const [hazardScore, setHazardScore] = useState<number>(42);

  // Environmental Telemetry Sensors
  const [sensors, setSensors] = useState({
    radiation: 0.12, // uSv/h
    oxygen: 20.9,    // %
    temp: 24.5,      // °C
    pressure: 1013,  // hPa
  });

  // Checklist items
  const [safetyChecklist, setSafetyChecklist] = useState([
    { id: 'chk-1', label: 'Radiation Vault Shields Engaged', done: true },
    { id: 'chk-2', label: 'CO2 Ventilation Mainframes Online', done: true },
    { id: 'chk-3', label: 'Primary Fire Extinguishing Arrays Active', done: true },
    { id: 'chk-4', label: 'Hazardous Chemical Vault Lockdown', done: false },
    { id: 'chk-5', label: 'Emergency Biohazard Evacuation Outlets Unlocked', done: false },
  ]);

  // Periodic sensor fluctuation simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setSensors((prev) => {
        const radDrift = (Math.random() * 0.04) - 0.02;
        const tempDrift = (Math.random() * 0.6) - 0.3;
        const pressureDrift = Math.floor(Math.random() * 4) - 2;
        
        return {
          radiation: Math.max(0.01, Number((prev.radiation + radDrift).toFixed(3))),
          oxygen: Number((20.9 + (Math.random() * 0.2 - 0.1)).toFixed(1)),
          temp: Number((prev.temp + tempDrift).toFixed(1)),
          pressure: prev.pressure + pressureDrift,
        };
      });
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  const toggleAlarm = () => {
    setAlarmActive(!alarmActive);
    if (!alarmActive) {
      toast.warning('EMERGENCY RED ALERT POSTURE ACTIVE across all decks!');
    } else {
      toast.success('DECK SECURITY STATUS: ALL CLEAR RESTORED');
    }
  };

  const handleCheckToggle = (id: string) => {
    setSafetyChecklist(prev =>
      prev.map(item => item.id === id ? { ...item, done: !item.done } : item)
    );
    toast.info('Emergency readiness checklist adjusted.');
  };

  return (
    <div className={`grid gap-6 xl:grid-cols-12 font-sans text-white transition-colors duration-500 ${
      alarmActive ? 'bg-rose-950/10' : ''
    }`}>
      {/* ── TOP RED ALERT BROADCASTER TICKER ── */}
      <div className={`col-span-12 rounded-3xl border p-6 relative overflow-hidden transition-all duration-500 ${
        alarmActive 
          ? 'border-rose-500/40 bg-rose-950/40 shadow-[0_0_25px_rgba(239,68,68,0.2)] animate-pulse' 
          : 'border-slate-800 bg-slate-950/80'
      }`}>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.015)_1px,transparent_1px)] bg-[size:15px_15px]"></div>
        
        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${
              alarmActive ? 'border-rose-400 bg-rose-500/20 text-rose-400' : 'border-amber-400/20 bg-amber-500/10 text-amber-400'
            }`}>
              <Siren className={`h-6 w-6 ${alarmActive ? 'animate-bounce' : ''}`} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider">
                {alarmActive ? 'EMERGENCY MAIN DECK POSTURE RED ALERT' : 'SAFETY MONITOR MAIN CONTROLS'}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1">
                SECTOR POSTURE: {alarmActive ? 'WARNING_THREAT_FLUSH' : 'NOMINAL_OPERATIONS'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleAlarm}
            className={`px-6 py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${
              alarmActive
                ? 'border-rose-500 bg-rose-500 text-slate-950 font-black shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/25'
            }`}
            type="button"
          >
            {alarmActive ? 'DISMISS RED ALERT' : 'ACTIVATE RED ALERT'}
          </button>
        </div>
      </div>

      {/* ── LEFT COLUMN: HAZARD TELEMETRY DAMPENERS (XL: 5 COLS) ── */}
      <div className="xl:col-span-5 space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2 mb-6">
            <Activity className="h-5 w-5 text-rose-500 animate-pulse" />
            ENVIRONMENTAL SENSOR DIALS
          </h3>

          <div className="grid grid-cols-2 gap-4 font-mono">
            {/* Radiation readout */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-2 relative overflow-hidden">
              <span className="text-[9px] text-slate-500 block">AMBIENT RADIATION</span>
              <span className="text-lg font-black text-white block">{sensors.radiation} uSv/h</span>
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-1 transition-all duration-1000"
                  style={{ width: `${Math.min(100, (sensors.radiation / 2.0) * 100)}%` }}
                ></div>
              </div>
              <span className="text-[8px] text-emerald-400 block font-bold">NOMINAL</span>
            </div>

            {/* O2 readout */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-2 relative overflow-hidden">
              <span className="text-[9px] text-slate-500 block">ATMOSPHERIC OXYGEN</span>
              <span className="text-lg font-black text-white block">{sensors.oxygen}%</span>
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-sky-500 h-1 transition-all duration-1000"
                  style={{ width: `${Math.min(100, (sensors.oxygen / 25) * 100)}%` }}
                ></div>
              </div>
              <span className="text-[8px] text-sky-400 block font-bold">STABLE</span>
            </div>

            {/* Temp readout */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-2 relative overflow-hidden">
              <span className="text-[9px] text-slate-500 block">MAIN DECK THERMALS</span>
              <span className="text-lg font-black text-white block">{sensors.temp} °C</span>
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-1 transition-all duration-1000"
                  style={{ width: `${Math.min(100, (sensors.temp / 50) * 100)}%` }}
                ></div>
              </div>
              <span className="text-[8px] text-amber-400 block font-bold">NOMINAL</span>
            </div>

            {/* Air pressure */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-2 relative overflow-hidden">
              <span className="text-[9px] text-slate-500 block">AIRFLOW PRESSURE</span>
              <span className="text-lg font-black text-white block">{sensors.pressure} hPa</span>
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-sky-400 h-1 transition-all duration-1000"
                  style={{ width: `${Math.min(100, (sensors.pressure / 1200) * 100)}%` }}
                ></div>
              </div>
              <span className="text-[8px] text-sky-400 block font-bold">EQUALIZED</span>
            </div>
          </div>
        </div>

        {/* Hazard Level Scoring and percentage ring */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <span className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 block">HAZARD RISK INTEGRATION RATIO</span>

          <div className="relative mt-6 flex items-center justify-center">
            {/* SVG circle */}
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="54" stroke="rgba(30, 41, 59, 0.4)" strokeWidth="6" fill="transparent" />
              <circle 
                cx="64" cy="64" r="54" 
                stroke={alarmActive ? '#f43f5e' : '#f59e0b'} 
                strokeWidth="8" fill="transparent" 
                strokeDasharray={2 * Math.PI * 54}
                strokeDashoffset={2 * Math.PI * 54 * (1 - (alarmActive ? 92 : hazardScore) / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center font-mono">
              <span className="text-3xl font-black text-white">{alarmActive ? 92 : hazardScore}%</span>
              <span className="text-[8px] uppercase tracking-widest text-slate-500">RISK FACTOR</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: HEATMAPS & SAFETY CHECKS (XL: 7 COLS) ── */}
      <div className="xl:col-span-7 space-y-6">
        {/* Geographic Threat Heatmap */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">DECK HAZARD HEATMAP RADIUS</h3>

          <div className="grid grid-cols-3 gap-3 font-mono text-center">
            {[
              { id: 'ZONE-A', name: 'Ammo Magazine A', risk: 'LOW', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
              { id: 'ZONE-B', name: 'Command Server Complex', risk: 'LOW', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
              { id: 'ZONE-C', name: 'Fuel Reserves Vault', risk: 'MODERATE', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
              { id: 'ZONE-D', name: 'Chemical Logistics Deck', risk: 'CRITICAL', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
              { id: 'ZONE-E', name: 'Barracks Sector 4', risk: 'LOW', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
              { id: 'ZONE-F', name: 'Perimeter Power Grid', risk: 'MODERATE', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
            ].map((zone) => {
              const active = zone.id === activeSector;
              return (
                <button
                  key={zone.id}
                  onClick={() => {
                    setActiveSector(zone.id);
                    setHazardScore(zone.risk === 'CRITICAL' ? 84 : zone.risk === 'MODERATE' ? 58 : 22);
                  }}
                  className={`p-4 rounded-2xl border transition-all ${
                    active 
                      ? 'border-sky-500 bg-sky-500/10 text-sky-400 shadow-[0_0_12px_rgba(56,182,255,0.2)]'
                      : zone.color
                  }`}
                  type="button"
                >
                  <span className="text-[9px] text-slate-500 block font-bold">{zone.id}</span>
                  <span className="text-xs font-black block mt-1 truncate uppercase">{zone.name.split(' ')[0]}</span>
                  <span className="text-[8px] block font-bold uppercase mt-2 tracking-wider">
                    {zone.risk}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Industrial safety checklist system */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">EMERGENCY COMPLIANCE CHECKLIST</h3>
          <div className="space-y-3">
            {safetyChecklist.map((item) => (
              <div 
                key={item.id} 
                onClick={() => handleCheckToggle(item.id)}
                className="flex items-center justify-between p-4 rounded-2xl border border-slate-900 bg-slate-950/60 hover:bg-slate-900/40 transition cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-6 w-6 rounded-lg border flex items-center justify-center transition-all ${
                    item.done 
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]' 
                      : 'border-slate-800 bg-slate-900 text-slate-600'
                  }`}>
                    {item.done && <CheckCircle className="h-4 w-4" />}
                  </div>
                  <span className={`text-xs font-semibold uppercase tracking-wide transition-all ${
                    item.done ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    {item.label}
                  </span>
                </div>

                <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                  item.done ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-500'
                }`}>
                  {item.done ? 'COMPLIANT' : 'PENDING'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
