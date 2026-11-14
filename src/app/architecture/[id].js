// Screen 2 — Infrastructure Explorer (route: "/architecture/<id>")
// The [id] in the file name is a DYNAMIC segment: whatever comes after
// "/architecture/" in the link becomes the "id" parameter.
// Example: "/architecture/arch-web-01"  ->  id = "arch-web-01"
//
// Shows one architecture as:
//   1. Layers   — its resources grouped by type (network edge -> data)
//   2. Dependency map — every link "A -> relationship -> B" inside it

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import Badge from '../../components/Badge';
import ConceptCard from '../../components/ConceptCard';
import ResourceCard from '../../components/ResourceCard';
import Section from '../../components/Section';
import StateView from '../../components/StateView';
import { CONCEPTS, TYPE_EXPLANATIONS } from '../../constants/explanations';
import { TYPE_ORDER, getComplexityMeta, getTypeMeta } from '../../constants/resourceMeta';
import { getArchitectureById } from '../../services/architectureService';
import { getDependenciesForArchitecture } from '../../services/dependencyService';
import { colors } from '../../theme/colors';

// A resource's role, worked out from its links inside this architecture.
const ROLES = {
  entry: { label: 'Entry point', help: 'nothing here relies on it; requests start here' },
  connector: { label: 'Connector', help: 'relies on others and others rely on it' },
  foundation: { label: 'Foundation', help: 'relies on nothing; others build on it' },
  standalone: { label: 'Standalone', help: 'no links inside this architecture' },
};

function getRole(reliesOn, neededBy) {
  if (reliesOn > 0 && neededBy === 0) return ROLES.entry;
  if (reliesOn > 0 && neededBy > 0) return ROLES.connector;
  if (reliesOn === 0 && neededBy > 0) return ROLES.foundation;
  return ROLES.standalone;
}

export default function InfrastructureExplorerScreen() {
  const { id } = useLocalSearchParams(); // the architecture id from the link
  const db = useSQLiteContext();
  const router = useRouter();

  const [architecture, setArchitecture] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true; // ignore results if the screen was closed meanwhile

    async function load() {
      try {
        const found = await getArchitectureById(db, id); // null if the id is unknown
        const architectureLinks = found ? await getDependenciesForArchitecture(db, id) : [];
        if (isActive) {
          setArchitecture(found);
          setLinks(architectureLinks);
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
  }, [db, id]);

  function openResource(resourceId) {
    router.push(`/resource/${resourceId}`);
  }

  if (loading) {
    return <StateView loading title="Loading architecture…" />;
  }
  if (error) {
    return <StateView title="Could not load this architecture" message={error} />;
  }
  if (!architecture) {
    return (
      <StateView
        title="Architecture not found"
        message={`No architecture with id "${id}" exists in the local dataset.`}
        actionLabel="Open Architecture Library"
        onAction={() => router.navigate('/architectures')}
      />
    );
  }

  // Count, for each resource, how many links go OUT (it relies on) and IN (needed by).
  const reliesOnCount = {};
  const neededByCount = {};
  for (const link of links) {
    reliesOnCount[link.source_id] = (reliesOnCount[link.source_id] ?? 0) + 1;
    neededByCount[link.target_id] = (neededByCount[link.target_id] ?? 0) + 1;
  }

  // Group resources by type, in the TYPE_ORDER layer order.
  const layers = TYPE_ORDER.map((type) => ({
    type,
    resources: architecture.resources.filter((resource) => resource.type === type),
  })).filter((layer) => layer.resources.length > 0);

  // Group links by their source resource for the dependency map.
  const linksBySource = [];
  for (const link of links) {
    let group = linksBySource.find((g) => g.sourceId === link.source_id);
    if (!group) {
      group = { sourceId: link.source_id, sourceName: link.source_name, targets: [] };
      linksBySource.push(group);
    }
    group.targets.push(link);
  }

  // A real link from this architecture, used to explain the arrow direction.
  const exampleLink = links[0] ?? null;

  const complexity = getComplexityMeta(architecture.complexity);
  const regions = [...new Set(architecture.resources.map((r) => r.region))];

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: architecture.name }} />

      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <Text style={styles.category}>{architecture.category}</Text>
          <Badge label={complexity.label} color={complexity.color} />
        </View>
        <Text style={styles.name}>{architecture.name}</Text>
        <Text style={styles.description}>{architecture.description}</Text>
        <View style={styles.stats}>
          <Stat value={architecture.resources.length} label="resources" />
          <Stat value={links.length} label="dependency links" />
          <Stat value={layers.length} label="layers" />
        </View>
        <Text style={styles.meta}>📍 {regions.join(', ')}</Text>
      </View>

      <ConceptCard
        icon="🧱"
        title={CONCEPTS.layers.title}
        simple={CONCEPTS.layers.simple}
        technical={CONCEPTS.layers.technical}
      />

      <Section title="How to read the arrows and roles">
        <View style={styles.arrowBox}>
          <Text style={styles.arrowExample}>
            A <Text style={styles.arrowSymbol}>→</Text> B
          </Text>
          <Text style={styles.legendRow}>
            means <Text style={styles.legendLabel}>A relies on B</Text>. If B fails, A may be affected. The failure
            travels against the arrow.
          </Text>
          {exampleLink ? (
            <Text style={styles.legendRow}>
              Example here: <Text style={styles.legendLabel}>{exampleLink.source_name}</Text> →{' '}
              <Text style={styles.legendLabel}>{exampleLink.target_name}</Text> (“{exampleLink.relationship}”).
            </Text>
          ) : null}
        </View>
        {Object.values(ROLES).map((role) => (
          <Text key={role.label} style={styles.legendRow}>
            <Text style={styles.legendLabel}>{role.label}</Text> — {role.help}
          </Text>
        ))}
      </Section>

      <Text style={styles.heading}>Infrastructure layers</Text>
      <Text style={styles.headingHint}>From where requests arrive (top) down to where data is kept (bottom).</Text>
      {layers.map((layer) => {
        const meta = getTypeMeta(layer.type);
        return (
          <View key={layer.type} style={styles.layer}>
            <Text style={styles.layerTitle}>
              {meta.icon} {meta.label} ({layer.resources.length})
            </Text>
            <Text style={styles.layerHint}>{TYPE_EXPLANATIONS[layer.type]?.simple}</Text>
            {layer.resources.map((resource) => {
              const reliesOn = reliesOnCount[resource.id] ?? 0;
              const neededBy = neededByCount[resource.id] ?? 0;
              const role = getRole(reliesOn, neededBy);
              return (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onPress={() => openResource(resource.id)}
                  extra={`${role.label} · relies on ${reliesOn} · needed by ${neededBy}`}
                />
              );
            })}
          </View>
        );
      })}

      <Section
        title={`Dependency map (${links.length})`}
        subtitle="Each block shows one resource and everything it relies on. Tap any name to open it."
      >
        {linksBySource.length === 0 ? (
          <Text style={styles.muted}>This architecture has no dependency links.</Text>
        ) : (
          linksBySource.map((group) => (
            <View key={group.sourceId} style={styles.mapGroup}>
              <Pressable onPress={() => openResource(group.sourceId)} hitSlop={6} accessibilityRole="button">
                <Text style={styles.mapSource}>{group.sourceName}</Text>
                <Text style={styles.mapSourceHint}>relies on:</Text>
              </Pressable>
              <View style={styles.mapTargets}>
              {group.targets.map((link) => (
                <Pressable
                  key={link.id}
                  onPress={() => openResource(link.target_id)}
                  style={({ pressed }) => [styles.mapLink, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`${group.sourceName} ${link.relationship} ${link.target_name}`}
                >
                  <Text style={styles.arrow}>→</Text>
                  <Text style={styles.mapText}>
                    {link.relationship} <Text style={styles.mapTarget}>{link.target_name}</Text>
                  </Text>
                </Pressable>
              ))}
              </View>
            </View>
          ))
        )}
      </Section>
    </ScrollView>
  );
}

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
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
    gap: 16,
  },
  hero: {
    gap: 8,
  },
  heroHeader: {
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
    fontSize: 24,
    fontWeight: '800',
  },
  description: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
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
  legendRow: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  legendLabel: {
    color: colors.text,
    fontWeight: '700',
  },
  heading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  layer: {
    gap: 10,
  },
  layerTitle: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mapGroup: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  mapSource: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    paddingTop: 4,
  },
  mapSourceHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 2,
  },
  // The vertical line connecting a resource to the resources it relies on
  mapTargets: {
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    marginLeft: 6,
    paddingLeft: 10,
  },
  arrowBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  arrowExample: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  arrowSymbol: {
    color: colors.primary,
  },
  headingHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: -10,
  },
  layerHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: -4,
  },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    minHeight: 36,
  },
  arrow: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  mapText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  mapTarget: {
    color: colors.primary,
    fontWeight: '700',
  },
  muted: {
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
});
