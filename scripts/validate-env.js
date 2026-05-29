#!/usr/bin/env node
/**
 * DDSE — Pre-deploy environment validation script.
 *
 * Usage:
 *   node scripts/validate-env.js            # validate .env.local against .env.example
 *   node scripts/validate-env.js --ci       # validate process.env (CI mode)
 *   node scripts/validate-env.js --check-template  # just verify .env.example is parseable
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');

const args = process.argv.slice(2);
const CI_MODE        = args.includes('--ci');
const TEMPLATE_CHECK = args.includes('--check-template');

// ─── Parse .env file into key→value map ───────────────────────────────────────

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const lines = readFileSync(filePath, 'utf8').split('\n');
  const vars   = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key   = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    vars[key] = value;
  }
  return vars;
}

// ─── Extract required keys from .env.example ─────────────────────────────────

function getRequiredKeys(examplePath) {
  const example = parseEnvFile(examplePath);
  // Keys are "required" if they contain placeholder brackets or are empty
  return Object.entries(example)
    .filter(([, v]) => v.includes('<') || v === '')
    .map(([k]) => k);
}

// ─── Main validation ──────────────────────────────────────────────────────────

const examplePath = resolve(ROOT, '.env.example');
if (!existsSync(examplePath)) {
  console.error('✗  .env.example not found. Cannot validate environment.');
  process.exit(1);
}

if (TEMPLATE_CHECK) {
  const keys = Object.keys(parseEnvFile(examplePath));
  console.log(`✓  .env.example is valid — ${keys.length} keys defined: ${keys.join(', ')}`);
  process.exit(0);
}

const requiredKeys = getRequiredKeys(examplePath);
let allValid = true;
const errors = [];
const warnings = [];

if (CI_MODE) {
  // In CI, read from process.env (injected as GitHub Secrets)
  for (const key of requiredKeys) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      errors.push(`  ✗  ${key} — missing from environment`);
      allValid = false;
    } else {
      console.log(`  ✓  ${key}`);
    }
  }
} else {
  // Local: read from .env.local
  const localPath = resolve(ROOT, '.env.local');
  if (!existsSync(localPath)) {
    errors.push('  ✗  .env.local not found. Copy .env.example → .env.local and fill in your values.');
    allValid = false;
  } else {
    const local = parseEnvFile(localPath);
    for (const key of requiredKeys) {
      const value = local[key];
      if (!value || value.trim() === '' || value.startsWith('<')) {
        errors.push(`  ✗  ${key} — missing or still a placeholder`);
        allValid = false;
      } else {
        console.log(`  ✓  ${key}`);
      }
    }

    // Warn about keys in .env.example but not required
    const exampleAll = parseEnvFile(examplePath);
    for (const key of Object.keys(exampleAll)) {
      if (!requiredKeys.includes(key) && !local[key]) {
        warnings.push(`  ⚠  ${key} — optional but not set`);
      }
    }
  }
}

if (warnings.length > 0) {
  console.log('\nWarnings:');
  warnings.forEach((w) => console.log(w));
}

if (!allValid) {
  console.error('\nEnvironment validation FAILED:');
  errors.forEach((e) => console.error(e));
  console.error('\nSee .env.example for the required variable format.');
  process.exit(1);
}

console.log('\n✓  All required environment variables are set.');
