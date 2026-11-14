// Screen 1 — Ecosystem Dashboard (route: "/")
// Every number here is calculated by SQLite from the local dataset.

import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import ConceptCard from '../../components/ConceptCard';
import EventRow from '../../components/EventRow';
import Section from '../../components/Section';
import StateView from '../../components/StateView';
import { StatusBadge } from '../../components/Badge';
import { CONCEPTS, COUNT_HINTS } from '../../constants/explanations';
import { getStatusMeta, getTypeMeta } from '../../constants/resourceMeta';
import { getDashboardStats } from '../../services/dashboardService';
import { getRecentEvents } from '../../services/eventService';
import { colors } from '../../theme/colors';

export default function DashboardScreen() {
  const db = useSQLiteContext(); // the open database from SQLiteProvider
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [error, setError] = useState(null);

  // useFocusEffect runs every time this tab becomes visible,
  // so the numbers are always fresh (e.g. after a simulation adds events).
  useFocusEffect(
    useCallback(() => {
      let isActive = true; // ignore results if the user already left the screen

      async function load() {
        try {
          const dashboardStats = await getDashboardStats(db);
          const events = await getRecentEvents(db, 5);
          if (isActive) {
            setStats(dashboardStats);
            setRecentEvents(events);
            setError(null);
          }
        } catch (e) {
          if (isActive) setError(e.message);
        }
      }

      load();
      return () => {
        isActive = false;
      };
    }, [db])
  );

  // Open the Catalogue tab with a filter already applied.
  // "ts" (a timestamp) makes each tap a new request, even for the same filter.
  function openCatalogue(filter = {}) {
    router.navigate({ pathname: '/catalogue', params: { ...filter, ts: Date.now() } });
  }

  if (error) {
    return <StateView title="Could not load the dashboard" message={error} />;
  }
  if (!stats) {
    return <StateView loading title="Loading local data…" />;
  }

  const { totals, byType, byStatus, healthPercent } = stats;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.brand}>AetherGrid</Text>
        <Text style={styles.tagline}>Where the Digital Universe Connects.</Text>
        <Text style={styles.disclaimer}>
          AetherGrid helps you learn how cloud applications are built. Explore a fictional cloud ecosystem, see how its
          parts rely on each other, and safely simulate what happens when one of them fails. Everything runs offline on
          this device, and all statuses and events are sample data.
        </Text>
      </View>

      {/* A clear starting point for first-time users */}
      <View style={styles.startCard}>
        <Text style={styles.startTitle}>Start exploring</Text>
        <StartStep number="1" text="Pick an example architecture in the Library." />
        <StartStep number="2" text="Open its resources to see what each part does." />
        <StartStep number="3" text="Break one in the Simulation Lab and watch the impact spread." />
        <Button label="Browse architectures →" onPress={() => router.navigate('/architectures')} />
        <Button label="⚡ Try a failure simulation" variant="secondary" onPress={() => router.navigate('/simulation')} />
      </View>

      {/* Four headline numbers, each with a short explanation */}
      <Text style={styles.heading}>This ecosystem at a glance</Text>
      <View style={styles.tiles}>
        <StatTile
          label="Resources"
          hint={COUNT_HINTS.resources}
          value={totals.resources}
          onPress={() => openCatalogue()}
        />
        <StatTile
          label="Architectures"
          hint={COUNT_HINTS.architectures}
          value={totals.architectures}
          onPress={() => router.navigate('/architectures')}
        />
        <StatTile label="Dependencies" hint={COUNT_HINTS.dependencies} value={totals.dependencies} />
        <StatTile
          label="Events"
          hint={COUNT_HINTS.events}
          value={totals.events}
          onPress={() => router.navigate('/activity')}
        />
      </View>

      <Section title="Simulated health" subtitle={`${healthPercent}% of resources are healthy`}>
        {byStatus.map((row) => {
          const meta = getStatusMeta(row.status);
          const percent = totals.resources > 0 ? (row.count / totals.resources) * 100 : 0;
          return (
            <Pressable key={row.status} onPress={() => openCatalogue({ status: row.status })} style={styles.barRow}>
              <View style={styles.barHeader}>
                <StatusBadge status={row.status} />
                <Text style={styles.count}>{row.count}</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: meta.color }]} />
              </View>
            </Pressable>
          );
        })}
      </Section>

      <Section title="Resources by type" subtitle="Tap a type to browse it in the catalogue">
        {byType.map((row) => {
          const meta = getTypeMeta(row.type);
          return (
            <Pressable
              key={row.type}
              onPress={() => openCatalogue({ type: row.type })}
              style={({ pressed }) => [styles.typeRow, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.typeIcon}>{meta.icon}</Text>
              <Text style={styles.typeLabel}>{meta.label}</Text>
              <Text style={styles.count}>{row.count}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          );
        })}
      </Section>

      <Section title="Recent sample activity" subtitle="Latest events from the local activity history">
        {recentEvents.length === 0 ? (
          <Text style={styles.muted}>No events recorded yet.</Text>
        ) : (
          recentEvents.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              onPress={event.resource_id ? () => router.push(`/resource/${event.resource_id}`) : undefined}
            />
          ))
        )}
      </Section>

      <Text style={styles.heading}>New to cloud? Key ideas</Text>
      {['architecture', 'resource', 'dependency'].map((key) => (
        <ConceptCard
          key={key}
          title={CONCEPTS[key].title}
          simple={CONCEPTS[key].simple}
          technical={CONCEPTS[key].technical}
        />
      ))}
    </ScrollView>
  );
}

// A single number tile with a short explanation. Tappable only when onPress is given.
function StatTile({ label, hint, value, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>
        {label}
        {onPress ? ' ›' : ''}
      </Text>
      <Text style={styles.tileHint}>{hint}</Text>
    </Pressable>
  );
}

function StartStep({ number, text }) {
  return (
    <View style={styles.startStep}>
      <View style={styles.startNumber}>
        <Text style={styles.startNumberText}>{number}</Text>
      </View>
      <Text style={styles.startText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  intro: {
    gap: 4,
  },
  brand: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '45%', // two tiles per row
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  tileValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  tileLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  tileHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  heading: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  startCard: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  startTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  startStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  startNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.primary,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startNumberText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  startText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  barRow: {
    gap: 6,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    minHeight: 44, // comfortable touch target
  },
  typeIcon: {
    fontSize: 20,
  },
  typeLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  count: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 22,
  },
  muted: {
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
});
