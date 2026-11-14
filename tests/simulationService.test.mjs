// Automated tests for the failure-impact calculation.
// Uses Node's built-in test runner (no extra library). Run with:  npm test

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { calculateImpact, getImpactSeverity } from '../src/services/simulationService.js';

// The real seed dataset, so the tests check the data the app actually uses.
const dependencies = JSON.parse(readFileSync(new URL('../src/data/seed/dependencies.json', import.meta.url), 'utf8'));

const ids = (items) => items.map((item) => item.resourceId).sort();

test('a resource nothing relies on affects nobody', () => {
  const result = calculateImpact('res-web-dns', dependencies);
  assert.deepEqual(result.affected, []);
});

test('failing the orders database spreads up the whole storefront chain', () => {
  const result = calculateImpact('res-web-db', dependencies);
  // Direct: the two resources whose links point straight at the database.
  assert.deepEqual(ids(result.direct), ['res-web-api', 'res-web-dbr']);
  // Indirect: everything that relies on those, level by level.
  assert.deepEqual(ids(result.indirect), ['res-web-dns', 'res-web-fe1', 'res-web-fe2', 'res-web-lb', 'res-web-waf']);
});

test('depth is the SHORTEST number of steps and paths start at the failure', () => {
  const result = calculateImpact('res-web-db', dependencies);
  const lb = result.affected.find((item) => item.resourceId === 'res-web-lb');
  assert.equal(lb.depth, 3); // db -> api -> frontend -> load balancer
  assert.equal(lb.path[0], 'res-web-db');
  assert.equal(lb.path[lb.path.length - 1], 'res-web-lb');
  assert.equal(lb.path.length, lb.depth + 1);
});

test('each affected resource is listed once even when reachable many ways', () => {
  // The API relies on db AND on the replica (which relies on db): two routes.
  const result = calculateImpact('res-web-db', dependencies);
  const unique = new Set(result.affected.map((item) => item.resourceId));
  assert.equal(unique.size, result.affected.length);
  assert.ok(!unique.has('res-web-db'), 'the failed resource is not counted as affected');
});

test('a dependency cycle does not cause an infinite loop', () => {
  // A relies on B, B relies on C, C relies on A  (a loop)
  const cycle = [
    { source_id: 'A', target_id: 'B', relationship: 'uses' },
    { source_id: 'B', target_id: 'C', relationship: 'uses' },
    { source_id: 'C', target_id: 'A', relationship: 'uses' },
  ];
  const result = calculateImpact('A', cycle);
  assert.deepEqual(ids(result.direct), ['C']);
  assert.deepEqual(ids(result.indirect), ['B']);
  assert.equal(result.affected.length, 2);
});

test('the result is deterministic (same input -> same output)', () => {
  assert.deepEqual(calculateImpact('res-med-kms', dependencies), calculateImpact('res-med-kms', dependencies));
});

test('the input data is not modified', () => {
  const before = JSON.stringify(dependencies);
  calculateImpact('res-web-vnet', dependencies);
  assert.equal(JSON.stringify(dependencies), before);
});

test('impact severity levels', () => {
  assert.equal(getImpactSeverity(0), 'info');
  assert.equal(getImpactSeverity(2), 'warning');
  assert.equal(getImpactSeverity(3), 'critical');
});
