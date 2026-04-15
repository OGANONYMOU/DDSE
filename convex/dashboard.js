import { query } from "./_generated/server";
import { v } from 'convex/values';
import { canAccessInspection, canViewDashboardAggregate, roleCanApproveRegistrations } from './lib/authz';

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

function summarizeBy(inspections, key) {
  const groups = new Map();
  for (const inspection of inspections) {
    const groupKey = inspection[key];
    const current = groups.get(groupKey) ?? {
      key: groupKey,
      inspections: 0,
      overdue: 0,
      highRisk: 0,
      averageScore: 0,
    };
    current.inspections += 1;
    current.overdue += inspection.dueDate && inspection.dueDate < Date.now() && !['approved', 'closed'].includes(inspection.status) ? 1 : 0;
    current.highRisk += ['high', 'critical'].includes(inspection.riskLevel) ? 1 : 0;
    current.averageScore += inspection.scoreOverall;
    groups.set(groupKey, current);
  }

  return Array.from(groups.values())
    .map((entry) => ({
      ...entry,
      averageScore: entry.inspections === 0 ? 0 : Math.round(entry.averageScore / entry.inspections),
    }))
    .sort((left, right) => right.inspections - left.inspections);
}

function filterVisibleInspections(user, inspections, args) {
  return inspections
    .filter((inspection) => canAccessInspection(user, inspection))
    .filter((inspection) => !args.moduleCode || inspection.moduleCode === args.moduleCode)
    .filter((inspection) => !args.directorateCode || inspection.directorateCode === args.directorateCode)
    .filter((inspection) => !args.formationCode || inspection.formationCode === args.formationCode)
    .filter((inspection) => !args.unitCode || inspection.unitCode === args.unitCode)
    .filter((inspection) => !args.status || inspection.status === args.status)
    .filter((inspection) => !args.riskLevel || inspection.riskLevel === args.riskLevel);
}

export const commandCenter = query({
  args: {
    sessionToken: v.string(),
    moduleCode: v.optional(v.string()),
    directorateCode: v.optional(v.string()),
    formationCode: v.optional(v.string()),
    unitCode: v.optional(v.string()),
    status: v.optional(v.string()),
    riskLevel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await getAuth(ctx, args.sessionToken);
    const inspections = await ctx.db.query('inspections').collect();
    const correctiveActions = await ctx.db.query('correctiveActions').collect();
    const approvals = await ctx.db.query('registrationApprovals').collect();
    const auditLogs = await ctx.db.query('auditLogs').collect();
    const findings = await ctx.db.query('findings').collect();
    const evidence = await ctx.db.query('evidence').collect();

    const visibleInspections = filterVisibleInspections(auth.user, inspections, args);

    const visibleInspectionIds = new Set(visibleInspections.map((inspection) => inspection._id));
    const visibleCorrectiveActions = correctiveActions.filter((item) => visibleInspectionIds.has(item.inspectionId));
    const visibleEvidence = evidence.filter((item) => visibleInspectionIds.has(item.inspectionId));
    const visibleFindings = findings.filter((item) => visibleInspectionIds.has(item.inspectionId));

    return {
      metrics: [
        { key: 'drafts', label: 'Draft Inspections', value: visibleInspections.filter((inspection) => inspection.status === 'draft').length, trend: 'editable work in progress', tone: 'info' },
        { key: 'submitted', label: 'Awaiting Review', value: visibleInspections.filter((inspection) => ['submitted', 'in_review'].includes(inspection.status)).length, trend: 'review queue', tone: 'warning' },
        { key: 'corrective', label: 'Corrective Actions Open', value: visibleCorrectiveActions.filter((item) => item.status !== 'closed').length, trend: 'follow-up outstanding', tone: 'danger' },
        { key: 'highRisk', label: 'High-Risk Records', value: visibleInspections.filter((inspection) => ['high', 'critical'].includes(inspection.riskLevel)).length, trend: 'command escalation threshold', tone: 'danger' },
      ],
      posture: {
        readinessAverage:
          visibleInspections.length === 0
            ? 0
            : Math.round(visibleInspections.reduce((total, inspection) => total + inspection.scoreOverall, 0) / visibleInspections.length),
        safetyRiskLevel: visibleInspections.some((inspection) => inspection.moduleCode === 'hazard_safety' && inspection.riskLevel === 'critical') ? 'critical' : 'moderate',
        evidenceCompleteness: visibleInspections.length === 0 ? 0 : Math.round((visibleEvidence.length / visibleInspections.length) * 100),
        restrictedModulesVisible: visibleInspections.filter((inspection) => inspection.classification !== 'official').length,
      },
      moduleSummaries: ['hazard_safety', 'jtf_readiness', 'civil_projects', 'general_security', 'armoury', 'magazine']
        .filter((moduleCode) => visibleInspections.some((inspection) => inspection.moduleCode === moduleCode))
        .map((moduleCode) => {
          const moduleInspections = visibleInspections.filter((inspection) => inspection.moduleCode === moduleCode);
          return {
            moduleCode,
            inspections: moduleInspections.length,
            overdue: moduleInspections.filter((inspection) => inspection.dueDate && inspection.dueDate < Date.now() && !['approved', 'closed'].includes(inspection.status)).length,
            averageScore:
              moduleInspections.length === 0
                ? 0
                : Math.round(moduleInspections.reduce((total, inspection) => total + inspection.scoreOverall, 0) / moduleInspections.length),
            openCorrectiveActions: visibleCorrectiveActions.filter((item) => moduleInspections.some((inspection) => inspection._id === item.inspectionId) && item.status !== 'closed').length,
            evidenceComplete: moduleInspections.filter((inspection) => visibleEvidence.some((entry) => entry.inspectionId === inspection._id)).length,
          };
        }),
      severityDistribution: {
        low: visibleFindings.filter((finding) => finding.severity === 'low').length,
        moderate: visibleFindings.filter((finding) => finding.severity === 'moderate').length,
        high: visibleFindings.filter((finding) => finding.severity === 'high').length,
        critical: visibleFindings.filter((finding) => finding.severity === 'critical').length,
      },
      approvalQueue: roleCanApproveRegistrations(auth.user.activeRoleCode)
        ? approvals.filter((approval) => approval.status === 'pending').length
        : 0,
      recentActivity: auditLogs
        .filter((log) => !log.moduleCode || visibleInspections.some((inspection) => inspection.moduleCode === log.moduleCode))
        .slice(-12)
        .reverse()
        .map((log) => ({
          id: log._id,
          action: log.action,
          entityType: log.entityType,
          moduleCode: log.moduleCode,
          createdAt: log.createdAt,
          actorRoleCode: log.actorRoleCode,
        })),
      alerts: [
        ...visibleInspections
          .filter((inspection) => ['high', 'critical'].includes(inspection.riskLevel))
          .slice(0, 4)
          .map((inspection) => ({
            id: inspection._id,
            title: `${inspection.title} flagged ${inspection.riskLevel}`,
            severity: inspection.riskLevel,
            moduleCode: inspection.moduleCode,
          })),
        ...(roleCanApproveRegistrations(auth.user.activeRoleCode)
          ? approvals
              .filter((approval) => approval.status === 'pending')
              .slice(0, 2)
              .map((approval) => ({
                id: approval._id,
                title: 'Personnel registration awaiting approval',
                severity: 'moderate',
                moduleCode: 'account_approval',
              }))
          : []),
      ],
      correctiveActionAging: {
        overdue: visibleCorrectiveActions.filter((item) => item.dueDate && item.dueDate < Date.now() && item.status !== 'closed').length,
        dueSoon: visibleCorrectiveActions.filter((item) => item.dueDate && item.dueDate >= Date.now() && item.dueDate < Date.now() + 7 * 24 * 60 * 60 * 1000 && item.status !== 'closed').length,
      },
      approvalSummary: {
        pending: roleCanApproveRegistrations(auth.user.activeRoleCode) ? approvals.filter((approval) => approval.status === 'pending').length : 0,
      },
      comparisons: {
        directorates: summarizeBy(visibleInspections, 'directorateCode').filter((entry) => canViewDashboardAggregate(auth.user, { directorateCode: entry.key, formationCode: auth.user.formationCode, unitCode: auth.user.unitCode })),
        formations: summarizeBy(visibleInspections, 'formationCode').filter((entry) => canViewDashboardAggregate(auth.user, { directorateCode: auth.user.directorateCode, formationCode: entry.key, unitCode: auth.user.unitCode })),
        units: summarizeBy(visibleInspections, 'unitCode').filter((entry) => canViewDashboardAggregate(auth.user, { directorateCode: auth.user.directorateCode, formationCode: auth.user.formationCode, unitCode: entry.key })),
      },
    };
  },
});

export const exportCommandReport = query({
  args: {
    sessionToken: v.string(),
    moduleCode: v.optional(v.string()),
    directorateCode: v.optional(v.string()),
    formationCode: v.optional(v.string()),
    unitCode: v.optional(v.string()),
    status: v.optional(v.string()),
    riskLevel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await getAuth(ctx, args.sessionToken);
    const inspections = await ctx.db.query('inspections').collect();
    const visibleInspections = filterVisibleInspections(auth.user, inspections, args);

    return {
      generatedAt: Date.now(),
      generatedBy: {
        appointmentNumber: auth.user.appointmentNumber,
        roleCode: auth.user.activeRoleCode,
      },
      scope: {
        moduleCode: args.moduleCode,
        directorateCode: args.directorateCode,
        formationCode: args.formationCode,
        unitCode: args.unitCode,
        status: args.status,
        riskLevel: args.riskLevel,
      },
      inspections: visibleInspections.map((inspection) => ({
        id: inspection._id,
        title: inspection.title,
        moduleCode: inspection.moduleCode,
        classification: inspection.classification,
        status: inspection.status,
        scoreOverall: inspection.scoreOverall,
        riskLevel: inspection.riskLevel,
        directorateCode: inspection.directorateCode,
        formationCode: inspection.formationCode,
        unitCode: inspection.unitCode,
        updatedAt: inspection.updatedAt,
      })),
    };
  },
});
