// Display information (labels, icons, colours) for the controlled values
// stored in the database. This is NOT data — the actual resources, counts
// and events always come from SQLite. This file only says how to show them.

import { colors } from '../theme/colors';

export const TYPE_META = {
  compute: { label: 'Compute', icon: '🖥️' },
  storage: { label: 'Storage', icon: '🗄️' },
  database: { label: 'Database', icon: '🛢️' },
  network: { label: 'Network', icon: '🌐' },
  security: { label: 'Security', icon: '🔐' },
  application: { label: 'Application', icon: '⚙️' },
};

export const STATUS_META = {
  healthy: { label: 'Healthy', color: colors.healthy },
  degraded: { label: 'Degraded', color: colors.degraded },
  maintenance: { label: 'Maintenance', color: colors.maintenance },
};

export const SEVERITY_META = {
  info: { label: 'Info', color: colors.info },
  warning: { label: 'Warning', color: colors.degraded },
  critical: { label: 'Critical', color: colors.critical },
};

export const SORT_LABELS = {
  name: 'Name',
  type: 'Type',
  status: 'Needs attention',
};

// Safe lookups: if the database ever contains an unknown value,
// show it as plain text instead of crashing.
export function getTypeMeta(type) {
  return TYPE_META[type] ?? { label: type, icon: '▫️' };
}

export function getStatusMeta(status) {
  return STATUS_META[status] ?? { label: status, color: colors.textMuted };
}

export function getSeverityMeta(severity) {
  return SEVERITY_META[severity] ?? { label: severity, color: colors.textMuted };
}
