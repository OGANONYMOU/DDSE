"use node";

import bcrypt from 'bcryptjs';
import { action } from './_generated/server';
import { v } from 'convex/values';
import { requiresApproval } from './lib/authz';
import { randomCode, randomToken, sha256 } from './lib/security';

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;
const APPOINTMENT_RULE = /^[A-Z0-9\/\-]{5,24}$/i;

export const register = action({
  args: {
    fullName: v.string(),
    serviceNumber: v.string(),
    rankCode: v.string(),
    requestedRoleCode: v.string(),
    directorateCode: v.string(),
    phoneNumber: v.string(),
    email: v.optional(v.string()),
    password: v.string(),
    confirmPassword: v.string(),
  },
  handler: async (ctx, args) => {
    if (!APPOINTMENT_RULE.test(args.serviceNumber)) {
      throw new Error('Service number format is invalid.');
    }
    if (!PASSWORD_RULE.test(args.password)) {
      throw new Error('Password must be 12+ characters and include upper, lower, number, and symbol.');
    }
    if (args.password !== args.confirmPassword) {
      throw new Error('Password confirmation does not match.');
    }

    const serviceNumber = args.serviceNumber.toUpperCase();
    const existingUser = await ctx.runQuery('auth:getUserByServiceNumber', { serviceNumber });
    if (existingUser) {
      throw new Error('An account with this service number already exists.');
    }

    const now = Date.now();
    const passwordHash = await bcrypt.hash(args.password, 12);
    const userId = await ctx.runMutation('auth:createPendingUser', {
      ...args,
      serviceNumber,
      passwordHash,
      now,
    });

    const challengeCode = randomCode();
    const challengeId = await ctx.runMutation('auth:createVerificationChallenge', {
      userId,
      serviceNumber,
      channel: args.email ? 'email' : 'sms',
      purpose: 'registration',
      destination: args.email ?? args.phoneNumber,
      codeHash: await sha256(challengeCode),
      expiresAt: now + 10 * 60 * 1000,
      metadata: { requestedRoleCode: args.requestedRoleCode },
    });

    await ctx.runAction('otp:sendOtp', {
      userId,
      serviceNumber,
      destination: args.email ?? args.phoneNumber,
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
        ? args.email.replace(/(.{2}).+(@.+)/, '$1***$2')
        : `${args.phoneNumber.slice(0, 4)}***${args.phoneNumber.slice(-2)}`,
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
      throw new Error('Verification code is invalid.');
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

const BOOTSTRAP_PASSWORD =
  process.env.DDSE_BOOTSTRAP_OWNER_PASSWORD ||
  process.env.VITE_DDSE_BOOTSTRAP_OWNER_PASSWORD ||
  process.env.BOOTSTRAP_PASSWORD ||
  process.env.VITE_BOOTSTRAP_PASSWORD;

export const bootstrapPlatformOwner = action({
  args: {
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const password = args.password ?? BOOTSTRAP_PASSWORD;
    if (!password) {
      throw new Error('Bootstrap password is not configured for platform owner creation.');
    }
    if (password === 'Anonymous@01' && process.env.NODE_ENV !== 'development') {
      throw new Error('Local bootstrap password is only allowed in development environments.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await ctx.runMutation('catalog:bootstrapReferenceData', {});
    const userId = await ctx.runMutation('auth:createPlatformOwnerInternal', {
      passwordHash,
      now: Date.now(),
    });

    const createdUser = await ctx.runQuery('auth:getUserByServiceNumber', {
      serviceNumber: 'ANONYMOUS',
    });
    if (!createdUser) {
      throw new Error('Platform owner bootstrap failed: user record was not created.');
    }

    return userId;
  },
});

export const resetPlatformOwnerPassword = action({
  args: {
    password: v.string(),
    bootstrapSecret: v.string(),
  },
  handler: async (ctx, args) => {
    if (!BOOTSTRAP_PASSWORD) {
      throw new Error('Bootstrap secret is not configured on the Convex server.');
    }
    if (args.bootstrapSecret !== BOOTSTRAP_PASSWORD) {
      throw new Error('Invalid bootstrap secret.');
    }

    const user = await ctx.runQuery('auth:getUserByServiceNumber', {
      serviceNumber: 'ANONYMOUS',
    });
    if (!user || user.activeRoleCode !== 'platform_owner') {
      throw new Error('Platform owner account not found.');
    }

    const passwordHash = await bcrypt.hash(args.password, 12);
    await ctx.runMutation('auth:resetPlatformOwnerPasswordInternal', {
      userId: user._id,
      passwordHash,
      now: Date.now(),
    });

    return { ok: true };
  },
});

export const updatePasswordAfterBootstrap = action({
  args: {
    sessionToken: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    if (!PASSWORD_RULE.test(args.password)) {
      throw new Error('Password must be 12+ characters and include upper, lower, number, and symbol.');
    }
    const passwordHash = await bcrypt.hash(args.password, 12);
    return ctx.runMutation('auth:updatePasswordAfterBootstrap', {
      sessionToken: args.sessionToken,
      passwordHash,
    });
  },
});

export const signIn = action({
  args: {
    serviceNumber: v.string(),
    password: v.string(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const serviceNumber = args.serviceNumber.toUpperCase();
    const user = await ctx.runQuery('auth:getUserByServiceNumber', { serviceNumber });
    if (!user) {
      throw new Error('Invalid credentials.');
    }
    if (user.status !== 'active') {
      throw new Error('Account is not active.');
    }

    const passwordMatches = await bcrypt.compare(args.password, user.passwordHash);
    if (!passwordMatches) {
      await ctx.runMutation('auth:incrementFailedLoginInternal', { userId: user._id });
      await ctx.runMutation('auth:recordAuditInternal', {
        action: 'auth.login.failed',
        entityType: 'user',
        entityId: String(user._id),
        actorUserId: user._id,
        actorRoleCode: user.activeRoleCode,
      });
      throw new Error('Invalid credentials.');
    }

    if (user.activeRoleCode === 'platform_owner' && (user.mustChangePassword || (user.mfaRequired && !user.mfaEnrolled))) {
      const challengeCode = randomCode();
      const challengeId = await ctx.runMutation('auth:createVerificationChallenge', {
        userId: user._id,
        serviceNumber,
        channel: user.email ? 'email' : 'sms',
        purpose: 'sign_in',
        destination: user.email ?? user.phoneNumber,
        codeHash: await sha256(challengeCode),
        expiresAt: Date.now() + 10 * 60 * 1000,
        metadata: {
          userAgent: args.userAgent,
          ipAddress: args.ipAddress,
        },
      });

      await ctx.runAction('otp:sendOtp', {
        userId: user._id,
        serviceNumber,
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
      };
    }

    if (user.mfaRequired && user.mfaEnrolled) {
      const challengeCode = randomCode();
      const challengeId = await ctx.runMutation('auth:createVerificationChallenge', {
        userId: user._id,
        serviceNumber,
        channel: user.email ? 'email' : 'sms',
        purpose: 'sign_in',
        destination: user.email ?? user.phoneNumber,
        codeHash: await sha256(challengeCode),
        expiresAt: Date.now() + 10 * 60 * 1000,
        metadata: {
          userAgent: args.userAgent,
          ipAddress: args.ipAddress,
        },
      });

      await ctx.runAction('otp:sendOtp', {
        userId: user._id,
        serviceNumber,
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
      throw new Error('One-time passcode is invalid.');
    }

    await ctx.runMutation('auth:consumeChallengeInternal', {
      challengeId: args.challengeId,
      now: Date.now(),
    });

    const user = await ctx.runQuery('auth:getUserById', { userId: challenge.userId });
    if (!user) {
      throw new Error('User account not found.');
    }

    const session = await ctx.runAction('authNode:createSessionInternal', {
      userId: challenge.userId,
      userAgent: args.userAgent ?? challenge.metadata?.userAgent,
      ipAddress: args.ipAddress ?? challenge.metadata?.ipAddress,
    });

    if (user.activeRoleCode === 'platform_owner' && user.mustChangePassword) {
      await ctx.runMutation('auth:recordAuditInternal', {
        action: 'auth.login.bootstrap_verified',
        entityType: 'user',
        entityId: String(user._id),
        actorUserId: user._id,
        actorRoleCode: user.activeRoleCode,
      });
      return {
        ...session,
        requiresBootstrapPasswordChange: true,
      };
    }

    return session;
  },
});

export const requestPasswordReset = action({
  args: {
    serviceNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const serviceNumber = args.serviceNumber.toUpperCase();
    const user = await ctx.runQuery('auth:getUserByServiceNumber', { serviceNumber });
    if (!user || user.status !== 'active') {
      throw new Error('Active account not found for password reset.');
    }

    const challengeCode = randomCode();
    const challengeId = await ctx.runMutation('auth:createVerificationChallenge', {
      userId: user._id,
      serviceNumber,
      channel: user.email ? 'email' : 'sms',
      purpose: 'password_reset',
      destination: user.email ?? user.phoneNumber,
      codeHash: await sha256(challengeCode),
      expiresAt: Date.now() + 10 * 60 * 1000,
      metadata: {},
    });

    await ctx.runAction('otp:sendOtp', {
      userId: user._id,
      serviceNumber,
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
      throw new Error('Verification code is invalid.');
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
    };
  },
});

export const resetPassword = action({
  args: {
    serviceNumber: v.string(),
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

    const serviceNumber = args.serviceNumber.toUpperCase();
    const user = await ctx.runQuery('auth:getUserByServiceNumber', { serviceNumber });
    if (!user) {
      throw new Error('User account not found.');
    }

    const resetTokenHash = await sha256(args.resetToken);
    const challenge = await ctx.runQuery('auth:getPasswordResetChallengeByResetTokenHash', { resetTokenHash });
    if (!challenge || challenge.userId !== user._id || challenge.consumedAt || challenge.expiresAt < Date.now()) {
      throw new Error('Reset token is invalid or expired.');
    }

    await ctx.runMutation('auth:updatePasswordInternal', {
      userId: user._id,
      passwordHash: await bcrypt.hash(args.password, 12),
      challengeId: challenge._id,
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
    });

    const user = await ctx.runQuery('auth:getUserById', { userId: args.userId });
    await ctx.runMutation('auth:recordAuditInternal', {
      action: 'auth.login.success',
      entityType: 'user',
      entityId: String(args.userId),
      actorUserId: args.userId,
      actorRoleCode: user.activeRoleCode,
    });

    return {
      sessionToken,
      expiresAt,
      user: {
        id: user._id,
        fullName: user.fullName,
        serviceNumber: user.serviceNumber,
        roleCode: user.activeRoleCode,
        directorateCode: user.directorateCode,
        status: user.status,
        mfaRequired: user.mfaRequired,
        mfaEnrolled: user.mfaEnrolled,
        mustChangePassword: user.mustChangePassword,
        isPlatformOwner: user.isPlatformOwner,
      },
    };
  },
});
