import crypto from 'node:crypto';
import { add } from 'date-fns';
import { v4 as uuid } from 'uuid';
import { createRefreshSession, findRefreshSession, findUserById, findUserForLogin, revokeRefreshSession } from '../repositories/auth-repository.js';
import { verifyPassword } from '../security/passwords.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../security/tokens.js';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function mapUser(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    appointmentNumber: user.appointment_number,
    role: user.role_code,
    directorateName: user.directorate_name,
    unitName: user.unit_name,
    formationName: user.formation_name,
    mfaRequired: user.mfa_required,
  };
}

async function createSessionForUser(user, userAgent, ipAddress) {
  const sessionId = uuid();
  const accessToken = signAccessToken({ sub: user.id, role: user.role_code, sid: sessionId });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role_code, sid: sessionId });

  await createRefreshSession({
    userId: user.id,
    sessionId,
    refreshTokenHash: sha256(refreshToken),
    userAgent,
    ipAddress,
    expiresAt: add(new Date(), { days: 7 }),
  });

  return {
    requiresTwoFactor: false,
    accessToken,
    refreshToken,
    user: mapUser(user),
  };
}

export async function authenticateUser({ appointmentNumber, password, otpCode, userAgent, ipAddress }) {
  const user = await findUserForLogin(appointmentNumber);

  if (!user || user.status !== 'active') {
    const error = new Error('Invalid credentials.');
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await verifyPassword(password, user.password_hash);
  if (!passwordMatches) {
    const error = new Error('Invalid credentials.');
    error.statusCode = 401;
    throw error;
  }

  if (user.mfa_required && !otpCode) {
    return {
      requiresTwoFactor: true,
      user: mapUser(user),
    };
  }

  if (user.mfa_required && otpCode !== user.mfa_secret) {
    const error = new Error('Invalid one-time passcode.');
    error.statusCode = 401;
    throw error;
  }

  return createSessionForUser(user, userAgent, ipAddress);
}

export async function rotateRefreshToken(refreshToken, userAgent, ipAddress) {
  const decoded = verifyRefreshToken(refreshToken);
  const session = await findRefreshSession(decoded.sid);

  if (!session || session.revoked_at || new Date(session.expires_at) <= new Date()) {
    const error = new Error('Refresh session is invalid.');
    error.statusCode = 401;
    throw error;
  }

  if (session.refresh_token_hash !== sha256(refreshToken)) {
    const error = new Error('Refresh session hash mismatch.');
    error.statusCode = 401;
    throw error;
  }

  await revokeRefreshSession(decoded.sid);
  const user = await findUserById(decoded.sub);

  if (!user || user.status !== 'active') {
    const error = new Error('User session is no longer active.');
    error.statusCode = 401;
    throw error;
  }

  return createSessionForUser(user, userAgent, ipAddress);
}
