import { query } from "./_generated/server";
import { v } from 'convex/values';
import { roleCanApproveRegistrations } from './lib/authz';

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

export const commandCenter = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const auth = await getAuth(ctx, args.sessionToken);
    const inspections = await ctx.db.query('inspections').collect();
    const correctiveActions = await ctx.db.query('correctiveActions').collect();
    const approvals = await ctx.db.query('registrationApprovals').collect();
    const auditLogs = await ctx.db.query('auditLogs').collect();
    const findings = await ctx.db.query('findings').collect();

    const visibleInspections = inspections.filter(
      (inspection) =>
        inspection.classification !== 'restricted_operational' ||
        ['super_admin', 'ddse_admin', 'evaluator', 'directorate_officer', 'base_commander', 'audit_reviewer', 'senior_command_readonly'].includes(auth.user.activeRoleCode),
    );

    return {
      metrics: [
        { key: 'drafts', label: 'Draft Inspections', value: visibleInspections.filter((inspection) => inspection.status === 'draft').length, trend: 'autosaved and editable', tone: 'info' },
        { key: 'submitted', label: 'Awaiting Review', value: visibleInspections.filter((inspection) => ['submitted', 'in_review'].includes(inspection.status)).length, trend: 'command attention required', tone: 'warning' },
        { key: 'corrective', label: 'Corrective Actions Open', value: correctiveActions.filter((item) => item.status !== 'closed').length, trend: 'follow-up outstanding', tone: 'danger' },
        { key: 'highRisk', label: 'High-Risk Records', value: visibleInspections.filter((inspection) => ['high', 'critical'].includes(inspection.riskLevel)).length, trend: 'escalation threshold met', tone: 'danger' },
      ],
      posture: {
        readinessAverage:
          visibleInspections.length === 0
            ? 0
            : Math.round(visibleInspections.reduce((total, inspection) => total + inspection.scoreOverall, 0) / visibleInspections.length),
        safetyRiskLevel: visibleInspections.some((inspection) => inspection.moduleCode === 'hazard_safety' && inspection.riskLevel === 'critical') ? 'critical' : 'moderate',
        evidenceCompleteness: visibleInspections.length === 0 ? 0 : Math.round((visibleInspections.filter((inspection) => inspection.completionPercent === 100).length / visibleInspections.length) * 100),
        restrictedModulesVisible: ['super_admin', 'ddse_admin', 'evaluator', 'directorate_officer', 'base_commander', 'audit_reviewer', 'senior_command_readonly'].includes(auth.user.activeRoleCode) ? 1 : 0,
      },
      moduleSummaries: ['hazard_safety', 'jtf_readiness', 'civil_projects', 'general_security', 'armoury', 'magazine']
        .filter((moduleCode) =>
          visibleInspections.some((inspection) => inspection.moduleCode === moduleCode) ||
          ['hazard_safety', 'jtf_readiness', 'civil_projects'].includes(moduleCode),
        )
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
            openCorrectiveActions: correctiveActions.filter((item) => moduleInspections.some((inspection) => inspection._id === item.inspectionId) && item.status !== 'closed').length,
            evidenceComplete: moduleInspections.filter((inspection) => inspection.completionPercent === 100).length,
          };
        }),
      severityDistribution: {
        low: findings.filter((finding) => finding.severity === 'low').length,
        moderate: findings.filter((finding) => finding.severity === 'moderate').length,
        high: findings.filter((finding) => finding.severity === 'high').length,
        critical: findings.filter((finding) => finding.severity === 'critical').length,
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
          .slice(0, 3)
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
        ...auditLogs
          .filter((log) => log.action === 'restricted.record.viewed')
          .slice(-2)
          .map((log) => ({
            id: log._id,
            title: 'Restricted access event recorded',
            severity: 'high',
            moduleCode: log.moduleCode ?? 'restricted',
          })),
      ],
    };
  },
});
