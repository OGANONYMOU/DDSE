// DDSE Advanced Analytics Intelligence Service
// Generates predictive trends, historical analysis, contractor performance scoring,
// and recurring pattern detection from operational data.

import {
  MOCK_INSPECTIONS,
  MOCK_HAZARD_ASSESSMENTS,
  MOCK_PROJECTS,
  MOCK_COMPLIANCE_TREND,
  MOCK_MODULE_PERFORMANCE,
} from '../lib/mock-data';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrendDataPoint {
  period: string;   // month label
  value:  number;
  delta?: number;   // change from previous period
}

export interface PredictedTrend {
  label:       string;
  current:     number;
  predicted:   number;
  delta:       number;
  confidence:  number;
  direction:   'UP' | 'DOWN' | 'STABLE';
}

export interface ContractorScore {
  name:         string;
  projects:     number;
  avgScore:     number;
  onTimeRate:   number;  // % of milestones completed on time
  safetyRecord: number;  // 0–100, based on hazard frequency
  reliability:  'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
}

export interface RecurringHazard {
  category:    string;
  count:       number;
  projectIds:  string[];
  riskLevel:   string;
  trend:       'INCREASING' | 'STABLE' | 'DECREASING';
}

export interface AnalyticsSummary {
  complianceTrend:   TrendDataPoint[];
  predictedTrends:   PredictedTrend[];
  contractorScores:  ContractorScore[];
  recurringHazards:  RecurringHazard[];
  modulePerformance: Array<{ module: string; avgScore: number; inspections: number; trend: 'UP' | 'DOWN' | 'STABLE' }>;
  generatedAt:       number;
}

// ─── Trend computation ────────────────────────────────────────────────────────

function computeComplianceTrend(): TrendDataPoint[] {
  return MOCK_COMPLIANCE_TREND.map((point, i, arr) => ({
    period: point.month,
    value:  point.compliance,
    delta:  i > 0 ? point.compliance - arr[i - 1].compliance : undefined,
  }));
}

function predictNextTrend(
  label:  string,
  series: number[],
  confidence: number
): PredictedTrend {
  const len     = series.length;
  const current = series[len - 1] ?? 0;

  // Simple linear regression on last 3 data points
  const window = series.slice(-3);
  const slope  = window.length > 1
    ? (window[window.length - 1] - window[0]) / (window.length - 1)
    : 0;

  const predicted = Math.max(0, Math.min(100, Math.round(current + slope)));
  const delta     = predicted - current;
  const direction = Math.abs(delta) < 2 ? 'STABLE' : delta > 0 ? 'UP' : 'DOWN';

  return { label, current, predicted, delta, confidence, direction };
}

function computePredictedTrends(): PredictedTrend[] {
  const complianceSeries = MOCK_COMPLIANCE_TREND.map((p) => p.compliance);

  const approvedInspections = MOCK_INSPECTIONS.filter((i) => i.status === 'approved');
  const inspectionScores    = approvedInspections.map((i) => i.score);

  const hazardScores = MOCK_PROJECTS.map((p) => {
    const projectHazards = MOCK_HAZARD_ASSESSMENTS.filter((h) => h.projectId === p.id);
    const critCount = projectHazards.filter((h) => h.riskLevel === 'CRITICAL' || h.riskLevel === 'HIGH').length;
    return Math.max(0, 100 - critCount * 20);
  });

  return [
    predictNextTrend('Compliance Score', complianceSeries, 78),
    predictNextTrend('Inspection Quality', inspectionScores, 82),
    predictNextTrend('Safety Index', hazardScores, 71),
    predictNextTrend(
      'Project Completion Rate',
      [55, 60, 65, 70, Math.round(MOCK_PROJECTS.filter((p) => p.status === 'completed').length / MOCK_PROJECTS.length * 100)],
      65
    ),
  ];
}

// ─── Contractor performance ───────────────────────────────────────────────────

function computeContractorScores(): ContractorScore[] {
  const contractorMap: Record<string, { scores: number[]; hazards: number; milestones: { total: number; onTime: number } }> = {};

  for (const proj of MOCK_PROJECTS) {
    const contractor = proj.contractor ?? 'Unknown Contractor';
    if (!contractorMap[contractor]) {
      contractorMap[contractor] = { scores: [], hazards: 0, milestones: { total: 0, onTime: 0 } };
    }

    const entry = contractorMap[contractor];
    const projectHazards = MOCK_HAZARD_ASSESSMENTS.filter((h) => h.projectId === proj.id);
    entry.hazards += projectHazards.filter((h) => h.riskLevel === 'HIGH' || h.riskLevel === 'CRITICAL').length;

    // Mock milestone tracking
    entry.milestones.total  += 4;
    entry.milestones.onTime += proj.status === 'completed' ? 4 : Math.floor(proj.completionPercent / 30);
  }

  for (const insp of MOCK_INSPECTIONS) {
    const proj       = MOCK_PROJECTS.find((p) => p.id === insp.projectId);
    const contractor = proj?.contractor ?? 'Unknown Contractor';
    if (contractorMap[contractor] && insp.status === 'approved') {
      contractorMap[contractor].scores.push(insp.score);
    }
  }

  return Object.entries(contractorMap).map(([name, data]) => {
    const avgScore    = data.scores.length > 0
      ? Math.round(data.scores.reduce((s, v) => s + v, 0) / data.scores.length)
      : 70;
    const onTimeRate  = data.milestones.total > 0
      ? Math.round((data.milestones.onTime / data.milestones.total) * 100)
      : 0;
    const safetyRecord = Math.max(0, 100 - data.hazards * 15);
    const composite    = avgScore * 0.4 + onTimeRate * 0.35 + safetyRecord * 0.25;

    let reliability: ContractorScore['reliability'];
    if (composite >= 85) reliability = 'EXCELLENT';
    else if (composite >= 70) reliability = 'GOOD';
    else if (composite >= 55) reliability = 'AVERAGE';
    else reliability = 'POOR';

    return {
      name,
      projects:     MOCK_PROJECTS.filter((p) => p.contractor === name).length,
      avgScore,
      onTimeRate,
      safetyRecord,
      reliability,
    };
  }).sort((a, b) => {
    const order = { EXCELLENT: 0, GOOD: 1, AVERAGE: 2, POOR: 3 };
    return order[a.reliability] - order[b.reliability];
  });
}

// ─── Recurring hazard detection ───────────────────────────────────────────────

function detectRecurringHazards(): RecurringHazard[] {
  const byCategory: Record<string, { count: number; projectIds: string[]; risks: string[] }> = {};

  for (const h of MOCK_HAZARD_ASSESSMENTS) {
    if (!byCategory[h.category]) {
      byCategory[h.category] = { count: 0, projectIds: [], risks: [] };
    }
    byCategory[h.category].count++;
    if (!byCategory[h.category].projectIds.includes(h.projectId)) {
      byCategory[h.category].projectIds.push(h.projectId);
    }
    byCategory[h.category].risks.push(h.riskLevel);
  }

  return Object.entries(byCategory)
    .filter(([, data]) => data.count >= 1)
    .map(([category, data]) => {
      const highCount = data.risks.filter((r) => r === 'HIGH' || r === 'CRITICAL').length;
      const dominantRisk = highCount > data.count / 2 ? 'HIGH' : 'MEDIUM';

      return {
        category,
        count:      data.count,
        projectIds: data.projectIds,
        riskLevel:  dominantRisk,
        trend:      data.count >= 3 ? 'INCREASING' as const : 'STABLE' as const,
      };
    })
    .sort((a, b) => b.count - a.count);
}

// ─── Module performance ───────────────────────────────────────────────────────

function computeModulePerformance() {
  return MOCK_MODULE_PERFORMANCE.map((m) => ({
    module:       m.module,
    avgScore:     m.avgScore,
    inspections:  m.inspections,
    trend:        m.avgScore >= 80 ? 'UP' as const : m.avgScore >= 65 ? 'STABLE' as const : 'DOWN' as const,
  }));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getAnalyticsSummary(): AnalyticsSummary {
  return {
    complianceTrend:   computeComplianceTrend(),
    predictedTrends:   computePredictedTrends(),
    contractorScores:  computeContractorScores(),
    recurringHazards:  detectRecurringHazards(),
    modulePerformance: computeModulePerformance(),
    generatedAt:       Date.now(),
  };
}
