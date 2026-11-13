// SEEDING — copies the bundled JSON dataset into the SQLite tables.
// It receives the dataset as a parameter (instead of importing the JSON
// itself) so it can be tested on its own.

import { EVENT_SEVERITIES, RESOURCE_STATUSES, RESOURCE_TYPES } from './schema';

// Data-integrity checks run BEFORE anything is inserted.
// Returns a list of problems; an empty list means the dataset is valid.
export function validateSeedData({ architectures, resources, dependencies, events }) {
  const problems = [];
  const architectureIds = new Set(architectures.map((a) => a.id));
  const resourceIds = new Set();

  for (const resource of resources) {
    if (resourceIds.has(resource.id)) problems.push(`Duplicate resource id ${resource.id}`);
    resourceIds.add(resource.id);
    if (!architectureIds.has(resource.architecture_id)) {
      problems.push(`${resource.id} points to unknown architecture ${resource.architecture_id}`);
    }
    if (!RESOURCE_TYPES.includes(resource.type)) problems.push(`${resource.id} has invalid type ${resource.type}`);
    if (!RESOURCE_STATUSES.includes(resource.status)) problems.push(`${resource.id} has invalid status ${resource.status}`);
  }

  for (const dep of dependencies) {
    if (!resourceIds.has(dep.source_id)) problems.push(`Dependency source ${dep.source_id} does not exist`);
    if (!resourceIds.has(dep.target_id)) problems.push(`Dependency target ${dep.target_id} does not exist`);
    if (dep.source_id === dep.target_id) problems.push(`${dep.source_id} cannot depend on itself`);
  }

  for (const event of events) {
    if (!resourceIds.has(event.resource_id)) problems.push(`Event points to unknown resource ${event.resource_id}`);
    if (!EVENT_SEVERITIES.includes(event.severity)) problems.push(`Event has invalid severity ${event.severity}`);
  }

  return problems;
}

// Inserts every record. Must be called inside a transaction (see initDatabase.js)
// so that either ALL rows are saved or NONE are.
// Every INSERT uses "?" placeholders: values are passed separately and
// SQLite inserts them safely, never by gluing text into the SQL string.
export async function insertSeedData(db, { architectures, resources, dependencies, events }) {
  for (const a of architectures) {
    await db.runAsync(
      'INSERT INTO architectures (id, name, category, complexity, description) VALUES (?, ?, ?, ?, ?)',
      [a.id, a.name, a.category, a.complexity, a.description]
    );
  }

  for (const r of resources) {
    await db.runAsync(
      `INSERT INTO resources
         (id, architecture_id, name, type, status, region, zone, environment, description, attributes_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.id,
        r.architecture_id,
        r.name,
        r.type,
        r.status,
        r.region,
        r.zone,
        r.environment,
        r.description,
        JSON.stringify(r.attributes ?? {}), // object -> JSON text for storage
      ]
    );
  }

  for (const d of dependencies) {
    await db.runAsync(
      'INSERT INTO dependencies (source_id, target_id, relationship) VALUES (?, ?, ?)',
      [d.source_id, d.target_id, d.relationship]
    );
  }

  for (const e of events) {
    await db.runAsync(
      `INSERT INTO events (resource_id, event_type, severity, message, created_at, origin)
       VALUES (?, ?, ?, ?, ?, 'seed')`,
      [e.resource_id, e.event_type, e.severity, e.message, e.created_at]
    );
  }
}
