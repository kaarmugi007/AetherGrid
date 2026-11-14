// The short heading + explanation at the top of a screen,
// so a first-time user immediately knows what the screen is for.

import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

export default function ScreenIntro({ eyebrow, title, text }) {
  return (
    <View style={styles.container}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  text: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
