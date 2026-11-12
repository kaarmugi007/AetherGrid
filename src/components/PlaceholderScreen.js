// A temporary, reusable screen used during Milestone 1.
// It shows the screen's name, what it will do, and optional buttons
// that navigate to other screens so we can test the navigation.
// Each screen will replace this with real content in later milestones.

import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

export default function PlaceholderScreen({ title, description, milestone, links = [] }) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.milestone}>Coming in {milestone}</Text>
      </View>

      {links.map((link) => (
        // Link + asChild: the Pressable below becomes the tappable link.
        <Link key={link.label} href={link.href} asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>{link.label} →</Text>
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  milestone: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14, // tall enough to be an easy touch target
    paddingHorizontal: 16,
  },
  buttonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
