import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionInspection, computeInspectionScores } from '../convex/lib/workflow.js';

test('inspection scoring calculates overall and completion', () => {
  const sections = [{ _id: 'section-1', title: 'One' }];
  const items = [
    { _id: 'item-1', sectionId: 'section-1', weight: 10 },
    { _id: 'item-2', sectionId: 'section-1', weight: 10 },
  ];
  const responses = [
    { itemId: 'item-1', numericScore: 1 },
    { itemId: 'item-2', numericScore: 0.5 },
  ];

  const result = computeInspectionScores(sections, items, responses);
  assert.equal(result.overallScore, 75);
  assert.equal(result.completionPercent, 100);
  assert.equal(result.complianceBand, 'compliant');
});

test('inspection workflow transition rules remain role aware', () => {
  assert.equal(canTransitionInspection('evaluator', 'draft', 'submitted'), true);
  assert.equal(canTransitionInspection('base_soldier', 'draft', 'submitted'), false);
  assert.equal(canTransitionInspection('audit_reviewer', 'submitted', 'approved'), true);
  assert.equal(canTransitionInspection('evaluator', 'submitted', 'approved'), false);
});
