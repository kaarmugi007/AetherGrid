// DATABASE SCHEMA — the structure (tables and columns) of AetherGrid's
// local SQLite database. No data here, only the "shape" of the data.
//
// DEPENDENCY DIRECTION RULE (used everywhere in the app):
//   source_id RELIES ON target_id.
//   Example: { source: Order API, target: Orders Database } means
//   "the Order API needs the Orders Database". So if the database fails,
//   the API (the source) may be affected.

// Controlled lists of allowed values. The CHECK rules below must match these.
export const RESOURCE_TYPES = ['compute', 'storage', 'database', 'network', 'security', 'application'];
export const RESOURCE_STATUSES = ['healthy', 'degraded', 'maintenance'];
export const EVENT_SEVERITIES = ['info', 'warning', 'critical'];
export const EVENT_ORIGINS = ['seed', 'simulation'];

// Removes old tables. Children first (events, dependencies) because they
// point at resources, and resources point at architectures.
export const DROP_TABLES_SQL = `
  DROP TABLE IF EXISTS events;
  DROP TABLE IF EXISTS dependencies;
  DROP TABLE IF EXISTS resources;
  DROP TABLE IF EXISTS architectures;
`;

export const CREATE_TABLES_SQL = `
  -- A fictional reference architecture (a group of resources working together)
  CREATE TABLE IF NOT EXISTS architectures (
    id          TEXT PRIMARY KEY NOT NULL,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,
    complexity  TEXT NOT NULL CHECK (complexity IN ('Beginner', 'Intermediate', 'Advanced')),
    description TEXT NOT NULL
  );

  -- One cloud component (VM, bucket, database, ...). Belongs to one architecture.
  CREATE TABLE IF NOT EXISTS resources (
    id              TEXT PRIMARY KEY NOT NULL,
    architecture_id TEXT NOT NULL REFERENCES architectures(id),
    name            TEXT NOT NULL,
    type            TEXT NOT NULL CHECK (type IN ('compute', 'storage', 'database', 'network', 'security', 'application')),
    status          TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'maintenance')),
    region          TEXT NOT NULL,
    zone            TEXT NOT NULL,
    environment     TEXT NOT NULL,
    description     TEXT NOT NULL,
    attributes_json TEXT NOT NULL DEFAULT '{}'  -- extra properties stored as JSON text
  );

  -- A directed link: source_id relies on target_id.
  CREATE TABLE IF NOT EXISTS dependencies (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id    TEXT NOT NULL REFERENCES resources(id),
    target_id    TEXT NOT NULL REFERENCES resources(id),
    relationship TEXT NOT NULL,
    UNIQUE (source_id, target_id),       -- no duplicate links
    CHECK (source_id <> target_id)       -- a resource cannot depend on itself
  );

  -- Activity history. origin = 'seed' (bundled sample) or 'simulation' (created in the app).
  CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_id TEXT REFERENCES resources(id),
    event_type  TEXT NOT NULL,
    severity    TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    message     TEXT NOT NULL,
    created_at  TEXT NOT NULL,           -- ISO 8601 date-time text
    origin      TEXT NOT NULL CHECK (origin IN ('seed', 'simulation'))
  );

  -- Indexes make lookups on these columns fast (like a book's index).
  CREATE INDEX IF NOT EXISTS idx_resources_architecture ON resources(architecture_id);
  CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
  CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
  CREATE INDEX IF NOT EXISTS idx_dependencies_source ON dependencies(source_id);
  CREATE INDEX IF NOT EXISTS idx_dependencies_target ON dependencies(target_id);
  CREATE INDEX IF NOT EXISTS idx_events_resource ON events(resource_id);
  CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
`;
