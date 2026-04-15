"use node";

import bcrypt from 'bcryptjs';
import { action } from './_generated/server';
import { v } from 'convex/values';
import { requiresApproval, validateRoleEligibility } from './lib/authz';
import { randomCode, randomToken, sha256 } from './lib/security';

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;
const APPOINTMENT_RULE = /^[A-Z0-9/-]{5,24}$/i;
const PHONE_RULE = /^\+?[0-9]{10,15}$/;
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_AUTH_ERROR = 'Invalid credentials or account unavailable.';
const GENERIC_RESET_MESSAGE = 'If an active account exists, a reset challenge has been dispatched.';

function isDevOtpPreviewEnabled() {
  return process.env.DDSE_ENABLE_DEV_OTP_PREVIEW === 'true';
}

function normalizeAppointmentNumber(value) {
  return value.trim().toUpperCase();
}

function sessionLabelFromUserAgent(userAgent) {
  if (!userAgent) {
    return 'Unclassified device';
  }

  if (userAgent.includes('Windows')) return 'Windows endpoint';
  if (userAgent.includes('Mac OS')) return 'macOS endpoint';
  if (userAgent.includes('Android')) return 'Android device';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS device';
  return 'Operational endpoint';
}

async function failChallenge(ctx, challengeId) {
  const result = await ctx.runMutation('auth:registerChallengeAttemptInternal', {
    challengeId,
    now: Date.now(),
  });

  if (result.attemptsRemaining > 0) {
    throw new Error(`Verification code is invalid. ${result.attemptsRemaining} attempt(s) remaining.`);
  }

  throw new Error('Verification challenge is no longer valid.');
}

export const register = action({
  args: {
    fullName: v.string(),
    appointmentNumber: v.string(),
    rankCode: v.string(),
    requestedRoleCode: v.string(),
    directorateCode: v.string(),
    formationCode: v.string(),
    unitCode: v.string(),
    phoneNumber: v.string(),
    email: v.optional(v.string()),
    branch: v.optional(v.string()),
    identityNumber: v.optional(v.string()),
    justification: v.optional(v.string()),
    password: v.string(),
    confirmPassword: v.string(),
  },
  handler: async (ctx, args) => {
    if (!APPOINTMENT_RULE.test(args.appointmentNumber)) {
      throw new Error('Appointment or service number format is invalid.');
    }
    if (!PASSWORD_RULE.test(args.password)) {
      throw new Error('Password must be 12+ characters and include upper, lower, number, and symbol.');
    }
    if (args.password !== args.confirmPassword) {
      throw new Error('Password confirmation does not match.');
    }
    if (!PHONE_RULE.test(args.phoneNumber)) {
      throw new Error('Phone number format is invalid.');
    }
    if (args.email && !EMAIL_RULE.test(args.email)) {
      throw new Error('Email address format is invalid.');
    }
    if (requiresApproval(args.requestedRoleCode) && !args.justification?.trim()) {
      throw new Error('Privileged role requests require operational justification.');
    }

    const appointmentNumber = normalizeAppointmentNumber(args.appointmentNumber);
    const catalogs = await ctx.runQuery('catalog:registrationFormOptions', {});
    const selectedUnit = catalogs.units.find((unit) => unit.code === args.unitCode);
    if (!selectedUnit || selectedUnit.formationCode !== args.formationCode) {
      throw new Error('Unit and formation selection is inconsistent.');
    }
    if (!catalogs.directorates.some((directorate) => directorate.code === args.directorateCode)) {
      throw new Error('Directorate selection is invalid.');
    }

    const eligibilityError = validateRoleEligibility(args.requestedRoleCode, args.directorateCode);
    if (eligibilityError) {
      throw new Error(eligibilityError);
    }

    const existingUser = await ctx.runQuery('auth:getUserByAppointmentNumber', { appointmentNumber });
    if (existingUser) {
      throw new Error('Registration could not be processed with the submitted identity details.');
    }
    if (args.email && (await ctx.runQuery('auth:getUserByEmail', { email: args.email.trim().toLowerCase() }))) {
      throw new Error('Registration could not be processed with the submitted identity details.');
    }
    if (await ctx.runQuery('auth:getUserByPhoneNumber', { phoneNumber: args.phoneNumber.trim() })) {
      throw new Error('Registration could not be processed with the submitted identity details.');
    }
    if (args.identityNumber && (await ctx.runQuery('auth:getUserProfileByIdentityNumber', { identityNumber: args.identityNumber.trim().toUpperCase() }))) {
      throw new Error('Registration could not be processed with the submitted identity details.');
    }

    const now = Date.now();
    const passwordHash = await bcrypt.hash(args.password, 12);
    const userId = await ctx.runMutation('auth:createPendingUser', {
      ...args,
      appointmentNumber,
      email: args.email?.trim().toLowerCase(),
      phoneNumber: args.phoneNumber.trim(),
      identityNumber: args.identityNumber?.trim().toUpperCase(),
      passwordHash,
      now,
    });

    const challengeCode = randomCode();
    const challengeId = await ctx.runMutation('auth:createVerificationChallenge', {
      userId,
      appointmentNumber,
      channel: args.email ? 'email' : 'sms',
      purpose: 'registration',
      destination: args.email?.trim().toLowerCase() ?? args.phoneNumber.trim(),
      codeHash: await sha256(challengeCode),
      expiresAt: now + 10 * 60 * 1000,
      maxAttempts: 5,
      metadata: { requestedRoleCode: args.requestedRoleCode },
    });

    await ctx.runAction('otp:sendOtp', {
      userId,
      appointmentNumber,
      destination: args.email?.trim().toLowerCase() ?? args.phoneNumber.trim(),
      channel: args.email ? 'email' : 'sms',
      purpose: 'registration',
      code: challengeCode,
    });
    await ctx.runMutation('auth:recordAuditInternal', {
      action: 'registration.submitted',
      entityType: 'user',
      entityId: String(userId),
      actorUserId: userId,
      actorRoleCode: 'base_soldier',
      newValue: { requestedRoleCode: args.requestedRoleCode },
    });

    return {
      nextStep: 'verify_registration',
      challengeId,
      destinationMasked: args.email
        ? args.email.trim().toLowerCase().replace(/(.{2}).+(@.+)/, '$1***$2')
        : `${args.phoneNumber.slice(0, 4)}***${args.phoneNumber.slice(-2)}`,
      previewCode: isDevOtpPreviewEnabled() ? challengeCode : undefined,
    };
  },
});

export const verifyRegistration = action({
  args: {
    challengeId: v.id('verificationChallenges'),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.runQuery('auth:getChallengeById', { challengeId: args.challengeId });
    if (!challenge || challenge.purpose !== 'registration') {
      throw new Error('Registration challenge is invalid.');
    }
    if (challenge.consumedAt || challenge.expiresAt < Date.now()) {
      throw new Error('Registration challenge has expired.');
    }
    if ((await sha256(args.code)) !== challenge.codeHash) {
      await failChallenge(ctx, args.challengeId);
    }

    const user = await ctx.runQuery('auth:getUserById', { userId: challenge.userId });
    const approvalRequired = requiresApproval(user.requestedRoleCode);

    await ctx.runMutation('auth:completeRegistrationInternal', {
      challengeId: args.challengeId,
      userId: challenge.userId,
      now: Date.now(),
      status: approvalRequired ? 'pending_approval' : 'active',
      activeRoleCode: approvalRequired ? 'base_soldier' : user.requestedRoleCode,
    });

    await ctx.runMutation('auth:recordAuditInternal', {
      action: approvalRequired ? 'registration.verified_pending_approval' : 'registration.activated',
      entityType: 'user',
      entityId: String(challenge.userId),
      actorUserId: challenge.userId,
      actorRoleCode: approvalRequired ? 'base_soldier' : user.requestedRoleCode,
    });

    return {
      status: approvalRequired ? 'pending_approval' : 'active',
      message: approvalRequired
        ? 'Registration verified and awaiting privileged-role approval.'
        : 'Registration verified. You can now sign in.',
    };
  },
});

export const signIn = action({
  args: {
    appointmentNumber: v.string(),
    password: v.string(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const appointmentNumber = normalizeAppointmentNumber(args.appointmentNumber);
    const user = await ctx.runQuery('auth:getUserByAppointmentNumber', { appointmentNumber });
    if (!user) {
      throw new Error(GENERIC_AUTH_ERROR);
    }
    if (user.lockedUntil && user.lockedUntil > Date.now()) {
      throw new Error('Account access is temporarily locked due to repeated failures.');
    }
    if (user.status !== 'active') {
      throw new Error(GENERIC_AUTH_ERROR);
    }

    const passwordMatches = await bcrypt.compare(args.password, user.passwordHash);
    if (!passwordMatches) {
      const failureState = await ctx.runMutation('auth:incrementFailedLoginInternal', { userId: user._id });
      await ctx.runMutation('auth:recordAuditInternal', {
        action: 'auth.login.failed',
        entityType: 'user',
        entityId: String(user._id),
        actorUserId: user._id,
        actorRoleCode: user.activeRoleCode,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        newValue: failureState,
      });
      throw new Error(failureState.lockedUntil && failureState.lockedUntil > Date.now()
        ? 'Account access is temporarily locked due to repeated failures.'
        : GENERIC_AUTH_ERROR);
    }

    if (user.mfaRequired) {
      const challengeCode = randomCode();
      const challengeId = await ctx.runMutation('auth:createVerificationChallenge', {
        userId: user._id,
        appointmentNumber,
        channel: user.email ? 'email' : 'sms',
        purpose: 'sign_in',
        destination: user.email ?? user.phoneNumber,
        codeHash: await sha256(challengeCode),
        expiresAt: Date.now() + 10 * 60 * 1000,
        maxAttempts: 5,
        metadata: {
          userAgent: args.userAgent,
          ipAddress: args.ipAddress,
        },
      });

      await ctx.runAction('otp:sendOtp', {
        userId: user._id,
        appointmentNumber,
        destination: user.email ?? user.phoneNumber,
        channel: user.email ? 'email' : 'sms',
        purpose: 'sign_in',
        code: challengeCode,
      });
      return {
        requiresOtp: true,
        challengeId,
        destinationMasked: user.email
          ? user.email.replace(/(.{2}).+(@.+)/, '$1***$2')
          : `${user.phoneNumber.slice(0, 4)}***${user.phoneNumber.slice(-2)}`,
        previewCode: isDevOtpPreviewEnabled() ? challengeCode : undefined,
      };
    }

    return ctx.runAction('authNode:createSessionInternal', {
      userId: user._id,
      userAgent: args.userAgent,
      ipAddress: args.ipAddress,
    });
  },
});

export const verifySignIn = action({
  args: {
    challengeId: v.id('verificationChallenges'),
    code: v.string(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.runQuery('auth:getChallengeById', { challengeId: args.challengeId });
    if (!challenge || challenge.purpose !== 'sign_in') {
      throw new Error('Sign in challenge is invalid.');
    }
    if (challenge.consumedAt || challenge.expiresAt < Date.now()) {
      throw new Error('Sign in challenge has expired.');
    }
    if ((await sha256(args.code)) !== challenge.codeHash) {
      await failChallenge(ctx, args.challengeId);
    }

    await ctx.runMutation('auth:consumeChallengeInternal', {
      challengeId: args.challengeId,
      now: Date.now(),
    });

    return ctx.runAction('authNode:createSessionInternal', {
      userId: challenge.userId,
      userAgent: args.userAgent ?? challenge.metadata?.userAgent,
      ipAddress: args.ipAddress ?? challenge.metadata?.ipAddress,
    });
  },
});

export const requestPasswordReset = action({
  args: {
    appointmentNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const appointmentNumber = normalizeAppointmentNumber(args.appointmentNumber);
    const user = await ctx.runQuery('auth:getUserByAppointmentNumber', { appointmentNumber });
    if (!user || user.status !== 'active') {
      return {
        challengeId: null,
        destinationMasked: 'secured channel',
        message: GENERIC_RESET_MESSAGE,
      };
    }

    const challengeCode = randomCode();
    const challengeId = await ctx.runMutation('auth:createVerificationChallenge', {
      userId: user._id,
      appointmentNumber,
      channel: user.email ? 'email' : 'sms',
      purpose: 'password_reset',
      destination: user.email ?? user.phoneNumber,
      codeHash: await sha256(challengeCode),
      expiresAt: Date.now() + 10 * 60 * 1000,
      maxAttempts: 5,
      metadata: {},
    });

    await ctx.runAction('otp:sendOtp', {
      userId: user._id,
      appointmentNumber,
      destination: user.email ?? user.phoneNumber,
      channel: user.email ? 'email' : 'sms',
      purpose: 'password_reset',
      code: challengeCode,
    });
    await ctx.runMutation('auth:recordAuditInternal', {
      action: 'auth.password_reset.requested',
      entityType: 'user',
      entityId: String(user._id),
      actorUserId: user._id,
      actorRoleCode: user.activeRoleCode,
    });

    return {
      challengeId,
      destinationMasked: user.email
        ? user.email.replace(/(.{2}).+(@.+)/, '$1***$2')
        : `${user.phoneNumber.slice(0, 4)}***${user.phoneNumber.slice(-2)}`,
      message: GENERIC_RESET_MESSAGE,
      previewCode: isDevOtpPreviewEnabled() ? challengeCode : undefined,
    };
  },
});

export const verifyPasswordReset = action({
  args: {
    challengeId: v.id('verificationChallenges'),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.runQuery('auth:getChallengeById', { challengeId: args.challengeId });
    if (!challenge || challenge.purpose !== 'password_reset') {
      throw new Error('Password reset challenge is invalid.');
    }
    if (challenge.consumedAt || challenge.expiresAt < Date.now()) {
      throw new Error('Password reset challenge has expired.');
    }
    if ((await sha256(args.code)) !== challenge.codeHash) {
      await failChallenge(ctx, args.challengeId);
    }

    const resetToken = randomToken();
    await ctx.runMutation('auth:promoteResetChallengeInternal', {
      challengeId: args.challengeId,
      resetTokenHash: await sha256(resetToken),
    });

    return { resetToken };
  },
});

export const resendChallenge = action({
  args: {
    challengeId: v.id('verificationChallenges'),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.runQuery('auth:getChallengeById', { challengeId: args.challengeId });
    if (!challenge || challenge.consumedAt || challenge.expiresAt < Date.now()) {
      throw new Error('Challenge is no longer valid for resend.');
    }

    const code = randomCode();
    await ctx.runMutation('auth:refreshChallengeCodeInternal', {
      challengeId: args.challengeId,
      codeHash: await sha256(code),
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    await ctx.runAction('otp:sendOtp', {
      userId: challenge.userId,
      appointmentNumber: challenge.appointmentNumber,
      destination: challenge.destination,
      channel: challenge.channel,
      purpose: challenge.purpose,
      code,
    });

    await ctx.runMutation('auth:recordAuditInternal', {
      action: 'auth.challenge.resent',
      entityType: 'verification_challenge',
      entityId: String(args.challengeId),
      actorUserId: challenge.userId,
    });

    return {
      challengeId: args.challengeId,
      destinationMasked: challenge.channel === 'email'
        ? challenge.destination.replace(/(.{2}).+(@.+)/, '$1***$2')
        : `${challenge.destination.slice(0, 4)}***${challenge.destination.slice(-2)}`,
      previewCode: isDevOtpPreviewEnabled() ? code : undefined,
    };
  },
});

export const resetPassword = action({
  args: {
    appointmentNumber: v.string(),
    resetToken: v.string(),
    password: v.string(),
    confirmPassword: v.string(),
  },
  handler: async (ctx, args) => {
    if (!PASSWORD_RULE.test(args.password)) {
      throw new Error('Password must be 12+ characters and include upper, lower, number, and symbol.');
    }
    if (args.password !== args.confirmPassword) {
      throw new Error('Password confirmation does not match.');
    }

    const appointmentNumber = normalizeAppointmentNumber(args.appointmentNumber);
    const user = await ctx.runQuery('auth:getUserByAppointmentNumber', { appointmentNumber });
    if (!user) {
      throw new Error('Reset token is invalid or expired.');
    }

    const resetTokenHash = await sha256(args.resetToken);
    const challenges = await ctx.runQuery('auth:listPasswordResetChallenges', {});
    const matchingChallenge = challenges.find(
      (challenge) =>
        challenge.userId === user._id &&
        challenge.resetTokenHash === resetTokenHash &&
        !challenge.consumedAt &&
        challenge.expiresAt > Date.now(),
    );
    if (!matchingChallenge) {
      throw new Error('Reset token is invalid or expired.');
    }

    await ctx.runMutation('auth:updatePasswordInternal', {
      userId: user._id,
      passwordHash: await bcrypt.hash(args.password, 12),
      challengeId: matchingChallenge._id,
      now: Date.now(),
    });

    await ctx.runMutation('auth:recordAuditInternal', {
      action: 'auth.password_reset.completed',
      entityType: 'user',
      entityId: String(user._id),
      actorUserId: user._id,
      actorRoleCode: user.activeRoleCode,
    });

    return { ok: true };
  },
});

export const createSessionInternal = action({
  args: {
    userId: v.id('users'),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessionToken = randomToken();
    const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
    await ctx.runMutation('auth:storeSessionInternal', {
      userId: args.userId,
      sessionToken,
      userAgent: args.userAgent,
      ipAddress: args.ipAddress,
      expiresAt,
      sessionLabel: sessionLabelFromUserAgent(args.userAgent),
    });

    const user = await ctx.runQuery('auth:getUserById', { userId: args.userId });
    await ctx.runMutation('auth:recordAuditInternal', {
      action: 'auth.login.success',
      entityType: 'user',
      entityId: String(args.userId),
      actorUserId: args.userId,
      actorRoleCode: user.activeRoleCode,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });

    return {
      sessionToken,
      expiresAt,
      user: {
        id: user._id,
        fullName: user.fullName,
        appointmentNumber: user.appointmentNumber,
        roleCode: user.activeRoleCode,
        directorateCode: user.directorateCode,
        formationCode: user.formationCode,
        unitCode: user.unitCode,
        status: user.status,
        mfaRequired: user.mfaRequired,
      },
    };
  },
});
