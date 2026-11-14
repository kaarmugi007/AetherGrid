// Screen 7 — Activity Centre (route: "/activity")
// The local event history: seeded sample events plus events created by the
// Failure Simulation Lab. This is a stored history, NOT live monitoring.

import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import Badge from '../../components/Badge';
import ConceptCard from '../../components/ConceptCard';
import EventRow from '../../components/EventRow';
import FilterChips from '../../components/FilterChips';
import ScreenIntro from '../../components/ScreenIntro';
import StateView from '../../components/StateView';
import { CONCEPTS } from '../../constants/explanations';
import { SEVERITY_META } from '../../constants/resourceMeta';
import {
  clearSimulationEvents,
  getEventFilterOptions,
  getEvents,
  getSimulationEventCount,
} from '../../services/eventService';
import { colors } from '../../theme/colors';
import { capitalize } from '../../utils/format';

const ORIGIN_OPTIONS = [
  { value: 'seed', label: 'Sample data' },
  { value: 'simulation', label: 'Simulations' },
];

// Everything this screen needs, in one helper (used on focus and after clearing).
async function fetchActivity(db, filters) {
  const events = await getEvents(db, filters);
  const options = await getEventFilterOptions(db);
  const simulationCount = await getSimulationEventCount(db);
  return { events, eventTypes: options.eventTypes, simulationCount };
}

export default function ActivityScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  const [severity, setSeverity] = useState(null);
  const [eventType, setEventType] = useState(null);
  const [origin, setOrigin] = useState(null);

  const [events, setEvents] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [simulationCount, setSimulationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function showActivity(data) {
    setEvents(data.events);
    setEventTypes(data.eventTypes);
    setSimulationCount(data.simulationCount);
    setError(null);
  }

  // Runs when the tab is opened AND whenever a filter changes, so events
  // created in the Simulation Lab appear as soon as you come here.
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      fetchActivity(db, { severity, eventType, origin })
        .then((data) => {
          if (isActive) {
            setEvents(data.events);
            setEventTypes(data.eventTypes);
            setSimulationCount(data.simulationCount);
            setError(null);
          }
        })
        .catch((e) => {
          if (isActive) setError(e.message);
        })
        .finally(() => {
          if (isActive) setLoading(false);
        });

      return () => {
        isActive = false;
      };
    }, [db, severity, eventType, origin])
  );

  const hasActiveFilters = severity !== null || eventType !== null || origin !== null;

  function clearFilters() {
    setSeverity(null);
    setEventType(null);
    setOrigin(null);
  }

  // Delete ONLY simulation events (sample events are kept), then refresh.
  async function clearHistory() {
    try {
      await clearSimulationEvents(db);
      showActivity(await fetchActivity(db, { severity, eventType, origin }));
    } catch (e) {
      setError(e.message);
    }
  }

  // Ask first. On Android/iOS we use a native Alert with buttons; in a web
  // browser Alert buttons are not supported, so we use the browser's confirm().
  function confirmClearHistory() {
    const title = 'Clear simulation history?';
    const message = `This removes the ${simulationCount} event(s) created by your simulations. Sample events are kept.`;

    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) {
        clearHistory();
      }
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearHistory },
    ]);
  }

  const severityOptions = Object.entries(SEVERITY_META).map(([value, meta]) => ({ value, label: meta.label }));
  const typeOptions = eventTypes.map((type) => ({ value: type, label: capitalize(type) }));

  const header = (
    <View style={styles.header}>
      <ScreenIntro text="A history log of things that happened to resources: the fictional sample events that come with the app, plus every failure simulation you run. This is a stored history, not live monitoring. Tap an event to open its resource." />
      <ConceptCard icon="📜" title={CONCEPTS.event.title} simple={CONCEPTS.event.simple} technical={CONCEPTS.event.technical} />

      <View style={styles.key}>
        <View style={styles.keyRow}>
          <Badge label="Sample" color={colors.textMuted} />
          <Text style={styles.keyText}>bundled example event</Text>
        </View>
        <View style={styles.keyRow}>
          <Badge label="Simulation" color={colors.accent} />
          <Text style={styles.keyText}>created by your Simulation Lab runs</Text>
        </View>
        <Text style={styles.keyText}>
          Severity: <Text style={styles.keyLabel}>Info</Text> = routine ·{' '}
          <Text style={styles.keyLabel}>Warning</Text> = worth a look · <Text style={styles.keyLabel}>Critical</Text> =
          serious (all fictional)
        </Text>
      </View>

      <FilterChips
        label="Severity"
        hint="how serious"
        options={severityOptions}
        selected={severity}
        onChange={setSeverity}
      />
      <FilterChips
        label="Category"
        hint="what kind of event"
        options={typeOptions}
        selected={eventType}
        onChange={setEventType}
      />
      <FilterChips label="Source" hint="where it came from" options={ORIGIN_OPTIONS} selected={origin} onChange={setOrigin} />

      <View style={styles.resultBar}>
        <Text style={styles.resultText}>
          {events.length} {events.length === 1 ? 'event' : 'events'}
        </Text>
        {hasActiveFilters && (
          <Pressable onPress={clearFilters} hitSlop={8} accessibilityRole="button">
            <Text style={styles.link}>Clear filters</Text>
          </Pressable>
        )}
      </View>

      {simulationCount > 0 && (
        <Pressable onPress={confirmClearHistory} style={styles.clearHistory} accessibilityRole="button">
          <Text style={styles.clearHistoryText}>Clear simulation history ({simulationCount})</Text>
        </Pressable>
      )}
    </View>
  );

  if (error) {
    return <StateView title="Could not load activity" message={error} />;
  }

  return (
    <FlatList
      style={styles.page}
      contentContainerStyle={styles.content}
      data={events}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <EventRow
          event={item}
          // Only tappable when the event points to a resource.
          onPress={item.resource_id ? () => router.push(`/resource/${item.resource_id}`) : undefined}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        loading ? (
          <StateView loading title="Loading activity…" />
        ) : (
          <StateView
            icon="📭"
            title="No matching events"
            message={
              hasActiveFilters
                ? 'No events match this combination of filters. Try removing one, or clear them all.'
                : 'No events are stored yet. Run a simulation in the Simulation Lab to create one.'
            }
            actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
            onAction={hasActiveFilters ? clearFilters : undefined}
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    flexGrow: 1,
  },
  header: {
    gap: 14,
    marginBottom: 14,
  },
  key: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keyText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  keyLabel: {
    color: colors.text,
    fontWeight: '700',
  },
  resultBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  link: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  clearHistory: {
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearHistoryText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  separator: {
    height: 10,
  },
});
