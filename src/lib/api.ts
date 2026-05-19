import { supabase, serviceNumberToEmail, sessionExpiresAt, toPlatformUser } from './supabase';
import type { RegistrationFormOptions, SessionPayload } from '../types/platform';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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
  if (payload.password !== payload.confirmPassword) {
    throw new Error('Passwords do not match.');
  }
  if (payload.password.length < 12) {
    throw new Error('Password must be at least 12 characters.');
  }

  const email = serviceNumberToEmail(payload.serviceNumber);
  const { data, error } = await supabase.auth.signUp({
    email,
    password: payload.password,
    options: {
      data: {
        fullName: payload.fullName,
        serviceNumber: payload.serviceNumber,
        rankCode: payload.rankCode,
        roleCode: payload.requestedRoleCode,
        directorateCode: payload.directorateCode,
        phoneNumber: payload.phoneNumber,
        status: 'pending',
        mfaRequired: false,
        mfaEnrolled: false,
        mustChangePassword: false,
        isPlatformOwner: false,
      },
    },
  });

  if (error) throw error;

  if (data.user) {
    await supabase.from('registration_approvals').insert({
      user_id: data.user.id,
      requested_role_code: payload.requestedRoleCode,
      directorate_code: payload.directorateCode,
    });
  }

  return {
    nextStep: 'sign_in',
    destinationMasked: payload.email ?? email,
  };
}

export async function signIn(payload: { serviceNumber: string; password: string }) {
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
  inspectionId: string;
  sectionId: string;
  itemId: string;
  responseValue: unknown;
  numericScore: number;
  severity?: string;
  immediateRisk: boolean;
  remarks?: string;
}) {
  return callEdgeFunction('save-inspection-response', {
    method: 'POST',
    body: payload,
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
