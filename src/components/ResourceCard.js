// A tappable card summarising one resource: icon, name, type, status,
// region and which architecture it belongs to.

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getTypeMeta } from '../constants/resourceMeta';
import { colors } from '../theme/colors';
import { StatusBadge } from './Badge';

export default function ResourceCard({ resource, onPress }) {
  const type = getTypeMeta(resource.type);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${resource.name}, ${type.label}, ${resource.status}`}
    >
      <Text style={styles.icon}>{type.icon}</Text>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {resource.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {type.label} · {resource.region}
          {resource.architecture_name ? ` · ${resource.architecture_name}` : ''}
        </Text>
        <StatusBadge status={resource.status} />
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
  },
  body: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 26,
  },
});
