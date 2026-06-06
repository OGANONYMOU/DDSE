// I-12: AI insights now derived from real Supabase data, not mock arrays.
// Heuristic analysis runs on live inspection, hazard, project, and report data.

import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InsightType =
  | 'risk_prediction' | 'recommendation' | 'anomaly'
  | 'trend' | 'performance' | 'compliance_gap';

export type InsightPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface OperationalInsight {
  id:          string;
  type:        InsightType;
  priority:    InsightPriority;
  title:       string;
  summary:     string;
  detail:      string;
  confidence:  number;
  module:      string;
  dataPoints:  string[];
  action?:     string;
  entityId?:   string;
  generatedAt: number;
}

export interface InsightReport {
  insights:     OperationalInsight[];
  riskScore:    number;
  anomalyCount: number;
  topPriority:  InsightPriority;
  generatedAt:  number;
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

interface LiveData {
  hazards:    Array<{ id: string; risk_level: string; category: string; hazard_title: string; project_code: string | null; workflow_status: string }>;
  inspections:Array<{ id: string; status: string; final_score: number | null; risk_band: string | null; directorate_code: string }>;
  projects:   Array<{ id: string; status: string; title: string; completion_percent: number; risk_level: string }>;
  reports:    Array<{ id: string; title: string; status: string; type: string }>;
}

async function fetchLiveData(): Promise<LiveData> {
  const [hazResult, insResult, projResult, repResult] = await Promise.all([
    supabase.from('hazard_assessments')
      .select('id, risk_level, category, hazard_title, project_code, workflow_status')
      .neq('workflow_status', 'closed')
      .limit(200),
    supabase.from('inspections')
      .select('id, status, final_score, risk_band, directorate_code')
      .neq('status', 'draft')
      .limit(200),
    supabase.from('projects')
      .select('id, status, title, completion_percent, risk_level')
      .neq('status', 'cancelled')
      .limit(200),
    supabase.from('reports')
      .select('id, title, status, type')
      .limit(200),
  ]);

  return {
    hazards:     hazResult.data  ?? [],
    inspections: insResult.data  ?? [],
    projects:    projResult.data ?? [],
    reports:     repResult.data  ?? [],
  };
}

// ─── Heuristic analyzers (same logic, real data) ─────────────────────────────

function analyzeHazardPatterns(data: LiveData): OperationalInsight[] {
  const results: OperationalInsight[] = [];
  const criticals = data.hazards.filter((h) => h.risk_level === 'CRITICAL');
  const byCategory: Record<string, number> = {};
  for (const h of data.hazards) {
    byCategory[h.category] = (byCategory[h.category] ?? 0) + 1;
  }
  const recurring = Object.entries(byCategory)
    .filter(([, c]) => c >= 2)
    .sort(([, a], [, b]) => b - a);

  if (recurring.length > 0) {
    const [topCat, topCount] = recurring[0];
    results.push({
      id: 'insight-recurring-hazard', type: 'risk_prediction', priority: 'HIGH',
      title:   'Recurring Hazard Pattern Detected',
      summary: `${topCat} hazards appearing in ${topCount} assessments`,
      detail:  `Category "${topCat}" has been flagged ${topCount} times — indicates a systemic issue rather than isolated incidents. Immediate root-cause review recommended.`,
      confidence: 82, module: 'Safety',
      dataPoints: [`${data.hazards.length} live assessments analyzed`, ...recurring.slice(0, 3).map(([c, n]) => `${c}: ${n} occurrences`)],
      action:  `Conduct root-cause review of all ${topCat} findings and issue standing order to contractors`,
      generatedAt: Date.now(),
    });
  }

  if (criticals.length > 0) {
    results.push({
      id: 'insight-critical-hazards', type: 'anomaly', priority: 'CRITICAL',
      title:   `${criticals.length} Critical Hazard${criticals.length > 1 ? 's' : ''} Unmitigated`,
      summary: 'Critical-risk hazards remain open — potential stop-work condition',
      detail:  `${criticals.length} CRITICAL hazards are still active. These require immediate corrective action before site work continues.`,
      confidence: 95, module: 'Safety',
      dataPoints: criticals.slice(0, 5).map((h) => `${h.hazard_title}${h.project_code ? ` (${h.project_code})` : ''}`),
      action:  'Issue stop-work notification and escalate to Director level',
      entityId: criticals[0].id,
      generatedAt: Date.now(),
    });
  }

  return results;
}

function analyzeComplianceTrends(data: LiveData): OperationalInsight[] {
  const results: OperationalInsight[] = [];
  const scored = data.inspections.filter((i) => i.final_score != null);

  if (scored.length === 0) return results;

  const avgScore = scored.reduce((s, i) => s + (i.final_score ?? 0), 0) / scored.length;
  const failing  = scored.filter((i) => (i.final_score ?? 0) < 60);
  const fRate    = Math.round((failing.length / scored.length) * 100);

  if (fRate > 20) {
    results.push({
      id: 'insight-low-compliance', type: 'compliance_gap', priority: fRate > 40 ? 'CRITICAL' : 'HIGH',
      title:   `${fRate}% Inspection Failure Rate Detected`,
      summary: `${failing.length} of ${scored.length} inspections scoring below 60`,
      detail:  `Average platform compliance score is ${avgScore.toFixed(1)}%. ${failing.length} inspections have scored in the F band (< 60). Systemic quality control improvements are required.`,
      confidence: 90, module: 'Inspections',
      dataPoints: [`Average score: ${avgScore.toFixed(1)}`, `Failing: ${failing.length} / ${scored.length}`, `Failure rate: ${fRate}%`],
      action:  'Review low-scoring inspections and initiate targeted inspector training',
      generatedAt: Date.now(),
    });
  } else if (avgScore > 80) {
    results.push({
      id: 'insight-good-compliance', type: 'performance', priority: 'LOW',
      title:   `Strong Compliance: ${avgScore.toFixed(0)}% Average Score`,
      summary: 'Platform inspection scores are tracking above target threshold',
      detail:  `The current average inspection score of ${avgScore.toFixed(1)} exceeds the 75-point target. Maintain current quality assurance practices.`,
      confidence: 88, module: 'Inspections',
      dataPoints: [`${scored.length} scored inspections`, `Target: 75`, `Actual: ${avgScore.toFixed(1)}`],
      generatedAt: Date.now(),
    });
  }

  return results;
}

function analyzeProjectHealth(data: LiveData): OperationalInsight[] {
  const results: OperationalInsight[] = [];
  const stalled = data.projects.filter((p) => p.status === 'in_progress' && p.completion_percent < 20);
  const onHold  = data.projects.filter((p) => p.status === 'on_hold');
  const critRisk = data.projects.filter((p) => p.risk_level === 'CRITICAL');

  if (stalled.length > 0) {
    results.push({
      id: 'insight-stalled-projects', type: 'risk_prediction', priority: 'MEDIUM',
      title:   `${stalled.length} Project${stalled.length > 1 ? 's' : ''} Stalled at Early Stage`,
      summary: 'Projects in-progress but below 20% completion may indicate mobilisation delays',
      detail:  `${stalled.length} active project${stalled.length > 1 ? 's' : ''} remain below 20% completion. Early-stage stalling often signals procurement delays, site access issues, or funding holds.`,
      confidence: 75, module: 'Projects',
      dataPoints: stalled.map((p) => `${p.title} (${p.completion_percent}%)`),
      action:  'Review programme schedules and identify blockers with project managers',
      generatedAt: Date.now(),
    });
  }

  if (critRisk.length > 0) {
    results.push({
      id: 'insight-critical-risk-projects', type: 'anomaly', priority: 'HIGH',
      title:   `${critRisk.length} Project${critRisk.length > 1 ? 's' : ''} at Critical Risk Level`,
      summary: 'Projects flagged CRITICAL require immediate risk mitigation',
      detail:  `These projects carry CRITICAL risk ratings: ${critRisk.map((p) => p.title).join(', ')}. Risk must be addressed before milestone sign-off can proceed.`,
      confidence: 85, module: 'Projects',
      dataPoints: critRisk.map((p) => p.title),
      action:  'Convene risk review board and update project risk registers',
      generatedAt: Date.now(),
    });
  }

  if (onHold.length > 0) {
    results.push({
      id: 'insight-on-hold', type: 'performance', priority: 'MEDIUM',
      title:   `${onHold.length} Project${onHold.length > 1 ? 's' : ''} on Hold`,
      summary: 'Suspended projects represent tied capital and programme risk',
      detail:  `${onHold.map((p) => p.title).join(', ')} ${onHold.length === 1 ? 'is' : 'are'} currently on hold. Each month of suspension increases the risk of programme slippage and cost escalation.`,
      confidence: 80, module: 'Projects',
      dataPoints: onHold.map((p) => p.title),
      action:  'Resolve blocking issues and establish resumption plan with contractors',
      generatedAt: Date.now(),
    });
  }

  return results;
}

function analyzeReportQueue(data: LiveData): OperationalInsight[] {
  const results: OperationalInsight[] = [];
  const pending = data.reports.filter((r) => r.status === 'pending_review');

  if (pending.length > 2) {
    results.push({
      id: 'insight-report-backlog', type: 'performance', priority: 'LOW',
      title:   'Report Review Backlog Building',
      summary: `${pending.length} reports awaiting review`,
      detail:  `${pending.length} reports are pending review. Backlogs can delay project closeout, safety certification, and financial release. Target review turnaround is 72 hours.`,
      confidence: 85, module: 'Reports',
      dataPoints: pending.slice(0, 5).map((r) => r.title),
      action:  'Assign additional reviewers or escalate the oldest pending reports',
      generatedAt: Date.now(),
    });
  }

  return results;
}

// ─── Public API ───────────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<InsightPriority, number> = {
  CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3,
};

// Cache: insights are valid for 5 minutes
let _cache:   InsightReport | null = null;
let _cacheAt: number               = 0;
const TTL = 5 * 60_000;

export async function generateInsightReport(): Promise<InsightReport> {
  const data = await fetchLiveData();

  const insights: OperationalInsight[] = [
    ...analyzeHazardPatterns(data),
    ...analyzeComplianceTrends(data),
    ...analyzeProjectHealth(data),
    ...analyzeReportQueue(data),
  ].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  const anomalyCount = insights.filter((i) => i.type === 'anomaly').length;
  const criticals    = insights.filter((i) => i.priority === 'CRITICAL').length;
  const highs        = insights.filter((i) => i.priority === 'HIGH').length;
  const riskScore    = Math.min(100, criticals * 25 + highs * 10 + anomalyCount * 15);
  const topPriority: InsightPriority = criticals > 0 ? 'CRITICAL' : highs > 0 ? 'HIGH'
    : insights.some((i) => i.priority === 'MEDIUM') ? 'MEDIUM' : 'LOW';

  const report: InsightReport = { insights, riskScore, anomalyCount, topPriority, generatedAt: Date.now() };
  _cache   = report;
  _cacheAt = Date.now();
  return report;
}

export async function getInsightReport(): Promise<InsightReport> {
  if (_cache && Date.now() - _cacheAt < TTL) return _cache;
  return generateInsightReport();
}

export function invalidateInsightCache(): void {
  _cache = null;
}
