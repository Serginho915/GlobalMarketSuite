import { query } from './db';

export async function auditLog(eventType: string, actor?: { id?: string; email?: string } | null, metadata: Record<string, unknown> = {}) {
  await query(
    'INSERT INTO audit_events (actor_id, actor_email, event_type, metadata) VALUES ($1, $2, $3, $4)',
    [actor?.id || null, actor?.email || null, eventType, JSON.stringify(metadata)],
  );
}
