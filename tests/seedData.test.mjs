// Automated checks for the bundled seed dataset (src/data/seed/*.json).
// They make sure every ID and relationship is consistent BEFORE the app
// ever inserts the data into SQLite. Run with:  npm test

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { explainResource } from '../src/constants/explanations.js';
import { validateSeedData } from '../src/database/seedDatabase.js';

const load = (name) => JSON.parse(readFileSync(new URL(`../src/data/seed/${name}.json`, import.meta.url), 'utf8'));

const architectures = load('architectures');
const resources = load('resources');
const dependencies = load('dependencies');
const events = load('events');

test('dataset has the documented size', () => {
  assert.equal(architectures.length, 4);
  assert.equal(resources.length, 34);
  assert.equal(dependencies.length, 40);
  assert.equal(events.length, 18);
});

test('the app\'s own integrity check finds no problems', () => {
  // Same function initDatabase() runs on first launch.
  assert.deepEqual(validateSeedData({ architectures, resources, dependencies, events }), []);
});

test('architecture and resource ids are unique', () => {
  assert.equal(new Set(architectures.map((a) => a.id)).size, architectures.length);
  assert.equal(new Set(resources.map((r) => r.id)).size, resources.length);
});

test('no duplicate dependency links (matches the UNIQUE rule in the schema)', () => {
  const pairs = dependencies.map((d) => `${d.source_id}->${d.target_id}`);
  assert.equal(new Set(pairs).size, pairs.length);
});

test('every architecture contains at least one resource', () => {
  for (const architecture of architectures) {
    assert.ok(
      resources.some((r) => r.architecture_id === architecture.id),
      `${architecture.id} has no resources`
    );
  }
});

test('dependency links stay inside one architecture', () => {
  // The Simulation Lab lists "not affected" resources per architecture,
  // which is only complete if links never cross architectures.
  const architectureOf = new Map(resources.map((r) => [r.id, r.architecture_id]));
  for (const d of dependencies) {
    assert.equal(architectureOf.get(d.source_id), architectureOf.get(d.target_id), `${d.source_id} -> ${d.target_id}`);
  }
});

test('every resource gets a specific beginner explanation', () => {
  for (const resource of resources) {
    const explanation = explainResource(resource);
    assert.ok(explanation.simple && explanation.title !== resource.type, `${resource.id} uses the generic fallback`);
  }
});
