// A labelled, horizontally scrolling row of tappable "chips".
// Tapping a chip calls onChange(value). The first chip, "All", sends null
// (meaning "no filter"). Set allowAll={false} for choices like sorting.
// Optional `hint`: a short line explaining what this filter means.

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

export default function FilterChips({ label, hint, options, selected, onChange, allowAll = true }) {
  const chips = allowAll ? [{ value: null, label: 'All' }, ...options] : options;

  return (
    <View style={styles.group}>
      <Text style={styles.label}>
        {label}
        {hint ? <Text style={styles.hint}>{`  ·  ${hint}`}</Text> : null}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {chips.map((chip) => {
          const isSelected = chip.value === selected;
          return (
            <Pressable
              key={String(chip.value)}
              onPress={() => onChange(chip.value)}
              style={[styles.chip, isSelected && styles.chipSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{chip.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 6,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hint: {
    fontWeight: '400',
    textTransform: 'none',
    letterSpacing: 0,
  },
  row: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontSize: 14,
  },
  chipTextSelected: {
    color: colors.background,
    fontWeight: '700',
  },
});
