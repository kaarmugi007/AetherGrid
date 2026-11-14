// A section that can be opened and closed. Used for detailed technical
// information so it does not overwhelm the screen until the user wants it.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

export default function Collapsible({ title, subtitle, initiallyOpen = false, children }) {
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <View style={styles.section}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Text style={styles.chevron}>{open ? '▾' : '▸'}</Text>
      </Pressable>
      {open && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 32,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    color: colors.primary,
    fontSize: 18,
  },
  content: {
    marginTop: 12,
    gap: 10,
  },
});
