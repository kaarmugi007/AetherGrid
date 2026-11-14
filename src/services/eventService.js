// EVENT SERVICE — reads and writes the activity history.
// origin = 'seed'       -> sample events bundled with the app (never deleted)
// origin = 'simulation' -> events created by the Failure Simulation Lab

// Events newest first, with optional filters.
// LEFT JOIN so an event still shows even if it has no related resource.
export async function getEvents(
  db,
  { severity = null, origin = null, eventType = null, resourceId = null, limit = null } = {}
) {
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
  if (eventType) {
    sql += ' AND e.event_type = ?';
    params.push(eventType);
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

// The chip choices for the Activity Centre, taken from the stored events.
export async function getEventFilterOptions(db) {
  const types = await db.getAllAsync('SELECT DISTINCT event_type FROM events ORDER BY event_type');
  return { eventTypes: types.map((row) => row.event_type) };
}

export async function getSimulationEventCount(db) {
  const row = await db.getFirstAsync("SELECT COUNT(*) AS count FROM events WHERE origin = 'simulation'");
  return row?.count ?? 0;
}

// Saves one simulation run to the history. Only the events table is written;
// resource records and statuses are never changed by a simulation.
export async function addSimulationEvent(db, { resourceId, severity, message }) {
  await db.runAsync(
    `INSERT INTO events (resource_id, event_type, severity, message, created_at, origin)
     VALUES (?, 'simulation', ?, ?, ?, 'simulation')`,
    [resourceId, severity, message, new Date().toISOString()]
  );
}

// Removes ONLY simulation-generated events. Seeded sample events stay.
export async function clearSimulationEvents(db) {
  await db.runAsync("DELETE FROM events WHERE origin = 'simulation'");
}
