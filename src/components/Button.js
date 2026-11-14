// One consistent button style for the whole app.
//   variant="primary"   -> filled cyan (main action)
//   variant="secondary" -> outlined (other actions)
//   variant="danger"    -> filled red (the simulated failure)

import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../theme/colors';

export default function Button({ label, onPress, variant = 'primary', disabled = false, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text
        style={[styles.text, variant === 'secondary' ? styles.secondaryText : styles.filledText, disabled && styles.disabledText]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48, // comfortable touch target on Android
  },
  primary: {
    backgroundColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.critical,
  },
  secondary: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
  disabled: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
  filledText: {
    color: colors.background,
  },
  secondaryText: {
    color: colors.primary,
  },
  disabledText: {
    color: colors.textMuted,
  },
});
