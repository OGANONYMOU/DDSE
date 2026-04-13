import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { roleCanApproveRegistrations, requiresApproval } from './lib/authz';

const APPOINTMENT_RULE = /^[A-Z0-9/-]{5,24}$/i;

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
    createdAt: Date.now(),
  });
}

async function getSessionAuth(ctx, sessionToken) {
  const session = await ctx.db.query('authSessions').withIndex('by_session_token', (q) => q.eq('sessionToken', sessionToken)).unique();
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

export const signOut = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const auth = await getSessionAuth(ctx, args.sessionToken);
    if (!auth) return { ok: true };

    await ctx.db.patch(auth.session._id, {
      status: 'revoked',
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
        return {
          approvalId: approval._id,
          userId: approval.userId,
          fullName: user?.fullName,
          appointmentNumber: user?.appointmentNumber,
          requestedRoleCode: user?.requestedRoleCode,
          directorateCode: user?.directorateCode,
          formationCode: user?.formationCode,
          unitCode: user?.unitCode,
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

    await ctx.db.patch(approval._id, {
      status: args.decision,
      reviewerUserId: auth.user._id,
      notes: args.notes,
      updatedAt: Date.now(),
    });

    await ctx.db.patch(user._id, {
      status: args.decision === 'approved' ? 'active' : 'rejected',
      activeRoleCode: args.decision === 'approved' ? user.requestedRoleCode : 'base_soldier',
      updatedAt: Date.now(),
    });

    await writeAudit(ctx, {
      actorUserId: auth.user._id,
      actorRoleCode: auth.user.activeRoleCode,
      action: `registration.${args.decision}`,
      entityType: 'user',
      entityId: String(user._id),
      newValue: { status: args.decision === 'approved' ? 'active' : 'rejected' },
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

    return ctx.db.query('users').withIndex('by_appointment_number', (q) => q.eq('appointmentNumber', args.appointmentNumber)).unique();
  },
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
    });
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('authSessions', {
      userId: args.userId,
      sessionToken: args.sessionToken,
      status: 'active',
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });

    await ctx.db.patch(args.userId, {
      failedLoginCount: 0,
      lastLoginAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const incrementFailedLoginInternal = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    await ctx.db.patch(args.userId, {
      failedLoginCount: user.failedLoginCount + 1,
      updatedAt: Date.now(),
    });
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
  },
  handler: async (ctx, args) => {
    await writeAudit(ctx, args);
  },
});
