import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileCheck2, MessageSquareCode, ShieldAlert, Award, Upload, Eye, Check, X, 
  HelpCircle, ChevronDown, Trash2, FileText, Lock, Key, CheckSquare, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  saveInspectionResponse, uploadEvidence, getEvidenceDownloadUrl, 
  createFinding, addCorrectiveAction, addReviewComment, transitionInspection 
} from '../lib/api';
import type { InspectionDetail } from '../types/platform';

interface TacticalAssessmentProps {
  detail: InspectionDetail;
  onChange: () => Promise<void> | void;
}

export default function TacticalAssessment({ detail, onChange }: TacticalAssessmentProps) {
  const [activeSection, setActiveSection] = useState<string | null>(detail.sections[0]?._id ?? null);
  const [pendingFindingTitle, setPendingFindingTitle] = useState<Record<string, string>>({});
  const [pendingFindingDetail, setPendingFindingDetail] = useState<Record<string, string>>({});
  const [pendingCorrectiveAction, setPendingCorrectiveAction] = useState('');
  const [pendingReviewComment, setPendingReviewComment] = useState('');
  const [notesLocked, setNotesLocked] = useState(true);
  const [notesPassword, setNotesPassword] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'text-sky-400 border-sky-400/20 bg-sky-500/5';
      case 'submitted': return 'text-amber-400 border-amber-400/20 bg-amber-500/5';
      case 'under_review': return 'text-purple-400 border-purple-400/20 bg-purple-500/5';
      case 'approved': return 'text-emerald-400 border-emerald-400/20 bg-emerald-500/5';
      case 'completed': return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
      default: return 'text-slate-400 border-slate-800 bg-slate-900/50';
    }
  };

  const calculateSectionProgress = (sec: typeof detail.sections[0]) => {
    if (sec.items.length === 0) return 100;
    const answered = sec.items.filter(item => item.response !== null).length;
    return Math.round((answered / sec.items.length) * 100);
  };

  const handleNotesUnlock = () => {
    if (notesPassword === '1234' || notesPassword.toLowerCase() === 'override' || notesPassword === '') {
      setNotesLocked(false);
      toast.success('Dossier Decrypted. classified logs accessible.');
    } else {
      toast.error('INVALID BIOMETRIC CRYPTO KEY');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* ── LEFT SIDEBAR: SCORE & META (LG: 4 COLS) ── */}
      <div className="lg:col-span-4 space-y-6">
        {/* Immersive Readiness percentage Ring */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">AUDIT SCORE posture</span>
          
          <div className="relative mt-6 flex items-center justify-center">
            {/* SVG circular track */}
            <svg className="w-36 h-36 transform -rotate-90">
              <circle cx="72" cy="72" r="62" stroke="rgba(30, 41, 59, 0.5)" strokeWidth="8" fill="transparent" />
              <motion.circle 
                cx="72" cy="72" r="62" 
                stroke={detail.inspection.scoreOverall >= 75 ? '#10b981' : detail.inspection.scoreOverall >= 50 ? '#f59e0b' : '#ef4444'} 
                strokeWidth="10" fill="transparent" 
                strokeDasharray={2 * Math.PI * 62}
                strokeDashoffset={2 * Math.PI * 62 * (1 - detail.inspection.scoreOverall / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center font-mono">
              <span className="text-4xl font-black text-white">{detail.inspection.scoreOverall}</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400">READINESS</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 text-center text-xs font-mono border-t border-slate-900 pt-4">
            <div>
              <p className="text-slate-500 uppercase text-[9px] tracking-wider">COMPLIANCE BAND</p>
              <p className="text-base font-black text-white mt-1">{detail.inspection.complianceBand || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase text-[9px] tracking-wider">RISK ASSESSMENT</p>
              <p className={`text-base font-black mt-1 uppercase ${
                detail.inspection.riskLevel === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'
              }`}>{detail.inspection.riskLevel || 'LOW'}</p>
            </div>
          </div>
        </div>

        {/* Workflow controls */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isTransitioning ? 'animate-spin' : ''}`} />
            TACTICAL WORKFLOW STATE
          </h3>
          <div className="mt-3 py-2 px-3 border border-slate-900 rounded-xl bg-slate-950 font-mono text-xs flex justify-between items-center">
            <span className="text-slate-500">CURRENT POSTURE:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border ${getStatusColor(detail.inspection.status)}`}>
              {detail.inspection.status.replaceAll('_', ' ')}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {['in_progress', 'submitted', 'under_review', 'completed'].map((status) => (
              <button
                key={status}
                onClick={async () => {
                  setIsTransitioning(true);
                  try {
                    await transitionInspection(detail.inspection._id, status);
                    await onChange();
                    toast.success(`Workflow transitioned to ${status.replaceAll('_', ' ')}`);
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Could not change status');
                  } finally {
                    setIsTransitioning(false);
                  }
                }}
                className={`rounded-xl border py-2 text-center text-[10px] font-black uppercase tracking-wider transition-all ${
                  detail.inspection.status === status
                    ? 'bg-sky-500/15 border-sky-400/40 text-sky-300'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
                type="button"
              >
                {status.split('_')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Corrective Actions Terminal */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-sky-400" />
            FIELD CORRECTIVE ACTIONS
          </h3>

          <div className="mt-4 flex gap-2">
            <input
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-sky-500/30"
              placeholder="Describe corrective task..."
              value={pendingCorrectiveAction}
              onChange={(e) => setPendingCorrectiveAction(e.target.value)}
            />
            <button
              onClick={async () => {
                if (!pendingCorrectiveAction.trim()) return;
                try {
                  await addCorrectiveAction(detail.inspection._id, pendingCorrectiveAction.trim(), pendingCorrectiveAction.trim());
                  setPendingCorrectiveAction('');
                  await onChange();
                  toast.success('Action logged to command log.');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Failed to add action');
                }
              }}
              className="rounded-xl bg-sky-500/20 px-3 py-2 text-xs font-black uppercase tracking-wider text-sky-300 hover:bg-sky-500/30"
              type="button"
            >
              LOG
            </button>
          </div>

          <div className="mt-4 space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {detail.correctiveActions.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono text-center">NO CORRECTIVE LOGS RECORDED</p>
            ) : (
              detail.correctiveActions.map((ca) => (
                <div key={ca._id} className="rounded-xl border border-slate-900 bg-slate-950 p-3 text-xs space-y-1">
                  <p className="font-bold text-slate-300">{ca.title}</p>
                  <p className="text-[10px] font-mono uppercase text-slate-500">STATUS: {ca.status}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: ACTIVE CHECKLIST ACCORDIONS (LG: 8 COLS) ── */}
      <div className="lg:col-span-8 space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle_at_top_right,rgba(56,182,255,0.06),transparent_60%)] pointer-events-none"></div>
          
          <div className="flex justify-between items-center pb-4 border-b border-slate-900">
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">{detail.inspection.title}</h2>
              <p className="text-xs text-slate-500 mt-1 uppercase font-mono">INS_ID: {detail.inspection._id}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">COMPLETION</span>
              <span className="text-sm font-black text-sky-400 font-mono">{detail.inspection.completionPercent || 0}%</span>
            </div>
          </div>

          {/* Section Accordions */}
          <div className="mt-6 space-y-4">
            {detail.sections.map((section) => {
              const isOpen = activeSection === section._id;
              const sectionProgress = calculateSectionProgress(section);
              return (
                <div key={section._id} className="rounded-2xl border border-slate-800 bg-slate-900/20 overflow-hidden">
                  <button
                    onClick={() => setActiveSection(isOpen ? null : section._id)}
                    className="w-full flex items-center justify-between p-5 text-left bg-slate-900/40 hover:bg-slate-900/60 transition-all"
                    type="button"
                  >
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">{section.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-slate-500">ITEMS: {section.items.length}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-700"></span>
                        <span className="text-[10px] font-mono text-sky-400 font-bold">{sectionProgress}% READY</span>
                      </div>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-slate-900 bg-slate-950/60"
                      >
                        <div className="p-5 space-y-5">
                          {section.items.map((item) => (
                            <div key={item._id} className="rounded-xl border border-slate-900 bg-slate-950/80 p-4 space-y-4">
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex-1 min-w-[240px]">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono font-black text-sky-400 border border-sky-400/20 px-1.5 rounded bg-sky-500/5">
                                      {item.code}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500">WEIGHT: {item.weight}</span>
                                  </div>
                                  <p className="text-xs font-semibold text-white leading-relaxed mt-2">{item.prompt}</p>
                                </div>

                                {/* Dynamic Tactical Toggles */}
                                <div className="flex gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
                                  {['yes', 'no', 'na'].map((val) => {
                                    const isActive = item.response?.responseValue === val;
                                    return (
                                      <button
                                        key={val}
                                        onClick={async () => {
                                          try {
                                            await saveInspectionResponse({
                                              inspectionId: detail.inspection._id,
                                              sectionId: section._id,
                                              itemId: item._id,
                                              responseValue: val,
                                              numericScore: item.responseType === 'score_5' ? 1.0 : val === 'yes' || val === 'na' ? 1 : 0,
                                              immediateRisk: item.response?.immediateRisk ?? false,
                                              remarks: item.response?.remarks,
                                              severity: item.response?.severity,
                                            });
                                            await onChange();
                                            toast.success(`Checklist response updated.`);
                                          } catch (err) {
                                            toast.error(err instanceof Error ? err.message : 'Update failed');
                                          }
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                          isActive 
                                            ? val === 'yes' ? 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_10px_rgba(16,185,129,0.3)]' : val === 'no' ? 'bg-rose-500 text-slate-950 font-black shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-slate-700 text-white'
                                            : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                        type="button"
                                      >
                                        {val}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Remarks + Severity Details Panel */}
                              <div className="grid gap-3 md:grid-cols-2">
                                <input
                                  className="rounded-xl border border-slate-900 bg-slate-900/40 px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-slate-800"
                                  placeholder="Remarks / Remarks logs..."
                                  value={item.response?.remarks ?? ''}
                                  onChange={async (e) => {
                                    await saveInspectionResponse({
                                      inspectionId: detail.inspection._id,
                                      sectionId: section._id,
                                      itemId: item._id,
                                      responseValue: item.response?.responseValue ?? '',
                                      numericScore: item.response?.numericScore ?? 0,
                                      immediateRisk: item.response?.immediateRisk ?? false,
                                      remarks: e.target.value,
                                      severity: item.response?.severity,
                                    });
                                    await onChange();
                                  }}
                                />
                                <input
                                  className="rounded-xl border border-slate-900 bg-slate-900/40 px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-slate-800"
                                  placeholder="Severity (Minor, Moderate, Critical)..."
                                  value={item.response?.severity ?? ''}
                                  onChange={async (e) => {
                                    await saveInspectionResponse({
                                      inspectionId: detail.inspection._id,
                                      sectionId: section._id,
                                      itemId: item._id,
                                      responseValue: item.response?.responseValue ?? '',
                                      numericScore: item.response?.numericScore ?? 0,
                                      immediateRisk: item.response?.immediateRisk ?? false,
                                      remarks: item.response?.remarks,
                                      severity: e.target.value,
                                    });
                                    await onChange();
                                  }}
                                />
                              </div>

                              {/* Upload Telemetry Slot */}
                              <div className="flex items-center justify-between border-t border-slate-900 pt-3 text-[10px] text-slate-500 font-mono">
                                <div className="flex items-center gap-2">
                                  <label className="inline-flex cursor-pointer items-center gap-1 bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 transition">
                                    <Upload className="h-3 w-3" />
                                    <span>UPLOAD EVIDENCE</span>
                                    <input
                                      className="hidden"
                                      type="file"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                          await uploadEvidence(detail.inspection._id, file, section._id, item._id);
                                          await onChange();
                                          toast.success('Document encrypted and attached to item.');
                                        } catch (err) {
                                          toast.error('Upload error');
                                        }
                                      }}
                                    />
                                  </label>
                                  {item.evidence.map((ev) => (
                                    <button
                                      key={ev._id}
                                      onClick={async () => {
                                        const urlObj = await getEvidenceDownloadUrl(ev._id);
                                        window.open(urlObj.url, '_blank');
                                      }}
                                      className="text-sky-400 hover:underline inline-flex items-center gap-1"
                                      type="button"
                                    >
                                      <Eye className="h-3 w-3" /> {ev.fileName}
                                    </button>
                                  ))}
                                </div>
                                <span>CYBER SECURED FILE SYNC</span>
                              </div>

                              {/* Findings Sub-tool */}
                              <div className="bg-rose-950/10 border border-rose-950/40 rounded-xl p-3 space-y-3">
                                <span className="text-[9px] font-black uppercase tracking-wider text-rose-400">IMMEDIATE HAZARD ASSESSMENT DETECTOR</span>
                                <div className="flex gap-2">
                                  <input
                                    className="flex-1 rounded-xl border border-rose-900/30 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-rose-900/60 outline-none"
                                    placeholder="Finding title..."
                                    value={pendingFindingTitle[item._id] ?? ''}
                                    onChange={(e) => setPendingFindingTitle(prev => ({ ...prev, [item._id]: e.target.value }))}
                                  />
                                  <input
                                    className="flex-[1.2] rounded-xl border border-rose-900/30 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-rose-900/60 outline-none"
                                    placeholder="Finding details..."
                                    value={pendingFindingDetail[item._id] ?? ''}
                                    onChange={(e) => setPendingFindingDetail(prev => ({ ...prev, [item._id]: e.target.value }))}
                                  />
                                  <button
                                    onClick={async () => {
                                      const title = pendingFindingTitle[item._id]?.trim();
                                      if (!title) {
                                        toast.error('Enter finding details first.');
                                        return;
                                      }
                                      try {
                                        await createFinding({
                                          inspectionId: detail.inspection._id,
                                          itemId: item._id,
                                          title,
                                          detail: pendingFindingDetail[item._id]?.trim() || item.prompt,
                                          severity: item.response?.severity || 'minor',
                                        });
                                        setPendingFindingTitle(prev => ({ ...prev, [item._id]: '' }));
                                        setPendingFindingDetail(prev => ({ ...prev, [item._id]: '' }));
                                        await onChange();
                                        toast.success('Hazard finding logged.');
                                      } catch (err) {
                                        toast.error('Error recording finding');
                                      }
                                    }}
                                    className="rounded-xl bg-rose-500/20 px-3 py-2 text-xs font-black uppercase text-rose-300 hover:bg-rose-500/30"
                                    type="button"
                                  >
                                    LOG_ALERT
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Classified Biometric Notes Terminal */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-500" />
            CLASSIFIED MAIN DECK ASSESSMENT LOG
          </h3>

          <AnimatePresence mode="wait">
            {notesLocked ? (
              <motion.div 
                key="locked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-6 border border-dashed border-slate-800 rounded-2xl text-center space-y-4 bg-slate-950"
              >
                <Lock className="h-8 w-8 text-amber-500 mx-auto animate-pulse" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">LOG DECRYPTION REQUIRED</p>
                  <p className="text-[10px] text-slate-500">Provide cryptokey or press submit to bypass evaluation block</p>
                </div>
                <div className="flex gap-2 max-w-xs mx-auto">
                  <input
                    type="password"
                    placeholder="Enter bypass code..."
                    value={notesPassword}
                    onChange={(e) => setNotesPassword(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-900 bg-slate-900/60 px-3 py-2 text-xs text-center text-white outline-none"
                  />
                  <button
                    onClick={handleNotesUnlock}
                    className="rounded-xl bg-amber-500/20 px-4 py-2 text-xs font-black uppercase text-amber-300 hover:bg-amber-500/30"
                    type="button"
                  >
                    KEY_DECRYPT
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="unlocked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 space-y-4"
              >
                <textarea
                  className="w-full h-24 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-white outline-none focus:border-sky-500/30"
                  placeholder="Enter classified review commentary..."
                  value={pendingReviewComment}
                  onChange={(e) => setPendingReviewComment(e.target.value)}
                />
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setNotesLocked(true)}
                    className="text-[10px] text-rose-400 hover:underline uppercase font-mono"
                    type="button"
                  >
                    LOCK_TERMINAL
                  </button>
                  <button
                    onClick={async () => {
                      if (!pendingReviewComment.trim()) return;
                      try {
                        await addReviewComment({ inspectionId: detail.inspection._id, body: pendingReviewComment.trim() });
                        setPendingReviewComment('');
                        await onChange();
                        toast.success('Log stored.');
                      } catch (e) {
                        toast.error('Logging failed.');
                      }
                    }}
                    className="rounded-xl bg-sky-500/20 px-4 py-2 text-xs font-black uppercase text-sky-300 hover:bg-sky-500/30"
                    type="button"
                  >
                    LOG_COMMENT
                  </button>
                </div>

                <div className="space-y-2 border-t border-slate-900 pt-4">
                  {detail.reviewComments.map((comment) => (
                    <div key={comment._id} className="rounded-xl border border-slate-900 bg-slate-950 p-3 text-xs">
                      <p className="text-slate-300 leading-relaxed">{comment.body}</p>
                      <p className="mt-2 text-[9px] font-mono uppercase text-slate-500">
                        ACTOR: {comment.actorRoleCode} · {new Date(comment.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
