"use node";

import crypto from 'node:crypto';

export async function sha256(value) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function randomCode(length = 6) {
  const digits = [];
  for (let index = 0; index < length; index += 1) {
    digits.push(crypto.randomInt(0, 10));
  }
  return digits.join('');
}

export function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}
