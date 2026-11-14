// One component for the three "non-normal" states of a screen:
//   loading  -> spinner + message
//   empty    -> e.g. "No matching resources"
//   error    -> e.g. "Could not load data"
// An optional button (actionLabel + onAction) lets the user recover.

import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import Button from './Button';

export default function StateView({ loading = false, icon, title, message, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" color={colors.primary} />}
      {icon && !loading ? <Text style={styles.icon}>{icon}</Text> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
  },
});
