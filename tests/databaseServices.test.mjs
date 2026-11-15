// Integration tests for the SQL in src/services/*.js.
// They build a real SQLite database in memory with the app's own schema and
// seed data, then call the same service functions the screens use.
//
// Node.js has SQLite built in (node:sqlite), so no extra package is needed.
// A tiny adapter below gives it the same async methods as expo-sqlite
// (execAsync, getAllAsync, ...), so the services run unchanged.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { beforeEach, test } from 'node:test';

import { CREATE_TABLES_SQL } from '../src/database/schema.js';
import { insertSeedData } from '../src/database/seedDatabase.js';
import { getArchitectureById, getArchitectures } from '../src/services/architectureService.js';
import { getDashboardStats } from '../src/services/dashboardService.js';
import { getAllDependencies, getDependencies } from '../src/services/dependencyService.js';
import {
  addSimulationEvent,
  clearSimulationEvents,
  getEvents,
  getSimulationEventCount,
} from '../src/services/eventService.js';
import { getFilterOptions, getResourceById, getResources } from '../src/services/resourceService.js';

class TestDatabase {
  constructor() {
    this.db = new DatabaseSync(':memory:');
  }
  async execAsync(sql) {
    this.db.exec(sql);
  }
  async getFirstAsync(sql, params = []) {
    return this.db.prepare(sql).get(...params);
  }
  async getAllAsync(sql, params = []) {
    return this.db.prepare(sql).all(...params);
  }
  async runAsync(sql, params = []) {
    return this.db.prepare(sql).run(...params);
  }
}

const load = (name) => JSON.parse(readFileSync(new URL(`../src/data/seed/${name}.json`, import.meta.url), 'utf8'));
const seed = {
  architectures: load('architectures'),
  resources: load('resources'),
  dependencies: load('dependencies'),
  events: load('events'),
};

let db;
beforeEach(async () => {
  db = new TestDatabase();
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(CREATE_TABLES_SQL);
  await insertSeedData(db, seed);
});

test('dashboard statistics are calculated from the data', async () => {
  const stats = await getDashboardStats(db);
  assert.deepEqual({ ...stats.totals }, { resources: 34, architectures: 4, dependencies: 40, events: 18 });
  assert.equal(stats.healthPercent, 85); // 29 of 34 healthy
});

test('search, filters and sorting', async () => {
  assert.equal((await getResources(db)).length, 34);
  assert.equal((await getResources(db, { search: 'database' })).length, 6);
  assert.equal((await getResources(db, { search: 'zzzz' })).length, 0);
  const combo = await getResources(db, { type: 'compute', status: 'degraded' });
  assert.equal(combo.length, 3);
  assert.ok(combo.every((r) => r.type === 'compute' && r.status === 'degraded'));
  assert.equal((await getResources(db, { region: 'aether-east-2' })).length, 9);
  assert.equal((await getResources(db, { sortBy: 'status' }))[0].status, 'degraded');
  const options = await getFilterOptions(db);
  assert.equal(options.types.length, 6);
  assert.equal(options.regions.length, 3);
});

test('search text is passed safely as a parameter (no SQL injection)', async () => {
  assert.equal((await getResources(db, { search: "'; DROP TABLE resources; --" })).length, 0);
  assert.equal((await getResources(db, { sortBy: 'name; DROP TABLE resources' })).length, 34); // unknown sort -> default
});

test('resource details and both dependency directions', async () => {
  const api = await getResourceById(db, 'res-web-api');
  assert.equal(api.architecture_name, 'Nebula Storefront');
  assert.equal(api.attributes.instances, 3); // JSON text parsed back into an object
  assert.equal(await getResourceById(db, 'does-not-exist'), null);

  const { dependsOn, usedBy } = await getDependencies(db, 'res-web-api');
  assert.equal(dependsOn.length, 5); // the API relies on 5 resources
  assert.deepEqual(usedBy.map((d) => d.resource_id).sort(), ['res-web-fe1', 'res-web-fe2']);
  assert.equal((await getAllDependencies(db)).length, 40);
});

test('architecture summaries and explorer data', async () => {
  const architectures = await getArchitectures(db);
  assert.equal(architectures.length, 4);
  assert.equal(architectures.reduce((n, a) => n + a.resource_count, 0), 34);
  assert.equal(architectures.reduce((n, a) => n + a.dependency_count, 0), 40);
  const web = await getArchitectureById(db, 'arch-web-01');
  assert.equal(web.resources.length, 12);
  assert.equal(await getArchitectureById(db, 'missing'), null);
});

test('database rules reject invalid data', async () => {
  await assert.rejects(
    db.runAsync(
      "INSERT INTO resources (id, architecture_id, name, type, status, region, zone, environment, description) VALUES ('x', 'arch-web-01', 'x', 'spaceship', 'healthy', 'r', 'z', 'e', 'd')"
    )
  ); // CHECK: invalid type
  await assert.rejects(
    db.runAsync("INSERT INTO dependencies (source_id, target_id, relationship) VALUES ('res-web-api', 'missing', 'x')")
  ); // FOREIGN KEY: unknown resource
});

test('simulation events are stored, filtered and cleared without touching sample data', async () => {
  const statusesBefore = (await getDashboardStats(db)).byStatus;

  await addSimulationEvent(db, { resourceId: 'res-web-db', severity: 'critical', message: 'test run' });
  assert.equal(await getSimulationEventCount(db), 1);
  const [newest] = await getEvents(db);
  assert.equal(newest.origin, 'simulation');
  assert.equal(newest.resource_name, 'Orders Database (Primary)');
  assert.equal((await getEvents(db, { origin: 'seed' })).length, 18);

  // A simulation never changes resource statuses.
  assert.deepEqual((await getDashboardStats(db)).byStatus, statusesBefore);

  await clearSimulationEvents(db);
  assert.equal(await getSimulationEventCount(db), 0);
  assert.equal((await getEvents(db)).length, 18); // all sample events kept
});
