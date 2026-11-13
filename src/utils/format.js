// Small helpers that turn stored values into friendly text.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-11-12T03:05:00Z" -> "12 Nov 2026, 03:05" (in the phone's local time)
export function formatDate(isoText) {
  const date = new Date(isoText);
  if (Number.isNaN(date.getTime())) return isoText;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${hours}:${minutes}`;
}

// Friendly names for the keys inside a resource's attributes.
const ATTRIBUTE_LABELS = {
  cpu_vcores: 'vCPU cores',
  memory_gb: 'Memory (GB)',
  storage_gb: 'Storage (GB)',
  capacity_gb: 'Capacity (GB)',
  used_gb: 'Used (GB)',
  max_upload_gb: 'Max upload (GB)',
  ttl_seconds: 'Record TTL (seconds)',
  timeout_s: 'Timeout (seconds)',
  replication_lag_s: 'Replication lag (seconds)',
  cache_hit_pct: 'Cache hit rate (%)',
  os: 'Operating system',
  mfa: 'Multi-factor sign-in',
};

// "rule_count" -> "Rule count" (unless a friendlier label exists above)
export function formatAttributeLabel(key) {
  if (ATTRIBUTE_LABELS[key]) return ATTRIBUTE_LABELS[key];
  const words = key.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}
