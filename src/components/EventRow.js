// One activity event: severity, message, related resource and date.
// Tappable when onPress is given (e.g. to open the related resource).

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { capitalize, formatDate } from '../utils/format';
import Badge, { SeverityBadge } from './Badge';

export default function EventRow({ event, onPress }) {
  const isSimulation = event.origin === 'simulation';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, isSimulation && styles.simulationRow, pressed && styles.pressed]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={styles.header}>
        <SeverityBadge severity={event.severity} />
        {/* Where the event came from: bundled sample data or a simulation run */}
        <Badge
          label={isSimulation ? 'Simulation' : 'Sample'}
          color={isSimulation ? colors.accent : colors.textMuted}
        />
        <Text style={styles.type}>{capitalize(event.event_type)}</Text>
      </View>
      <Text style={styles.message}>{event.message}</Text>
      <Text style={styles.meta}>
        {event.resource_name ? `${event.resource_name} · ` : ''}
        {formatDate(event.created_at)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  simulationRow: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  type: {
    color: colors.textMuted,
    fontSize: 12,
  },
  message: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
