// Explains one idea at two levels:
//   - the simple explanation is always visible
//   - the technical explanation appears when "Technical view" is tapped
// This keeps screens readable for beginners while keeping the correct
// cloud terminology one tap away.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

export default function ConceptCard({ icon = '💡', title, simple, technical }) {
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.simple}>{simple}</Text>

      {technical ? (
        <>
          <Pressable
            onPress={() => setShowTechnical((open) => !open)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityState={{ expanded: showTechnical }}
          >
            <Text style={styles.toggle}>{showTechnical ? '▾ Hide technical view' : '▸ Technical view'}</Text>
          </Pressable>
          {showTechnical && <Text style={styles.technical}>{technical}</Text>}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  simple: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  toggle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 4,
  },
  technical: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: 10,
  },
});
