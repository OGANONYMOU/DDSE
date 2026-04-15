import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { roleCanApproveRegistrations, requiresApproval } from './lib/authz';

const APPOINTMENT_RULE = /^[A-Z0-9/-]{5,24}$/i;
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

async function writeAudit(ctx, payload) {
  await ctx.db.insert('auditLogs', {
    actorUserId: payload.actorUserId,
    actorRoleCode: payload.actorRoleCode,
    action: payload.action,
    entityType: payload.entityType,
    entityId: payload.entityId,
    moduleCode: payload.moduleCode,
    oldValue: payload.oldValue,
    newValue: payload.newValue,
    justification: payload.justification,
    ipAddress: payload.ipAddress,
    userAgent: payload.userAgent,
    createdAt: Date.now(),
  });
}

async function getSessionAuth(ctx, sessionToken) {
  const session = await ctx.db
    .query('authSessions')
    .withIndex('by_session_token', (q) => q.eq('sessionToken', sessionToken))
    .unique();

  if (!session || session.status !== 'active' || session.expiresAt < Date.now()) {
    return null;
  }

  const user = await ctx.db.get(session.userId);
  if (!user || user.status !== 'active') {
    return null;
  }

  return { session, user };
}

export const currentSession = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.sessionToken) return null;
    const auth = await getSessionAuth(ctx, args.sessionToken);
    if (!auth) return null;

    return {
      session: {
        id: auth.session._id,
        expiresAt: auth.session.expiresAt,
        lastSeenAt: auth.session.lastSeenAt,
        sessionLabel: auth.session.sessionLabel,
      },
      user: {
        id: auth.user._id,
        fullName: auth.user.fullName,
        appointmentNumber: auth.user.appointmentNumber,
        roleCode: auth.user.activeRoleCode,
        directorateCode: auth.user.directorateCode,
        formationCode: auth.user.formationCode,
        unitCode: auth.user.unitCode,
        status: auth.user.status,
        mfaRequired: auth.user.mfaRequired,
      },
    };
  },
});

export const sessionPrincipal = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => getSessionAuth(ctx, args.sessionToken),
});

export const signOut = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const auth = await getSessionAuth(ctx, args.sessionToken);
    if (!auth) return { ok: true };

    await ctx.db.patch(auth.session._id, {
      status: 'revoked',
      revokedAt: Date.now(),
      revokedReason: 'logout',
      lastSeenAt: Date.now(),
    });

    await writeAudit(ctx, {
      actorUserId: auth.user._id,
      actorRoleCode: auth.user.activeRoleCode,
      action: 'auth.logout',
      entityType: 'session',
      entityId: String(auth.session._id),
    });

    return { ok: true };
  },
});

export const listSessions = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const auth = await getSessionAuth(ctx, args.sessionToken);
    if (!auth) {
      throw new Error('Authentication required.');
    }

    const sessions = await ctx.db
      .query('authSessions')
      .withIndex('by_user_id', (q) => q.eq('userId', auth.user._id))
      .collect();

    return sessions
      .sort((left, right) => right.lastSeenAt - left.lastSeenAt)
      .map((session) => ({
        sessionId: session._id,
        isCurrent: session.sessionToken === args.sessionToken,
        status: session.status,
        createdAt: session.createdAt,
        lastSeenAt: session.lastSeenAt,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt,
        revokedReason: session.revokedReason,
        sessionLabel: session.sessionLabel ?? 'Unlabelled device',
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
      }));
  },
});

export const revokeSession = mutation({
  args: {
    sessionToken: v.string(),
    targetSessionId: v.id('authSessions'),
  },
  handler: async (ctx, args) => {
    const auth = await getSessionAuth(ctx, args.sessionToken);
    if (!auth) {
      throw new Error('Authentication required.');
    }

    const targetSession = await ctx.db.get(args.targetSessionId);
    if (!targetSession) {
      throw new Error('Session not found.');
    }

    const canManage = targetSession.userId === auth.user._id || roleCanApproveRegistrations(auth.user.activeRoleCode);
    if (!canManage) {
      throw new Error('You are not authorized to revoke this session.');
    }

    await ctx.db.patch(targetSession._id, {
      status: 'revoked',
      revokedAt: Date.now(),
      revokedReason: targetSession.userId === auth.user._id ? 'user_revoked' : 'administrator_revoked',
      lastSeenAt: Date.now(),
    });

    await writeAudit(ctx, {
      actorUserId: auth.user._id,
      actorRoleCode: auth.user.activeRoleCode,
      action: 'auth.session.revoked',
      entityType: 'session',
      entityId: String(targetSession._id),
    });

    return { ok: true };
  },
});

export const revokeOtherSessions = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const auth = await getSessionAuth(ctx, args.sessionToken);
    if (!auth) {
      throw new Error('Authentication required.');
    }

    const sessions = await ctx.db
      .query('authSessions')
      .withIndex('by_user_id', (q) => q.eq('userId', auth.user._id))
      .collect();

    await Promise.all(
      sessions
        .filter((session) => session.sessionToken !== args.sessionToken && session.status === 'active')
        .map((session) =>
          ctx.db.patch(session._id, {
            status: 'revoked',
            revokedAt: Date.now(),
            revokedReason: 'user_revoked_other_sessions',
            lastSeenAt: Date.now(),
          }),
        ),
    );

    await writeAudit(ctx, {
      actorUserId: auth.user._id,
      actorRoleCode: auth.user.activeRoleCode,
      action: 'auth.sessions.revoked_others',
      entityType: 'user',
      entityId: String(auth.user._id),
    });

    return { ok: true };
  },
});

export const pendingApprovals = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const auth = await getSessionAuth(ctx, args.sessionToken);
    if (!auth || !roleCanApproveRegistrations(auth.user.activeRoleCode)) {
      return [];
    }

    const approvals = await ctx.db.query('registrationApprovals').collect();
    const pending = approvals.filter((approval) => approval.status === 'pending');

    return Promise.all(
      pending.map(async (approval) => {
        const user = await ctx.db.get(approval.userId);
        const profile = user
          ? await ctx.db.query('userProfiles').withIndex('by_user_id', (q) => q.eq('userId', user._id)).unique()
          : null;

        return {
          approvalId: approval._id,
          userId: approval.userId,
          fullName: user?.fullName,
          appointmentNumber: user?.appointmentNumber,
          requestedRoleCode: user?.requestedRoleCode,
          directorateCode: user?.directorateCode,
          formationCode: user?.formationCode,
          unitCode: user?.unitCode,
          justification: profile?.notes,
        };
      }),
    );
  },
});

export const approveRegistration = mutation({
  args: {
    sessionToken: v.string(),
    registrationApprovalId: v.id('registrationApprovals'),
    decision: v.union(v.literal('approved'), v.literal('rejected')),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await getSessionAuth(ctx, args.sessionToken);
    if (!auth || !roleCanApproveRegistrations(auth.user.activeRoleCode)) {
      throw new Error('You do not have permission to review registrations.');
    }

    const approval = await ctx.db.get(args.registrationApprovalId);
    if (!approval) {
      throw new Error('Registration approval record not found.');
    }

    const user = await ctx.db.get(approval.userId);
    if (!user) {
      throw new Error('User record not found.');
    }

    if (!args.notes?.trim() && (args.decision === 'rejected' || requiresApproval(user.requestedRoleCode))) {
      throw new Error('Decision rationale is required for sensitive approvals.');
    }

    await ctx.db.patch(approval._id, {
      status: args.decision,
      reviewerUserId: auth.user._id,
      notes: args.notes,
      updatedAt: Date.now(),
    });

    await ctx.db.patch(user._id, {
      status: args.decision === 'approved' ? 'active' : 'rejected',
      activeRoleCode: args.decision === 'approved' ? user.requestedRoleCode : 'base_soldier',
      privilegedRoleApprovedAt: args.decision === 'approved' ? Date.now() : undefined,
      privilegedRoleApprovedByUserId: args.decision === 'approved' ? auth.user._id : undefined,
      updatedAt: Date.now(),
    });

    const roleRequest = await ctx.db.query('roleRequests').withIndex('by_user_id', (q) => q.eq('userId', user._id)).unique();
    if (roleRequest) {
      await ctx.db.patch(roleRequest._id, {
        status: args.decision,
        decidedByUserId: auth.user._id,
        decisionReason: args.notes,
        decidedAt: Date.now(),
      });
    }

    await writeAudit(ctx, {
      actorUserId: auth.user._id,
      actorRoleCode: auth.user.activeRoleCode,
      action: `registration.${args.decision}`,
      entityType: 'user',
      entityId: String(user._id),
      newValue: { status: args.decision === 'approved' ? 'active' : 'rejected' },
      justification: args.notes,
    });

    return { ok: true };
  },
});

export const getUserByAppointmentNumber = query({
  args: { appointmentNumber: v.string() },
  handler: async (ctx, args) => {
    if (!APPOINTMENT_RULE.test(args.appointmentNumber)) {
      return null;
    }

    return ctx.db
      .query('users')
      .withIndex('by_appointment_number', (q) => q.eq('appointmentNumber', args.appointmentNumber))
      .unique();
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) =>
    ctx.db.query('users').withIndex('by_email', (q) => q.eq('email', args.email)).unique(),
});

export const getUserByPhoneNumber = query({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) =>
    ctx.db.query('users').withIndex('by_phone_number', (q) => q.eq('phoneNumber', args.phoneNumber)).unique(),
});

export const getUserProfileByIdentityNumber = query({
  args: { identityNumber: v.string() },
  handler: async (ctx, args) =>
    ctx.db.query('userProfiles').withIndex('by_identity_number', (q) => q.eq('identityNumber', args.identityNumber)).unique(),
});

export const getUserById = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => ctx.db.get(args.userId),
});

export const getChallengeById = query({
  args: { challengeId: v.id('verificationChallenges') },
  handler: async (ctx, args) => ctx.db.get(args.challengeId),
});

export const listPasswordResetChallenges = query({
  args: {},
  handler: async (ctx) =>
    (await ctx.db.query('verificationChallenges').withIndex('by_purpose', (q) => q.eq('purpose', 'password_reset')).collect()) ?? [],
});

export const createPendingUser = mutation({
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
    passwordHash: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert('users', {
      fullName: args.fullName,
      appointmentNumber: args.appointmentNumber,
      email: args.email,
      phoneNumber: args.phoneNumber,
      branch: args.branch,
      passwordHash: args.passwordHash,
      rankCode: args.rankCode,
      requestedRoleCode: args.requestedRoleCode,
      activeRoleCode: 'base_soldier',
      directorateCode: args.directorateCode,
      formationCode: args.formationCode,
      unitCode: args.unitCode,
      status: 'pending_verification',
      emailVerifiedAt: undefined,
      phoneVerifiedAt: undefined,
      mfaRequired: requiresApproval(args.requestedRoleCode),
      failedLoginCount: 0,
      lockedUntil: undefined,
      lastFailedLoginAt: undefined,
      suspiciousActivityAt: undefined,
      privilegedRoleApprovedAt: undefined,
      privilegedRoleApprovedByUserId: undefined,
      lastLoginAt: undefined,
      createdAt: args.now,
      updatedAt: args.now,
    });

    await ctx.db.insert('userProfiles', {
      userId,
      serviceBranch: args.branch,
      identityNumber: args.identityNumber,
      notes: args.justification,
      createdAt: args.now,
      updatedAt: args.now,
    });

    await ctx.db.insert('roleRequests', {
      userId,
      requestedRoleCode: args.requestedRoleCode,
      status: 'pending',
      justification: args.justification,
      createdAt: args.now,
      decidedAt: undefined,
    });

    await ctx.db.insert('registrationApprovals', {
      userId,
      status: 'pending',
      reviewerUserId: undefined,
      notes: undefined,
      createdAt: args.now,
      updatedAt: args.now,
    });

    return userId;
  },
});

export const createVerificationChallenge = mutation({
  args: {
    userId: v.optional(v.id('users')),
    appointmentNumber: v.optional(v.string()),
    channel: v.string(),
    purpose: v.string(),
    destination: v.string(),
    codeHash: v.string(),
    expiresAt: v.number(),
    maxAttempts: v.number(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) =>
    ctx.db.insert('verificationChallenges', {
      userId: args.userId,
      appointmentNumber: args.appointmentNumber,
      channel: args.channel,
      purpose: args.purpose,
      destination: args.destination,
      codeHash: args.codeHash,
      resetTokenHash: undefined,
      expiresAt: args.expiresAt,
      consumedAt: undefined,
      failedAttempts: 0,
      maxAttempts: args.maxAttempts,
      metadata: args.metadata,
      createdAt: Date.now(),
    }),
});

export const refreshChallengeCodeInternal = mutation({
  args: {
    challengeId: v.id('verificationChallenges'),
    codeHash: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.challengeId, {
      codeHash: args.codeHash,
      expiresAt: args.expiresAt,
      consumedAt: undefined,
      failedAttempts: 0,
    });
  },
});

export const registerChallengeAttemptInternal = mutation({
  args: {
    challengeId: v.id('verificationChallenges'),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      return { attemptsRemaining: 0 };
    }

    const failedAttempts = challenge.failedAttempts + 1;
    const consumedAt = failedAttempts >= challenge.maxAttempts ? args.now : challenge.consumedAt;
    await ctx.db.patch(args.challengeId, {
      failedAttempts,
      consumedAt,
    });

    return {
      attemptsRemaining: Math.max(0, challenge.maxAttempts - failedAttempts),
    };
  },
});

export const completeRegistrationInternal = mutation({
  args: {
    challengeId: v.id('verificationChallenges'),
    userId: v.id('users'),
    now: v.number(),
    status: v.string(),
    activeRoleCode: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.challengeId, { consumedAt: args.now });
    await ctx.db.patch(args.userId, {
      status: args.status,
      activeRoleCode: args.activeRoleCode,
      phoneVerifiedAt: args.now,
      updatedAt: args.now,
    });
  },
});

export const consumeChallengeInternal = mutation({
  args: {
    challengeId: v.id('verificationChallenges'),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.challengeId, { consumedAt: args.now });
  },
});

export const promoteResetChallengeInternal = mutation({
  args: {
    challengeId: v.id('verificationChallenges'),
    resetTokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.challengeId, {
      resetTokenHash: args.resetTokenHash,
    });
  },
});

export const updatePasswordInternal = mutation({
  args: {
    userId: v.id('users'),
    passwordHash: v.string(),
    challengeId: v.id('verificationChallenges'),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      passwordHash: args.passwordHash,
      updatedAt: args.now,
      failedLoginCount: 0,
      lockedUntil: undefined,
      lastFailedLoginAt: undefined,
    });
    await ctx.db.patch(args.challengeId, { consumedAt: args.now });
  },
});

export const storeSessionInternal = mutation({
  args: {
    userId: v.id('users'),
    sessionToken: v.string(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    expiresAt: v.number(),
    sessionLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('authSessions', {
      userId: args.userId,
      sessionToken: args.sessionToken,
      status: 'active',
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      lastElevatedAt: Date.now(),
      revokedAt: undefined,
      revokedReason: undefined,
      sessionLabel: args.sessionLabel,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });

    await ctx.db.patch(args.userId, {
      failedLoginCount: 0,
      lockedUntil: undefined,
      lastFailedLoginAt: undefined,
      lastLoginAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const touchSessionInternal = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('authSessions')
      .withIndex('by_session_token', (q) => q.eq('sessionToken', args.sessionToken))
      .unique();

    if (!session || session.status !== 'active') {
      return;
    }

    await ctx.db.patch(session._id, {
      lastSeenAt: Date.now(),
    });
  },
});

export const incrementFailedLoginInternal = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { lockedUntil: undefined, failedLoginCount: 0 };

    const failedLoginCount = user.failedLoginCount + 1;
    const lockedUntil = failedLoginCount >= LOCKOUT_THRESHOLD ? Date.now() + LOCKOUT_WINDOW_MS : user.lockedUntil;
    await ctx.db.patch(args.userId, {
      failedLoginCount,
      lockedUntil,
      lastFailedLoginAt: Date.now(),
      suspiciousActivityAt: lockedUntil ? Date.now() : user.suspiciousActivityAt,
      updatedAt: Date.now(),
    });

    return { lockedUntil, failedLoginCount };
  },
});

export const recordAuditInternal = mutation({
  args: {
    actorUserId: v.optional(v.id('users')),
    actorRoleCode: v.optional(v.string()),
    action: v.string(),
    entityType: v.string(),
    entityId: v.optional(v.string()),
    moduleCode: v.optional(v.string()),
    oldValue: v.optional(v.any()),
    newValue: v.optional(v.any()),
    justification: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await writeAudit(ctx, args);
  },
});
