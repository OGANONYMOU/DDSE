import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { visibleModulesForRole } from '../security/rbac.js';

export const dashboardRouter = Router();

dashboardRouter.get('/summary', requireAuth, async (req, res) => {
  const visibleModules = visibleModulesForRole(req.auth.role);

  res.status(200).json({
    metrics: [
      { key: 'inspections_due', label: 'Inspections Due', value: 18, trend: '+4 this week', tone: 'info' },
      { key: 'pending_approvals', label: 'Pending Approvals', value: 6, trend: '2 above 72h SLA', tone: 'warning' },
      { key: 'open_corrective_actions', label: 'Corrective Actions', value: 23, trend: '8 high risk', tone: 'danger' },
      { key: 'projects_under_watch', label: 'Projects Under Watch', value: 11, trend: '3 milestone slippages', tone: 'warning' },
    ],
    posture: {
      readinessAverage: 84,
      safetyRiskLevel: 'moderate',
      evidenceCompleteness: 91,
      restrictedModulesVisible: visibleModules.filter((moduleCode) => moduleCode === 'armoury' || moduleCode === 'magazine').length,
    },
    alerts: [
      { id: 'alert-001', title: 'Hazard closure SLA exceeded', severity: 'high', moduleCode: 'hazard_safety' },
      { id: 'alert-002', title: 'Project milestone missed', severity: 'moderate', moduleCode: 'civil_projects' },
      ...(visibleModules.includes('armoury') ? [{ id: 'alert-003', title: 'Restricted armoury exception pending review', severity: 'critical', moduleCode: 'armoury' }] : []),
    ],
  });
});
