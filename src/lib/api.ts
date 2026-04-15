import { api, convex } from './convex';
import { brokerFetch, brokerRpc } from './sessionBroker';
import type {
  DashboardSummary,
  InspectionDetail,
  InspectionSummary,
  ModuleDefinition,
  PlatformUser,
  RegistrationFormOptions,
  SessionInventoryEntry,
} from '../types/platform';

export async function bootstrapPlatform() {
  return convex.mutation(api.catalog.bootstrapReferenceData, {});
}

export async function getRegistrationFormOptions() {
  return convex.query(api.catalog.registrationFormOptions, {}) as Promise<RegistrationFormOptions>;
}

export async function registerPersonnel(payload: {
  fullName: string;
  appointmentNumber: string;
  rankCode: string;
  requestedRoleCode: string;
  directorateCode: string;
  formationCode: string;
  unitCode: string;
  phoneNumber: string;
  email?: string;
  branch?: string;
  identityNumber?: string;
  justification?: string;
  password: string;
  confirmPassword: string;
}) {
  return brokerFetch<{
    nextStep: string;
    challengeId: string;
    destinationMasked: string;
    previewCode?: string;
  }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyRegistration(challengeId: string, code: string) {
  return brokerFetch<{ status: string; message: string }>('/api/auth/verify-registration', {
    method: 'POST',
    body: JSON.stringify({ challengeId, code }),
  });
}

export async function resendChallenge(challengeId: string) {
  return brokerFetch<{
    challengeId: string;
    destinationMasked: string;
    previewCode?: string;
  }>('/api/auth/resend-challenge', {
    method: 'POST',
    body: JSON.stringify({ challengeId }),
  });
}

export async function signIn(payload: { appointmentNumber: string; password: string; userAgent?: string }) {
  return brokerFetch<{ requiresOtp?: boolean; challengeId?: string; destinationMasked?: string; previewCode?: string; expiresAt?: number; user?: PlatformUser }>(
    '/api/auth/sign-in',
    {
      method: 'POST',
      body: JSON.stringify({ ...payload, userAgent: navigator.userAgent }),
    },
  );
}

export async function verifySignIn(challengeId: string, code: string) {
  return brokerFetch<{ expiresAt: number; user: PlatformUser }>('/api/auth/verify-sign-in', {
    method: 'POST',
    body: JSON.stringify({ challengeId, code, userAgent: navigator.userAgent }),
  });
}

export async function completeSignIn(payload: { appointmentNumber: string; password: string }) {
  return signIn({ ...payload, userAgent: navigator.userAgent });
}

export async function requestPasswordReset(appointmentNumber: string) {
  return brokerFetch<{
    challengeId: string | null;
    destinationMasked: string;
    message: string;
    previewCode?: string;
  }>('/api/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ appointmentNumber }),
  });
}

export async function verifyPasswordReset(challengeId: string, code: string) {
  return brokerFetch<{ resetToken: string }>('/api/auth/password-reset/verify', {
    method: 'POST',
    body: JSON.stringify({ challengeId, code }),
  });
}

export async function resetPassword(payload: {
  appointmentNumber: string;
  resetToken: string;
  password: string;
  confirmPassword: string;
}) {
  return brokerFetch('/api/auth/password-reset/complete', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function restoreSession() {
  return brokerFetch<{ user: PlatformUser; session: { expiresAt: number; lastSeenAt: number; sessionLabel?: string } } | null>('/api/auth/session', {
    method: 'GET',
  });
}

export async function signOut() {
  await brokerFetch<{ ok: true }>('/api/auth/sign-out', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function getPendingApprovals() {
  return brokerRpc('getPendingApprovals');
}

export async function listActiveSessions() {
  return brokerFetch<SessionInventoryEntry[]>('/api/auth/sessions', {
    method: 'GET',
  });
}

export async function revokeSession(targetSessionId: string) {
  return brokerFetch<{ ok: true }>('/api/auth/sessions/revoke', {
    method: 'POST',
    body: JSON.stringify({ targetSessionId }),
  });
}

export async function revokeOtherSessions() {
  return brokerFetch<{ ok: true }>('/api/auth/sessions/revoke-others', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function approveRegistration(registrationApprovalId: string, decision: 'approved' | 'rejected', notes?: string) {
  return brokerRpc('approveRegistration', {
    registrationApprovalId,
    decision,
    notes,
  });
}

export async function getCommandCenterSummary(payload: Record<string, unknown> = {}) {
  return brokerRpc<DashboardSummary>('getCommandCenterSummary', payload);
}

export async function getModules() {
  return brokerRpc<ModuleDefinition[]>('getModules');
}

export async function exportCommandReport(payload: Record<string, unknown> = {}) {
  return brokerRpc<{
    generatedAt: number;
    generatedBy: { appointmentNumber: string; roleCode: string };
    scope: Record<string, unknown>;
    inspections: InspectionSummary[];
  }>('exportCommandReport', payload);
}

export async function listInspections(moduleCode?: string) {
  return brokerRpc<InspectionSummary[]>('listInspections', { moduleCode });
}

export async function createInspection(payload: {
  moduleCode: string;
  title: string;
  directorateCode: string;
  formationCode: string;
  unitCode: string;
  subjectName?: string;
  subjectReference?: string;
}) {
  return brokerRpc<string>('createInspection', payload);
}

export async function getInspectionDetail(inspectionId: string) {
  return brokerRpc<InspectionDetail>('getInspectionDetail', {
    inspectionId,
  });
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
  return brokerRpc('saveInspectionResponse', payload);
}

export async function transitionInspection(inspectionId: string, toStatus: string, comments?: string) {
  return brokerRpc('transitionInspection', {
    inspectionId,
    toStatus,
    comments,
  });
}

export async function addCorrectiveAction(inspectionId: string, title: string, detail: string, stopWorkIssued = false) {
  return brokerRpc('addCorrectiveAction', {
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
  return brokerRpc('createFinding', payload);
}

export async function updateFinding(payload: {
  findingId: string;
  title: string;
  detail: string;
  severity: string;
  status: string;
}) {
  return brokerRpc('updateFinding', payload);
}

export async function deleteFinding(findingId: string) {
  return brokerRpc('deleteFinding', {
    findingId,
  });
}

export async function addReviewComment(payload: {
  inspectionId: string;
  findingId?: string;
  parentCommentId?: string;
  body: string;
}) {
  return brokerRpc('addReviewComment', payload);
}

export async function resolveReviewComment(commentId: string) {
  return brokerRpc('resolveReviewComment', {
    commentId,
  });
}

export async function uploadEvidence(inspectionId: string, file: File, sectionId?: string, itemId?: string) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  const contentHash = Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  const uploadUrl = await brokerRpc<string>('generateEvidenceUploadUrl', {
    inspectionId,
  });

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!uploadResponse.ok) {
    throw new Error('Evidence upload failed.');
  }

  const { storageId } = (await uploadResponse.json()) as { storageId: string };
  return brokerRpc('attachEvidence', {
    inspectionId,
    sectionId,
    itemId,
    storageId,
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
    classification: 'official',
    contentHash,
    provenance: {
      originalLastModified: file.lastModified,
      source: 'browser_upload',
    },
  });
}

export async function getEvidenceDownloadUrl(evidenceId: string, reason?: string) {
  return brokerRpc<{ fileName: string; contentType: string; classification: string; watermarkLabel?: string; url: string; expiresInSeconds: number }>(
    'getEvidenceDownloadUrl',
    {
      evidenceId,
      reason,
    },
  );
}
