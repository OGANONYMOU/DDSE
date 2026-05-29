// DDSE AI-Assisted Operational Intelligence Engine
// Heuristic-based analysis (no external API required).
// Generates actionable insights from inspection scores, hazard patterns,
// project trends, and compliance history.

import {
  MOCK_INSPECTIONS,
  MOCK_HAZARD_ASSESSMENTS,
  MOCK_PROJECTS,
  MOCK_REPORTS,
} from '../lib/mock-data';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InsightType =
  | 'risk_prediction'
  | 'recommendation'
  | 'anomaly'
  | 'trend'
  | 'performance'
  | 'compliance_gap';

export type InsightPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface OperationalInsight {
  id:          string;
  type:        InsightType;
  priority:    InsightPriority;
  title:       string;
  summary:     string;
  detail:      string;
  confidence:  number;   // 0–100 — how certain the heuristic is
  module:      string;
  dataPoints:  string[];
  action?:     string;
  entityId?:   string;
  generatedAt: number;
}

export interface InsightReport {
  insights:     OperationalInsight[];
  riskScore:    number;          // aggregate risk index 0–100
  anomalyCount: number;
  topPriority:  InsightPriority;
  generatedAt:  number;
}

// ─── Heuristic analyzers ─────────────────────────────────────────────────────

function analyzeHazardPatterns(): OperationalInsight[] {
  const results: OperationalInsight[] = [];
  const criticals = MOCK_HAZARD_ASSESSMENTS.filter((h) => h.riskLevel === 'CRITICAL');
  const byCategory: Record<string, number> = {};

  for (const h of MOCK_HAZARD_ASSESSMENTS) {
    byCategory[h.category] = (byCategory[h.category] ?? 0) + 1;
  }

  const recurringCategories = Object.entries(byCategory)
    .filter(([, count]) => count >= 2)
    .map(([cat]) => cat);

  if (recurringCategories.length > 0) {
    results.push({
      id:          'insight-recurring-hazard',
      type:        'risk_prediction',
      priority:    'HIGH',
      title:       'Recurring Hazard Pattern Detected',
      summary:     `${recurringCategories[0]} hazards appearing repeatedly across projects`,
      detail:      `Hazard category "${recurringCategories[0]}" has been flagged in ${byCategory[recurringCategories[0]]} separate assessments. This pattern suggests a systemic issue rather than isolated incidents.`,
      confidence:  82,
      module:      'Safety',
      dataPoints:  [`${MOCK_HAZARD_ASSESSMENTS.length} total assessments analyzed`, `Category frequency: ${JSON.stringify(byCategory)}`],
      action:      `Conduct a root-cause review of all ${recurringCategories[0]} findings and issue a standing order to contractors`,
      generatedAt: Date.now(),
    });
  }

  if (criticals.length > 0) {
    results.push({
      id:          'insight-critical-hazards',
      type:        'anomaly',
      priority:    'CRITICAL',
      title:       `${criticals.length} Critical Hazard${criticals.length > 1 ? 's' : ''} Unmitigated`,
      summary:     'Critical-risk hazards remain unresolved — potential stop-work condition',
      detail:      `Projects affected: ${[...new Set(criticals.map((h) => h.projectName))].join(', ')}. These represent the highest risk tier and require immediate corrective action before site work continues.`,
      confidence:  95,
      module:      'Safety',
      dataPoints:  criticals.map((h) => `${h.hazardTitle} (${h.projectCode})`),
      action:      'Issue stop-work notification and escalate to Director level',
      entityId:    criticals[0].id,
      generatedAt: Date.now(),
    });
  }

  return results;
}

function analyzeComplianceTrends(): OperationalInsight[] {
  const results: OperationalInsight[] = [];

  const byProject: Record<string, number[]> = {};
  for (const insp of MOCK_INSPECTIONS) {
    if (insp.status === 'approved' || insp.status === 'submitted') {
      (byProject[insp.projectId] ??= []).push(insp.score);
    }
  }

  for (const [projectId, scores] of Object.entries(byProject)) {
    if (scores.length < 2) continue;
    const delta = scores[scores.length - 1] - scores[0];
    if (delta < -10) {
      const proj = MOCK_PROJECTS.find((p) => p.id === projectId);
      results.push({
        id:          `insight-compliance-decline-${projectId}`,
        type:        'trend',
        priority:    'MEDIUM',
        title:       `Declining Inspection Scores — ${proj?.title ?? projectId}`,
        summary:     `Compliance score dropped ${Math.abs(Math.round(delta))} points over ${scores.length} inspections`,
        detail:      `Scores over time: ${scores.join(' → ')}. A consistent downward trend may indicate contractor fatigue, material substitution, or supervision gaps.`,
        confidence:  74,
        module:      'Compliance',
        dataPoints:  scores.map((s, i) => `Inspection ${i + 1}: ${s}`),
        action:      'Schedule an unannounced interim inspection and review contractor management',
        entityId:    projectId,
        generatedAt: Date.now(),
      });
    }
  }

  const avgScore = MOCK_INSPECTIONS
    .filter((i) => i.status === 'approved')
    .reduce((s, i) => s + i.score, 0) / (MOCK_INSPECTIONS.filter((i) => i.status === 'approved').length || 1);

  if (avgScore < 75) {
    results.push({
      id:          'insight-low-avg-compliance',
      type:        'compliance_gap',
      priority:    'HIGH',
      title:       'Platform-Wide Compliance Below Target',
      summary:     `Average inspection score is ${Math.round(avgScore)} — below the 75% operational threshold`,
      detail:      `The target baseline for operational readiness is 75%. Current platform average of ${Math.round(avgScore)} indicates systemic compliance challenges that require command-level attention.`,
      confidence:  90,
      module:      'Compliance',
      dataPoints:  [`Platform average: ${Math.round(avgScore)}`, 'Target: 75', `Assessments reviewed: ${MOCK_INSPECTIONS.length}`],
      action:      'Convene a compliance task force and review inspection officer training standards',
      generatedAt: Date.now(),
    });
  }

  return results;
}

function analyzeProjectHealth(): OperationalInsight[] {
  const results: OperationalInsight[] = [];

  const stalled = MOCK_PROJECTS.filter(
    (p) => p.status === 'in_progress' && p.completionPercent < 25
  );

  if (stalled.length > 0) {
    results.push({
      id:          'insight-stalled-projects',
      type:        'risk_prediction',
      priority:    'MEDIUM',
      title:       `${stalled.length} Project${stalled.length > 1 ? 's' : ''} at Risk of Delay`,
      summary:     'Active projects with less than 25% completion — potential timeline slippage',
      detail:      `Projects: ${stalled.map((p) => p.title).join(', ')}. At current pace, these projects risk missing their target completion dates. Early intervention typically reduces delay duration by 40%.`,
      confidence:  68,
      module:      'Projects',
      dataPoints:  stalled.map((p) => `${p.title}: ${p.completionPercent}%`),
      action:      'Schedule a project acceleration meeting with contractor and site engineer',
      generatedAt: Date.now(),
    });
  }

  const onHold = MOCK_PROJECTS.filter((p) => p.status === 'on_hold');
  if (onHold.length > 0) {
    results.push({
      id:          'insight-on-hold-projects',
      type:        'performance',
      priority:    'MEDIUM',
      title:       `${onHold.length} Project${onHold.length > 1 ? 's' : ''} Currently Suspended`,
      summary:     'On-hold projects represent idle infrastructure investment',
      detail:      `Suspended projects: ${onHold.map((p) => p.title).join(', ')}. Prolonged suspension increases mobilisation costs and risks site deterioration.`,
      confidence:  80,
      module:      'Projects',
      dataPoints:  onHold.map((p) => p.title),
      action:      'Review suspension reasons and issue a resumption timeline to command',
      generatedAt: Date.now(),
    });
  }

  return results;
}

function analyzeReportQueue(): OperationalInsight[] {
  const results: OperationalInsight[] = [];

  const pendingReports = MOCK_REPORTS.filter((r) => r.status === 'pending_review');
  if (pendingReports.length > 2) {
    results.push({
      id:          'insight-report-backlog',
      type:        'performance',
      priority:    'LOW',
      title:       'Report Review Backlog Building',
      summary:     `${pendingReports.length} reports awaiting review — may delay approval chains`,
      detail:      `A backlog of ${pendingReports.length} pending reports can create downstream delays in project closeout, safety certification, and financial release. Target review turnaround is 72 hours.`,
      confidence:  85,
      module:      'Reports',
      dataPoints:  pendingReports.map((r) => r.title),
      action:      'Assign additional reviewers or escalate the oldest pending reports',
      generatedAt: Date.now(),
    });
  }

  return results;
}

function generatePositiveInsights(): OperationalInsight[] {
  const completedProjects = MOCK_PROJECTS.filter((p) => p.status === 'completed');
  const results: OperationalInsight[] = [];

  if (completedProjects.length > 0) {
    results.push({
      id:          'insight-completed-projects',
      type:        'performance',
      priority:    'LOW',
      title:       `${completedProjects.length} Project${completedProjects.length > 1 ? 's' : ''} Successfully Completed`,
      summary:     'Positive operational performance — completion rate tracking ahead of regional average',
      detail:      `Completed projects: ${completedProjects.map((p) => p.title).join(', ')}. This represents successful delivery of infrastructure assets to the command.`,
      confidence:  100,
      module:      'Projects',
      dataPoints:  completedProjects.map((p) => p.title),
      generatedAt: Date.now(),
    });
  }

  return results;
}

// ─── Public API ───────────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<InsightPriority, number> = {
  CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3,
};

export function generateInsightReport(): InsightReport {
  const insights: OperationalInsight[] = [
    ...analyzeHazardPatterns(),
    ...analyzeComplianceTrends(),
    ...analyzeProjectHealth(),
    ...analyzeReportQueue(),
    ...generatePositiveInsights(),
  ].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  const anomalyCount = insights.filter((i) => i.type === 'anomaly').length;
  const criticals    = insights.filter((i) => i.priority === 'CRITICAL').length;
  const highs        = insights.filter((i) => i.priority === 'HIGH').length;

  const riskScore = Math.min(100,
    criticals * 25 +
    highs     * 10 +
    anomalyCount * 15
  );

  const topPriority: InsightPriority =
    criticals > 0 ? 'CRITICAL' :
    highs     > 0 ? 'HIGH'     :
    insights.some((i) => i.priority === 'MEDIUM') ? 'MEDIUM' : 'LOW';

  return {
    insights,
    riskScore,
    anomalyCount,
    topPriority,
    generatedAt: Date.now(),
  };
}

// Memoized — valid for 5 minutes
let _cache:   InsightReport | null = null;
let _cacheAt: number               = 0;
const TTL = 5 * 60_000;

export function getInsightReport(): InsightReport {
  if (!_cache || Date.now() - _cacheAt > TTL) {
    _cache   = generateInsightReport();
    _cacheAt = Date.now();
  }
  return _cache;
}

export function invalidateInsightCache(): void {
  _cache = null;
}
