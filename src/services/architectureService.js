// ARCHITECTURE SERVICE — reads the fictional reference architectures.

// All architectures with summary information calculated from their resources.
// LEFT JOIN keeps an architecture even if it had 0 resources;
// GROUP BY makes one result row per architecture, and:
//   COUNT(r.id)                  -> how many resources it has
//   SUM(CASE ...)                -> how many are not healthy
//   GROUP_CONCAT(DISTINCT ...)   -> its regions / types as "a,b,c" text
//   the sub-query                -> how many dependency links start inside it
export async function getArchitectures(db) {
  const rows = await db.getAllAsync(
    `SELECT a.id, a.name, a.category, a.complexity, a.description,
            COUNT(r.id) AS resource_count,
            SUM(CASE WHEN r.status <> 'healthy' THEN 1 ELSE 0 END) AS attention_count,
            GROUP_CONCAT(DISTINCT r.region) AS regions,
            GROUP_CONCAT(DISTINCT r.type) AS types,
            (SELECT COUNT(*)
               FROM dependencies d
               JOIN resources s ON s.id = d.source_id
              WHERE s.architecture_id = a.id) AS dependency_count
     FROM architectures a
     LEFT JOIN resources r ON r.architecture_id = a.id
     GROUP BY a.id
     ORDER BY a.name`
  );

  // Turn "a,b,c" text into arrays the screen can loop over.
  return rows.map((row) => ({
    ...row,
    attention_count: row.attention_count ?? 0,
    regions: row.regions ? row.regions.split(',') : [],
    types: row.types ? row.types.split(',') : [],
  }));
}

// One architecture plus its resources, or null if the id does not exist.
export async function getArchitectureById(db, id) {
  const architecture = await db.getFirstAsync('SELECT * FROM architectures WHERE id = ?', [id]);
  if (!architecture) return null;

  const resources = await db.getAllAsync(
    `SELECT id, name, type, status, region, zone
     FROM resources
     WHERE architecture_id = ?
     ORDER BY type, name`,
    [id]
  );
  return { ...architecture, resources };
}
