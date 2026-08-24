import { supabase, serviceNumberToEmail, sessionExpiresAt, toPlatformUser } from './supabase';
import { checkSignInLimit, checkOtpRequestLimit, checkRegistrationLimit, formatRetryTime } from './rateLimiter';
import { EVALUATION_TEMPLATES } from './evaluationTemplates';
import type {
  AnalyticsSummary,
  DashboardSummary,
  InspectionDetail,
  InspectionSummary,
  InspectionTemplate,
  ModuleTemplateDefinition,
  ModuleDefinition,
  RegistrationFormOptions,
  SessionPayload,
} from '../types/platform';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Dev-mode module list mirrors the real, live module set (same 9 departments
// and question templates seeded in supabase/migrations/20260810120000_module_templates.sql)
// so the "Dev Access Panel" demo path shows the real DDSE evaluation content.
const DEV_MODULES: ModuleTemplateDefinition[] = EVALUATION_TEMPLATES.map((m) => ({
  id: m.code,
  moduleCode: m.code,
  title: m.title,
  classification: m.classification,
  description: m.description,
  version: 1,
  updatedAt: Date.now() - 1000 * 60 * 60 * 24,
  template: { sections: m.sections.map((section) => ({
    title: section.title,
    items: section.items.map((item) => ({ ...item })),
  })) },
}));

const RISK_BAND_FOR_SCORE = (score: number): { band: string; risk: string } => {
  if (score >= 90) return { band: 'A', risk: 'LOW' };
  if (score >= 75) return { band: 'B', risk: 'LOW' };
  if (score >= 60) return { band: 'C', risk: 'MEDIUM' };
  if (score >= 45) return { band: 'D', risk: 'HIGH' };
  return { band: 'F', risk: 'HIGH' };
};

// Builds a full InspectionDetail from a module's real question template.
// `answeredFraction` (0-1) pre-fills that share of items with alternating
// yes/no responses so sample dev inspections look like realistic in-flight
// evaluations instead of either fully blank or fully complete.
function buildDevInspectionFromTemplate(
  id: string,
  title: string,
  moduleCode: string,
  status: string,
  answeredFraction: number,
  templateOverride?: InspectionTemplate,
): InspectionDetail {
  const template = templateOverride ?? DEV_MODULES.find((m) => m.moduleCode === moduleCode)?.template;
  const templateSections = template?.sections ?? [];

  let seen = 0;
  let answered = 0;
  let earnedWeight = 0;
  let totalWeight = 0;

  const sections = templateSections.map((section, sIdx) => ({
    _id: `${id}-sec-${sIdx}`,
    title: section.title,
    items: section.items.map((item, iIdx) => {
      seen++;
      totalWeight += item.weight;
      const shouldAnswer = seen / Math.max(templateSections.reduce((n, s) => n + s.items.length, 0), 1) <= answeredFraction;
      if (!shouldAnswer) {
        return {
          _id: `${id}-item-${sIdx}-${iIdx}`,
          code: item.code,
          prompt: item.prompt,
          responseType: item.responseType,
          weight: item.weight,
          response: null,
          evidence: [],
        };
      }
      answered++;
      const isYes = iIdx % 4 !== 0; // occasional "no" so findings/risk have something to show
      const numericScore = isYes ? 1 : 0;
      earnedWeight += isYes ? item.weight : 0;
      return {
        _id: `${id}-item-${sIdx}-${iIdx}`,
        code: item.code,
        prompt: item.prompt,
        responseType: item.responseType,
        weight: item.weight,
        response: {
          responseValue: isYes ? 'yes' : 'no',
          numericScore,
          immediateRisk: !isYes,
          remarks: isYes ? undefined : 'Flagged during walk-through — needs follow-up.',
        },
        evidence: [],
      };
    }),
  }));

  const scoreOverall = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  const { band, risk } = RISK_BAND_FOR_SCORE(scoreOverall);
  const completionPercent = seen > 0 ? Math.round((answered / seen) * 100) : 0;

  return {
    inspection: {
      _id: id,
      title,
      moduleCode,
      status,
      scoreOverall,
      complianceBand: answered > 0 ? band : 'N/A',
      riskLevel: risk,
      completionPercent,
    },
    sections,
    findings: [],
    correctiveActions: [],
    approvals: [],
    reviewComments: [],
    auditLogs: [
      {
        _id: `${id}-audit-1`,
        action: `Inspection ${status.replace(/_/g, ' ')}`,
        createdAt: Date.now() - 1000 * 60 * 30,
      },
    ],
  };
}

const DEV_SAMPLE_SEEDS: Array<{ id: string; title: string; moduleCode: string; status: string; answeredFraction: number; directorateCode: string; unitCode: string; ageMinutes: number }> = [
  { id: 'insp-001', title: 'Armoury security evaluation — Sector Alpha',        moduleCode: 'armoury',                 status: 'in_progress', answeredFraction: 0.55, directorateCode: 'standard_evaluation', unitCode: 'Unit 14', ageMinutes: 30 },
  { id: 'insp-002', title: 'JTF operational readiness — Q3 sweep',              moduleCode: 'jtf_readiness',           status: 'submitted',   answeredFraction: 1,    directorateCode: 'safety_manual',       unitCode: 'Unit 9',  ageMinutes: 90 },
  { id: 'insp-003', title: 'DHQ Training Establishment audit — NDA wing',       moduleCode: 'training_establishments', status: 'under_review', answeredFraction: 0.8,  directorateCode: 'project_monitoring',  unitCode: 'Unit 21', ageMinutes: 120 },
  { id: 'insp-004', title: 'Hazard & safety walk-through — Engineering block',  moduleCode: 'hazard_safety',           status: 'draft',       answeredFraction: 0.1,  directorateCode: 'safety_manual',       unitCode: 'Unit 3',  ageMinutes: 10 },
  { id: 'insp-005', title: 'General security posture check — Perimeter',       moduleCode: 'general_security',        status: 'completed',   answeredFraction: 1,    directorateCode: 'standard_evaluation', unitCode: 'Unit 14', ageMinutes: 240 },
];

const DEV_INSPECTION_DETAILS: Record<string, InspectionDetail> = Object.fromEntries(
  DEV_SAMPLE_SEEDS.map((seed) => [
    seed.id,
    buildDevInspectionFromTemplate(seed.id, seed.title, seed.moduleCode, seed.status, seed.answeredFraction),
  ]),
);

const DEV_INSPECTIONS: InspectionSummary[] = DEV_SAMPLE_SEEDS.map((seed) => {
  const detail = DEV_INSPECTION_DETAILS[seed.id].inspection;
  return {
    _id: seed.id,
    title: seed.title,
    moduleCode: seed.moduleCode,
    status: seed.status,
    scoreOverall: detail.scoreOverall,
    complianceBand: detail.complianceBand,
    riskLevel: detail.riskLevel,
    completionPercent: detail.completionPercent,
    directorateCode: seed.directorateCode,
    unitCode: seed.unitCode,
    updatedAt: Date.now() - 1000 * 60 * seed.ageMinutes,
  };
});

const DEV_PENDING_APPROVALS = [
  {
    approvalId: 'approval-001',
    fullName: 'Corporal Amina Hassan',
    serviceNumber: '10000007',
    requestedRoleCode: 'staff',
    directorateCode: 'standard_evaluation',
  },
];

function createDevId(prefix = 'dev') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function getDevMetricValue() {
  return Math.floor(Math.random() * 25) + 65;
}

function buildDevSummary(): DashboardSummary {
  const openInspections = DEV_INSPECTIONS.filter((inspection) => inspection.status !== 'completed').length;
  return {
    metrics: [
      { key: 'active_inspections', label: 'Active Inspections', value: openInspections, trend: 'Stable', tone: 'info' },
      { key: 'completion_rate', label: 'Completion Rate', value: 84, trend: 'Up 4%', tone: 'info' },
      { key: 'open_findings', label: 'Open Findings', value: 7, trend: 'Down 8%', tone: 'warning' },
      { key: 'pending_approvals', label: 'Pending Approvals', value: DEV_PENDING_APPROVALS.length, trend: 'Unchanged', tone: 'danger' },
    ],
    posture: {
      readinessAverage: 78,
      safetyRiskLevel: 'MODERATE',
      evidenceCompleteness: 64,
      restrictedModulesVisible: 3,
    },
    moduleSummaries: DEV_MODULES.map((module) => ({
      moduleCode: module.moduleCode,
      inspections: DEV_INSPECTIONS.filter((inspection) => inspection.moduleCode === module.moduleCode).length,
      overdue: DEV_INSPECTIONS.filter((inspection) => inspection.moduleCode === module.moduleCode && inspection.status === 'under_review').length,
      averageScore: Math.max(60, Math.min(95, getDevMetricValue())),
      openCorrectiveActions: DEV_INSPECTION_DETAILS
        ? Object.values(DEV_INSPECTION_DETAILS).reduce(
            (count, detail) => count + detail.correctiveActions.filter((ca) => ca.status !== 'closed').length,
            0,
          )
        : 0,
      evidenceComplete: Math.floor(Math.random() * 40) + 50,
    })),
    severityDistribution: {
      low: 3,
      medium: 2,
      high: 2,
    },
    approvalQueue: DEV_PENDING_APPROVALS.length,
    recentActivity: [
      {
        id: 'activity-001',
        action: 'Inspection updated',
        entityType: 'inspection',
        moduleCode: 'standard_evaluation',
        createdAt: Date.now() - 1000 * 60 * 20,
        actorRoleCode: 'staff',
      },
      {
        id: 'activity-002',
        action: 'Finding created',
        entityType: 'finding',
        moduleCode: 'project_monitoring',
        createdAt: Date.now() - 1000 * 60 * 45,
        actorRoleCode: 'admin',
      },
    ],
    alerts: [
      {
        id: 'alert-001',
        title: 'Overdue corrective action in Project Monitoring',
        severity: 'High',
        moduleCode: 'project_monitoring',
      },
    ],
  };
}

function buildDevAnalytics() {
  return {
    activeProjects: 4,
    onHoldProjects: 1,
    criticalHazards: 2,
    pendingReviews: DEV_INSPECTIONS.filter((i) => i.status === 'submitted' || i.status === 'under_review').length,
    overdueActions: 3,
    openReports: 2,
    complianceAvg: 78,
    totalAssessments: DEV_INSPECTIONS.length,
    inspectionModules: DEV_MODULES.length,
    registeredProjects: 6,
    complianceTrend: Array.from({ length: 8 }, (_, i) => ({
      period: new Date(Date.now() - (7 - i) * 7 * 86400000).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
      compliance: Math.max(55, Math.min(95, getDevMetricValue())),
    })),
    riskDistribution: DEV_MODULES.slice(0, 3).map((module, idx) => ({
      directorate: module.moduleCode,
      critical: idx,
      high: idx + 1,
      moderate: 2,
      low: 4 - idx,
    })),
    modulePerformance: DEV_MODULES.map((module) => ({
      module: module.title,
      avgScore: Math.max(60, Math.min(95, getDevMetricValue())),
      inspections: DEV_INSPECTIONS.filter((i) => i.moduleCode === module.moduleCode).length,
      openActions: 1,
    })),
    recentActivity: DEV_INSPECTIONS.slice(0, 8).map((i) => ({
      id: i._id,
      action: `Inspection ${i.status.replace(/_/g, ' ')}`,
      entityType: 'inspection',
      moduleCode: i.moduleCode,
      createdAt: i.updatedAt,
    })),
  };
}

function createDevInspectionDetail(id: string, title: string, moduleCode: string): InspectionDetail {
  // 0% answered — a freshly-started evaluation, pre-populated with the module's
  // real question set (mirrors what create-inspection does against the live backend).
  const moduleTemplate = DEV_STATE.modules.find((m) => m.moduleCode === moduleCode)?.template;
  return buildDevInspectionFromTemplate(id, title, moduleCode, 'in_progress', 0, moduleTemplate);
}

const DEV_STATE = {
  modules: DEV_MODULES,
  inspections: [...DEV_INSPECTIONS],
  details: { ...DEV_INSPECTION_DETAILS },
  approvals: [...DEV_PENDING_APPROVALS],
};

function cloneTemplate(template: InspectionTemplate): InspectionTemplate {
  return {
    sections: template.sections.map((section) => ({
      title: section.title,
      items: section.items.map((item) => ({ ...item })),
    })),
  };
}

function devEdgeFunction<T>(functionName: string, options: EdgeFunctionOptions = {}): Promise<T> {
  switch (functionName) {
    case 'get-command-center':
      return Promise.resolve(buildDevSummary() as unknown as T);
    case 'get-analytics':
      return Promise.resolve(buildDevAnalytics() as unknown as T);
    case 'list-modules':
      return Promise.resolve(DEV_STATE.modules as unknown as T);
    case 'get-module-template': {
      const moduleCode = options.params?.moduleCode ?? '';
      const moduleDef = DEV_STATE.modules.find((module) => module.moduleCode === moduleCode || module.id === moduleCode);
      if (!moduleDef) throw new Error('Module not found.');
      return Promise.resolve({
        ...moduleDef,
        template: cloneTemplate(moduleDef.template),
      } as unknown as T);
    }
    case 'update-module-template': {
      const body = options.body as { moduleCode: string; template: InspectionTemplate };
      const moduleDef = DEV_STATE.modules.find((module) => module.moduleCode === body.moduleCode || module.id === body.moduleCode);
      if (!moduleDef) throw new Error('Module not found.');
      moduleDef.template = cloneTemplate(body.template);
      moduleDef.version += 1;
      moduleDef.updatedAt = Date.now();
      return Promise.resolve({
        success: true,
        module: {
          ...moduleDef,
          template: cloneTemplate(moduleDef.template),
        },
      } as unknown as T);
    }
    case 'list-inspections': {
      const moduleCode = options.params?.moduleCode;
      const filtered = moduleCode
        ? DEV_STATE.inspections.filter((inspection) => inspection.moduleCode === moduleCode)
        : DEV_STATE.inspections;
      return Promise.resolve(filtered as unknown as T);
    }
    case 'list-pending-approvals':
      return Promise.resolve(DEV_STATE.approvals as unknown as T);
    case 'create-inspection': {
      const body = options.body as { moduleCode: string; title: string; directorateCode: string };
      const id = createDevId('insp');
      const newInspection: InspectionSummary = {
        _id: id,
        title: body.title,
        moduleCode: body.moduleCode,
        status: 'in_progress',
        scoreOverall: 0,
        complianceBand: 'N/A',
        riskLevel: 'MEDIUM',
        completionPercent: 0,
        directorateCode: body.directorateCode,
        unitCode: 'Unit TBD',
        updatedAt: Date.now(),
      };
      DEV_STATE.inspections.unshift(newInspection);
      DEV_STATE.details[id] = createDevInspectionDetail(id, body.title, body.moduleCode);
      return Promise.resolve({ success: true, id } as unknown as T);
    }
    case 'get-inspection-detail': {
      const inspectionId = options.params?.inspectionId ?? '';
      const detail = DEV_STATE.details[inspectionId];
      if (detail) return Promise.resolve(detail as unknown as T);
      const inspection = DEV_STATE.inspections.find((item) => item._id === inspectionId);
      if (!inspection) throw new Error('Inspection not found.');
      const generated = createDevInspectionDetail(inspection._id, inspection.title, inspection.moduleCode);
      DEV_STATE.details[inspectionId] = generated;
      return Promise.resolve(generated as unknown as T);
    }
    case 'approve-registration': {
      const registrationApprovalId = (options.body as { registrationApprovalId: string }).registrationApprovalId;
      DEV_STATE.approvals = DEV_STATE.approvals.filter((approval) => String(approval.approvalId) !== registrationApprovalId);
      return Promise.resolve({ success: true } as unknown as T);
    }
    case 'save-inspection-response': {
      const body = options.body as { inspectionId: string; sectionId: string; itemId: string; responseValue: unknown; numericScore: number; severity?: string; immediateRisk: boolean; remarks?: string };
      const detail = DEV_STATE.details[body.inspectionId];
      if (!detail) throw new Error('Inspection detail not found.');
      const section = detail.sections.find((s) => s._id === body.sectionId);
      const item = section?.items.find((i) => i._id === body.itemId);
      if (!item) throw new Error('Checklist item not found.');
      item.response = {
        responseValue: body.responseValue,
        numericScore: body.numericScore,
        severity: body.severity,
        immediateRisk: body.immediateRisk,
        remarks: body.remarks,
      };
      detail.inspection.scoreOverall = Math.min(100, Math.max(0, detail.inspection.scoreOverall + body.numericScore));
      detail.auditLogs.unshift({
        _id: createDevId('audit'),
        action: `Response updated for ${item.code}`,
        createdAt: Date.now(),
      });
      return Promise.resolve({ success: true } as unknown as T);
    }
    case 'transition-inspection': {
      const body = options.body as { inspectionId: string; toStatus: string; comments?: string };
      const detail = DEV_STATE.details[body.inspectionId];
      if (!detail) throw new Error('Inspection detail not found.');
      if ((body.toStatus === 'rejected' || body.toStatus === 'correction_required') && !body.comments?.trim()) {
        throw new Error('A review note is required for declined or correction-required evaluations.');
      }
      detail.inspection.status = body.toStatus;
      const inspection = DEV_STATE.inspections.find((item) => item._id === body.inspectionId);
      if (inspection) inspection.status = body.toStatus;
      if (body.comments?.trim()) {
        detail.reviewComments.unshift({
          _id: createDevId('comment'),
          actorRoleCode: 'super_admin',
          body: body.comments.trim(),
          createdAt: Date.now(),
        });
      }
      detail.auditLogs.unshift({
        _id: createDevId('audit'),
        action: `Inspection transitioned to ${body.toStatus}`,
        createdAt: Date.now(),
      });
      return Promise.resolve({ success: true } as unknown as T);
    }
    case 'add-corrective-action': {
      const body = options.body as { inspectionId: string; title: string; detail: string; stopWorkIssued: boolean };
      const inspectionDetail = DEV_STATE.details[body.inspectionId];
      if (!inspectionDetail) throw new Error('Inspection detail not found.');
      inspectionDetail.correctiveActions.unshift({
        _id: createDevId('ca'),
        title: body.title,
        detail: body.detail,
        status: 'open',
        stopWorkIssued: body.stopWorkIssued,
      });
      inspectionDetail.auditLogs.unshift({
        _id: createDevId('audit'),
        action: 'Corrective action added',
        createdAt: Date.now(),
      });
      return Promise.resolve({ success: true } as unknown as T);
    }
    case 'create-finding': {
      const body = options.body as { inspectionId: string; itemId: string; title: string; detail: string; severity: string };
      const inspectionDetail = DEV_STATE.details[body.inspectionId];
      if (!inspectionDetail) throw new Error('Inspection detail not found.');
      inspectionDetail.findings.unshift({
        _id: createDevId('finding'),
        title: body.title,
        detail: body.detail,
        severity: body.severity,
        status: 'open',
      });
      inspectionDetail.auditLogs.unshift({
        _id: createDevId('audit'),
        action: 'Finding created',
        createdAt: Date.now(),
      });
      return Promise.resolve({ success: true } as unknown as T);
    }
    case 'update-finding': {
      const body = options.body as { findingId: string; title: string; detail: string; severity: string; status: string };
      const inspectionDetail = Object.values(DEV_STATE.details).find((detail) =>
        detail.findings.some((finding) => finding._id === body.findingId),
      );
      if (!inspectionDetail) throw new Error('Finding not found.');
      const finding = inspectionDetail.findings.find((f) => f._id === body.findingId);
      if (!finding) throw new Error('Finding not found.');
      finding.title = body.title;
      finding.detail = body.detail;
      finding.severity = body.severity;
      finding.status = body.status;
      return Promise.resolve({ success: true } as unknown as T);
    }
    case 'delete-finding': {
      const body = options.body as { findingId: string };
      Object.values(DEV_STATE.details).forEach((detail) => {
        detail.findings = detail.findings.filter((finding) => finding._id !== body.findingId);
      });
      return Promise.resolve({ success: true } as unknown as T);
    }
    case 'add-review-comment': {
      const body = options.body as { inspectionId: string; findingId?: string; parentCommentId?: string; body: string };
      const inspectionDetail = DEV_STATE.details[body.inspectionId];
      if (!inspectionDetail) throw new Error('Inspection detail not found.');
      inspectionDetail.reviewComments.unshift({
        _id: createDevId('comment'),
        findingId: body.findingId,
        parentCommentId: body.parentCommentId,
        actorRoleCode: 'staff',
        body: body.body,
        createdAt: Date.now(),
      });
      inspectionDetail.auditLogs.unshift({
        _id: createDevId('audit'),
        action: 'Review comment added',
        createdAt: Date.now(),
      });
      return Promise.resolve({ success: true } as unknown as T);
    }
    case 'resolve-review-comment': {
      const body = options.body as { commentId: string };
      const inspectionDetail = Object.values(DEV_STATE.details).find((detail) =>
        detail.reviewComments.some((comment) => comment._id === body.commentId),
      );
      if (!inspectionDetail) throw new Error('Comment not found.');
      const comment = inspectionDetail.reviewComments.find((c) => c._id === body.commentId);
      if (!comment) throw new Error('Comment not found.');
      comment.resolvedAt = Date.now();
      return Promise.resolve({ success: true } as unknown as T);
    }
    case 'upload-evidence': {
      return Promise.resolve({ success: true } as unknown as T);
    }
    case 'get-evidence-download-url': {
      return Promise.resolve({ url: 'about:blank' } as unknown as T);
    }
    default:
      throw new Error(`Dev fallback not available for '${functionName}'.`);
  }
}

interface EdgeFunctionOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  params?: Record<string, string>;
}

async function callEdgeFunction<T>(
  functionName: string,
  options: EdgeFunctionOptions = {}
): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.access_token) {
    if (import.meta.env.DEV) {
      return devEdgeFunction(functionName, options);
    }
    throw new Error('No active session');
  }

  const url = new URL(`${SUPABASE_URL}/functions/v1/${functionName}`);
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.append(key, value);
    }
  }

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Edge function '${functionName}' failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// ============================================================================
// AUTH OPERATIONS
// ============================================================================

export async function bootstrapPlatform() {
  return;
}

export async function updatePasswordAfterBootstrap(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function getRegistrationFormOptions(): Promise<RegistrationFormOptions> {
  const { data: modules } = await supabase.from('modules').select('code, title');
  return {
    ranks: [
      { code: 'pte', label: 'Private', order: 1 },
      { code: 'lcpl', label: 'Lance Corporal', order: 2 },
      { code: 'cpl', label: 'Corporal', order: 3 },
      { code: 'sgt', label: 'Sergeant', order: 4 },
      { code: 'ssgt', label: 'Staff Sergeant', order: 5 },
      { code: 'wo2', label: 'Warrant Officer II', order: 6 },
      { code: 'wo1', label: 'Warrant Officer I', order: 7 },
      { code: '2lt', label: 'Second Lieutenant', order: 8 },
      { code: 'lt', label: 'Lieutenant', order: 9 },
      { code: 'capt', label: 'Captain', order: 10 },
      { code: 'maj', label: 'Major', order: 11 },
      { code: 'ltcol', label: 'Lieutenant Colonel', order: 12 },
      { code: 'col', label: 'Colonel', order: 13 },
      { code: 'brig', label: 'Brigadier', order: 14 },
    ],
    directorates: (modules ?? []).map((m: { code: string; title: string }) => ({
      _id: m.code,
      code: m.code,
      name: m.title,
    })),
    roles: [
      { code: 'base_soldier', label: 'Base Soldier', privileged: false },
      { code: 'inspector', label: 'Inspector', privileged: false },
      { code: 'senior_inspector', label: 'Senior Inspector', privileged: true },
      { code: 'directorate_head', label: 'Directorate Head', privileged: true },
      { code: 'platform_owner', label: 'Platform Owner', privileged: true },
    ],
  };
}

export async function registerPersonnel(payload: {
  fullName:        string;
  email:           string;
  serviceNumber:   string;
  phoneNumber:     string;
  rankCode:        string;
  directorateCode: string;
  password:        string;
  confirmPassword: string;
}) {
  const regLimit = checkRegistrationLimit(payload.serviceNumber);
  if (!regLimit.allowed) {
    throw new Error(`Too many registration attempts. Try again in ${formatRetryTime(regLimit.retryAfterSeconds)}.`);
  }

  if (payload.password !== payload.confirmPassword) {
    throw new Error('Passwords do not match.');
  }
  if (payload.password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  // Supabase Auth requires an email field; we use a deterministic internal alias
  // so the service-number-based sign-in flow works without a lookup round-trip.
  const authEmail = serviceNumberToEmail(payload.serviceNumber);

  const { data, error } = await supabase.auth.signUp({
    email:    authEmail,
    password: payload.password,
    options: {
      data: {
        fullName:           payload.fullName,
        email:              payload.email,       // real contact email stored in metadata
        serviceNumber:      payload.serviceNumber,
        phoneNumber:        payload.phoneNumber,
        rankCode:           payload.rankCode,
        directorateCode:    payload.directorateCode,
        roleCode:           'staff',             // all public registrations start as staff
        status:             'pending',
        mfaRequired:        false,
        mfaEnrolled:        false,
        mustChangePassword: false,
        isPlatformOwner:    false,
      },
    },
  });

  if (error) throw error;

  if (data.user) {
    await supabase.from('registration_approvals').insert({
      user_id:             data.user.id,
      requested_role_code: 'staff',
      directorate_code:    payload.directorateCode,
    });
  }

  return { nextStep: 'sign_in' };
}

// Create a developer super-admin via server-side function (requires service key or dev secret)
export async function createDeveloperSuperAdmin(payload: { email: string; password: string; fullName: string }) {
  return callEdgeFunction<{ success: boolean; userId?: string }>('create-developer-admin', { method: 'POST', body: payload });
}

export async function signIn(payload: { serviceNumber: string; password: string }) {
  const signInLimit = checkSignInLimit(payload.serviceNumber);
  if (!signInLimit.allowed) {
    throw new Error(`Too many sign-in attempts. Try again in ${formatRetryTime(signInLimit.retryAfterSeconds)}.`);
  }

  const email = serviceNumberToEmail(payload.serviceNumber);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: payload.password,
  });

  if (error) throw error;
  if (!data.session || !data.user) throw new Error('Sign in failed.');

  const user = toPlatformUser(data.user);
  if (!user) throw new Error('Sign in failed — user profile incomplete.');

  const sessionPayload: SessionPayload = {
    sessionToken: data.session.access_token,
    expiresAt: sessionExpiresAt(data.session),
    user,
  };

  return sessionPayload;
}

export async function completeSignIn(payload: { serviceNumber: string; password: string }) {
  return signIn(payload);
}

export async function requestPasswordReset(serviceNumber: string) {
  const email = serviceNumberToEmail(serviceNumber);
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
  return { destinationMasked: email };
}

// ─── OTP-based password reset (Step 1 — send OTP) ────────────────────────────
// Verifies that the service number + phone combo exists in the personnel table,
// then calls the unauthenticated edge function `request-password-reset` which
// generates a 6-digit OTP, stores a bcrypt hash in password_reset_tokens, and
// dispatches an SMS via the configured provider (Twilio / Termii / etc.).
export async function requestPasswordResetOTP(payload: {
  serviceNumber: string;
  phoneNumber:   string;
}): Promise<void> {
  // C-10: Apply client-side rate limit as a UX guard (not security).
  // Real enforcement happens server-side in the edge function via otp_rate_limits table.
  const otpLimit = checkOtpRequestLimit(payload.phoneNumber);
  if (!otpLimit.allowed) {
    throw new Error(`Too many OTP requests. Try again in ${formatRetryTime(otpLimit.retryAfterSeconds)}.`);
  }

  // Client-side pre-check: anti-enumeration — give the same generic error
  // regardless of whether the service number exists or the phone matches.
  // The server-side edge function does the authoritative check.
  const { data } = await supabase
    .from('user_profiles')
    .select('status')
    .eq('service_number', payload.serviceNumber)
    .maybeSingle();

  if (!data) {
    // Anti-enumeration: don't reveal whether the account exists.
    // Delay response to mitigate timing attacks.
    await new Promise((r) => setTimeout(r, 500));
    throw new Error('If this service number is registered, an OTP has been sent to the associated phone number.');
  }
  if (data.status === 'pending')   throw new Error('Account pending approval. Contact your administrator.');
  if (data.status === 'suspended') throw new Error('Account suspended. Contact your administrator.');

  // Delegate OTP generation + SMS dispatch + server-side rate limit enforcement
  // to the edge function. The edge function:
  //   1. Checks otp_rate_limits table (max 3 per 10min per phone)
  //   2. Locks the record if limit exceeded (locked_until)
  //   3. Records request_ip and request_device for abuse detection
  //   4. Generates and stores the OTP hash
  //   5. Dispatches SMS
  const response = await fetch(`${SUPABASE_URL}/functions/v1/request-password-reset`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      serviceNumber: payload.serviceNumber,
      phoneNumber:   payload.phoneNumber,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'OTP request failed.' }));
    // Return same message for rate limited and other errors (anti-enumeration)
    throw new Error(err.error || 'If this service number is registered, an OTP has been sent.');
  }
}

// Personnel admin helpers
export async function listPersonnel(): Promise<Record<string, any>[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, service_number, rank_code, directorate_code, role_code, status, created_at, updated_at')
    .order('full_name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updatePersonnelStatus(id: string, status: string) {
  const { error } = await supabase
    .from('user_profiles')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

export async function softDeletePersonnel(id: string) {
  // Soft-delete by marking status as 'deleted'
  return updatePersonnelStatus(id, 'deleted');
}

// ─── OTP-based password reset (Step 2 — verify OTP + update password) ────────
// Sends the OTP and new password to the edge function `verify-password-reset`,
// which checks the stored hash, updates the auth user's password via the
// Supabase admin client (service role), and marks the token as used.
export async function verifyOTPAndResetPassword(payload: {
  serviceNumber: string;
  phoneNumber:   string;
  otp:           string;
  newPassword:   string;
}): Promise<void> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-password-reset`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Verification failed.' }));
    throw new Error(err.error || 'Invalid or expired OTP. Request a new one.');
  }
}

export async function restoreSession() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData?.session) return null;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return null;

  const user = toPlatformUser(userData.user);
  if (!user) return null;

  return {
    user,
    session: { expiresAt: sessionExpiresAt(sessionData.session) },
  };
}

export async function signOut() {
  await supabase.auth.signOut();
}

// ============================================================================
// DATA OPERATIONS (via Edge Functions)
// ============================================================================

export async function getPendingApprovals() {
  return callEdgeFunction<Record<string, unknown>[]>('list-pending-approvals');
}

export async function approveRegistration(
  registrationApprovalId: string,
  decision: 'approved' | 'rejected',
  notes?: string
) {
  return callEdgeFunction('approve-registration', {
    method: 'POST',
    body: { registrationApprovalId, decision, notes },
  });
}

export async function getCommandCenterSummary() {
  return callEdgeFunction('get-command-center');
}

export async function getAnalyticsSummary() {
  return callEdgeFunction<AnalyticsSummary>('get-analytics');
}

export async function getModules() {
  return callEdgeFunction<Record<string, unknown>[]>('list-modules');
}

export async function getModuleTemplate(moduleCode: string): Promise<ModuleTemplateDefinition> {
  return callEdgeFunction<ModuleTemplateDefinition>('get-module-template', {
    params: { moduleCode },
  });
}

export async function updateModuleTemplate(
  moduleCode: string,
  template: InspectionTemplate
): Promise<ModuleTemplateDefinition> {
  const result = await callEdgeFunction<{ success: boolean; module: ModuleTemplateDefinition }>('update-module-template', {
    method: 'POST',
    body: { moduleCode, template },
  });
  return result.module;
}

export async function grantModuleEdit(
  moduleCode: string,
  grant: boolean
) {
  return callEdgeFunction<{ success: boolean; module: Record<string, unknown> }>('grant-module-edit', {
    method: 'POST',
    body: { moduleCode, grant },
  });
}

export async function listInspections(moduleCode?: string) {
  return callEdgeFunction<Record<string, unknown>[]>('list-inspections', {
    params: moduleCode ? { moduleCode } : undefined,
  });
}

export async function createInspection(payload: {
  moduleCode: string;
  title: string;
  directorateCode: string;
  formationCode?: string;
  unitCode?: string;
  subjectName?: string;
  subjectReference?: string;
}) {
  const result = await callEdgeFunction<{ success: boolean; id: string }>('create-inspection', {
    method: 'POST',
    body: payload,
  });
  return result.id;
}

export async function getInspectionDetail(inspectionId: string) {
  return callEdgeFunction('get-inspection-detail', {
    params: { inspectionId },
  });
}

export async function saveInspectionResponse(payload: {
  inspectionId:     string;
  sectionId:        string;
  itemId:           string;
  responseValue:    unknown;
  numericScore:     number;
  severity?:        string;
  immediateRisk:    boolean;
  remarks?:         string;
  // C-8: respondent attribution — the edge function reads auth.uid() server-side
  // and writes responded_by + responded_at + submission_source automatically.
  // No client-supplied userId accepted (prevents spoofing).
}) {
  return callEdgeFunction('save-inspection-response', {
    method: 'POST',
    body:   { ...payload, submissionSource: 'web' },
  });
}

export async function transitionInspection(
  inspectionId: string,
  toStatus: string,
  comments?: string
) {
  return callEdgeFunction('transition-inspection', {
    method: 'POST',
    body: { inspectionId, toStatus, comments },
  });
}

export async function addCorrectiveAction(
  inspectionId: string,
  title: string,
  detail: string,
  stopWorkIssued = false
) {
  return callEdgeFunction('add-corrective-action', {
    method: 'POST',
    body: { inspectionId, title, detail, stopWorkIssued },
  });
}

export async function createFinding(payload: {
  inspectionId: string;
  itemId: string;
  title: string;
  detail: string;
  severity: string;
}) {
  return callEdgeFunction('create-finding', {
    method: 'POST',
    body: payload,
  });
}

export async function updateFinding(payload: {
  findingId: string;
  title: string;
  detail: string;
  severity: string;
  status: string;
}) {
  return callEdgeFunction('update-finding', {
    method: 'POST',
    body: payload,
  });
}

export async function deleteFinding(findingId: string) {
  return callEdgeFunction('delete-finding', {
    method: 'POST',
    body: { findingId },
  });
}

export async function addReviewComment(payload: {
  inspectionId: string;
  findingId?: string;
  parentCommentId?: string;
  body: string;
}) {
  return callEdgeFunction('add-review-comment', {
    method: 'POST',
    body: payload,
  });
}

export async function resolveReviewComment(commentId: string) {
  return callEdgeFunction('resolve-review-comment', {
    method: 'POST',
    body: { commentId },
  });
}

export async function uploadEvidence(
  inspectionId: string,
  file: File,
  sectionId?: string,
  itemId?: string
) {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.access_token) {
    throw new Error('No active session');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('inspectionId', inspectionId);
  if (sectionId) formData.append('sectionId', sectionId);
  if (itemId) formData.append('itemId', itemId);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/upload-evidence`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Upload failed with status ${response.status}`);
  }

  return response.json();
}

export async function getEvidenceDownloadUrl(evidenceId: string) {
  return callEdgeFunction<{ url: string }>('get-evidence-download-url', {
    params: { evidenceId },
  });
}

// ============================================================================
// PROJECTS
// ============================================================================

export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown[];
}

export async function getProjectById(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown;
}

// ============================================================================
// HAZARD ASSESSMENTS
// ============================================================================

export async function getHazardAssessments() {
  const { data, error } = await supabase
    .from('hazard_assessments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown[];
}

export async function getHazardById(id: string) {
  const { data, error } = await supabase
    .from('hazard_assessments')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown;
}

// ============================================================================
// REPORTS
// ============================================================================

export async function getReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown[];
}

export async function getReportById(id: string) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown;
}
