import assert from 'node:assert/strict';

import { canTransitionInspection, computeInspectionScores } from '../convex/lib/workflow.js';

export function runWorkflowTests() {
  assert.equal(canTransitionInspection('base_soldier', 'draft', 'submitted'), false);
  assert.equal(canTransitionInspection('directorate_officer', 'draft', 'submitted'), true);
  assert.equal(canTransitionInspection('directorate_officer', 'submitted', 'approved'), false);
  assert.equal(canTransitionInspection('audit_reviewer', 'submitted', 'approved'), true);

  const sections = [
    { _id: 'section_1', title: 'Section 1' },
    { _id: 'section_2', title: 'Section 2' },
  ];
  const items = [
    { _id: 'item_1', sectionId: 'section_1', weight: 10 },
    { _id: 'item_2', sectionId: 'section_2', weight: 10 },
  ];
  const responses = [
    { itemId: 'item_1', numericScore: 1 },
  ];

  const result = computeInspectionScores(sections, items, responses);
  assert.equal(result.completionPercent, 50);
  assert.equal(result.overallScore, 50);
  assert.equal(result.complianceBand, 'critical');
  assert.equal(result.riskLevel, 'high');
}
