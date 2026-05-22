import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCheck, Shield, Award, Terminal, Eye, BookOpen, MapPin, 
  ChevronRight, Star, RefreshCw, FileText, CheckCircle, Info, Activity
} from 'lucide-react';
import { toast } from 'sonner';

export default function PersonnelDossier() {
  const [selectedOfficer, setSelectedOfficer] = useState<string>('OF-01');

  const officers = [
    {
      id: 'OF-01',
      fullName: 'Brigadier General Musa Danjuma',
      rank: 'Brigadier General',
      serviceNumber: 'N/10000001',
      clearance: 'LEVEL_5_SECRET',
      role: 'Base Commander',
      status: 'ACTIVE_DUTY',
      unit: 'HQ Defense Command Post 1',
      joinedDate: '2020-04-12',
      ribbons: ['Distinguished Service', 'Meritorious Operations', 'Defense Medal', 'Border Security Valor'],
      history: [
        { date: '2026-02-15', detail: 'Authorized central weapons deployment overhaul.' },
        { date: '2025-11-04', detail: 'Led perimeter thermal camera arrays clearance sweep.' },
        { date: '2025-08-30', detail: 'Transitioned Sector Bravo into full DEFCON 3 standby.' },
      ],
    },
    {
      id: 'OF-02',
      fullName: 'Colonel Chidi Okafor',
      rank: 'Colonel',
      serviceNumber: 'N/10000002',
      clearance: 'LEVEL_4_SECRET',
      role: 'Director of Strategic Engineering',
      status: 'ACTIVE_DUTY',
      unit: 'Military Construction Unit 14',
      joinedDate: '2021-08-20',
      ribbons: ['Engineering Excellence', 'Distinguished Service', 'Meritorious Operations'],
      history: [
        { date: '2026-03-01', detail: 'Approved foundations pours for underground bunkers.' },
        { date: '2025-12-10', detail: 'Commissioned drainage array designs for tactical airfield.' },
      ],
    },
    {
      id: 'OF-03',
      fullName: 'Lieutenant Colonel Amina Hassan',
      rank: 'Lieutenant Colonel',
      serviceNumber: 'N/10000003',
      clearance: 'LEVEL_4_SECRET',
      role: 'Directorate Head of Evaluations',
      status: 'ACTIVE_DUTY',
      unit: 'Compliance & Audits Division',
      joinedDate: '2022-01-15',
      ribbons: ['Compliance Ribbon', 'Meritorious Operations', 'Defense Medal'],
      history: [
        { date: '2026-05-18', detail: 'Conducted comprehensive readiness sweep at headquarters.' },
        { date: '2026-01-22', detail: 'Resolved corrective action pipeline in safety manual.' },
      ],
    },
  ];

  const currentOfficer = officers.find((o) => o.id === selectedOfficer) ?? officers[0];

  return (
    <div className="grid gap-6 xl:grid-cols-12 font-sans text-white">
      {/* ── LEFT SIDEBAR: OFFICER SELECTION LIST (XL: 4 COLS) ── */}
      <div className="xl:col-span-4 space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-sky-500/20"></div>
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2 mb-6">
            <UserCheck className="h-5 w-5 text-sky-400" />
            OFFICER COMMAND DIRECTORY
          </h3>

          <div className="space-y-3">
            {officers.map((off) => {
              const active = off.id === selectedOfficer;
              return (
                <button
                  key={off.id}
                  onClick={() => setSelectedOfficer(off.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 relative ${
                    active 
                      ? 'border-sky-500/40 bg-sky-950/90 shadow-[0_0_15px_rgba(56,182,255,0.08)]' 
                      : 'border-slate-900 bg-slate-950/40 hover:border-slate-800'
                  }`}
                  type="button"
                >
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span>{off.serviceNumber}</span>
                    <span className="font-bold text-sky-400 uppercase">{off.status.replaceAll('_', ' ')}</span>
                  </div>
                  <h4 className="text-sm font-black uppercase text-white mt-1">{off.fullName}</h4>
                  <p className="text-xs text-slate-400 mt-2 font-mono">{off.rank} · {off.role}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: OFFICER CLASSIFIED ID CARD DOSSIER (XL: 8 COLS) ── */}
      <div className="xl:col-span-8 space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b border-slate-900">
            {/* Tactical Profile Photo Box representation */}
            <div className="flex items-center gap-5">
              <div className="relative h-20 w-20 rounded-2xl border border-sky-400/30 bg-sky-500/10 flex items-center justify-center text-sky-400">
                <Shield className="h-10 w-10 animate-pulse" />
                <div className="absolute inset-1 rounded-xl border border-dashed border-sky-500/25"></div>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 border border-rose-500/20 px-2 py-0.5 bg-rose-500/5 rounded">
                  {currentOfficer.clearance.replaceAll('_', ' ')}
                </span>
                <h2 className="text-xl font-black text-white uppercase tracking-wider mt-1.5">{currentOfficer.fullName}</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  SERVICE NO: {currentOfficer.serviceNumber} · RANK: {currentOfficer.rank}
                </p>
              </div>
            </div>

            <div className="text-right font-mono text-xs text-slate-500">
              <span>ACTIVE DEPLOYMENT POSTURE</span>
              <span className="text-sm font-black text-emerald-400 block mt-1 uppercase">
                {currentOfficer.status.replaceAll('_', ' ')}
              </span>
            </div>
          </div>

          {/* Officer Details Grid */}
          <div className="mt-6 grid gap-4 md:grid-cols-2 text-xs font-mono">
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-2">
              <p className="text-slate-500 uppercase text-[9px] tracking-wider">UNIT ASSIGNMENT</p>
              <p className="text-sm font-bold text-white uppercase">{currentOfficer.unit}</p>
            </div>
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-2">
              <p className="text-slate-500 uppercase text-[9px] tracking-wider">OFFICER ASSIGNED ROLE</p>
              <p className="text-sm font-bold text-white uppercase">{currentOfficer.role}</p>
            </div>
          </div>

          {/* Animated Service Ribbons */}
          <div className="mt-6 border-t border-slate-900 pt-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">DECORATIONS & SERVICE RIBBONS</h3>
            <div className="flex flex-wrap gap-3">
              {currentOfficer.ribbons.map((ribbon) => (
                <div 
                  key={ribbon} 
                  className="rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-center min-w-[120px] relative overflow-hidden group hover:border-sky-400/40 transition-all duration-300"
                >
                  {/* Decorative stripes on ribbons */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-sky-500"></div>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-sky-500"></div>
                  <div className="absolute inset-y-0 left-3 w-1 bg-amber-500"></div>
                  <div className="absolute inset-y-0 right-3 w-1 bg-amber-500"></div>
                  
                  <span className="text-[10px] font-black text-white block uppercase tracking-wide pt-1">{ribbon}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Operational logs */}
          <div className="mt-6 border-t border-slate-900 pt-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">RECENT DEPLOYMENT ACTIVITY LOGS</h3>
            <div className="space-y-3">
              {currentOfficer.history.map((log) => (
                <div key={log.date} className="rounded-2xl border border-slate-900 bg-slate-950/60 p-4 text-xs font-mono">
                  <div className="flex justify-between text-[10px] text-slate-500 pb-2 border-b border-slate-900 mb-2">
                    <span>ACTION DISPATCH</span>
                    <span>{log.date}</span>
                  </div>
                  <p className="text-slate-300 uppercase leading-relaxed">{log.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
