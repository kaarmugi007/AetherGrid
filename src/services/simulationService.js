// SIMULATION SERVICE — the failure-impact calculation.
//
// This is a PURE function: it only uses its inputs (no database, no screen),
// always gives the same answer for the same inputs, and changes nothing.
// That makes it easy to test (see tests/simulationService.test.mjs).
//
// Rule (same as the rest of the app): source_id RELIES ON target_id.
// So when resource B fails, every link whose target_id is B points at a
// resource (its source_id) that may be affected. Those resources may in turn
// break the resources that rely on THEM, and so on.
//
// Algorithm: Breadth-First Search (BFS)
//   1. Put the failed resource in a queue and mark it "visited".
//   2. Take the first resource from the queue. Find every resource that
//      relies on it. Each one not yet visited is "affected": mark it visited,
//      remember how we reached it, and add it to the end of the queue.
//   3. Repeat until the queue is empty.
// BFS checks resources level by level, so "depth" is the shortest number of
// dependency steps from the failure:
//   depth 1 = directly affected, depth 2+ = indirectly affected.
// The visited set guarantees each resource is processed once, so a cycle
// (A relies on B, B relies on A) cannot cause an endless loop.

export function calculateImpact(failedId, dependencies) {
  // Lookup table: resource id -> list of links from resources that rely on it.
  const dependantsOf = new Map();
  for (const dep of dependencies) {
    if (!dependantsOf.has(dep.target_id)) {
      dependantsOf.set(dep.target_id, []);
    }
    dependantsOf.get(dep.target_id).push(dep);
  }

  const visited = new Set([failedId]);
  const queue = [{ id: failedId, path: [failedId] }];
  const affected = [];

  while (queue.length > 0) {
    const current = queue.shift(); // take from the front (first in, first out)

    // Sort so the result is always in the same order (deterministic).
    const links = [...(dependantsOf.get(current.id) ?? [])].sort((a, b) => a.source_id.localeCompare(b.source_id));

    for (const link of links) {
      if (visited.has(link.source_id)) continue; // already counted -> skip

      visited.add(link.source_id);
      const path = [...current.path, link.source_id]; // failed resource ... this resource
      affected.push({
        resourceId: link.source_id,
        depth: path.length - 1,
        viaId: current.id, // the resource it relies on that has failed/been affected
        relationship: link.relationship,
        path,
      });
      queue.push({ id: link.source_id, path });
    }
  }

  return {
    failedId,
    affected,
    direct: affected.filter((item) => item.depth === 1),
    indirect: affected.filter((item) => item.depth > 1),
  };
}

// Turns the number of affected resources into an illustrative impact level.
// (A simple teaching rule, not a real outage prediction.)
export function getImpactSeverity(affectedCount) {
  if (affectedCount === 0) return 'info';
  if (affectedCount <= 2) return 'warning';
  return 'critical';
}
