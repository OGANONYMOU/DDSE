import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env.local');
const required = [
  'VITE_CONVEX_URL',
  'VITE_CONVEX_SITE_URL',
  'APP_ORIGIN',
];

if (!fs.existsSync(envPath)) {
  console.error('Missing .env.local. Start from .env.example before running DDSE locally.');
  process.exit(1);
}

const envText = fs.readFileSync(envPath, 'utf8');
const missing = required.filter((key) => !new RegExp(`^${key}=.+$`, 'm').test(envText));

if (missing.length > 0) {
  console.error(`Missing required local environment values: ${missing.join(', ')}`);
  process.exit(1);
}

if (!/DDSE_ENABLE_DEV_OTP_PREVIEW=true/m.test(envText) && !/OTP_DELIVERY_WEBHOOK_URL=.+/m.test(envText)) {
  console.error('Configure OTP_DELIVERY_WEBHOOK_URL or enable DDSE_ENABLE_DEV_OTP_PREVIEW=true for localhost OTP flows.');
  process.exit(1);
}

console.log('Local environment configuration looks complete.');
