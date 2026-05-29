// DDSE Operational Readiness Engine
// Computes multi-dimensional readiness scores for the command center.
// Inputs: inspection scores, open hazards, overdue actions, project states.
// Outputs: ReadinessReport consumed by ReadinessPage + dashboard widgets.

import {
  MOCK_INSPECTIONS,
  MOCK_HAZARD_ASSESSMENTS,
  MOCK_PROJECTS,
  MOCK_REPORTS,
} from './mock-data';
import { DIRECTORATES, type DirectorateCode } from '../constants/app';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReadinessBand = 'A' | 'B' | 'C' | 'D' | 'F';
export type ReadinessTrend = 'UP' | 'DOWN' | 'STABLE';
export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ReadinessDimension {
  label:  string;
  score:  number;       // 0–100
  band:   ReadinessBand;
  trend:  ReadinessTrend;
  detail: string;
}

export interface ReadinessAlert {
  id:       string;
  severity: AlertSeverity;
  module:   string;
  message:  string;
  action?:  string;
}

export interface DirectorateReadiness {
  code:         DirectorateCode;
  name:         string;
  score:        number;
  band:         ReadinessBand;
  openHazards:  number;
  activeProjects: number;
  pendingInspections: number;
}

export interface ReadinessReport {
  overall:      ReadinessDimension;
  dimensions:   Record<'safety' | 'compliance' | 'projects' | 'personnel', ReadinessDimension>;
  directorates: DirectorateReadiness[];
  alerts:       ReadinessAlert[];
  generatedAt:  number;
  nextReviewAt: number;
}

// ─── Band thresholds ─────────────────────────────────────────────────────────

export function scoreToBand(score: number): ReadinessBand {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'F';
}

export function bandColor(band: ReadinessBand): string {
  const map: Record<ReadinessBand, string> = {
    A: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    B: 'text-sky-400     border-sky-500/30     bg-sky-500/10',
    C: 'text-amber-400   border-amber-500/30   bg-amber-500/10',
    D: 'text-orange-400  border-orange-500/30  bg-orange-500/10',
    F: 'text-rose-400    border-rose-500/30    bg-rose-500/10',
  };
  return map[band];
}

export function bandLabel(band: ReadinessBand): string {
  const map: Record<ReadinessBand, string> = {
    A: 'FULLY OPERATIONAL',
    B: 'OPERATIONAL',
    C: 'LIMITED CAPABILITY',
    D: 'DEGRADED',
    F: 'NON-OPERATIONAL',
  };
  return map[band];
}

// ─── Score computation ────────────────────────────────────────────────────────

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function computeSafetyScore(): { score: number; alerts: ReadinessAlert[] } {
  const alerts: ReadinessAlert[] = [];
  const criticalHazards = MOCK_HAZARD_ASSESSMENTS.filter((h) => h.riskLevel === 'CRITICAL').length;
  const highHazards     = MOCK_HAZARD_ASSESSMENTS.filter((h) => h.riskLevel === 'HIGH').length;
  // workflowStatus values: 'pending_review' | 'action_required' | 'closed' | 'escalated'
  const openHazards     = MOCK_HAZARD_ASSESSMENTS.filter(
    (h) => h.workflowStatus !== 'closed'
  ).length;
  const total           = MOCK_HAZARD_ASSESSMENTS.length || 1;

  if (criticalHazards > 0) {
    alerts.push({
      id:       'safety-critical',
      severity: 'CRITICAL',
      module:   'Safety',
      message:  `${criticalHazards} critical hazard${criticalHazards > 1 ? 's' : ''} unresolved`,
      action:   'Escalate to safety officer immediately',
    });
  }

  let score = 100;
  score -= criticalHazards * 15;
  score -= highHazards     * 8;
  score -= ((openHazards / total) * 20);
  return { score: clamp(score), alerts };
}

function computeComplianceScore(): { score: number; alerts: ReadinessAlert[] } {
  const alerts: ReadinessAlert[] = [];

  const submitted = MOCK_INSPECTIONS.filter(
    (i) => i.status === 'submitted' || i.status === 'approved'
  );
  const avgScore  = submitted.length
    ? submitted.reduce((s, i) => s + i.score, 0) / submitted.length
    : 50;

  const inProgress = MOCK_INSPECTIONS.filter((i) => i.status === 'in_progress').length;

  if (inProgress > 2) {
    alerts.push({
      id:       'compliance-overdue',
      severity: 'HIGH',
      module:   'Compliance',
      message:  `${inProgress} inspections still in progress — may become overdue`,
      action:   'Review and expedite inspection completions',
    });
  }

  const score = clamp(avgScore * 0.8 + (inProgress === 0 ? 20 : Math.max(0, 20 - inProgress * 4)));
  return { score, alerts };
}

function computeProjectScore(): { score: number; alerts: ReadinessAlert[] } {
  const alerts: ReadinessAlert[] = [];

  const active    = MOCK_PROJECTS.filter((p) => p.status === 'in_progress');
  const delayed   = active.filter((p) => p.completionPercent < 40).length;
  const completed = MOCK_PROJECTS.filter((p) => p.status === 'completed').length;
  const total     = MOCK_PROJECTS.length || 1;

  if (delayed > 1) {
    alerts.push({
      id:       'projects-delayed',
      severity: 'MEDIUM',
      module:   'Projects',
      message:  `${delayed} active projects below 40% completion`,
      action:   'Review project timelines and resource allocation',
    });
  }

  const completionRate = (completed / total) * 100;
  const activeHealth   = delayed === 0 ? 30 : Math.max(0, 30 - delayed * 8);
  const score          = clamp(completionRate * 0.7 + activeHealth);
  return { score, alerts };
}

function computePersonnelScore(): { score: number; alerts: ReadinessAlert[] } {
  const alerts: ReadinessAlert[] = [];

  const openReports    = MOCK_REPORTS.filter((r) => r.status === 'pending_review').length;
  const draftReports   = MOCK_REPORTS.filter((r) => r.status === 'draft').length;

  if (openReports > 3) {
    alerts.push({
      id:       'personnel-queue',
      severity: 'LOW',
      module:   'Personnel',
      message:  `${openReports} reports pending review in the approval queue`,
      action:   'Assign reviewers to clear the backlog',
    });
  }

  let score = 100;
  score -= openReports  * 5;
  score -= draftReports * 2;
  return { score: clamp(score), alerts };
}

// ─── Per-directorate scoring ──────────────────────────────────────────────────

const DIRECTORATE_NAMES: Record<DirectorateCode, string> = {
  DESE: 'Director of Engineer Services',
  DEME: 'Director of Mechanical & Electrical',
  DQMS: 'Director of Quartering & Military Survey',
  DWE:  'Director of Works & Engineering',
};

function computeDirectorateReadiness(): DirectorateReadiness[] {
  return (DIRECTORATES as unknown as DirectorateCode[]).map((code) => {
    const projCount  = MOCK_PROJECTS.filter((p) => p.directorateCode === code).length;
    const hazCount   = MOCK_HAZARD_ASSESSMENTS.filter(
      (h) => h.directorateCode === code && h.workflowStatus !== 'closed'
    ).length;
    const inspCount  = MOCK_INSPECTIONS.filter(
      (i) => i.status === 'in_progress'
    ).length;

    // Deterministic pseudo-score per directorate (varies by code)
    const baseScores: Record<DirectorateCode, number> = {
      DESE: 82, DEME: 74, DQMS: 91, DWE: 68,
    };
    const score = clamp(baseScores[code] - hazCount * 5 - inspCount * 2);

    return {
      code,
      name:               DIRECTORATE_NAMES[code],
      score,
      band:               scoreToBand(score),
      openHazards:        hazCount,
      activeProjects:     projCount,
      pendingInspections: inspCount,
    };
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function generateReadinessReport(): ReadinessReport {
  const safety     = computeSafetyScore();
  const compliance = computeComplianceScore();
  const projects   = computeProjectScore();
  const personnel  = computePersonnelScore();

  const overallScore = clamp(
    safety.score     * 0.35 +
    compliance.score * 0.30 +
    projects.score   * 0.20 +
    personnel.score  * 0.15
  );

  const allAlerts = [
    ...safety.alerts,
    ...compliance.alerts,
    ...projects.alerts,
    ...personnel.alerts,
  ].sort((a, b) => {
    const order: Record<AlertSeverity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return order[a.severity] - order[b.severity];
  });

  const dim = (
    label: string,
    score: number,
    trend: ReadinessTrend,
    detail: string
  ): ReadinessDimension => ({
    label, score, band: scoreToBand(score), trend, detail,
  });

  return {
    overall: dim('Overall Readiness', overallScore, 'STABLE', 'Composite score across all operational domains'),
    dimensions: {
      safety:     dim('Safety & Hazard',     safety.score,     'UP',     'Open hazards, risk levels, corrective action status'),
      compliance: dim('Inspection Compliance', compliance.score, 'STABLE', 'Inspection completion rates and average scores'),
      projects:   dim('Project Readiness',   projects.score,   'DOWN',   'Active project progress and milestone adherence'),
      personnel:  dim('Personnel & Admin',   personnel.score,  'UP',     'Approval queue depth and report management'),
    },
    directorates: computeDirectorateReadiness(),
    alerts:       allAlerts,
    generatedAt:  Date.now(),
    nextReviewAt: Date.now() + 4 * 60 * 60 * 1000, // 4 hours
  };
}

// Memoized — recomputes at most once per minute
let _cached:    ReadinessReport | null = null;
let _cachedAt:  number                 = 0;
const CACHE_TTL = 60_000;

export function getReadinessReport(): ReadinessReport {
  if (!_cached || Date.now() - _cachedAt > CACHE_TTL) {
    _cached   = generateReadinessReport();
    _cachedAt = Date.now();
  }
  return _cached;
}

export function invalidateReadinessCache(): void {
  _cached = null;
}
