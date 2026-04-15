import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    fullName: v.string(),
    appointmentNumber: v.string(),
    email: v.optional(v.string()),
    phoneNumber: v.string(),
    branch: v.optional(v.string()),
    passwordHash: v.string(),
    rankCode: v.string(),
    requestedRoleCode: v.string(),
    activeRoleCode: v.string(),
    directorateCode: v.string(),
    formationCode: v.string(),
    unitCode: v.string(),
    status: v.string(),
    emailVerifiedAt: v.optional(v.number()),
    phoneVerifiedAt: v.optional(v.number()),
    mfaRequired: v.boolean(),
    failedLoginCount: v.number(),
    lockedUntil: v.optional(v.number()),
    lastFailedLoginAt: v.optional(v.number()),
    suspiciousActivityAt: v.optional(v.number()),
    privilegedRoleApprovedAt: v.optional(v.number()),
    privilegedRoleApprovedByUserId: v.optional(v.id("users")),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_appointment_number", ["appointmentNumber"])
    .index("by_email", ["email"])
    .index("by_phone_number", ["phoneNumber"])
    .index("by_status", ["status"]),

  userProfiles: defineTable({
    userId: v.id("users"),
    serviceBranch: v.optional(v.string()),
    identityNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_identity_number", ["identityNumber"]),

  rankCatalog: defineTable({
    code: v.string(),
    label: v.string(),
    order: v.number(),
  }).index("by_code", ["code"]),

  directorateCatalog: defineTable({
    code: v.string(),
    name: v.string(),
  }).index("by_code", ["code"]),

  formationCatalog: defineTable({
    code: v.string(),
    name: v.string(),
  }).index("by_code", ["code"]),

  unitCatalog: defineTable({
    code: v.string(),
    name: v.string(),
    formationCode: v.string(),
  })
    .index("by_code", ["code"])
    .index("by_formation_code", ["formationCode"]),

  roleRequests: defineTable({
    userId: v.id("users"),
    requestedRoleCode: v.string(),
    requestedByUserId: v.optional(v.id("users")),
    status: v.string(),
    justification: v.optional(v.string()),
    decidedByUserId: v.optional(v.id("users")),
    decisionReason: v.optional(v.string()),
    createdAt: v.number(),
    decidedAt: v.optional(v.number()),
  }).index("by_user_id", ["userId"]),

  registrationApprovals: defineTable({
    userId: v.id("users"),
    status: v.string(),
    reviewerUserId: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),

  authSessions: defineTable({
    userId: v.id("users"),
    sessionToken: v.string(),
    status: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    lastSeenAt: v.number(),
    lastElevatedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
    revokedReason: v.optional(v.string()),
    sessionLabel: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_session_token", ["sessionToken"])
    .index("by_user_id", ["userId"]),

  verificationChallenges: defineTable({
    userId: v.optional(v.id("users")),
    appointmentNumber: v.optional(v.string()),
    channel: v.string(),
    purpose: v.string(),
    destination: v.string(),
    codeHash: v.string(),
    resetTokenHash: v.optional(v.string()),
    expiresAt: v.number(),
    consumedAt: v.optional(v.number()),
    failedAttempts: v.number(),
    maxAttempts: v.number(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_purpose", ["purpose"]),

  otpEvents: defineTable({
    userId: v.optional(v.id("users")),
    appointmentNumber: v.optional(v.string()),
    purpose: v.string(),
    channel: v.string(),
    destination: v.string(),
    status: v.string(),
    errorCode: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_purpose", ["purpose"])
    .index("by_appointment_number", ["appointmentNumber"]),

  inspectionTemplates: defineTable({
    moduleCode: v.string(),
    title: v.string(),
    classification: v.string(),
    description: v.string(),
    active: v.boolean(),
    createdAt: v.number(),
  }).index("by_module_code", ["moduleCode"]),

  inspectionSections: defineTable({
    templateId: v.id("inspectionTemplates"),
    title: v.string(),
    order: v.number(),
    weight: v.number(),
  }).index("by_template_id", ["templateId"]),

  inspectionItems: defineTable({
    templateId: v.id("inspectionTemplates"),
    sectionId: v.id("inspectionSections"),
    code: v.string(),
    prompt: v.string(),
    responseType: v.string(),
    weight: v.number(),
    order: v.number(),
  })
    .index("by_section_id", ["sectionId"])
    .index("by_template_id", ["templateId"]),

  inspections: defineTable({
    templateId: v.id("inspectionTemplates"),
    moduleCode: v.string(),
    title: v.string(),
    classification: v.string(),
    status: v.string(),
    createdByUserId: v.id("users"),
    assignedToUserId: v.optional(v.id("users")),
    directorateCode: v.string(),
    formationCode: v.string(),
    unitCode: v.string(),
    subjectName: v.optional(v.string()),
    subjectReference: v.optional(v.string()),
    scoreOverall: v.number(),
    complianceBand: v.string(),
    riskLevel: v.string(),
    completionPercent: v.number(),
    dueDate: v.optional(v.number()),
    submittedAt: v.optional(v.number()),
    reviewedAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
    reopenedAt: v.optional(v.number()),
    lastDecisionAt: v.optional(v.number()),
    lastDecisionByUserId: v.optional(v.id("users")),
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_module_code", ["moduleCode"])
    .index("by_status", ["status"])
    .index("by_created_by", ["createdByUserId"]),

  responses: defineTable({
    inspectionId: v.id("inspections"),
    sectionId: v.id("inspectionSections"),
    itemId: v.id("inspectionItems"),
    actorUserId: v.id("users"),
    responseValue: v.any(),
    numericScore: v.number(),
    severity: v.optional(v.string()),
    immediateRisk: v.boolean(),
    remarks: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_inspection_id", ["inspectionId"])
    .index("by_item_id", ["itemId"]),

  findings: defineTable({
    inspectionId: v.id("inspections"),
    itemId: v.id("inspectionItems"),
    actorUserId: v.id("users"),
    title: v.string(),
    detail: v.string(),
    severity: v.string(),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_inspection_id", ["inspectionId"]),

  reviewComments: defineTable({
    inspectionId: v.id("inspections"),
    findingId: v.optional(v.id("findings")),
    parentCommentId: v.optional(v.id("reviewComments")),
    actorUserId: v.id("users"),
    actorRoleCode: v.string(),
    body: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_inspection_id", ["inspectionId"])
    .index("by_finding_id", ["findingId"]),

  evidence: defineTable({
    inspectionId: v.id("inspections"),
    sectionId: v.optional(v.id("inspectionSections")),
    itemId: v.optional(v.id("inspectionItems")),
    actorUserId: v.id("users"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    contentType: v.string(),
    sizeBytes: v.number(),
    classification: v.string(),
    uploadedByRoleCode: v.string(),
    contentHash: v.optional(v.string()),
    provenance: v.optional(v.any()),
    watermarkLabel: v.optional(v.string()),
    lastAccessedAt: v.optional(v.number()),
    accessCount: v.number(),
    createdAt: v.number(),
  }).index("by_inspection_id", ["inspectionId"]),

  correctiveActions: defineTable({
    inspectionId: v.id("inspections"),
    findingId: v.optional(v.id("findings")),
    title: v.string(),
    detail: v.string(),
    ownerUserId: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    status: v.string(),
    stopWorkIssued: v.boolean(),
    closureVerifiedAt: v.optional(v.number()),
    closureVerifiedByUserId: v.optional(v.id("users")),
    reopenedCount: v.number(),
    createdByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_inspection_id", ["inspectionId"]),

  approvals: defineTable({
    inspectionId: v.id("inspections"),
    actorUserId: v.id("users"),
    decision: v.string(),
    comments: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_inspection_id", ["inspectionId"]),

  auditLogs: defineTable({
    actorUserId: v.optional(v.id("users")),
    actorRoleCode: v.optional(v.string()),
    action: v.string(),
    entityType: v.string(),
    entityId: v.optional(v.string()),
    moduleCode: v.optional(v.string()),
    justification: v.optional(v.string()),
    correlationId: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    oldValue: v.optional(v.any()),
    newValue: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_actor", ["actorUserId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    severity: v.string(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user_id", ["userId"]),
});
