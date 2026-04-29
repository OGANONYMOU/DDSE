import { api, convex } from './convex';
import { clearSessionToken, getSessionToken, storeSessionToken } from './session';
import type { DashboardSummary, InspectionDetail, InspectionSummary, ModuleDefinition, PlatformUser, RegistrationFormOptions, SessionPayload } from '../types/platform';

function requireSessionToken() {
  const sessionToken = getSessionToken();
  if (!sessionToken) {
    throw new Error('No active secure session found.');
  }
  return sessionToken;
}

export async function bootstrapPlatform() {
  await convex.mutation(api.catalog.bootstrapReferenceData, {});
  const localBootstrapPassword = import.meta.env.DEV
    ? import.meta.env.VITE_DDSE_BOOTSTRAP_OWNER_PASSWORD || import.meta.env.VITE_BOOTSTRAP_PASSWORD
    : undefined;

  try {
    await convex.action(api.authNode.bootstrapPlatformOwner, {
      password: localBootstrapPassword,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Platform owner already exists')) {
      return;
    }
    console.warn('Platform owner bootstrap skipped:', error?.message ?? error);
  }
}

export async function updatePasswordAfterBootstrap(password: string) {
  return convex.action(api.authNode.updatePasswordAfterBootstrap, {
    sessionToken: requireSessionToken(),
    password,
  });
}

export async function enrollMfa() {
  return convex.mutation(api.auth.enrollMfaInternal, {
    sessionToken: requireSessionToken(),
  });
}

export async function getRegistrationFormOptions() {
  return convex.query(api.catalog.registrationFormOptions, {}) as Promise<RegistrationFormOptions>;
}

export async function registerPersonnel(payload: {
  fullName: string;
  serviceNumber: string;
  rankCode: string;
  requestedRoleCode: string;
  directorateCode: string;
  phoneNumber: string;
  email?: string;
  password: string;
  confirmPassword: string;
}) {
  return convex.action(api.authNode.register, payload) as Promise<{ nextStep: string; challengeId: string; destinationMasked: string }>;
}

export async function verifyRegistration(challengeId: string, code: string) {
  return convex.action(api.authNode.verifyRegistration, { challengeId, code }) as Promise<{ status: string; message: string }>;
}

export async function resendChallenge(challengeId: string) {
  return convex.action(api.authNode.resendChallenge, { challengeId }) as Promise<{ challengeId: string; destinationMasked: string }>;
}

export async function signIn(payload: { serviceNumber: string; password: string; userAgent?: string }) {
  return convex.action(api.authNode.signIn, payload) as Promise<{ requiresOtp?: boolean; challengeId?: string; destinationMasked?: string } | SessionPayload>;
}

export async function verifySignIn(challengeId: string, code: string) {
  const session = (await convex.action(api.authNode.verifySignIn, { challengeId, code, userAgent: navigator.userAgent })) as SessionPayload;
  storeSessionToken(session.sessionToken, session.expiresAt);
  return session;
}

export async function completeSignIn(payload: { serviceNumber: string; password: string }) {
  const result = await signIn({ serviceNumber: payload.serviceNumber, password: payload.password, userAgent: navigator.userAgent });
  if ('sessionToken' in result) {
    storeSessionToken(result.sessionToken, result.expiresAt);
  }
  return result;
}

export async function requestPasswordReset(serviceNumber: string) {
  return convex.action(api.authNode.requestPasswordReset, { serviceNumber }) as Promise<{ challengeId: string; destinationMasked: string }>;
}

export async function verifyPasswordReset(challengeId: string, code: string) {
  return convex.action(api.authNode.verifyPasswordReset, { challengeId, code }) as Promise<{ resetToken: string }>;
}

export async function resetPassword(payload: {
  serviceNumber: string;
  resetToken: string;
  password: string;
  confirmPassword: string;
}) {
  return convex.action(api.authNode.resetPassword, payload);
}

export async function restoreSession() {
  const sessionToken = getSessionToken();
  if (!sessionToken) {
    return null;
  }

  const restored = (await convex.query(api.auth.currentSession, { sessionToken })) as { user: PlatformUser; session: { expiresAt: number } } | null;
  if (!restored) {
    clearSessionToken();
    return null;
  }
  return restored;
}

export async function signOut() {
  const sessionToken = getSessionToken();
  if (!sessionToken) return;
  await convex.mutation(api.auth.signOut, { sessionToken });
  clearSessionToken();
}

export async function getPendingApprovals() {
  return convex.query(api.auth.pendingApprovals, { sessionToken: requireSessionToken() });
}

export async function approveRegistration(registrationApprovalId: string, decision: 'approved' | 'rejected', notes?: string) {
  return convex.mutation(api.auth.approveRegistration, {
    sessionToken: requireSessionToken(),
    registrationApprovalId,
    decision,
    notes,
  });
}

export async function getCommandCenterSummary() {
  return convex.query(api.dashboard.commandCenter, { sessionToken: requireSessionToken() }) as Promise<DashboardSummary>;
}

export async function getModules() {
  return convex.query(api.catalog.listModules, { sessionToken: requireSessionToken() }) as Promise<ModuleDefinition[]>;
}

export async function listInspections(moduleCode?: string) {
  return convex.query(api.inspections.listInspections, {
    sessionToken: requireSessionToken(),
    moduleCode,
  }) as Promise<InspectionSummary[]>;
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
  return convex.mutation(api.inspections.createInspection, {
    sessionToken: requireSessionToken(),
    formationCode: payload.formationCode ?? '',
    unitCode: payload.unitCode ?? '',
    ...payload,
  }) as Promise<string>;
}

export async function getInspectionDetail(inspectionId: string) {
  return convex.query(api.inspections.getInspectionDetail, {
    sessionToken: requireSessionToken(),
    inspectionId,
  }) as Promise<InspectionDetail>;
}

export async function saveInspectionResponse(payload: {
  inspectionId: string;
  sectionId: string;
  itemId: string;
  responseValue: unknown;
  numericScore: number;
  severity?: string;
  immediateRisk: boolean;
  remarks?: string;
}) {
  return convex.mutation(api.inspections.saveResponse, {
    sessionToken: requireSessionToken(),
    ...payload,
  });
}

export async function transitionInspection(inspectionId: string, toStatus: string, comments?: string) {
  return convex.mutation(api.inspections.transitionInspection, {
    sessionToken: requireSessionToken(),
    inspectionId,
    toStatus,
    comments,
  });
}

export async function addCorrectiveAction(inspectionId: string, title: string, detail: string, stopWorkIssued = false) {
  return convex.mutation(api.inspections.addCorrectiveAction, {
    sessionToken: requireSessionToken(),
    inspectionId,
    title,
    detail,
    stopWorkIssued,
  });
}

export async function createFinding(payload: {
  inspectionId: string;
  itemId: string;
  title: string;
  detail: string;
  severity: string;
}) {
  return convex.mutation(api.inspections.createFinding, {
    sessionToken: requireSessionToken(),
    ...payload,
  });
}

export async function updateFinding(payload: {
  findingId: string;
  title: string;
  detail: string;
  severity: string;
  status: string;
}) {
  return convex.mutation(api.inspections.updateFinding, {
    sessionToken: requireSessionToken(),
    ...payload,
  });
}

export async function deleteFinding(findingId: string) {
  return convex.mutation(api.inspections.deleteFinding, {
    sessionToken: requireSessionToken(),
    findingId,
  });
}

export async function addReviewComment(payload: {
  inspectionId: string;
  findingId?: string;
  parentCommentId?: string;
  body: string;
}) {
  return convex.mutation(api.inspections.addReviewComment, {
    sessionToken: requireSessionToken(),
    ...payload,
  });
}

export async function resolveReviewComment(commentId: string) {
  return convex.mutation(api.inspections.resolveReviewComment, {
    sessionToken: requireSessionToken(),
    commentId,
  });
}

export async function uploadEvidence(inspectionId: string, file: File, sectionId?: string, itemId?: string) {
  const uploadUrl = (await convex.mutation(api.inspections.generateEvidenceUploadUrl, {
    sessionToken: requireSessionToken(),
    inspectionId,
  })) as string;

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!uploadResponse.ok) {
    throw new Error('Evidence upload failed.');
  }

  const { storageId } = (await uploadResponse.json()) as { storageId: string };
  return convex.mutation(api.inspections.attachEvidence, {
    sessionToken: requireSessionToken(),
    inspectionId,
    sectionId,
    itemId,
    storageId,
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
    classification: 'official',
  });
}

export async function getEvidenceDownloadUrl(evidenceId: string) {
  return convex.mutation(api.inspections.getEvidenceDownloadUrl, {
    sessionToken: requireSessionToken(),
    evidenceId,
  }) as Promise<{ fileName: string; contentType: string; url: string; expiresInSeconds: number }>;
}
