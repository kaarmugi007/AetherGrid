// Screen 4 — Resource Details + Dependency Explorer (route: "/resource/<id>")
// Shows one resource, what it depends on, and what depends on it.
// Tapping a related resource opens ITS detail screen on top of this one,
// so the user can "walk" along the dependency chain and come back with Back.

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '../../components/Badge';
import EventRow from '../../components/EventRow';
import Section from '../../components/Section';
import StateView from '../../components/StateView';
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

  if (loading) {
    return <StateView loading title="Loading resource…" />;
  }
  if (error) {
    return <StateView title="Could not load this resource" message={error} />;
  }
  if (!resource) {
    return (
      <StateView
        title="Resource not found"
        message={`No resource with id "${id}" exists in the local dataset.`}
        actionLabel="Go back"
        onAction={() => (router.canGoBack() ? router.back() : router.navigate('/catalogue'))}
      />
    );
  }

  const type = getTypeMeta(resource.type);
  const attributeEntries = Object.entries(resource.attributes);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      {/* Put the resource's name in the header bar */}
      <Stack.Screen options={{ title: resource.name }} />

      <View style={styles.hero}>
        <Text style={styles.heroType}>
          {type.icon} {type.label}
        </Text>
        <Text style={styles.heroName}>{resource.name}</Text>
        <Text style={styles.heroId}>{resource.id}</Text>
        <StatusBadge status={resource.status} />
        <Text style={styles.description}>{resource.description}</Text>
      </View>

      <Section title="Overview">
        <InfoRow
          label="Architecture"
          value={resource.architecture_name}
          onPress={() => router.push(`/architecture/${resource.architecture_id}`)}
        />
        <InfoRow label="Region" value={resource.region} />
        <InfoRow label="Availability zone" value={resource.zone} />
        <InfoRow label="Environment" value={capitalize(resource.environment)} />
      </Section>

      <Section title="Properties" subtitle="Fictional sample values for learning">
        {attributeEntries.length === 0 ? (
          <Text style={styles.muted}>No extra properties recorded.</Text>
        ) : (
          attributeEntries.map(([key, value]) => (
            <InfoRow key={key} label={formatAttributeLabel(key)} value={String(value)} />
          ))
        )}
      </Section>

      <Section
        title={`Depends on (${dependencies.dependsOn.length})`}
        subtitle="Resources this one needs in order to work"
      >
        {dependencies.dependsOn.length === 0 ? (
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
        title={`Used by (${dependencies.usedBy.length})`}
        subtitle="Resources that rely on this one — they could be affected if it failed"
      >
        {dependencies.usedBy.length === 0 ? (
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

      <Section title="Recent sample events" subtitle="Activity recorded for this resource">
        {events.length === 0 ? (
          <Text style={styles.muted}>No events recorded for this resource.</Text>
        ) : (
          events.map((event) => <EventRow key={event.id} event={event} />)
        )}
      </Section>
    </ScrollView>
  );
}

// A "label: value" line. Tappable (shown in the accent colour) when onPress is given.
function InfoRow({ label, value, onPress }) {
  const content = (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, onPress && styles.link]}>
        {value}
        {onPress ? ' ›' : ''}
      </Text>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {content}
    </Pressable>
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
  heroId: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  description: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
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
  link: {
    color: colors.primary,
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
