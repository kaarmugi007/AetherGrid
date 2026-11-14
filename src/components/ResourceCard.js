// A tappable card summarising one resource. Clear visual order:
//   1. name (largest) + status badge
//   2. type chip (what kind of component it is)
//   3. where it lives (region · architecture)
// Optional `extra`: one more line of text (e.g. dependency information).

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getStatusMeta, getTypeMeta } from '../constants/resourceMeta';
import { colors } from '../theme/colors';
import { StatusBadge } from './Badge';

export default function ResourceCard({ resource, onPress, extra }) {
  const type = getTypeMeta(resource.type);
  const status = getStatusMeta(resource.status);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${resource.name}, ${type.label}, ${status.label}`}
    >
      <Text style={styles.icon}>{type.icon}</Text>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={2}>
            {resource.name}
          </Text>
          <StatusBadge status={resource.status} />
        </View>
        <View style={styles.typeChip}>
          <Text style={styles.typeText}>{type.label}</Text>
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          📍 {resource.region}
          {resource.architecture_name ? ` · ${resource.architecture_name}` : ''}
        </Text>
        {extra ? <Text style={styles.extra}>{extra}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 26,
    alignSelf: 'flex-start',
  },
  body: {
    flex: 1,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  typeChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  extra: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 26,
  },
});
