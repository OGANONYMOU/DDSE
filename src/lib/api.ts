import { supabase, serviceNumberToEmail, sessionExpiresAt, toPlatformUser } from './supabase';
import type { RegistrationFormOptions, SessionPayload } from '../types/platform';

function unsupportedDataBackend(): never {
  throw new Error('Supabase data backend is not yet implemented. All frontend data operations must be migrated from Convex to Supabase.');
}

export async function bootstrapPlatform() {
  // Supabase authentication and user metadata are initialized by the Supabase project setup.
  // This function can be extended to call a Supabase RPC if platform bootstrap is required.
  return;
}

export async function updatePasswordAfterBootstrap(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function enrollMfa() {
  // Supabase MFA enrollment is not enabled in this initial migration.
  return;
}

export async function getRegistrationFormOptions() {
  return null as unknown as Promise<RegistrationFormOptions>;
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
  const email = serviceNumberToEmail(payload.serviceNumber);
  const { error } = await supabase.auth.signUp({
    email,
    password: payload.password,
    options: {
      data: {
        fullName: payload.fullName,
        serviceNumber: payload.serviceNumber,
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

  if (error) {
    throw error;
  }

  return {
    nextStep: 'sign_in',
    challengeId: 'supabase_registration',
    destinationMasked: payload.email ? payload.email : email,
  };
}

export async function verifyRegistration(_challengeId: string, _code: string) {
  return { status: 'complete', message: 'Registration completed. Sign in with your credentials.' };
}

export async function resendChallenge(_challengeId: string) {
  throw new Error('Resend challenge is not supported in Supabase auth migration.');
}

export async function signIn(payload: { serviceNumber: string; password: string; userAgent?: string }) {
  const email = serviceNumberToEmail(payload.serviceNumber);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: payload.password,
  });

  if (error) {
    throw error;
  }

  if (!data.session || !data.user) {
    throw new Error('Sign in failed.');
  }

  const user = toPlatformUser(data.user);
  if (!user) {
    throw new Error('Sign in failed.');
  }

  const sessionPayload: SessionPayload = {
    sessionToken: data.session.access_token,
    expiresAt: sessionExpiresAt(data.session),
    user,
  };

  return sessionPayload;
}

export async function verifySignIn(_challengeId: string, _code: string) {
  throw new Error('OTP verification is not required for Supabase password sign in.');
}

export async function completeSignIn(payload: { serviceNumber: string; password: string }) {
  return signIn({ serviceNumber: payload.serviceNumber, password: payload.password });
}

export async function requestPasswordReset(serviceNumber: string) {
  const email = serviceNumberToEmail(serviceNumber);
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
  return { challengeId: 'supabase_password_reset', destinationMasked: email };
}

export async function verifyPasswordReset(_challengeId: string, _code: string) {
  return { resetToken: '' };
}

export async function resetPassword(_payload: {
  serviceNumber: string;
  resetToken: string;
  password: string;
  confirmPassword: string;
}) {
  throw new Error('Password reset is handled via Supabase email flow.');
}

export async function restoreSession() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData?.session) {
    return null;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return null;
  }

  const user = toPlatformUser(userData.user);
  if (!user) {
    return null;
  }

  return {
    user,
    session: { expiresAt: sessionExpiresAt(sessionData.session) },
  };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getPendingApprovals() {
  return unsupportedDataBackend();
}

export async function approveRegistration(_registrationApprovalId: string, _decision: 'approved' | 'rejected', _notes?: string) {
  return unsupportedDataBackend();
}

export async function getCommandCenterSummary() {
  return unsupportedDataBackend();
}

export async function getModules() {
  return unsupportedDataBackend();
}

export async function listInspections(_moduleCode?: string) {
  return unsupportedDataBackend();
}

export async function createInspection(_payload: { moduleCode: string; title: string; directorateCode: string; formationCode?: string; unitCode?: string; subjectName?: string; subjectReference?: string; }) {
  return unsupportedDataBackend();
}

export async function getInspectionDetail(_inspectionId: string) {
  return unsupportedDataBackend();
}

export async function saveInspectionResponse(_payload: { inspectionId: string; sectionId: string; itemId: string; responseValue: unknown; numericScore: number; severity?: string; immediateRisk: boolean; remarks?: string; }) {
  return unsupportedDataBackend();
}

export async function transitionInspection(_inspectionId: string, _toStatus: string, _comments?: string) {
  return unsupportedDataBackend();
}

export async function addCorrectiveAction(_inspectionId: string, _title: string, _detail: string, _stopWorkIssued = false) {
  return unsupportedDataBackend();
}

export async function createFinding(_payload: { inspectionId: string; itemId: string; title: string; detail: string; severity: string; }) {
  return unsupportedDataBackend();
}

export async function updateFinding(_payload: { findingId: string; title: string; detail: string; severity: string; status: string; }) {
  return unsupportedDataBackend();
}

export async function deleteFinding(_findingId: string) {
  return unsupportedDataBackend();
}

export async function addReviewComment(_payload: { inspectionId: string; findingId?: string; parentCommentId?: string; body: string; }) {
  return unsupportedDataBackend();
}

export async function resolveReviewComment(_commentId: string) {
  return unsupportedDataBackend();
}

export async function uploadEvidence(_inspectionId: string, _file: File, _sectionId?: string, _itemId?: string) {
  return unsupportedDataBackend();
}

export async function getEvidenceDownloadUrl(_evidenceId: string) {
  return unsupportedDataBackend();
}
