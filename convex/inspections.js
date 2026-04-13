import { mutation, query } from "./_generated/server";
import { v } from 'convex/values';
import { roleCanAccessModule, roleCanCreateInspection, roleCanDownloadEvidence } from './lib/authz';
import { canTransitionInspection, computeInspectionScores } from './lib/workflow';

async function getAuth(ctx, sessionToken) {
  const session = await ctx.db.query('authSessions').withIndex('by_session_token', (q) => q.eq('sessionToken', sessionToken)).unique();
  if (!session || session.status !== 'active' || session.expiresAt < Date.now()) {
    throw new Error('Authentication required.');
  }
  const user = await ctx.db.get(session.userId);
  if (!user || user.status !== 'active') {
    throw new Error('Active user session not found.');
  }
  return { session, user };
}

async function recordAudit(ctx, payload) {
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

async function recalculateInspection(ctx, inspectionId) {
  const inspection = await ctx.db.get(inspectionId);
  const sections = await ctx.db.query('inspectionSections').withIndex('by_template_id', (q) => q.eq('templateId', inspection.templateId)).collect();
  const items = await ctx.db.query('inspectionItems').withIndex('by_template_id', (q) => q.eq('templateId', inspection.templateId)).collect();
  const responses = await ctx.db.query('responses').withIndex('by_inspection_id', (q) => q.eq('inspectionId', inspectionId)).collect();
  const scores = computeInspectionScores(sections, items, responses);

  await ctx.db.patch(inspectionId, {
    scoreOverall: scores.overallScore,
    completionPercent: scores.completionPercent,
    complianceBand: scores.complianceBand,
    riskLevel: scores.riskLevel,
    updatedAt: Date.now(),
  });

  return scores;
}

export const createInspection = mutation({
  args: {
    sessionToken: v.string(),
    moduleCode: v.string(),
    title: v.string(),
    directorateCode: v.string(),
    formationCode: v.string(),
    unitCode: v.string(),
    subjectName: v.optional(v.string()),
    subjectReference: v.optional(v.string()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user } = await getAuth(ctx, args.sessionToken);
    if (!roleCanCreateInspection(user.activeRoleCode, args.moduleCode)) {
      throw new Error('You do not have permission to create this inspection.');
    }

    const template = await ctx.db.query('inspectionTemplates').withIndex('by_module_code', (q) => q.eq('moduleCode', args.moduleCode)).unique();
    if (!template) {
      throw new Error('Inspection template not found.');
    }

    const inspectionId = await ctx.db.insert('inspections', {
      templateId: template._id,
      moduleCode: template.moduleCode,
      title: args.title,
      classification: template.classification,
      status: 'draft',
      createdByUserId: user._id,
      assignedToUserId: undefined,
      directorateCode: args.directorateCode,
      formationCode: args.formationCode,
      unitCode: args.unitCode,
      subjectName: args.subjectName,
      subjectReference: args.subjectReference,
      scoreOverall: 0,
      complianceBand: 'attention',
      riskLevel: 'moderate',
      completionPercent: 0,
      dueDate: args.dueDate,
      submittedAt: undefined,
      reviewedAt: undefined,
      approvedAt: undefined,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    });

    await recordAudit(ctx, {
      actorUserId: user._id,
      actorRoleCode: user.activeRoleCode,
      action: 'inspection.created',
      entityType: 'inspection',
      entityId: String(inspectionId),
      moduleCode: args.moduleCode,
      newValue: { title: args.title },
    });

    return inspectionId;
  },
});

export const listInspections = query({
  args: {
    sessionToken: v.string(),
    moduleCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await getAuth(ctx, args.sessionToken);
    const inspections = await ctx.db.query('inspections').collect();

    return inspections
      .filter((inspection) => !args.moduleCode || inspection.moduleCode === args.moduleCode)
      .filter((inspection) => roleCanAccessModule(user.activeRoleCode, inspection.moduleCode))
      .sort((left, right) => right.updatedAt - left.updatedAt);
  },
});

export const getInspectionDetail = query({
  args: {
    sessionToken: v.string(),
    inspectionId: v.id('inspections'),
  },
  handler: async (ctx, args) => {
    const { user } = await getAuth(ctx, args.sessionToken);
    const inspection = await ctx.db.get(args.inspectionId);
    if (!inspection || !roleCanAccessModule(user.activeRoleCode, inspection.moduleCode)) {
      throw new Error('Inspection not found or access denied.');
    }

    const sections = await ctx.db.query('inspectionSections').withIndex('by_template_id', (q) => q.eq('templateId', inspection.templateId)).collect();
    const items = await ctx.db.query('inspectionItems').withIndex('by_template_id', (q) => q.eq('templateId', inspection.templateId)).collect();
    const responses = await ctx.db.query('responses').withIndex('by_inspection_id', (q) => q.eq('inspectionId', args.inspectionId)).collect();
    const findings = await ctx.db.query('findings').withIndex('by_inspection_id', (q) => q.eq('inspectionId', args.inspectionId)).collect();
    const evidence = await ctx.db.query('evidence').withIndex('by_inspection_id', (q) => q.eq('inspectionId', args.inspectionId)).collect();
    const correctiveActions = await ctx.db.query('correctiveActions').withIndex('by_inspection_id', (q) => q.eq('inspectionId', args.inspectionId)).collect();
    const approvals = await ctx.db.query('approvals').withIndex('by_inspection_id', (q) => q.eq('inspectionId', args.inspectionId)).collect();
    const reviewComments = await ctx.db.query('reviewComments').withIndex('by_inspection_id', (q) => q.eq('inspectionId', args.inspectionId)).collect();
    const auditLogs = (await ctx.db.query('auditLogs').withIndex('by_entity', (q) => q.eq('entityType', 'inspection').eq('entityId', String(args.inspectionId))).collect()).sort((left, right) => right.createdAt - left.createdAt);

    return {
      inspection,
      sections: sections
        .sort((left, right) => left.order - right.order)
        .map((section) => ({
          ...section,
          items: items
            .filter((item) => item.sectionId === section._id)
            .sort((left, right) => left.order - right.order)
            .map((item) => ({
              ...item,
              response: responses.find((response) => response.itemId === item._id) ?? null,
              evidence: evidence.filter((entry) => entry.itemId === item._id),
            })),
        })),
      findings,
      correctiveActions,
      approvals,
      reviewComments,
      auditLogs,
    };
  },
});

export const saveResponse = mutation({
  args: {
    sessionToken: v.string(),
    inspectionId: v.id('inspections'),
    sectionId: v.id('inspectionSections'),
    itemId: v.id('inspectionItems'),
    responseValue: v.any(),
    numericScore: v.number(),
    severity: v.optional(v.string()),
    immediateRisk: v.boolean(),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await getAuth(ctx, args.sessionToken);
    const inspection = await ctx.db.get(args.inspectionId);
    if (!inspection || !['draft', 'requires_correction'].includes(inspection.status)) {
      throw new Error('Inspection is not editable.');
    }

    const existing = (await ctx.db.query('responses').withIndex('by_inspection_id', (q) => q.eq('inspectionId', args.inspectionId)).collect()).find((response) => response.itemId === args.itemId);
    if (existing) {
      await ctx.db.patch(existing._id, {
        responseValue: args.responseValue,
        numericScore: args.numericScore,
        severity: args.severity,
        immediateRisk: args.immediateRisk,
        remarks: args.remarks,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert('responses', {
        inspectionId: args.inspectionId,
        sectionId: args.sectionId,
        itemId: args.itemId,
        actorUserId: user._id,
        responseValue: args.responseValue,
        numericScore: args.numericScore,
        severity: args.severity,
        immediateRisk: args.immediateRisk,
        remarks: args.remarks,
        updatedAt: Date.now(),
      });
    }

    const scores = await recalculateInspection(ctx, args.inspectionId);
    await recordAudit(ctx, {
      actorUserId: user._id,
      actorRoleCode: user.activeRoleCode,
      action: 'inspection.response.saved',
      entityType: 'inspection',
      entityId: String(args.inspectionId),
      moduleCode: inspection.moduleCode,
      newValue: { itemId: String(args.itemId), overallScore: scores.overallScore },
    });

    return scores;
  },
});

export const transitionInspection = mutation({
  args: {
    sessionToken: v.string(),
    inspectionId: v.id('inspections'),
    toStatus: v.string(),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await getAuth(ctx, args.sessionToken);
    const inspection = await ctx.db.get(args.inspectionId);
    if (!inspection || !canTransitionInspection(user.activeRoleCode, inspection.status, args.toStatus)) {
      throw new Error('Inspection status transition is not allowed.');
    }

    const patch = {
      status: args.toStatus,
      updatedAt: Date.now(),
    };
    if (args.toStatus === 'submitted') patch.submittedAt = Date.now();
    if (args.toStatus === 'in_review') patch.reviewedAt = Date.now();
    if (args.toStatus === 'approved') patch.approvedAt = Date.now();
    await ctx.db.patch(args.inspectionId, patch);

    await ctx.db.insert('approvals', {
      inspectionId: args.inspectionId,
      actorUserId: user._id,
      decision: args.toStatus,
      comments: args.comments,
      createdAt: Date.now(),
    });

    await recordAudit(ctx, {
      actorUserId: user._id,
      actorRoleCode: user.activeRoleCode,
      action: `inspection.${args.toStatus}`,
      entityType: 'inspection',
      entityId: String(args.inspectionId),
      moduleCode: inspection.moduleCode,
      newValue: { status: args.toStatus },
    });

    return { ok: true };
  },
});

export const createFinding = mutation({
  args: {
    sessionToken: v.string(),
    inspectionId: v.id('inspections'),
    itemId: v.id('inspectionItems'),
    title: v.string(),
    detail: v.string(),
    severity: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await getAuth(ctx, args.sessionToken);
    const inspection = await ctx.db.get(args.inspectionId);
    if (!inspection || !roleCanAccessModule(user.activeRoleCode, inspection.moduleCode)) {
      throw new Error('Inspection not found or access denied.');
    }

    const findingId = await ctx.db.insert('findings', {
      inspectionId: args.inspectionId,
      itemId: args.itemId,
      actorUserId: user._id,
      title: args.title,
      detail: args.detail,
      severity: args.severity,
      status: 'open',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await recordAudit(ctx, {
      actorUserId: user._id,
      actorRoleCode: user.activeRoleCode,
      action: 'finding.created',
      entityType: 'finding',
      entityId: String(findingId),
      moduleCode: inspection.moduleCode,
    });

    return findingId;
  },
});

export const updateFinding = mutation({
  args: {
    sessionToken: v.string(),
    findingId: v.id('findings'),
    title: v.string(),
    detail: v.string(),
    severity: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await getAuth(ctx, args.sessionToken);
    const finding = await ctx.db.get(args.findingId);
    if (!finding) throw new Error('Finding not found.');
    const inspection = await ctx.db.get(finding.inspectionId);
    if (!inspection || !roleCanAccessModule(user.activeRoleCode, inspection.moduleCode)) {
      throw new Error('Access denied.');
    }

    await ctx.db.patch(args.findingId, {
      title: args.title,
      detail: args.detail,
      severity: args.severity,
      status: args.status,
      updatedAt: Date.now(),
    });

    await recordAudit(ctx, {
      actorUserId: user._id,
      actorRoleCode: user.activeRoleCode,
      action: 'finding.updated',
      entityType: 'finding',
      entityId: String(args.findingId),
      moduleCode: inspection.moduleCode,
    });

    return { ok: true };
  },
});

export const deleteFinding = mutation({
  args: {
    sessionToken: v.string(),
    findingId: v.id('findings'),
  },
  handler: async (ctx, args) => {
    const { user } = await getAuth(ctx, args.sessionToken);
    const finding = await ctx.db.get(args.findingId);
    if (!finding) throw new Error('Finding not found.');
    const inspection = await ctx.db.get(finding.inspectionId);
    if (!inspection || !roleCanAccessModule(user.activeRoleCode, inspection.moduleCode)) {
      throw new Error('Access denied.');
    }

    await ctx.db.delete(args.findingId);
    await recordAudit(ctx, {
      actorUserId: user._id,
      actorRoleCode: user.activeRoleCode,
      action: 'finding.deleted',
      entityType: 'finding',
      entityId: String(args.findingId),
      moduleCode: inspection.moduleCode,
    });

    return { ok: true };
  },
});

export const addReviewComment = mutation({
  args: {
    sessionToken: v.string(),
    inspectionId: v.id('inspections'),
    findingId: v.optional(v.id('findings')),
    parentCommentId: v.optional(v.id('reviewComments')),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await getAuth(ctx, args.sessionToken);
    const inspection = await ctx.db.get(args.inspectionId);
    if (!inspection || !roleCanAccessModule(user.activeRoleCode, inspection.moduleCode)) {
      throw new Error('Inspection not found or access denied.');
    }

    const commentId = await ctx.db.insert('reviewComments', {
      inspectionId: args.inspectionId,
      findingId: args.findingId,
      parentCommentId: args.parentCommentId,
      actorUserId: user._id,
      actorRoleCode: user.activeRoleCode,
      body: args.body,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      resolvedAt: undefined,
    });

    await recordAudit(ctx, {
      actorUserId: user._id,
      actorRoleCode: user.activeRoleCode,
      action: 'review.comment.created',
      entityType: 'review_comment',
      entityId: String(commentId),
      moduleCode: inspection.moduleCode,
    });

    return commentId;
  },
});

export const resolveReviewComment = mutation({
  args: {
    sessionToken: v.string(),
    commentId: v.id('reviewComments'),
  },
  handler: async (ctx, args) => {
    const { user } = await getAuth(ctx, args.sessionToken);
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error('Comment not found.');
    const inspection = await ctx.db.get(comment.inspectionId);
    if (!inspection || !roleCanAccessModule(user.activeRoleCode, inspection.moduleCode)) {
      throw new Error('Access denied.');
    }

    await ctx.db.patch(args.commentId, {
      resolvedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const addCorrectiveAction = mutation({
  args: {
    sessionToken: v.string(),
    inspectionId: v.id('inspections'),
    title: v.string(),
    detail: v.string(),
    dueDate: v.optional(v.number()),
    stopWorkIssued: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { user } = await getAuth(ctx, args.sessionToken);
    const inspection = await ctx.db.get(args.inspectionId);
    if (!inspection || !roleCanAccessModule(user.activeRoleCode, inspection.moduleCode)) {
      throw new Error('Inspection not found or access denied.');
    }

    const actionId = await ctx.db.insert('correctiveActions', {
      inspectionId: args.inspectionId,
      findingId: undefined,
      title: args.title,
      detail: args.detail,
      ownerUserId: undefined,
      dueDate: args.dueDate,
      status: 'open',
      stopWorkIssued: args.stopWorkIssued,
      createdByUserId: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await recordAudit(ctx, {
      actorUserId: user._id,
      actorRoleCode: user.activeRoleCode,
      action: args.stopWorkIssued ? 'inspection.stop_work.issued' : 'inspection.corrective_action.created',
      entityType: 'corrective_action',
      entityId: String(actionId),
      moduleCode: inspection.moduleCode,
    });

    return actionId;
  },
});

export const generateEvidenceUploadUrl = mutation({
  args: {
    sessionToken: v.string(),
    inspectionId: v.id('inspections'),
  },
  handler: async (ctx, args) => {
    const { user } = await getAuth(ctx, args.sessionToken);
    const inspection = await ctx.db.get(args.inspectionId);
    if (!inspection || !roleCanAccessModule(user.activeRoleCode, inspection.moduleCode)) {
      throw new Error('Inspection not found or access denied.');
    }
    return ctx.storage.generateUploadUrl();
  },
});

export const attachEvidence = mutation({
  args: {
    sessionToken: v.string(),
    inspectionId: v.id('inspections'),
    sectionId: v.optional(v.id('inspectionSections')),
    itemId: v.optional(v.id('inspectionItems')),
    storageId: v.id('_storage'),
    fileName: v.string(),
    contentType: v.string(),
    sizeBytes: v.number(),
    classification: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await getAuth(ctx, args.sessionToken);
    const inspection = await ctx.db.get(args.inspectionId);
    if (!inspection || !roleCanAccessModule(user.activeRoleCode, inspection.moduleCode)) {
      throw new Error('Inspection not found or access denied.');
    }
    if (args.sizeBytes > 15 * 1024 * 1024) {
      throw new Error('Evidence exceeds the maximum allowed file size.');
    }

    const defaultClassification =
      inspection.moduleCode === 'armoury'
        ? 'restricted_armoury'
        : inspection.moduleCode === 'magazine'
          ? 'restricted_magazine'
          : inspection.moduleCode === 'general_security' || inspection.moduleCode === 'jtf_readiness'
            ? 'restricted_security'
            : args.classification;

    const evidenceId = await ctx.db.insert('evidence', {
      inspectionId: args.inspectionId,
      sectionId: args.sectionId,
      itemId: args.itemId,
      actorUserId: user._id,
      storageId: args.storageId,
      fileName: args.fileName,
      contentType: args.contentType,
      sizeBytes: args.sizeBytes,
      classification: defaultClassification,
      createdAt: Date.now(),
    });

    await recordAudit(ctx, {
      actorUserId: user._id,
      actorRoleCode: user.activeRoleCode,
      action: 'inspection.evidence.uploaded',
      entityType: 'evidence',
      entityId: String(evidenceId),
      moduleCode: inspection.moduleCode,
    });

    return evidenceId;
  },
});

export const getEvidenceDownloadUrl = mutation({
  args: {
    sessionToken: v.string(),
    evidenceId: v.id('evidence'),
  },
  handler: async (ctx, args) => {
    const { user } = await getAuth(ctx, args.sessionToken);
    const evidence = await ctx.db.get(args.evidenceId);
    if (!evidence) throw new Error('Evidence not found.');
    const inspection = await ctx.db.get(evidence.inspectionId);
    if (!inspection || !roleCanDownloadEvidence(user.activeRoleCode, inspection.moduleCode, evidence.classification)) {
      throw new Error('You are not authorized to access this evidence.');
    }

    const url = await ctx.storage.getUrl(evidence.storageId);
    if (!url) {
      throw new Error('Evidence file is unavailable.');
    }

    await recordAudit(ctx, {
      actorUserId: user._id,
      actorRoleCode: user.activeRoleCode,
      action: 'inspection.evidence.downloaded',
      entityType: 'evidence',
      entityId: String(args.evidenceId),
      moduleCode: inspection.moduleCode,
    });

    return {
      fileName: evidence.fileName,
      contentType: evidence.contentType,
      url,
      expiresInSeconds: 300,
    };
  },
});
