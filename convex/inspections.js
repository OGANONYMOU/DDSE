import { mutation, query } from "./_generated/server";
import { v } from 'convex/values';
import {
  canAccessEvidence,
  canAccessInspection,
  canCloseInspection,
  canCreateInspectionForOrg,
  canReviewInspection,
  roleCanAccessModule,
} from './lib/authz';
import { canTransitionInspection, computeInspectionScores } from './lib/workflow';

const ALLOWED_EVIDENCE_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
]);

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

function deriveEvidenceClassification(moduleCode, requestedClassification) {
  if (moduleCode === 'armoury') return 'restricted_armoury';
  if (moduleCode === 'magazine') return 'restricted_magazine';
  if (moduleCode === 'general_security' || moduleCode === 'jtf_readiness') return 'restricted_security';
  return requestedClassification || 'official';
}

function isSensitiveModule(moduleCode) {
  return ['armoury', 'magazine', 'general_security', 'jtf_readiness'].includes(moduleCode);
}

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

function ensureEditRights(user, inspection) {
  const sameOwner = inspection.createdByUserId === user._id || inspection.assignedToUserId === user._id;
  if (sameOwner) {
    return true;
  }

  return ['super_admin', 'ddse_admin', 'evaluator', 'directorate_officer', 'project_officer'].includes(user.activeRoleCode);
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
    if (!roleCanAccessModule(user.activeRoleCode, args.moduleCode) || !canCreateInspectionForOrg(user, args)) {
      throw new Error('You do not have permission to create this inspection.');
    }

    const template = await ctx.db.query('inspectionTemplates').withIndex('by_module_code', (q) => q.eq('moduleCode', args.moduleCode)).unique();
    if (!template) {
      throw new Error('Inspection template not found.');
    }

    const inspectionId = await ctx.db.insert('inspections', {
      templateId: template._id,
      moduleCode: template.moduleCode,
      title: args.title.trim(),
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
      reopenedAt: undefined,
      lastDecisionAt: undefined,
      lastDecisionByUserId: undefined,
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
    status: v.optional(v.string()),
    riskLevel: v.optional(v.string()),
    directorateCode: v.optional(v.string()),
    formationCode: v.optional(v.string()),
    unitCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await getAuth(ctx, args.sessionToken);
    const inspections = await ctx.db.query('inspections').collect();

    return inspections
      .filter((inspection) => !args.moduleCode || inspection.moduleCode === args.moduleCode)
      .filter((inspection) => !args.status || inspection.status === args.status)
      .filter((inspection) => !args.riskLevel || inspection.riskLevel === args.riskLevel)
      .filter((inspection) => !args.directorateCode || inspection.directorateCode === args.directorateCode)
      .filter((inspection) => !args.formationCode || inspection.formationCode === args.formationCode)
      .filter((inspection) => !args.unitCode || inspection.unitCode === args.unitCode)
      .filter((inspection) => canAccessInspection(user, inspection))
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
    if (!inspection || !canAccessInspection(user, inspection)) {
      throw new Error('Inspection not found or access denied.');
    }

    const sections = await ctx.db.query('inspectionSections').withIndex('by_template_id', (q) => q.eq('templateId', inspection.templateId)).collect();
    const items = await ctx.db.query('inspectionItems').withIndex('by_template_id', (q) => q.eq('templateId', inspection.templateId)).collect();
    const responses = await ctx.db.query('responses').withIndex('by_inspection_id', (q) => q.eq('inspectionId', args.inspectionId)).collect();
    const findings = await ctx.db.query('findings').withIndex('by_inspection_id', (q) => q.eq('inspectionId', args.inspectionId)).collect();
    const evidence = (await ctx.db.query('evidence').withIndex('by_inspection_id', (q) => q.eq('inspectionId', args.inspectionId)).collect())
      .filter((entry) => canAccessEvidence(user, inspection, entry));
    const correctiveActions = await ctx.db.query('correctiveActions').withIndex('by_inspection_id', (q) => q.eq('inspectionId', args.inspectionId)).collect();
    const approvals = await ctx.db.query('approvals').withIndex('by_inspection_id', (q) => q.eq('inspectionId', args.inspectionId)).collect();
    const reviewComments = await ctx.db.query('reviewComments').withIndex('by_inspection_id', (q) => q.eq('inspectionId', args.inspectionId)).collect();
    const auditLogs = (await ctx.db.query('auditLogs').withIndex('by_entity', (q) => q.eq('entityType', 'inspection').eq('entityId', String(args.inspectionId))).collect())
      .sort((left, right) => right.createdAt - left.createdAt);

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
    if (!inspection || !canAccessInspection(user, inspection) || !ensureEditRights(user, inspection)) {
      throw new Error('Inspection is not editable.');
    }
    if (!['draft', 'requires_correction'].includes(inspection.status)) {
      throw new Error('Inspection is not editable.');
    }

    const existing = (await ctx.db.query('responses').withIndex('by_inspection_id', (q) => q.eq('inspectionId', args.inspectionId)).collect())
      .find((response) => response.itemId === args.itemId);

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
    if (!inspection || !canAccessInspection(user, inspection) || !canTransitionInspection(user.activeRoleCode, inspection.status, args.toStatus)) {
      throw new Error('Inspection status transition is not allowed.');
    }

    if (['approved', 'rejected', 'requires_correction', 'closed'].includes(args.toStatus) && !args.comments?.trim()) {
      throw new Error('Decision rationale is required for this workflow action.');
    }

    if (['approved', 'rejected', 'requires_correction'].includes(args.toStatus)) {
      if (!canReviewInspection(user, inspection)) {
        throw new Error('Review authority is required for this decision.');
      }
      if (inspection.createdByUserId === user._id && !['super_admin', 'ddse_admin'].includes(user.activeRoleCode)) {
        throw new Error('Independent review is required before this decision can be recorded.');
      }
    }

    if (args.toStatus === 'closed' && !canCloseInspection(user, inspection)) {
      throw new Error('Closure authority is required for this decision.');
    }
    if (args.toStatus === 'closed' && isSensitiveModule(inspection.moduleCode) && inspection.lastDecisionByUserId === user._id) {
      throw new Error('Sensitive module closure must be verified by a different authorized reviewer.');
    }

    const patch = {
      status: args.toStatus,
      updatedAt: Date.now(),
      lastDecisionAt: Date.now(),
      lastDecisionByUserId: user._id,
    };
    if (args.toStatus === 'submitted') patch.submittedAt = Date.now();
    if (args.toStatus === 'in_review') patch.reviewedAt = Date.now();
    if (args.toStatus === 'approved') patch.approvedAt = Date.now();
    if (args.toStatus === 'requires_correction') patch.reopenedAt = Date.now();
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
      justification: args.comments,
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
    if (!inspection || !canAccessInspection(user, inspection)) {
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
    if (!inspection || !canAccessInspection(user, inspection)) {
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
    if (!inspection || !canAccessInspection(user, inspection)) {
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
    if (!inspection || !canAccessInspection(user, inspection)) {
      throw new Error('Inspection not found or access denied.');
    }

    const commentId = await ctx.db.insert('reviewComments', {
      inspectionId: args.inspectionId,
      findingId: args.findingId,
      parentCommentId: args.parentCommentId,
      actorUserId: user._id,
      actorRoleCode: user.activeRoleCode,
      body: args.body.trim(),
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
    if (!inspection || !canReviewInspection(user, inspection)) {
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
    if (!inspection || !canReviewInspection(user, inspection)) {
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
      closureVerifiedAt: undefined,
      closureVerifiedByUserId: undefined,
      reopenedCount: 0,
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
    if (!inspection || !canAccessInspection(user, inspection) || !ensureEditRights(user, inspection)) {
      throw new Error('Inspection not found or access denied.');
    }
    if (!['draft', 'requires_correction'].includes(inspection.status)) {
      throw new Error('Evidence can only be uploaded while the inspection is editable.');
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
    contentHash: v.optional(v.string()),
    provenance: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { user } = await getAuth(ctx, args.sessionToken);
    const inspection = await ctx.db.get(args.inspectionId);
    if (!inspection || !canAccessInspection(user, inspection) || !ensureEditRights(user, inspection)) {
      throw new Error('Inspection not found or access denied.');
    }
    if (args.sizeBytes > 15 * 1024 * 1024) {
      throw new Error('Evidence exceeds the maximum allowed file size.');
    }
    if (!ALLOWED_EVIDENCE_TYPES.has(args.contentType)) {
      throw new Error('Evidence content type is not authorized.');
    }

    const classification = deriveEvidenceClassification(inspection.moduleCode, args.classification);
    const evidenceId = await ctx.db.insert('evidence', {
      inspectionId: args.inspectionId,
      sectionId: args.sectionId,
      itemId: args.itemId,
      actorUserId: user._id,
      storageId: args.storageId,
      fileName: sanitizeFileName(args.fileName),
      contentType: args.contentType,
      sizeBytes: args.sizeBytes,
      classification,
      uploadedByRoleCode: user.activeRoleCode,
      contentHash: args.contentHash,
      provenance: args.provenance,
      watermarkLabel: `${classification.toUpperCase()} // ${inspection.unitCode} // DDSE`,
      lastAccessedAt: undefined,
      accessCount: 0,
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
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await getAuth(ctx, args.sessionToken);
    const evidence = await ctx.db.get(args.evidenceId);
    if (!evidence) throw new Error('Evidence not found.');
    const inspection = await ctx.db.get(evidence.inspectionId);
    if (!inspection || !canAccessEvidence(user, inspection, evidence)) {
      throw new Error('You are not authorized to access this evidence.');
    }
    if (inspection.classification !== 'official' && !args.reason?.trim()) {
      throw new Error('Access reason is required for restricted evidence.');
    }

    const url = await ctx.storage.getUrl(evidence.storageId);
    if (!url) {
      throw new Error('Evidence file is unavailable.');
    }

    await ctx.db.patch(args.evidenceId, {
      lastAccessedAt: Date.now(),
      accessCount: (evidence.accessCount ?? 0) + 1,
    });
    await recordAudit(ctx, {
      actorUserId: user._id,
      actorRoleCode: user.activeRoleCode,
      action: 'inspection.evidence.downloaded',
      entityType: 'evidence',
      entityId: String(args.evidenceId),
      moduleCode: inspection.moduleCode,
      justification: args.reason,
      newValue: { classification: evidence.classification, contentHash: evidence.contentHash },
    });

    return {
      fileName: evidence.fileName,
      contentType: evidence.contentType,
      classification: evidence.classification,
      watermarkLabel: evidence.watermarkLabel,
      url,
      expiresInSeconds: 300,
    };
  },
});
