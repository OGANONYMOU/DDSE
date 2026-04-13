import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessClassification, hasPermission, visibleModulesForRole } from './rbac.js';
import { roleCanAccessModule, roleCanDownloadEvidence } from '../../convex/lib/authz.js';

test('restricted armoury access is denied to evaluator', () => {
  assert.equal(canAccessClassification('evaluator', 'restricted_armoury'), false);
});

test('restricted armoury access is allowed to super admin', () => {
  assert.equal(canAccessClassification('super_admin', 'restricted_armoury'), true);
});

test('visible modules for audit reviewer include magazine and armoury', () => {
  const modules = visibleModulesForRole('audit_reviewer');
  assert.equal(modules.includes('armoury'), true);
  assert.equal(modules.includes('magazine'), true);
});

test('reports export permission is enforced by role matrix', () => {
  assert.equal(hasPermission('base_soldier', 'reports.export'), false);
  assert.equal(hasPermission('senior_command_readonly', 'reports.export'), true);
});

test('restricted Convex modules deny non-authorized access', () => {
  assert.equal(roleCanAccessModule('base_soldier', 'armoury'), false);
  assert.equal(roleCanAccessModule('base_commander', 'armoury'), true);
  assert.equal(roleCanAccessModule('base_soldier', 'general_security'), false);
  assert.equal(roleCanAccessModule('audit_reviewer', 'general_security'), true);
});

test('evidence download authorization respects classification restrictions', () => {
  assert.equal(roleCanDownloadEvidence('base_soldier', 'armoury', 'restricted_armoury'), false);
  assert.equal(roleCanDownloadEvidence('audit_reviewer', 'armoury', 'restricted_armoury'), true);
  assert.equal(roleCanDownloadEvidence('directorate_officer', 'jtf_readiness', 'restricted_security'), true);
});
