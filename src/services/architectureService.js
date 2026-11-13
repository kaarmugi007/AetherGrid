// ARCHITECTURE SERVICE — reads the fictional reference architectures.

// All architectures with how many resources each one contains.
// LEFT JOIN keeps an architecture even if it had 0 resources;
// GROUP BY + COUNT counts the resources per architecture.
export async function getArchitectures(db) {
  return db.getAllAsync(
    `SELECT a.id, a.name, a.category, a.complexity, a.description,
            COUNT(r.id) AS resource_count
     FROM architectures a
     LEFT JOIN resources r ON r.architecture_id = a.id
     GROUP BY a.id
     ORDER BY a.name`
  );
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
