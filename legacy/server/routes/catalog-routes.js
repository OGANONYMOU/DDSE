import { Router } from 'express';
import { summarizeCatalogForRole } from '../domain/ddse-templates.js';
import { requireAuth } from '../middleware/auth.js';
import { visibleModulesForRole } from '../security/rbac.js';

export const catalogRouter = Router();

catalogRouter.get('/modules', requireAuth, async (req, res) => {
  const visibleModules = visibleModulesForRole(req.auth.role);
  res.status(200).json({
    modules: summarizeCatalogForRole(visibleModules),
  });
});
