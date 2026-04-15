import assert from 'node:assert/strict';

import {
  canAccessEvidence,
  canAccessInspection,
  canCreateInspectionForOrg,
  roleCanApproveRegistrations,
  validateRoleEligibility,
} from '../convex/lib/authz.js';

export function runAuthzTests() {
  const baseUser = {
    _id: 'user_1',
    activeRoleCode: 'directorate_officer',
    directorateCode: 'DSE',
    formationCode: 'HQ-NA',
    unitCode: 'DDSE-HQ',
  };

  assert.equal(
    canAccessInspection(baseUser, {
      moduleCode: 'general_security',
      classification: 'restricted_security',
      directorateCode: 'DSE',
      formationCode: 'HQ-NA',
      unitCode: 'DDSE-HQ',
      createdByUserId: 'other',
      assignedToUserId: 'other',
    }),
    true,
  );

  assert.equal(
    canAccessInspection(baseUser, {
      moduleCode: 'general_security',
      classification: 'restricted_security',
      directorateCode: 'DPM',
      formationCode: 'HQ-NA',
      unitCode: 'DDSE-HQ',
      createdByUserId: 'other',
      assignedToUserId: 'other',
    }),
    false,
  );

  const soldier = {
    _id: 'soldier_1',
    activeRoleCode: 'base_soldier',
    directorateCode: 'DSE',
    formationCode: 'HQ-NA',
    unitCode: 'DDSE-HQ',
  };

  const inspection = {
    moduleCode: 'hazard_safety',
    classification: 'official',
    directorateCode: 'DSE',
    formationCode: 'HQ-NA',
    unitCode: 'DDSE-HQ',
    createdByUserId: 'other',
    assignedToUserId: 'other',
  };

  assert.equal(canAccessInspection(soldier, inspection), false);
  assert.equal(
    canAccessEvidence(soldier, { ...inspection, createdByUserId: 'soldier_1' }, { classification: 'restricted_security' }),
    false,
  );

  assert.equal(
    canCreateInspectionForOrg(baseUser, {
      directorateCode: 'DSE',
      formationCode: 'HQ-NA',
      unitCode: 'DDSE-HQ',
    }),
    true,
  );

  assert.equal(
    canCreateInspectionForOrg(baseUser, {
      directorateCode: 'DSM',
      formationCode: 'HQ-NA',
      unitCode: 'DDSE-HQ',
    }),
    false,
  );

  assert.equal(roleCanApproveRegistrations('ddse_admin'), true);
  assert.equal(roleCanApproveRegistrations('directorate_officer'), false);
  assert.match(validateRoleEligibility('project_officer', 'DSE') ?? '', /Project Officer access/i);
  assert.equal(validateRoleEligibility('project_officer', 'DPM'), null);
}
