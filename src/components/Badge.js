// A small coloured label with a dot + text.
// Text is always shown, so meaning never depends on colour alone (accessibility).

import { StyleSheet, Text, View } from 'react-native';

import { getSeverityMeta, getStatusMeta } from '../constants/resourceMeta';

export default function Badge({ label, color }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

export function StatusBadge({ status }) {
  const meta = getStatusMeta(status);
  return <Badge label={meta.label} color={meta.color} />;
}

export function SeverityBadge({ severity }) {
  const meta = getSeverityMeta(severity);
  return <Badge label={meta.label} color={meta.color} />;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
