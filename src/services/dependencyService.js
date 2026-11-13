// DEPENDENCY SERVICE — reads the links between resources.
// Remember the rule: source_id RELIES ON target_id.

// For one resource, return both directions:
//   dependsOn = what THIS resource needs        (rows where it is the source)
//   usedBy    = what needs THIS resource        (rows where it is the target)
export async function getDependencies(db, resourceId) {
  const dependsOn = await db.getAllAsync(
    `SELECT d.id, d.relationship,
            r.id AS resource_id, r.name, r.type, r.status
     FROM dependencies d
     JOIN resources r ON r.id = d.target_id
     WHERE d.source_id = ?
     ORDER BY r.name`,
    [resourceId]
  );

  const usedBy = await db.getAllAsync(
    `SELECT d.id, d.relationship,
            r.id AS resource_id, r.name, r.type, r.status
     FROM dependencies d
     JOIN resources r ON r.id = d.source_id
     WHERE d.target_id = ?
     ORDER BY r.name`,
    [resourceId]
  );

  return { dependsOn, usedBy };
}

// Every link inside one architecture (used by the Infrastructure Explorer
// and the Failure Simulation Lab in the next milestones).
export async function getDependenciesForArchitecture(db, architectureId) {
  return db.getAllAsync(
    `SELECT d.id, d.source_id, d.target_id, d.relationship,
            s.name AS source_name, t.name AS target_name
     FROM dependencies d
     JOIN resources s ON s.id = d.source_id
     JOIN resources t ON t.id = d.target_id
     WHERE s.architecture_id = ?
     ORDER BY s.name, t.name`,
    [architectureId]
  );
}
