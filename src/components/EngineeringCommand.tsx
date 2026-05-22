import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HardHat, ClipboardList, Ruler, Eye, Briefcase, Activity, Calendar, 
  MapPin, CheckSquare, ChevronRight, Layout, Download, Info
} from 'lucide-react';
import { toast } from 'sonner';

export default function EngineeringCommand() {
  const [selectedProject, setSelectedProject] = useState<string>('PRJ-206');
  const [blueprintZoom, setBlueprintZoom] = useState<boolean>(false);

  const projects = [
    {
      id: 'PRJ-206',
      title: 'Classified Base Fortification',
      location: 'Sector Charlie Outpost',
      contractor: 'Defence Builders Ltd',
      status: 'UNDER_CONSTRUCTION',
      completion: 78,
      leadEngineer: 'Major General T. Musa',
      budget: '₦420,000,000',
      boq: [
        { item: '1.0', desc: 'Excavation & Substructure Works', qty: '12,000 m³', cost: '₦84,000,000', status: 'COMPLETED' },
        { item: '2.0', desc: 'Reinforced Blast Walls Construction', qty: '4,500 m³', cost: '₦180,000,000', status: 'IN_PROGRESS' },
        { item: '3.0', desc: 'Underground Operations Bunker Dome', qty: '1 Array', cost: '₦110,000,000', status: 'IN_PROGRESS' },
        { item: '4.0', desc: 'Tactical Perimeter Laser Security Support', qty: '12 Stations', cost: '₦46,000,000', status: 'ON_STANDBY' },
      ],
      milestones: [
        { id: 'm1', label: 'Geotechnical Soil Survey & Clearance', date: '2026-01-10', done: true },
        { id: 'm2', label: 'Concrete Foundation Pours', date: '2026-03-05', done: true },
        { id: 'm3', label: 'Primary Steel Armor Installation', date: '2026-05-15', done: true },
        { id: 'm4', label: 'HVAC & Air Filtration Mainframe Fit', date: '2026-07-20', done: false },
        { id: 'm5', label: 'Final Telemetry Grid Testing', date: '2026-09-01', done: false },
      ],
    },
    {
      id: 'PRJ-302',
      title: 'Tactical Airfield Drainage Arrays',
      location: 'Northern Airbase Platform',
      contractor: 'AeroCivil Corps',
      status: 'PLANNING_PHASE',
      completion: 24,
      leadEngineer: 'Lieutenant Colonel A. Aliyu',
      budget: '₦180,000,000',
      boq: [
        { item: '1.0', desc: 'Runway Trench Clearing & Grading', qty: '8,000 m', cost: '₦54,000,000', status: 'IN_PROGRESS' },
        { item: '2.0', desc: 'High-Density Drainage Piping', qty: '4,200 units', cost: '₦86,000,000', status: 'ON_STANDBY' },
        { item: '3.0', desc: 'Outfall Vaults & Flood Controls', qty: '4 Basins', cost: '₦40,000,000', status: 'ON_STANDBY' },
      ],
      milestones: [
        { id: 'm1', label: 'Hydrologic Modeling Approval', date: '2026-04-01', done: true },
        { id: 'm2', label: 'Trench Excavation Sweeps', date: '2026-06-15', done: false },
        { id: 'm3', label: 'Drainage Ring Pipe Pours', date: '2026-08-30', done: false },
      ],
    },
  ];

  const currentProject = projects.find((p) => p.id === selectedProject) ?? projects[0];

  return (
    <div className="grid gap-6 xl:grid-cols-12 font-sans text-white relative">
      {/* Blueprint Grid Overlay background for entire sheet */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,182,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(56,182,255,0.015)_1px,transparent_1px)] bg-[size:25px_25px] pointer-events-none"></div>

      {/* ── LEFT SIDEBAR: CIVIL PROJECTS NAVIGATION (XL: 4 COLS) ── */}
      <div className="xl:col-span-4 space-y-6 relative z-10">
        <div className="rounded-3xl border border-sky-950 bg-slate-950/80 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-sky-500/20"></div>
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-sky-400" />
            ENGINEERING WORKLIST DIRECTORY
          </h3>

          <div className="mt-6 space-y-3">
            {projects.map((proj) => {
              const active = proj.id === selectedProject;
              return (
                <button
                  key={proj.id}
                  onClick={() => setSelectedProject(proj.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 relative ${
                    active 
                      ? 'border-sky-500/40 bg-sky-950/90 shadow-[0_0_15px_rgba(56,182,255,0.08)]' 
                      : 'border-slate-900 bg-slate-950/40 hover:border-slate-800'
                  }`}
                  type="button"
                >
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span>{proj.id}</span>
                    <span className="font-bold text-sky-400">{proj.completion}%</span>
                  </div>
                  <h4 className="text-sm font-black uppercase text-white mt-1 group-hover:text-sky-300">{proj.title}</h4>
                  <p className="text-xs text-slate-400 mt-2 font-mono">{proj.location}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Blueprint Overview schematic (Interactive preview card) */}
        <div className="rounded-3xl border border-sky-950 bg-slate-950/80 p-6 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-900">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">STRUCTURAL Blueprint GRID</span>
            <button
              onClick={() => setBlueprintZoom(true)}
              className="text-[10px] text-sky-400 font-mono hover:underline inline-flex items-center gap-1"
              type="button"
            >
              <Eye className="h-3.5 w-3.5" /> DETAILED_DRAWING
            </button>
          </div>

          {/* Blueprint style layout visualization */}
          <div className="mt-4 border border-sky-950/80 rounded-2xl h-[180px] bg-slate-950 relative overflow-hidden flex items-center justify-center">
            {/* Fine architectural grid lines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(56,182,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(56,182,255,0.03)_1px,transparent_1px)] bg-[size:10px_10px]"></div>
            
            {/* Blueprint graphic schematic circles */}
            <div className="absolute h-28 w-28 rounded-full border border-sky-500/20 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full border border-dashed border-sky-500/25"></div>
              <div className="h-10 w-10 rounded-full border border-sky-500/30"></div>
            </div>
            {/* Blueprint crosshairs */}
            <div className="absolute w-36 h-[1px] bg-sky-500/20"></div>
            <div className="absolute h-36 w-[1px] bg-sky-500/20"></div>
            
            <span className="absolute bottom-3 left-3 text-[8px] font-mono text-sky-500">DWG: FORT-A206_SECTION_CC</span>
            <span className="absolute top-3 right-3 text-[8px] font-mono text-slate-500">SCALE: 1:150</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: PROJECT TRACKING & BOQ LEDGER (XL: 8 COLS) ── */}
      <div className="xl:col-span-8 space-y-6 relative z-10">
        {/* Project Header details */}
        <div className="rounded-3xl border border-sky-950 bg-slate-950/80 p-6 relative overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-900">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">{currentProject.title}</h2>
              <p className="text-xs text-slate-500 mt-1 uppercase font-mono">
                ENGINEER LEADER: {currentProject.leadEngineer} · CONTRACTOR: {currentProject.contractor}
              </p>
            </div>
            <div className="text-right font-mono">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">PROJECT INVESTMENT</span>
              <span className="text-lg font-black text-sky-400">{currentProject.budget}</span>
            </div>
          </div>

          {/* Project progress milestones with timeline circles */}
          <div className="mt-6">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">ENGINEERING PHASE MILESTONES</h3>
            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              {/* Horizontal connector line on MD screens */}
              <div className="hidden md:block absolute top-[18px] left-[20px] right-[20px] h-0.5 bg-slate-900 z-0"></div>
              
              {currentProject.milestones.map((mile) => (
                <div key={mile.id} className="flex md:flex-col items-center gap-4 md:text-center relative z-10 flex-1">
                  <div className={`h-10 w-10 rounded-full border flex items-center justify-center font-mono text-xs font-bold transition-all ${
                    mile.done 
                      ? 'border-sky-500 bg-sky-500/10 text-sky-400 shadow-[0_0_12px_rgba(56,182,255,0.2)]' 
                      : 'border-slate-800 bg-slate-950 text-slate-500'
                  }`}>
                    {mile.done ? '✓' : '•'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wide">{mile.label}</p>
                    <p className="text-[9px] font-mono text-slate-500 mt-1">{mile.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bill of Quantities BOQ Spreadsheet */}
        <div className="rounded-3xl border border-sky-950 bg-slate-950/80 p-6 relative overflow-hidden">
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 mb-4">BILL OF QUANTITIES (BOQ) LEDGER</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500">
                  <th className="pb-3 uppercase w-[80px]">Item No</th>
                  <th className="pb-3 uppercase">Component Description</th>
                  <th className="pb-3 uppercase">Dimension/Qty</th>
                  <th className="pb-3 uppercase">Calculated Budget</th>
                  <th className="pb-3 uppercase text-right">Progress Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {currentProject.boq.map((row) => (
                  <tr key={row.item} className="hover:bg-sky-500/5 transition-all group">
                    <td className="py-4 text-sky-400 font-bold">{row.item}</td>
                    <td className="py-4 text-white font-bold uppercase tracking-wide group-hover:text-sky-300">{row.desc}</td>
                    <td className="py-4 text-slate-400">{row.qty}</td>
                    <td className="py-4 text-slate-300">{row.cost}</td>
                    <td className="py-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border ${
                        row.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                          : row.status === 'IN_PROGRESS'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/15'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── DETAIL BLUEPRINT DRAWING OVERLAY MODAL ── */}
      <AnimatePresence>
        {blueprintZoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl px-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-5xl rounded-3xl border border-sky-950 bg-slate-950 p-6 shadow-2xl relative"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-900 mb-4">
                <div>
                  <h4 className="text-base font-black uppercase text-white tracking-wider">DWG: FORT-A206_TACTICAL_SECTION_FULL</h4>
                  <p className="text-[10px] text-slate-500 font-mono">MILITARY STRUCTURES SPECIFICATION OVERLAY</p>
                </div>
                <button
                  onClick={() => setBlueprintZoom(false)}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-black uppercase text-slate-400 hover:text-white transition"
                  type="button"
                >
                  CLOSE_DRAWING
                </button>
              </div>

              {/* Blueprint details */}
              <div className="border border-sky-900/60 bg-[#02050f] rounded-2xl h-[520px] relative overflow-hidden flex flex-col justify-center items-center p-6 text-center select-none font-mono">
                {/* Micro lines */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(56,182,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(56,182,255,0.02)_1px,transparent_1px)] bg-[size:15px_15px]"></div>
                
                <svg viewBox="0 0 1000 480" className="w-full h-full text-sky-500/70 relative z-10">
                  {/* Outer fort ring */}
                  <rect x="150" y="80" width="700" height="320" fill="none" stroke="#38b6ff" strokeWidth="2" />
                  <rect x="180" y="110" width="640" height="260" fill="none" stroke="#38b6ff" strokeWidth="1" strokeDasharray="5,5" />
                  
                  {/* Underground bunker schematic */}
                  <circle cx="500" cy="240" r="80" fill="none" stroke="#38b6ff" strokeWidth="2" />
                  <circle cx="500" cy="240" r="40" fill="none" stroke="#38b6ff" strokeWidth="1" />
                  <line x1="500" y1="120" x2="500" y2="360" stroke="#38b6ff" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="380" y1="240" x2="620" y2="240" stroke="#38b6ff" strokeWidth="1" strokeDasharray="3,3" />
                  
                  {/* Foundation annotations */}
                  <text x="515" y="220" fill="#38b6ff" fontSize="10">TACTICAL VAULT CORE</text>
                  <text x="160" y="100" fill="#38b6ff" fontSize="10">REINFORCED BOUNDARY WALLS</text>
                  <text x="690" y="360" fill="#38b6ff" fontSize="10">HVAC DUCT WORK POST</text>
                </svg>

                <div className="absolute bottom-4 left-6 text-left text-[9px] text-sky-500/80 space-y-1">
                  <p>APPROVED ENGINEER: MAJOR GENERAL T. MUSA</p>
                  <p>APPROVED DATE: 2026-02-28</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
