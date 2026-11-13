// DASHBOARD SERVICE — summary numbers calculated by SQLite from the data.
// Nothing here is typed in by hand: change the dataset and these change too.

export async function getDashboardStats(db) {
  const totals = await db.getFirstAsync(
    `SELECT
       (SELECT COUNT(*) FROM resources)     AS resources,
       (SELECT COUNT(*) FROM architectures) AS architectures,
       (SELECT COUNT(*) FROM dependencies)  AS dependencies,
       (SELECT COUNT(*) FROM events)        AS events`
  );

  // GROUP BY puts rows with the same type together; COUNT(*) counts each group.
  const byType = await db.getAllAsync(
    'SELECT type, COUNT(*) AS count FROM resources GROUP BY type ORDER BY count DESC, type'
  );

  const byStatus = await db.getAllAsync(
    `SELECT status, COUNT(*) AS count FROM resources GROUP BY status
     ORDER BY CASE status WHEN 'healthy' THEN 0 WHEN 'degraded' THEN 1 ELSE 2 END`
  );

  const healthy = byStatus.find((row) => row.status === 'healthy')?.count ?? 0;
  const healthPercent = totals.resources > 0 ? Math.round((healthy / totals.resources) * 100) : 0;

  return { totals, byType, byStatus, healthPercent };
}
