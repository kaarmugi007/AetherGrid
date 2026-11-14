// Screen 4 — Resource Details + Dependency Explorer (route: "/resource/<id>")
// Explains one resource in beginner-friendly steps:
//   What is this?  ->  What does it do?  ->  Why does it matter?
//   ->  What does it depend on?  ->  What depends on it?
// Technical properties are kept in a collapsible section.
// Tapping a related resource opens ITS detail screen on top of this one,
// so the user can "walk" along the dependency chain and come back with Back.

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '../../components/Badge';
import Button from '../../components/Button';
import Collapsible from '../../components/Collapsible';
import ConceptCard from '../../components/ConceptCard';
import EventRow from '../../components/EventRow';
import Section from '../../components/Section';
import StateView from '../../components/StateView';
import { explainResource } from '../../constants/explanations';
import { getTypeMeta } from '../../constants/resourceMeta';
import { getDependencies } from '../../services/dependencyService';
import { getEvents } from '../../services/eventService';
import { getResourceById } from '../../services/resourceService';
import { colors } from '../../theme/colors';
import { capitalize, formatAttributeLabel } from '../../utils/format';

export default function ResourceDetailScreen() {
  const { id } = useLocalSearchParams(); // the id from the link, e.g. "res-web-api"
  const db = useSQLiteContext();
  const router = useRouter();

  const [resource, setResource] = useState(null);
  const [dependencies, setDependencies] = useState({ dependsOn: [], usedBy: [] });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function load() {
      try {
        const found = await getResourceById(db, id);
        const deps = found ? await getDependencies(db, id) : { dependsOn: [], usedBy: [] };
        const related = found ? await getEvents(db, { resourceId: id, limit: 5 }) : [];
        if (isActive) {
          setResource(found); // null when the id does not exist
          setDependencies(deps);
          setEvents(related);
          setLoading(false);
        }
      } catch (e) {
        if (isActive) {
          setError(e.message);
          setLoading(false);
        }
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

  // Open the Simulation Lab with this resource already selected.
  function simulateFailure() {
    router.navigate({ pathname: '/simulation', params: { resourceId: resource.id, ts: Date.now() } });
  }

  if (loading) {
    return <StateView loading title="Loading resource…" />;
  }
  if (error) {
    return <StateView icon="⚠️" title="Could not load this resource" message={error} />;
  }
  if (!resource) {
    return (
      <StateView
        icon="🔍"
        title="Resource not found"
        message={`No resource with id "${id}" exists in the local dataset.`}
        actionLabel="Go back"
        onAction={() => (router.canGoBack() ? router.back() : router.navigate('/catalogue'))}
      />
    );
  }

  const type = getTypeMeta(resource.type);
  const concept = explainResource(resource); // chosen from the resource's stored kind/engine/type
  const attributeEntries = Object.entries(resource.attributes);
  const usedByCount = dependencies.usedBy.length;
  const dependsOnCount = dependencies.dependsOn.length;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      {/* Put the resource's name in the header bar */}
      <Stack.Screen options={{ title: resource.name }} />

      <View style={styles.hero}>
        <Text style={styles.heroType}>
          {type.icon} {type.label} · {concept.title}
        </Text>
        <Text style={styles.heroName}>{resource.name}</Text>
        <View style={styles.heroRow}>
          <StatusBadge status={resource.status} />
          <Text style={styles.sampleNote}>sample status</Text>
        </View>
        <Pressable
          onPress={() => router.push(`/architecture/${resource.architecture_id}`)}
          accessibilityRole="button"
          hitSlop={6}
        >
          <Text style={styles.partOf}>
            Part of <Text style={styles.link}>{resource.architecture_name} ›</Text>
          </Text>
        </Pressable>
      </View>

      <ConceptCard icon="💡" title={`What is this? · ${concept.title}`} simple={concept.simple} technical={concept.technical} />

      <Section title="What does it do?">
        <Text style={styles.paragraph}>{resource.description}</Text>
      </Section>

      <Section title="Why does it matter?">
        <Text style={styles.paragraph}>
          {usedByCount === 0
            ? 'No other resource in this model relies on it, so if it failed the problem would stay contained to this resource.'
            : `${usedByCount} ${usedByCount === 1 ? 'resource relies' : 'resources rely'} on it directly. If it failed, ${
                usedByCount === 1 ? 'that resource' : 'those resources'
              } could stop working, and the problem could spread further along the chain.`}
        </Text>
        <Text style={styles.paragraph}>
          {dependsOnCount === 0
            ? 'It does not rely on any other resource here.'
            : `It needs ${dependsOnCount} other ${dependsOnCount === 1 ? 'resource' : 'resources'} to do its own job.`}
        </Text>
        <Button label="⚡ Simulate this failure" variant="secondary" onPress={simulateFailure} />
      </Section>

      <Section
        title={`What does it depend on? (${dependsOnCount})`}
        subtitle="Resources this one needs. If one of them fails, this resource may be affected."
      >
        {dependsOnCount === 0 ? (
          <Text style={styles.muted}>This resource does not rely on any other resource.</Text>
        ) : (
          dependencies.dependsOn.map((dep) => (
            <DependencyRow
              key={dep.id}
              text={`This ${dep.relationship}`}
              resource={dep}
              onPress={() => openResource(dep.resource_id)}
            />
          ))
        )}
      </Section>

      <Section
        title={`Which resources depend on it? (${usedByCount})`}
        subtitle="Resources that rely on this one. They could be affected if it failed."
      >
        {usedByCount === 0 ? (
          <Text style={styles.muted}>No other resource relies on this one.</Text>
        ) : (
          dependencies.usedBy.map((dep) => (
            <DependencyRow
              key={dep.id}
              text={`${dep.relationship} this`}
              resource={dep}
              before
              onPress={() => openResource(dep.resource_id)}
            />
          ))
        )}
      </Section>

      <Collapsible title="Technical details" subtitle="Identifier, location and fictional sample properties">
        <InfoRow label="Resource id" value={resource.id} />
        <InfoRow label="Type" value={type.label} />
        <InfoRow label="Region" value={resource.region} />
        <InfoRow label="Availability zone" value={resource.zone} />
        <InfoRow label="Environment" value={capitalize(resource.environment)} />
        {attributeEntries.map(([key, value]) => (
          <InfoRow key={key} label={formatAttributeLabel(key)} value={String(value)} />
        ))}
      </Collapsible>

      <Section title="Recent events" subtitle="Activity recorded for this resource (sample data and your simulations)">
        {events.length === 0 ? (
          <Text style={styles.muted}>No events recorded for this resource.</Text>
        ) : (
          events.map((event) => <EventRow key={event.id} event={event} />)
        )}
      </Section>
    </ScrollView>
  );
}

// A "label: value" line.
function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// One link to a related resource, e.g.
//   "This reads and writes data in"  →  Orders Database (Primary)
//   Frontend Node A                  →  "calls this"
// `before` = show the other resource's name before the sentence.
function DependencyRow({ text, resource, before = false, onPress }) {
  const type = getTypeMeta(resource.type);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.depRow, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Text style={styles.depIcon}>{type.icon}</Text>
      <View style={styles.depBody}>
        {before ? (
          <>
            <Text style={styles.depName}>{resource.name}</Text>
            <Text style={styles.depText}>{text}</Text>
          </>
        ) : (
          <>
            <Text style={styles.depText}>{text}</Text>
            <Text style={styles.depName}>{resource.name}</Text>
          </>
        )}
        <StatusBadge status={resource.status} />
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
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
    gap: 6,
  },
  heroType: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  heroName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sampleNote: {
    color: colors.textMuted,
    fontSize: 12,
  },
  partOf: {
    color: colors.textMuted,
    fontSize: 14,
    paddingVertical: 4,
  },
  link: {
    color: colors.primary,
    fontWeight: '700',
  },
  paragraph: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 24,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  infoValue: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  depRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  depIcon: {
    fontSize: 22,
  },
  depBody: {
    flex: 1,
    gap: 3,
  },
  depText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  depName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 24,
  },
  muted: {
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
});
