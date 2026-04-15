import { runAuthzTests } from './convex-authz.test.js';
import { runWorkflowTests } from './workflow.test.js';

const suites = [
  ['authorization', runAuthzTests],
  ['workflow', runWorkflowTests],
];

for (const [name, run] of suites) {
  run();
  console.log(`PASS ${name}`);
}

console.log(`PASS ${suites.length} suite(s)`);
