import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const [key, ...rest] = line.split('=');
    if (!key) continue;
    process.env[key.trim()] = rest.join('=').trim();
  }
}

class CookieClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.cookie = '';
  }

  async fetch(pathname, init = {}) {
    const response = await fetch(new URL(pathname, `${this.baseUrl}/`), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(this.cookie ? { Cookie: this.cookie } : {}),
        ...(init.headers ?? {}),
      },
    });

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      this.cookie = setCookie.split(';')[0];
    }

    return response;
  }

  async post(pathname, body) {
    const response = await this.fetch(pathname, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(json?.error ?? `Request failed for ${pathname}`);
    }
    return json;
  }

  async get(pathname) {
    const response = await this.fetch(pathname, { method: 'GET' });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(json?.error ?? `Request failed for ${pathname}`);
    }
    return json;
  }

  async rpc(operation, payload) {
    return this.post('/api/rpc', { operation, payload });
  }
}

async function signIn(client, appointmentNumber, password) {
  const result = await client.post('/api/auth/sign-in', {
    appointmentNumber,
    password,
    userAgent: 'ddse-e2e',
  });

  if (result.requiresOtp) {
    assert.ok(result.previewCode, 'Expected preview OTP code in localhost mode');
    return client.post('/api/auth/verify-sign-in', {
      challengeId: result.challengeId,
      code: result.previewCode,
      userAgent: 'ddse-e2e',
    });
  }

  return result;
}

loadEnvFile();

const appUrl = process.env.APP_ORIGIN ?? 'http://localhost:5173';
const convexSiteUrl = process.env.VITE_CONVEX_SITE_URL;
const adminAppointment = process.env.DDSE_E2E_ADMIN_APPOINTMENT;
const adminPassword = process.env.DDSE_E2E_ADMIN_PASSWORD;

if (!convexSiteUrl) {
  throw new Error('VITE_CONVEX_SITE_URL must be set in .env.local for E2E runs.');
}

if (!adminAppointment || !adminPassword) {
  throw new Error('DDSE_E2E_ADMIN_APPOINTMENT and DDSE_E2E_ADMIN_PASSWORD are required for approval and review coverage.');
}

const appResponse = await fetch(appUrl);
assert.equal(appResponse.ok, true, 'Local frontend is not reachable');

const adminClient = new CookieClient(convexSiteUrl);
const projectUserClient = new CookieClient(convexSiteUrl);

const uniqueSuffix = `${Date.now()}`.slice(-6);
const appointmentNumber = `DDSE/PJ/${uniqueSuffix}`;
const fullName = `Project Officer ${uniqueSuffix}`;
const password = `Secure!Pass${uniqueSuffix}A`;

const registration = await projectUserClient.post('/api/auth/register', {
  fullName,
  appointmentNumber,
  rankCode: 'captain',
  requestedRoleCode: 'project_officer',
  directorateCode: 'DPM',
  formationCode: 'HQ-NA',
  unitCode: 'ENG-PROJ-01',
  phoneNumber: `0801234${uniqueSuffix}`,
  email: `project${uniqueSuffix}@ddse.local`,
  branch: 'engineering',
  identityNumber: `ID${uniqueSuffix}`,
  justification: 'E2E privileged registration validation',
  password,
  confirmPassword: password,
});

assert.ok(registration.challengeId);
assert.ok(registration.previewCode);

await projectUserClient.post('/api/auth/verify-registration', {
  challengeId: registration.challengeId,
  code: registration.previewCode,
});

await signIn(adminClient, adminAppointment, adminPassword);

const pendingApprovals = await adminClient.rpc('getPendingApprovals');
const approval = pendingApprovals.find((entry) => entry.appointmentNumber === appointmentNumber);
assert.ok(approval, 'Expected pending approval for newly registered privileged user');

await adminClient.rpc('approveRegistration', {
  registrationApprovalId: approval.approvalId,
  decision: 'approved',
  notes: 'Approved by localhost E2E validation',
});

const session = await signIn(projectUserClient, appointmentNumber, password);
assert.ok(session.user);

const projectSummary = await projectUserClient.rpc('getCommandCenterSummary', {});
assert.ok(projectSummary.metrics.length > 0);

const projectModules = await projectUserClient.rpc('getModules');
assert.ok(projectModules.some((module) => module.moduleCode === 'civil_projects'));
assert.equal(projectModules.some((module) => module.moduleCode === 'armoury'), false);

const inspectionId = await projectUserClient.rpc('createInspection', {
  moduleCode: 'civil_projects',
  title: `Civil Project ${uniqueSuffix}`,
  directorateCode: 'DPM',
  formationCode: 'HQ-NA',
  unitCode: 'ENG-PROJ-01',
});

const inspectionDetail = await projectUserClient.rpc('getInspectionDetail', { inspectionId });
const firstSection = inspectionDetail.sections[0];
const firstItem = firstSection.items[0];

await projectUserClient.rpc('saveInspectionResponse', {
  inspectionId,
  sectionId: firstSection._id,
  itemId: firstItem._id,
  responseValue: 'yes',
  numericScore: 1,
  immediateRisk: false,
  remarks: 'localhost e2e response',
});

await projectUserClient.rpc('createFinding', {
  inspectionId,
  itemId: firstItem._id,
  title: 'Localhost finding',
  detail: 'Finding created by E2E coverage',
  severity: 'moderate',
});

await projectUserClient.rpc('addReviewComment', {
  inspectionId,
  body: 'Initial reviewer comment from localhost E2E',
});

const uploadUrl = await projectUserClient.rpc('generateEvidenceUploadUrl', {
  inspectionId,
});

const evidenceUpload = await fetch(uploadUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain',
  },
  body: new Blob(['localhost evidence payload'], { type: 'text/plain' }),
});
assert.equal(evidenceUpload.ok, true, 'Evidence upload URL rejected upload');
const { storageId } = await evidenceUpload.json();

await projectUserClient.rpc('attachEvidence', {
  inspectionId,
  sectionId: firstSection._id,
  itemId: firstItem._id,
  storageId,
  fileName: 'e2e-evidence.txt',
  contentType: 'text/plain',
  sizeBytes: 26,
  classification: 'official',
  contentHash: 'e2e-placeholder-hash',
  provenance: { source: 'e2e' },
});

await projectUserClient.rpc('transitionInspection', {
  inspectionId,
  toStatus: 'submitted',
});

await adminClient.rpc('transitionInspection', {
  inspectionId,
  toStatus: 'in_review',
});

await adminClient.rpc('transitionInspection', {
  inspectionId,
  toStatus: 'approved',
  comments: 'Approved during localhost E2E run',
});

await adminClient.rpc('transitionInspection', {
  inspectionId,
  toStatus: 'closed',
  comments: 'Closed during localhost E2E run',
});

const refreshedDetail = await adminClient.rpc('getInspectionDetail', { inspectionId });
const evidenceId = refreshedDetail.sections[0].items[0].evidence[0]._id;

const evidenceDownload = await adminClient.rpc('getEvidenceDownloadUrl', {
  evidenceId,
  reason: 'localhost e2e authorization verification',
});
assert.ok(evidenceDownload.url);

const restrictedInspectionId = await adminClient.rpc('createInspection', {
  moduleCode: 'armoury',
  title: `Armoury ${uniqueSuffix}`,
  directorateCode: 'DSE',
  formationCode: 'HQ-NA',
  unitCode: 'DDSE-HQ',
});

let denied = false;
try {
  await projectUserClient.rpc('getInspectionDetail', { inspectionId: restrictedInspectionId });
} catch (error) {
  denied = /access denied|not found/i.test(String(error));
}
assert.equal(denied, true, 'Expected restricted module drill-down denial');

const adminSummary = await adminClient.rpc('getCommandCenterSummary', {});
assert.ok(adminSummary.posture.restrictedModulesVisible >= projectSummary.posture.restrictedModulesVisible);

console.log('PASS localhost auth, approval, dashboard, evidence, and restricted-module E2E flow');
