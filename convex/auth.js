import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { roleCanApproveRegistrations, requiresApproval } from './lib/authz';

const APPOINTMENT_RULE = /^[A-Z0-9\/\-]{5,24}$/i;

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

async function getSessionAuth(ctx, sessionToken, options = { allowBootstrapPending: false }) {
  const session = await ctx.db.query('authSessions').withIndex('by_session_token', (q) => q.eq('sessionToken', sessionToken)).unique();
  if (!session || session.status !== 'active' || session.expiresAt < Date.now()) {
    return null;
  }

  const user = await ctx.db.get(session.userId);
  if (!user || user.status !== 'active') {
    return null;
  }

  if (user.mustChangePassword && user.activeRoleCode === 'platform_owner' && !options.allowBootstrapPending) {
    return null;
  }

  return { session, user };
}

function requireRecentStepUp(auth) {
  if (auth.user.activeRoleCode !== 'platform_owner') {
    return;
  }
  if (!auth.session.lastElevatedAt || Date.now() - auth.session.lastElevatedAt > 10 * 60 * 1000) {
    throw new Error('Step-up authentication is required to complete this high-risk action. Please sign in again.');
  }
}

export const currentSession = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.sessionToken) return null;
    const auth = await getSessionAuth(ctx, args.sessionToken, { allowBootstrapPending: true });
    if (!auth) return null;

    return {
      session: {
        id: auth.session._id,
        expiresAt: auth.session.expiresAt,
      },
      user: {
        id: auth.user._id,
        fullName: auth.user.fullName,
        serviceNumber: auth.user.serviceNumber,
        roleCode: auth.user.activeRoleCode,
        directorateCode: auth.user.directorateCode,
        status: auth.user.status,
        mfaRequired: auth.user.mfaRequired,
        mfaEnrolled: auth.user.mfaEnrolled,
        mustChangePassword: auth.user.mustChangePassword,
        isPlatformOwner: auth.user.isPlatformOwner,
      },
    };
  },
});

export const signOut = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const auth = await getSessionAuth(ctx, args.sessionToken, { allowBootstrapPending: true });
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
    requireRecentStepUp(auth);

    const approval = await ctx.db.get(args.registrationApprovalId);
    if (!approval) {
      throw new Error('Registration approval record not found.');
    }

    const user = await ctx.db.get(approval.userId);
    if (!user) {
      throw new Error('User record not found.');
    }

    if (user.isPlatformOwner || user.activeRoleCode === 'platform_owner') {
      throw new Error('Cannot modify the platform owner account through this interface.');
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

export const createPlatformOwnerInternal = mutation({
  args: {
    passwordHash: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_service_number', (q) => q.eq('serviceNumber', 'ANONYMOUS'))
      .unique();

    if (existing) {
      return existing._id;
    }

    const userId = await ctx.db.insert('users', {
      fullName: 'Platform Owner',
      serviceNumber: 'ANONYMOUS',
      phoneNumber: '0000000000',
      passwordHash: args.passwordHash,
      rankCode: 'General',
      requestedRoleCode: 'platform_owner',
      activeRoleCode: 'platform_owner',
      directorateCode: 'HQ',
      formationCode: 'HQ-NA',
      unitCode: 'DDSE-HQ',
      status: 'active',
      mfaRequired: true,
      mfaEnrolled: false,
      mustChangePassword: true,
      isPlatformOwner: true,
      failedLoginCount: 0,
      createdAt: args.now,
      updatedAt: args.now,
    });

    await ctx.db.insert('userProfiles', {
      userId,
      notes: 'Initial bootstrap account',
      createdAt: args.now,
      updatedAt: args.now,
    });

    await writeAudit(ctx, {
      action: 'platform.bootstrap',
      entityType: 'user',
      entityId: String(userId),
      actorRoleCode: 'platform_owner',
      newValue: { role: 'platform_owner', serviceNumber: 'ANONYMOUS' },
    });

    return userId;
  },
});

export const listUsers = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const auth = await getSessionAuth(ctx, args.sessionToken);
    if (!auth || !roleCanApproveRegistrations(auth.user.activeRoleCode)) {
      throw new Error('You do not have permission to view users.');
    }

    const allUsers = await ctx.db.query('users').collect();
    
    // Only platform_owner can see other platform_owners
    return allUsers.filter(u => {
      if (u.isPlatformOwner || u.activeRoleCode === 'platform_owner') {
        return auth.user.isPlatformOwner || auth.user.activeRoleCode === 'platform_owner';
      }
      return true;
    });
  },
});

export const updatePasswordAfterBootstrap = mutation({
  args: {
    sessionToken: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = await getSessionAuth(ctx, args.sessionToken, { allowBootstrapPending: true });
    if (!auth) throw new Error('Unauthorized');

    await ctx.db.patch(auth.user._id, {
      passwordHash: args.passwordHash,
      mustChangePassword: false,
      mfaEnrolled: true,
      updatedAt: Date.now(),
    });

    await writeAudit(ctx, {
      actorUserId: auth.user._id,
      actorRoleCode: auth.user.activeRoleCode,
      action: 'auth.password_update_bootstrap',
      entityType: 'user',
      entityId: String(auth.user._id),
    });

    return { ok: true };
  },
});

export const enrollMfaInternal = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = await getSessionAuth(ctx, args.sessionToken, { allowBootstrapPending: true });
    if (!auth) throw new Error('Unauthorized');

    await ctx.db.patch(auth.user._id, {
      mfaEnrolled: true,
      updatedAt: Date.now(),
    });

    await writeAudit(ctx, {
      actorUserId: auth.user._id,
      actorRoleCode: auth.user.activeRoleCode,
      action: 'auth.mfa_enroll',
      entityType: 'user',
      entityId: String(auth.user._id),
    });

    return { ok: true };
  },
});

export const resetPlatformOwnerPasswordInternal = mutation({
  args: {
    userId: v.id('users'),
    passwordHash: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      passwordHash: args.passwordHash,
      mustChangePassword: true,
      mfaEnrolled: false,
      updatedAt: args.now,
    });

    await writeAudit(ctx, {
      actorRoleCode: 'platform_owner',
      action: 'auth.password_reset_bootstrap',
      entityType: 'user',
      entityId: String(args.userId),
      newValue: { passwordReset: true },
    });

    return { ok: true };
  },
});

export const getUserByServiceNumber = query({
  args: { serviceNumber: v.string() },
  handler: async (ctx, args) => {
    return ctx.db.query('users').withIndex('by_service_number', (q) => q.eq('serviceNumber', args.serviceNumber)).unique();
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

export const getPasswordResetChallengeByResetTokenHash = query({
  args: { resetTokenHash: v.string() },
  handler: async (ctx, args) =>
    ctx.db.query('verificationChallenges').withIndex('by_reset_token_hash', (q) => q.eq('resetTokenHash', args.resetTokenHash)).unique(),
});

export const createPendingUser = mutation({
  args: {
    fullName: v.string(),
    serviceNumber: v.string(),
    rankCode: v.string(),
    requestedRoleCode: v.string(),
    directorateCode: v.string(),
    phoneNumber: v.string(),
    email: v.optional(v.string()),
    passwordHash: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert('users', {
      fullName: args.fullName,
      serviceNumber: args.serviceNumber,
      email: args.email,
      phoneNumber: args.phoneNumber,
      passwordHash: args.passwordHash,
      rankCode: args.rankCode,
      requestedRoleCode: args.requestedRoleCode,
      activeRoleCode: 'base_soldier',
      directorateCode: args.directorateCode,
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
      notes: undefined,
      createdAt: args.now,
      updatedAt: args.now,
    });

    await ctx.db.insert('roleRequests', {
      userId,
      requestedRoleCode: args.requestedRoleCode,
      status: 'pending',
      decidedAt: undefined,
      createdAt: args.now,
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
    serviceNumber: v.optional(v.string()),
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
      serviceNumber: args.serviceNumber,
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
      lastElevatedAt: Date.now(),
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
