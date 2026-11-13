// A titled card used to group content on a screen.

import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

export default function Section({ title, subtitle, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.content}>{children}</View>
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
  content: {
    marginTop: 12,
    gap: 10,
  },
});
