import { query } from '../lib/db.js';

export async function findUserForLogin(appointmentNumber) {
  const result = await query(
    `select
      u.id,
      u.full_name,
      u.appointment_number,
      u.password_hash,
      u.status,
      u.mfa_required,
      u.mfa_secret,
      r.code as role_code,
      d.name as directorate_name,
      unit.name as unit_name,
      formation.name as formation_name
    from users u
    join roles r on r.id = u.role_id
    left join directorates d on d.id = u.directorate_id
    left join units unit on unit.id = u.unit_id
    left join formations formation on formation.id = u.formation_id
    where lower(u.appointment_number) = lower($1)
    limit 1`,
    [appointmentNumber],
  );

  return result.rows[0] ?? null;
}

export async function findUserById(userId) {
  const result = await query(
    `select
      u.id,
      u.full_name,
      u.appointment_number,
      u.status,
      u.mfa_required,
      r.code as role_code,
      d.name as directorate_name,
      unit.name as unit_name,
      formation.name as formation_name
    from users u
    join roles r on r.id = u.role_id
    left join directorates d on d.id = u.directorate_id
    left join units unit on unit.id = u.unit_id
    left join formations formation on formation.id = u.formation_id
    where u.id = $1
    limit 1`,
    [userId],
  );

  return result.rows[0] ?? null;
}

export async function createRefreshSession({
  userId,
  sessionId,
  refreshTokenHash,
  userAgent,
  ipAddress,
  expiresAt,
}) {
  await query(
    `insert into user_sessions (
      id,
      user_id,
      refresh_token_hash,
      user_agent,
      ip_address,
      expires_at
    ) values ($1,$2,$3,$4,$5,$6)`,
    [sessionId, userId, refreshTokenHash, userAgent, ipAddress, expiresAt],
  );
}

export async function revokeRefreshSession(sessionId) {
  await query(`update user_sessions set revoked_at = now() where id = $1`, [sessionId]);
}

export async function findRefreshSession(sessionId) {
  const result = await query(
    `select id, user_id, refresh_token_hash, revoked_at, expires_at
    from user_sessions
    where id = $1
    limit 1`,
    [sessionId],
  );

  return result.rows[0] ?? null;
}
