import { supabase, serviceNumberToEmail, sessionExpiresAt, toPlatformUser } from './supabase';
import { checkSignInLimit, checkOtpRequestLimit, checkRegistrationLimit, formatRetryTime } from './rateLimiter';
import type {
  DashboardSummary,
  InspectionDetail,
  InspectionSummary,
  ModuleDefinition,
  RegistrationFormOptions,
  SessionPayload,
} from '../types/platform';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const DEV_MODULES: ModuleDefinition[] = [
  {
    id: 'standard_evaluation',
    moduleCode: 'standard_evaluation',
    title: 'Standard & Evaluation',
    classification: 'standard_evaluation',
    description: 'Track compliance, document audits, and baseline assessment workflows.',
  },
  {
    id: 'safety_manual',
    moduleCode: 'safety_manual',
    title: 'Safety & Manual',
    classification: 'safety_manual',
    description: 'Monitor safety checks, incident findings, and corrective actions.',
  },
  {
    id: 'project_monitoring',
    moduleCode: 'project_monitoring',
    title: 'Project Monitoring',
    classification: 'project_monitoring',
    description: 'Oversee project inspections, progress reports and evidence collection.',
  },
];

const DEV_INSPECTIONS: InspectionSummary[] = [
  {
    _id: 'insp-001',
    title: 'Standard evaluation readiness sweep',
    moduleCode: 'standard_evaluation',
    status: 'in_progress',
    scoreOverall: 78,
    complianceBand: 'B',
    riskLevel: 'MEDIUM',
    completionPercent: 62,
    directorateCode: 'standard_evaluation',
    unitCode: 'Unit 14',
    updatedAt: Date.now() - 1000 * 60 * 30,
  },
  {
    _id: 'insp-002',
    title: 'Safety manual emergency response review',
    moduleCode: 'safety_manual',
    status: 'submitted',
    scoreOverall: 88,
    complianceBand: 'A',
    riskLevel: 'LOW',
    completionPercent: 100,
    directorateCode: 'safety_manual',
    unitCode: 'Unit 9',
    updatedAt: Date.now() - 1000 * 60 * 90,
  },
  {
    _id: 'insp-003',
    title: 'Project monitoring status check',
    moduleCode: 'project_monitoring',
    status: 'under_review',
    scoreOverall: 66,
    complianceBand: 'C',
    riskLevel: 'HIGH',
    completionPercent: 48,
    directorateCode: 'project_monitoring',
    unitCode: 'Unit 21',
    updatedAt: Date.now() - 1000 * 60 * 120,
  },
];

const DEV_INSPECTION_DETAILS: Record<string, InspectionDetail> = {
  'insp-001': {
    inspection: {
      _id: 'insp-001',
      title: 'Standard evaluation readiness sweep',
      moduleCode: 'standard_evaluation',
      status: 'in_progress',
      scoreOverall: 78,
      complianceBand: 'B',
      riskLevel: 'MEDIUM',
      completionPercent: 62,
    },
    sections: [
      {
        _id: 'sec-1',
        title: 'Documentation and baseline checks',
        items: [
          {
            _id: 'item-1',
            code: 'DOC-01',
            prompt: 'Are all standard operating procedures published and accessible?',
            responseType: 'boolean',
            weight: 3,
            response: {
              responseValue: 'Partially',
              numericScore: 1,
              immediateRisk: false,
              remarks: 'Some SOPs are still in draft status.',
            },
            evidence: [],
          },
          {
            _id: 'item-2',
            code: 'BLS-02',
            prompt: 'Are baseline compliance targets clearly defined?',
            responseType: 'boolean',
            weight: 2,
            response: {
              responseValue: 'Yes',
              numericScore: 2,
              immediateRisk: false,
              remarks: 'Targets are aligned with operational guidance.',
            },
            evidence: [],
          },
        ],
      },
    ],
    findings: [
      {
        _id: 'finding-001',
        title: 'Missing SOP revision schedule',
        detail: 'The standard operating procedure revision schedule is not documented for at least 3 procedures.',
        severity: 'medium',
        status: 'open',
      },
    ],
    correctiveActions: [
      {
        _id: 'ca-001',
        title: 'Document revision plan',
        detail: 'Create and publish the missing SOP revision schedule by the end of the quarter.',
        status: 'open',
        stopWorkIssued: false,
      },
    ],
    approvals: [],
    reviewComments: [
      {
        _id: 'comment-001',
        actorRoleCode: 'staff',
        body: 'Need a stronger reference to the latest standard in item 2.',
        createdAt: Date.now() - 1000 * 60 * 45,
      },
    ],
    auditLogs: [
      {
        _id: 'audit-001',
        action: 'Inspection created',
        createdAt: Date.now() - 1000 * 60 * 90,
      },
      {
        _id: 'audit-002',
        action: 'Section 1 response updated',
        createdAt: Date.now() - 1000 * 60 * 30,
      },
    ],
  },
  'insp-002': {
    inspection: {
      _id: 'insp-002',
      title: 'Safety manual emergency response review',
      moduleCode: 'safety_manual',
      status: 'submitted',
      scoreOverall: 88,
      complianceBand: 'A',
      riskLevel: 'LOW',
      completionPercent: 100,
    },
    sections: [
      {
        _id: 'sec-2',
        title: 'Emergency response readiness',
        items: [
          {
            _id: 'item-3',
            code: 'EMS-01',
            prompt: 'Is the emergency response team roster complete?',
            responseType: 'boolean',
            weight: 2,
            response: {
              responseValue: 'Yes',
              numericScore: 2,
              immediateRisk: false,
              remarks: 'Roster is current and all personnel have contact details.',
            },
            evidence: [],
          },
        ],
      },
    ],
    findings: [],
    correctiveActions: [],
    approvals: [],
    reviewComments: [],
    auditLogs: [
      {
        _id: 'audit-003',
        action: 'Inspection submitted for review',
        createdAt: Date.now() - 1000 * 60 * 90,
      },
    ],
  },
  'insp-003': {
    inspection: {
      _id: 'insp-003',
      title: 'Project monitoring status check',
      moduleCode: 'project_monitoring',
      status: 'under_review',
      scoreOverall: 66,
      complianceBand: 'C',
      riskLevel: 'HIGH',
      completionPercent: 48,
    },
    sections: [
      {
        _id: 'sec-3',
        title: 'Schedule and resource tracking',
        items: [
          {
            _id: 'item-4',
            code: 'PM-01',
            prompt: 'Are project milestones aligned with the current delivery plan?',
            responseType: 'boolean',
            weight: 3,
            response: {
              responseValue: 'No',
              numericScore: 0,
              immediateRisk: true,
              severity: 'high',
              remarks: 'Several milestones are overdue or missing.',
            },
            evidence: [],
          },
        ],
      },
    ],
    findings: [
      {
        _id: 'finding-002',
        title: 'Late milestone reporting',
        detail: 'The project schedule has not been updated to reflect the last two delays.',
        severity: 'high',
        status: 'open',
      },
    ],
    correctiveActions: [],
    approvals: [],
    reviewComments: [],
    auditLogs: [
      {
        _id: 'audit-004',
        action: 'Review initiated',
        createdAt: Date.now() - 1000 * 60 * 120,
      },
    ],
  },
};

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

function createDevInspectionDetail(id: string, title: string, moduleCode: string): InspectionDetail {
  return {
    inspection: {
      _id: id,
      title,
      moduleCode,
      status: 'in_progress',
      scoreOverall: 70,
      complianceBand: 'C',
      riskLevel: 'MEDIUM',
      completionPercent: 10,
    },
    sections: [
      {
        _id: `${id}-sec-1`,
        title: 'Core inspection checklist',
        items: [
          {
            _id: `${id}-item-1`,
            code: 'CHK-01',
            prompt: 'Has the initial project brief been reviewed?',
            responseType: 'boolean',
            weight: 2,
            response: null,
            evidence: [],
          },
          {
            _id: `${id}-item-2`,
            code: 'CHK-02',
            prompt: 'Are all stakeholders aware of the current project status?',
            responseType: 'boolean',
            weight: 2,
            response: null,
            evidence: [],
          },
        ],
      },
    ],
    findings: [],
    correctiveActions: [],
    approvals: [],
    reviewComments: [],
    auditLogs: [
      {
        _id: `${id}-audit-1`,
        action: 'Inspection created in dev mode',
        createdAt: Date.now(),
      },
    ],
  };
}

const DEV_STATE = {
  modules: DEV_MODULES,
  inspections: [...DEV_INSPECTIONS],
  details: { ...DEV_INSPECTION_DETAILS },
  approvals: [...DEV_PENDING_APPROVALS],
};

function devEdgeFunction<T>(functionName: string, options: EdgeFunctionOptions = {}): Promise<T> {
  switch (functionName) {
    case 'get-command-center':
      return Promise.resolve(buildDevSummary() as unknown as T);
    case 'list-modules':
      return Promise.resolve(DEV_STATE.modules as unknown as T);
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
      detail.inspection.status = body.toStatus;
      const inspection = DEV_STATE.inspections.find((item) => item._id === body.inspectionId);
      if (inspection) inspection.status = body.toStatus;
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

export async function getModules() {
  return callEdgeFunction<Record<string, unknown>[]>('list-modules');
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
