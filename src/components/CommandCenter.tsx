import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, FileCheck2, Lock, HardHat, AlertTriangle, UserCheck, TrendingUp, 
  LogOut, Radio, Layers3, Siren, Radar, Cpu, Clock, Key, ShieldCheck, 
  Fingerprint, Menu, X, Terminal, ChevronRight, Activity, Globe
} from 'lucide-react';
import { toast } from 'sonner';
import {
  approveRegistration,
  createInspection,
  getCommandCenterSummary,
  getInspectionDetail,
  getModules,
  getPendingApprovals,
  listInspections,
} from '../lib/api';
import type { DashboardSummary, InspectionDetail, InspectionSummary, ModuleDefinition, PlatformUser } from '../types/platform';

// Subcomponents
import DefenseHQ from './DefenseHQ';
import TacticalAssessment from './TacticalAssessment';
import ArmourySecurity from './ArmourySecurity';
import EngineeringCommand from './EngineeringCommand';
import HazardEmergency from './HazardEmergency';
import PersonnelDossier from './PersonnelDossier';
import IntelligenceAnalytics from './IntelligenceAnalytics';

interface CommandCenterProps {
  user: PlatformUser;
  onLogout: () => Promise<void> | void;
}

const DECKS = [
  { id: 'hq', label: 'Defense HQ', icon: Shield, description: 'Strategic Operations Room', classification: 'LEVEL_5 SECURE' },
  { id: 'checklists', label: 'Tactical Audits', icon: FileCheck2, description: 'Interactive Assessments', classification: 'LEVEL_4 DECLASSIFIED' },
  { id: 'armoury', label: 'Armoury Vault', icon: Lock, description: 'Classified Weapons System', classification: 'LEVEL_4 RESTRICTED' },
  { id: 'engineering', label: 'Engineering Command', icon: HardHat, description: 'Strategic Infrastructure', classification: 'LEVEL_4 STRATEGIC' },
  { id: 'hazard', label: 'Hazard Emergency', icon: AlertTriangle, description: 'Industrial Threat Sweeps', classification: 'LEVEL_4 HIGH_RISK' },
  { id: 'personnel', label: 'Personnel Dossiers', icon: UserCheck, description: 'Classified Officer Profiles', classification: 'LEVEL_5 RESTRICTED' },
  { id: 'analytics', label: 'Intelligence Analytics', icon: TrendingUp, description: 'Readiness Forecasting', classification: 'LEVEL_5 SECRET' },
];

export default function CommandCenter({ user, onLogout }: CommandCenterProps) {
  // Navigation deck state
  const [currentDeck, setCurrentDeck] = useState<string>('hq');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [authQueueOpen, setAuthQueueOpen] = useState<boolean>(false);

  // Telemetry API states
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [modules, setModules] = useState<ModuleDefinition[]>([]);
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InspectionDetail | null>(null);
  const [activeModule, setActiveModule] = useState<string>('');
  const [pendingApprovals, setPendingApprovals] = useState<Record<string, unknown>[]>([]);
  const [newInspectionTitle, setNewInspectionTitle] = useState('');
  const [loading, setLoading] = useState(true);

  // Decorative coordinate drift
  const [liveCoords, setLiveCoords] = useState({ lat: '09°04\'21" N', lng: '07°29\'01" E' });
  const [systemTime, setSystemTime] = useState<string>('00:00:00');

  const loadDashboard = useCallback(async (moduleCode: string) => {
    const [dashboardSummary, moduleList, inspectionList, approvals] = await Promise.all([
      getCommandCenterSummary() as Promise<DashboardSummary>,
      getModules(),
      listInspections(moduleCode || undefined),
      getPendingApprovals().catch(() => [] as Record<string, unknown>[]),
    ]);

    setSummary(dashboardSummary);

    const normalizedModules = (moduleList as unknown as Array<Record<string, unknown>>).map((m) => ({
      id: String(m.id ?? m.code ?? ''),
      moduleCode: String(m.moduleCode ?? m.code ?? ''),
      title: String(m.title ?? m.label ?? ''),
      classification: String(m.classification ?? 'general'),
      description: String(m.description ?? ''),
    })) as ModuleDefinition[];
    setModules(normalizedModules);

    if (!moduleCode && normalizedModules.length > 0) {
      setActiveModule(normalizedModules[0].moduleCode);
    }

    setInspections(
      (inspectionList as unknown as Array<Record<string, unknown>>).map((i) => ({
        _id: String(i._id ?? i.id ?? ''),
        title: String(i.title ?? ''),
        moduleCode: String(i.moduleCode ?? ''),
        status: String(i.status ?? 'draft'),
        scoreOverall: Number(i.scoreOverall ?? 0),
        complianceBand: String(i.complianceBand ?? 'N/A'),
        riskLevel: String(i.riskLevel ?? 'LOW'),
        completionPercent: Number(i.completionPercent ?? 0),
        directorateCode: String(i.directorateCode ?? ''),
        unitCode: String(i.unitCode ?? ''),
        updatedAt: Number(i.updatedAt ?? 0),
      }))
    );

    setPendingApprovals(approvals as Record<string, unknown>[]);
  }, []);

  // Sync timers
  useEffect(() => {
    const coordTimer = setInterval(() => {
      const latMin = Math.floor(Math.random() * 60);
      const latSec = Math.floor(Math.random() * 60);
      const lngMin = Math.floor(Math.random() * 60);
      const lngSec = Math.floor(Math.random() * 60);
      setLiveCoords({
        lat: `09°${latMin.toString().padStart(2, '0')}'${latSec.toString().padStart(2, '0')}" N`,
        lng: `07°${lngMin.toString().padStart(2, '0')}'${lngSec.toString().padStart(2, '0')}" E`,
      });
    }, 4500);

    const clockTimer = setInterval(() => {
      const now = new Date();
      setSystemTime(now.toLocaleTimeString());
    }, 1000);

    return () => {
      clearInterval(coordTimer);
      clearInterval(clockTimer);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    loadDashboard(activeModule)
      .catch((error: Error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [activeModule, loadDashboard]);

  useEffect(() => {
    if (!selectedInspectionId) {
      setDetail(null);
      return;
    }
    getInspectionDetail(selectedInspectionId)
      .then((d) => setDetail(d as InspectionDetail))
      .catch((error: Error) => toast.error(error.message));
  }, [selectedInspectionId]);

  const activeModuleDefinition = useMemo(
    () => modules.find((m) => m.moduleCode === activeModule) ?? null,
    [modules, activeModule],
  );

  async function handleCreateInspection() {
    if (!newInspectionTitle.trim()) {
      toast.error('Enter a title for the inspection.');
      return;
    }
    if (!activeModule) {
      toast.error('Select a module first.');
      return;
    }
    try {
      const id = await createInspection({
        moduleCode: activeModule,
        title: newInspectionTitle.trim(),
        directorateCode: user.directorateCode,
      });
      setNewInspectionTitle('');
      await loadDashboard(activeModule);
      setSelectedInspectionId(id);
      toast.success('Tactical audit dossier initialized.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create inspection.');
    }
  }

  // Map backend summary metrics to DefenseHQ metrics
  const defenseMetrics = useMemo(() => {
    return (summary?.metrics || []).map((m) => ({
      key: m.key,
      label: m.label,
      value: Number(m.value) || 0,
      trend: m.trend || 'STABLE',
      tone: m.key === 'critical_findings' || m.key === 'open_corrective_actions' ? 'danger' : m.key === 'average_compliance' ? 'warning' : 'info',
    }));
  }, [summary]);

  // Dynamic deck renderer
  const renderDeck = () => {
    switch (currentDeck) {
      case 'hq':
        return (
          <DefenseHQ
            user={{
              fullName: user.fullName,
              roleCode: user.roleCode,
              directorateCode: user.directorateCode,
            }}
            metrics={defenseMetrics}
            recentActivity={summary?.recentActivity || []}
            alerts={summary?.alerts || []}
          />
        );
      case 'checklists':
        return renderChecklistsDeck();
      case 'armoury':
        return <ArmourySecurity />;
      case 'engineering':
        return <EngineeringCommand />;
      case 'hazard':
        return <HazardEmergency />;
      case 'personnel':
        return <PersonnelDossier />;
      case 'analytics':
        return (
          <IntelligenceAnalytics
            severityDistribution={summary?.severityDistribution}
            moduleSummaries={summary?.moduleSummaries}
          />
        );
      default:
        return null;
    }
  };

  // Immersive two-column Split Audit Deck
  const renderChecklistsDeck = () => {
    return (
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Tactical Audits List Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-sky-500/10 bg-slate-950/80 p-6 relative overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 to-slate-950/50 pointer-events-none"></div>
            
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
                <Layers3 className="h-5 w-5 text-sky-400 animate-pulse" />
                Audit Registers
              </h3>
              <span className="text-[10px] font-mono text-slate-500 uppercase">SYS_INDEX: {inspections.length}</span>
            </div>

            {/* Modules Filter selection pills */}
            <div className="mt-4 space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block">SELECT OPERATIONAL MODULE</span>
              <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900/50 border border-slate-900 rounded-xl">
                {modules.map((mod) => (
                  <button
                    key={mod.moduleCode}
                    onClick={() => setActiveModule(mod.moduleCode)}
                    className={`flex-1 min-w-[70px] px-2 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider text-center transition-all ${
                      activeModule === mod.moduleCode
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                    type="button"
                  >
                    {mod.title.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* New inspection dossier input */}
            <div className="mt-4 space-y-2 border-t border-slate-900 pt-4">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block">INITIALIZE AUDIT DOSSIER</span>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-sky-500/30"
                  placeholder={activeModuleDefinition ? `New ${activeModuleDefinition.title}...` : 'Dossier description...'}
                  value={newInspectionTitle}
                  onChange={(e) => setNewInspectionTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleCreateInspection(); }}
                />
                <button
                  onClick={() => void handleCreateInspection()}
                  className="rounded-xl bg-sky-500/20 px-3 py-2 text-xs font-black uppercase text-sky-300 hover:bg-sky-500/30 transition-all"
                  type="button"
                >
                  INITIALIZE
                </button>
              </div>
            </div>

            {/* Inspections list */}
            <div className="mt-6 border-t border-slate-900 pt-4 space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {inspections.length === 0 ? (
                <p className="text-xs text-slate-500 font-mono text-center py-6 uppercase">No tactical dossiers recorded</p>
              ) : (
                inspections.map((ins) => {
                  const isSelected = selectedInspectionId === ins._id;
                  return (
                    <button
                      key={ins._id}
                      onClick={() => setSelectedInspectionId(ins._id)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all duration-300 relative ${
                        isSelected
                          ? 'border-sky-500/40 bg-sky-950/80 shadow-[0_0_15px_rgba(56,182,255,0.08)]'
                          : 'border-slate-900 bg-slate-950/40 hover:border-slate-800'
                      }`}
                      type="button"
                    >
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                        <span>{ins.complianceBand}</span>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          ins.status === 'completed' || ins.status === 'approved' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'
                        }`}></span>
                      </div>
                      <h4 className="text-xs font-black uppercase text-white mt-1.5 tracking-wide line-clamp-1">{ins.title}</h4>
                      <div className="mt-3 flex items-center justify-between text-[9px] font-mono border-t border-slate-900/60 pt-2 text-slate-400">
                        <span>SCORE: {ins.scoreOverall}%</span>
                        <span className="uppercase text-slate-500">POSTURE: {ins.status}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Tactical Assessment Panel */}
        <div className="lg:col-span-8">
          {detail ? (
            <TacticalAssessment
              detail={detail}
              onChange={async () => {
                const refreshed = await getInspectionDetail(detail.inspection._id);
                setDetail(refreshed as InspectionDetail);
                await loadDashboard(activeModule);
              }}
            />
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 p-12 text-center h-[520px] flex flex-col items-center justify-center space-y-4">
              <Fingerprint className="h-14 w-14 text-sky-500/30 animate-pulse" />
              <div className="space-y-1 max-w-sm">
                <h4 className="text-xs font-black uppercase text-white tracking-widest font-mono">ENCRYPTED TACTICAL STREAM</h4>
                <p className="text-[10px] text-slate-500 uppercase leading-relaxed font-mono">
                  Select an active audit dossier in the left-hand command list to disengage decryption locks and initialize evaluation interface.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,182,255,0.06),transparent_40%),linear-gradient(180deg,#03050d_0%,#050816_65%,#010208_100%)] text-white relative flex flex-col font-sans">
      {/* Background architectural grid sweep */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,182,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(56,182,255,0.01)_1px,transparent_1px)] bg-[size:35px_35px] pointer-events-none"></div>
      
      {/* ── COMMAND HUB SYSTEM BAR / HEADER ── */}
      <header className="sticky top-0 z-30 border-b border-sky-500/10 bg-slate-950/85 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-sky-500/20 to-transparent"></div>
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4 relative z-10">
          
          {/* Identity details */}
          <div className="flex items-center gap-4">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-500/5 text-sky-400">
              <Radar className="h-5 w-5 animate-spin" style={{ animationDuration: '15s' }} />
              <span className="absolute inset-0.5 rounded-lg border border-dashed border-sky-400/10"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black uppercase tracking-[0.25em] text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded bg-sky-500/5">
                  SECURE NET DIRECT LINK
                </span>
                <span className="text-[8px] font-mono text-slate-500">ORBITAL GRID: {liveCoords.lat}</span>
              </div>
              <h1 className="mt-1 text-base font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                DDSE COMMAND DIRECTORY
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              </h1>
              <p className="text-[10px] font-mono text-slate-400">
                {user.fullName} · ID: {user.serviceNumber} · clearance: {user.roleCode.toUpperCase().replaceAll('_', ' ')}
              </p>
            </div>
          </div>

          {/* Secure authorization alert indicators */}
          <div className="flex items-center gap-4">
            {pendingApprovals.length > 0 && (
              <button
                onClick={() => setAuthQueueOpen(true)}
                className="hidden sm:flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] font-mono font-black text-amber-300 animate-pulse hover:border-amber-400 transition"
                type="button"
              >
                <Siren className="h-4 w-4 animate-bounce" />
                AUTHORIZATION REQUIRED ({pendingApprovals.length})
              </button>
            )}

            <div className="hidden lg:text-right font-mono text-xs text-slate-400 border-l border-slate-900 pl-4">
              <p className="text-[9px] uppercase tracking-wider text-slate-500">TACTICAL SYS TIME</p>
              <p className="font-bold text-sky-300 flex items-center justify-end gap-1">
                <Clock className="h-3.5 w-3.5" />
                {systemTime}
              </p>
            </div>

            <button
              onClick={() => void onLogout()}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-rose-300 hover:bg-rose-500/15 transition-all"
              type="button"
            >
              <LogOut className="h-4 w-4" />
              DE-AUTHORIZE
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden flex items-center justify-center p-2 rounded-xl border border-slate-800 bg-slate-900/60"
              type="button"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* ── CORE OPERATIONS COCKPIT LAYOUT ── */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-8 flex flex-col xl:flex-row gap-8 relative z-20">
        
        {/* Left Side Sidebar Dock (Cockpit console controls) */}
        <aside className="hidden xl:flex flex-col w-[280px] shrink-0 space-y-6">
          <div className="rounded-3xl border border-sky-500/10 bg-slate-950/70 p-5 space-y-4 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-500/30 to-transparent"></div>
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-900">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TACTICAL DECKS</span>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">ONLINE</span>
            </div>

            {/* Deck buttons */}
            <nav className="space-y-2">
              {DECKS.map((deck) => {
                const active = currentDeck === deck.id;
                const IconComponent = deck.icon;
                return (
                  <button
                    key={deck.id}
                    onClick={() => {
                      setCurrentDeck(deck.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-start gap-3.5 p-3 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                      active
                        ? 'border-sky-500/35 bg-sky-500/10 text-sky-400 font-bold shadow-[0_0_15px_rgba(56,182,255,0.08)]'
                        : 'border-transparent text-slate-400 hover:border-slate-800/80 hover:bg-slate-900/20'
                    }`}
                    type="button"
                  >
                    {active && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500"></div>
                    )}
                    <IconComponent className={`h-5 w-5 shrink-0 mt-0.5 transition-colors ${
                      active ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`} />
                    <div className="text-left font-sans">
                      <span className={`text-xs block font-bold tracking-wide uppercase transition-colors ${
                        active ? 'text-white font-black' : 'text-slate-300 group-hover:text-slate-100'
                      }`}>
                        {deck.label}
                      </span>
                      <span className="text-[9px] block text-slate-500 mt-1 uppercase tracking-wider">
                        {deck.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Diagnostic Widget */}
          <div className="rounded-3xl border border-slate-900 bg-slate-950/40 p-5 space-y-3 font-mono text-[10px] text-slate-500">
            <div className="flex justify-between items-center border-b border-slate-900/60 pb-2">
              <span className="font-bold text-slate-400 flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-sky-500" />
                MAINFRAME STATUS
              </span>
              <span className="text-emerald-400 animate-pulse">OPTIMAL</span>
            </div>
            <p>COMMS INTEGRITY: 99.8% SIGN</p>
            <p>CRYPTO LINK: SHA-256 AES</p>
            <p>POSTURE RATIO: DEFCON NOMINAL</p>
          </div>
        </aside>

        {/* ── MOBILE SYSTEM DOCK DRAWER OVERLAYS ── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              className="fixed inset-y-0 left-0 z-40 w-full max-w-xs bg-slate-950 border-r border-slate-900 p-6 flex flex-col space-y-6 shadow-2xl xl:hidden"
            >
              <div className="flex justify-between items-center border-b border-slate-900 pb-4">
                <span className="text-xs font-black uppercase text-white font-mono">COMMAND POST CONSOLE</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg bg-slate-900 text-slate-400"
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-2 overflow-y-auto">
                {DECKS.map((deck) => {
                  const active = currentDeck === deck.id;
                  const IconComponent = deck.icon;
                  return (
                    <button
                      key={deck.id}
                      onClick={() => {
                        setCurrentDeck(deck.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3.5 p-4 rounded-xl border transition-all ${
                        active
                          ? 'border-sky-500/35 bg-sky-500/10 text-sky-400 font-bold'
                          : 'border-transparent text-slate-400 hover:bg-slate-900/40'
                      }`}
                      type="button"
                    >
                      <IconComponent className="h-5 w-5 shrink-0" />
                      <div className="text-left">
                        <span className="text-xs block font-bold uppercase tracking-wider text-white">
                          {deck.label}
                        </span>
                        <span className="text-[9px] block text-slate-500 mt-0.5">
                          {deck.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MAIN DECK RENDER CONSOLE PANEL ── */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="rounded-3xl border border-sky-500/10 bg-slate-950/60 p-12 text-center h-[520px] flex flex-col items-center justify-center space-y-4">
              <Radar className="h-14 w-14 text-sky-400 animate-spin" />
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-widest text-white font-mono">ESTABLISHING ORBITAL DUPLEX</h4>
                <p className="text-[10px] text-slate-500 uppercase font-mono">Synchronizing strategic posturing telemetry... Please standby</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentDeck}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="w-full"
              >
                {renderDeck()}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

      </div>

      {/* ── COMMAND REGISTRATIONS DOCK MODAL (PENDING APPROVALS) ── */}
      <AnimatePresence>
        {authQueueOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl border border-amber-500/30 bg-slate-950 p-6 shadow-2xl space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none"></div>

              <div className="flex justify-between items-center pb-3 border-b border-slate-900">
                <div className="flex items-center gap-2 text-amber-400">
                  <Key className="h-5 w-5 animate-pulse" />
                  <h4 className="text-sm font-black uppercase tracking-widest">TACTICAL ACCESS REGISTRATION AUTHORIZATIONS</h4>
                </div>
                <button
                  onClick={() => setAuthQueueOpen(false)}
                  className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                {pendingApprovals.map((approval) => (
                  <div 
                    key={String(approval.approvalId)} 
                    className="rounded-2xl border border-slate-900 bg-slate-950/60 p-4 space-y-4 relative overflow-hidden group hover:border-amber-500/20 transition-all duration-300"
                  >
                    {/* Blinking indicator LED */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 font-mono text-[8px] text-amber-500 font-bold border border-amber-500/10 px-2 py-0.5 rounded bg-amber-500/5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>
                      SECURE_PENDING
                    </div>

                    <div className="space-y-1 font-mono">
                      <span className="text-[9px] text-slate-500 uppercase block">REQUESTED IDENTITY</span>
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider">{String(approval.fullName)}</h5>
                      <p className="text-[10px] text-slate-400 uppercase pt-0.5">
                        SERVICE NO: {String(approval.serviceNumber)} · ROLE: {String(approval.requestedRoleCode).replaceAll('_', ' ')}
                      </p>
                    </div>

                    <div className="flex gap-2 border-t border-slate-900/60 pt-3">
                      <button
                        onClick={async () => {
                          try {
                            await approveRegistration(String(approval.approvalId), 'approved');
                            await loadDashboard(activeModule);
                            toast.success('Access keys generated and authorized.');
                            if (pendingApprovals.length <= 1) {
                              setAuthQueueOpen(false);
                            }
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : 'Error approving registration.');
                          }
                        }}
                        className="flex-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 py-2 text-[10px] font-black uppercase text-emerald-300 transition-all"
                        type="button"
                      >
                        AUTHORIZE_KEY
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await approveRegistration(String(approval.approvalId), 'rejected');
                            await loadDashboard(activeModule);
                            toast.warning('Access registration rejected.');
                            if (pendingApprovals.length <= 1) {
                              setAuthQueueOpen(false);
                            }
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : 'Error rejecting registration.');
                          }
                        }}
                        className="flex-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 py-2 text-[10px] font-black uppercase text-rose-300 transition-all"
                        type="button"
                      >
                        REJECT_ACCESS
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
