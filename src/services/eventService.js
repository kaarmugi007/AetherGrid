// EVENT SERVICE — reads the activity history (sample + simulation events).

// Events newest first, with optional filters.
// LEFT JOIN so an event still shows even if it has no related resource.
export async function getEvents(db, { severity = null, origin = null, resourceId = null, limit = null } = {}) {
  let sql = `
    SELECT e.id, e.resource_id, e.event_type, e.severity, e.message,
           e.created_at, e.origin, r.name AS resource_name
    FROM events e
    LEFT JOIN resources r ON r.id = e.resource_id
    WHERE 1 = 1`;
  const params = [];

  if (severity) {
    sql += ' AND e.severity = ?';
    params.push(severity);
  }
  if (origin) {
    sql += ' AND e.origin = ?';
    params.push(origin);
  }
  if (resourceId) {
    sql += ' AND e.resource_id = ?';
    params.push(resourceId);
  }

  sql += ' ORDER BY e.created_at DESC, e.id DESC';

  if (limit) {
    sql += ' LIMIT ?';
    params.push(limit);
  }

  return db.getAllAsync(sql, params);
}

export function getRecentEvents(db, limit = 5) {
  return getEvents(db, { limit });
}
