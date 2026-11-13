// RESOURCE SERVICE — all SQL for reading resources.
// Screens call these functions; they never write SQL themselves.

// Sorting: column names cannot be "?" placeholders, so we only allow
// ORDER BY clauses from this fixed list (a "whitelist"). Anything else
// falls back to sorting by name, so user input can never reach the SQL.
const SORT_OPTIONS = {
  name: 'r.name COLLATE NOCASE ASC',
  type: 'r.type ASC, r.name COLLATE NOCASE ASC',
  // Resources that need attention (degraded, maintenance) come first.
  status: `CASE r.status WHEN 'degraded' THEN 0 WHEN 'maintenance' THEN 1 ELSE 2 END,
           r.name COLLATE NOCASE ASC`,
};

export const SORT_KEYS = Object.keys(SORT_OPTIONS);

// Search + filter + sort in ONE query.
// Every filter is optional: we only add a WHERE condition when it is set.
export async function getResources(db, { search = '', type = null, status = null, region = null, sortBy = 'name' } = {}) {
  let sql = `
    SELECT r.id, r.name, r.type, r.status, r.region, r.zone, r.environment,
           a.name AS architecture_name
    FROM resources r
    JOIN architectures a ON a.id = r.architecture_id
    WHERE 1 = 1`; // "1 = 1" is always true; it lets us append "AND ..." safely.
  const params = [];

  const term = search.trim();
  if (term) {
    // LIKE '%text%' = "contains text" (case-insensitive for English letters).
    sql += ' AND (r.name LIKE ? OR r.id LIKE ? OR r.description LIKE ?)';
    const pattern = `%${term}%`;
    params.push(pattern, pattern, pattern);
  }
  if (type) {
    sql += ' AND r.type = ?';
    params.push(type);
  }
  if (status) {
    sql += ' AND r.status = ?';
    params.push(status);
  }
  if (region) {
    sql += ' AND r.region = ?';
    params.push(region);
  }

  sql += ` ORDER BY ${SORT_OPTIONS[sortBy] ?? SORT_OPTIONS.name}`;

  return db.getAllAsync(sql, params);
}

// The choices shown in the filter chips come from the data itself,
// so adding a new region to the dataset automatically adds a chip.
export async function getFilterOptions(db) {
  const types = await db.getAllAsync('SELECT DISTINCT type FROM resources ORDER BY type');
  const statuses = await db.getAllAsync('SELECT DISTINCT status FROM resources ORDER BY status');
  const regions = await db.getAllAsync('SELECT DISTINCT region FROM resources ORDER BY region');
  return {
    types: types.map((row) => row.type),
    statuses: statuses.map((row) => row.status),
    regions: regions.map((row) => row.region),
  };
}

// One resource with all its details, or null if the id does not exist.
export async function getResourceById(db, id) {
  const row = await db.getFirstAsync(
    `SELECT r.*, a.name AS architecture_name
     FROM resources r
     JOIN architectures a ON a.id = r.architecture_id
     WHERE r.id = ?`,
    [id]
  );
  if (!row) return null;

  // attributes_json is stored as text; turn it back into a JS object.
  let attributes = {};
  try {
    attributes = JSON.parse(row.attributes_json);
  } catch {
    attributes = {};
  }
  return { ...row, attributes };
}
