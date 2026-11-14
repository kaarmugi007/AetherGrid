// Screen 6 — Architecture Library (route: "/architectures")
// Lists every fictional reference architecture stored in SQLite.
// Tapping a card opens its Infrastructure Explorer ("/architecture/<id>").

import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import Badge from '../../components/Badge';
import ConceptCard from '../../components/ConceptCard';
import ScreenIntro from '../../components/ScreenIntro';
import StateView from '../../components/StateView';
import { CONCEPTS } from '../../constants/explanations';
import { getComplexityMeta, getTypeMeta } from '../../constants/resourceMeta';
import { getArchitectures } from '../../services/architectureService';
import { colors } from '../../theme/colors';

export default function ArchitecturesScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [architectures, setArchitectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0); // increases when "Try again" is pressed

  // Load once when the screen opens (and again after "Try again").
  useEffect(() => {
    let isActive = true; // ignore results if the screen was closed meanwhile

    async function load() {
      try {
        const rows = await getArchitectures(db);
        if (isActive) {
          setArchitectures(rows);
          setError(null);
        }
      } catch (e) {
        if (isActive) setError(e.message);
      } finally {
        if (isActive) setLoading(false);
      }
    }

    load();
    return () => {
      isActive = false;
    };
  }, [db, attempt]);

  function retry() {
    setLoading(true);
    setError(null);
    setAttempt((n) => n + 1);
  }

  if (loading) {
    return <StateView loading title="Loading architectures…" />;
  }
  if (error) {
    return <StateView title="Could not load architectures" message={error} actionLabel="Try again" onAction={retry} />;
  }

  return (
    <FlatList
      style={styles.page}
      contentContainerStyle={styles.content}
      data={architectures}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <ScreenIntro text="Each architecture below is a complete example application: a collection of cloud resources connected to each other. Open one to see its parts grouped into layers and how they rely on each other." />
          <ConceptCard
            icon="🏛️"
            title={CONCEPTS.architecture.title}
            simple={CONCEPTS.architecture.simple}
            technical={CONCEPTS.architecture.technical}
          />
          <View style={styles.key}>
            <Text style={styles.keyText}>
              <Text style={styles.keyLabel}>Resources</Text> = building blocks in it ·{' '}
              <Text style={styles.keyLabel}>Connections</Text> = links where one part relies on another ·{' '}
              <Text style={styles.keyLabel}>Need attention</Text> = sample status is degraded or in maintenance
            </Text>
            <Text style={styles.keyText}>
              <Text style={styles.keyLabel}>Complexity</Text>: Beginner (few parts) → Intermediate → Advanced (many
              connected parts)
            </Text>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <ArchitectureCard architecture={item} onPress={() => router.push(`/architecture/${item.id}`)} />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <StateView title="No architectures found" message="The local dataset does not contain any architectures." />
      }
    />
  );
}

// One architecture card.
function ArchitectureCard({ architecture, onPress }) {
  const complexity = getComplexityMeta(architecture.complexity);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { borderLeftColor: complexity.color }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${architecture.name}, ${architecture.category}, ${architecture.resource_count} resources`}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.category}>{architecture.category}</Text>
        <Badge label={complexity.label} color={complexity.color} />
      </View>

      <Text style={styles.name}>{architecture.name}</Text>
      <Text style={styles.description} numberOfLines={3}>
        {architecture.description}
      </Text>

      {/* Numbers calculated by SQLite in getArchitectures() */}
      <View style={styles.stats}>
        <Stat value={architecture.resource_count} label="resources" />
        <Stat value={architecture.dependency_count} label="connections" />
        <Stat
          value={architecture.attention_count}
          label="need attention"
          color={architecture.attention_count > 0 ? colors.degraded : colors.healthy}
        />
      </View>

      <Text style={styles.meta}>📍 {architecture.regions.join(', ') || 'No region'}</Text>
      <Text style={styles.meta}>
        {architecture.types.map((type) => getTypeMeta(type).icon).join('  ')}
      </Text>

      <Text style={styles.explore}>Explore architecture ›</Text>
    </Pressable>
  );
}

function Stat({ value, label, color = colors.text }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
    flexGrow: 1,
  },
  header: {
    gap: 12,
    marginBottom: 14,
  },
  key: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    gap: 6,
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
  separator: {
    height: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  pressed: {
    opacity: 0.75,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  category: {
    flexShrink: 1,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 4,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  explore: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
});
