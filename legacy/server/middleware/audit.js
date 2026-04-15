import { query } from '../lib/db.js';

export async function writeAuditLog({
  actorUserId,
  actorRole,
  action,
  entityType,
  entityId,
  classification = 'official',
  oldValue = null,
  newValue = null,
  justification = null,
  correlationId = null,
  ipAddress = null,
  userAgent = null,
}) {
  await query(
    `insert into audit_logs (
      actor_user_id,
      actor_role,
      action,
      entity_type,
      entity_id,
      classification,
      old_value,
      new_value,
      justification,
      correlation_id,
      ip_address,
      user_agent
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      actorUserId,
      actorRole,
      action,
      entityType,
      entityId,
      classification,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      justification,
      correlationId,
      ipAddress,
      userAgent,
    ],
  );
}
