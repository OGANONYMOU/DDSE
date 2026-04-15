import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.ACCESS_TOKEN_TTL,
    issuer: 'ddse-platform',
    audience: 'ddse-operators',
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.REFRESH_TOKEN_TTL,
    issuer: 'ddse-platform',
    audience: 'ddse-operators',
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'ddse-platform',
    audience: 'ddse-operators',
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: 'ddse-platform',
    audience: 'ddse-operators',
  });
}
