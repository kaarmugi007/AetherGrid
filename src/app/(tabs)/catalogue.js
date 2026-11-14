// Screen 3 — Resource Catalogue (route: "/catalogue")
// Search + type/status/region filters + sorting, all done by SQLite.
//
// How it works:
//   1. Each control (search box, chips) is stored in a piece of state.
//   2. Whenever any of them changes, the useEffect below runs getResources()
//      with the current values and shows the returned rows.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import ConceptCard from '../../components/ConceptCard';
import FilterChips from '../../components/FilterChips';
import ResourceCard from '../../components/ResourceCard';
import ScreenIntro from '../../components/ScreenIntro';
import StateView from '../../components/StateView';
import { CONCEPTS } from '../../constants/explanations';
import { SORT_LABELS, getStatusMeta, getTypeMeta } from '../../constants/resourceMeta';
import { SORT_KEYS, getFilterOptions, getResources } from '../../services/resourceService';
import { colors } from '../../theme/colors';

export default function CatalogueScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const params = useLocalSearchParams(); // filters sent from the Dashboard

  const [search, setSearch] = useState('');
  const [type, setType] = useState(null); // null = no filter ("All")
  const [status, setStatus] = useState(null);
  const [region, setRegion] = useState(null);
  const [sortBy, setSortBy] = useState('name');

  const [filterOptions, setFilterOptions] = useState({ types: [], statuses: [], regions: [] });
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load the chip choices once (they come from the data itself).
  useEffect(() => {
    getFilterOptions(db)
      .then(setFilterOptions)
      .catch((e) => setError(e.message));
  }, [db]);

  // When the Dashboard opens this tab with a filter, apply it once.
  // params.ts is a new number on every Dashboard tap. We remember the last
  // one we applied, and only reset the filters when a NEW one arrives.
  // (React's recommended way to update state when incoming values change.)
  const [appliedRequest, setAppliedRequest] = useState(null);
  if (params.ts && params.ts !== appliedRequest) {
    setAppliedRequest(params.ts);
    setSearch('');
    setRegion(null);
    setType(params.type ?? null);
    setStatus(params.status ?? null);
  }

  // Re-query whenever the search text, a filter or the sort order changes.
  useEffect(() => {
    let isActive = true; // ignore an old, slower result if the user kept typing

    getResources(db, { search, type, status, region, sortBy })
      .then((rows) => {
        if (isActive) {
          setResources(rows);
          setError(null);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (isActive) {
          setError(e.message);
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [db, search, type, status, region, sortBy]);

  const hasActiveFilters = search.trim() !== '' || type !== null || status !== null || region !== null;

  function clearFilters() {
    setSearch('');
    setType(null);
    setStatus(null);
    setRegion(null);
  }

  // Turn the plain values from the database into chip { value, label } objects.
  const typeOptions = filterOptions.types.map((t) => ({ value: t, label: `${getTypeMeta(t).icon} ${getTypeMeta(t).label}` }));
  const statusOptions = filterOptions.statuses.map((s) => ({ value: s, label: getStatusMeta(s).label }));
  const regionOptions = filterOptions.regions.map((r) => ({ value: r, label: r }));
  const sortOptions = SORT_KEYS.map((key) => ({ value: key, label: SORT_LABELS[key] ?? key }));

  // Everything above the list. It is passed to FlatList as a header so it
  // scrolls away with the results, leaving more room on small phones.
  const header = (
    <View style={styles.header}>
      <ScreenIntro text="Every building block in the fictional cloud ecosystem. Search by name, or narrow the list with the filters, then tap a resource to learn what it does and what it is connected to." />
      <ConceptCard
        icon="🧱"
        title={CONCEPTS.resource.title}
        simple={CONCEPTS.resource.simple}
        technical={CONCEPTS.resource.technical}
      />

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, id or description"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search resources"
        />
        {search !== '' && (
          <Pressable onPress={() => setSearch('')} hitSlop={12} accessibilityLabel="Clear search">
            <Text style={styles.clearIcon}>✕</Text>
          </Pressable>
        )}
      </View>

      <FilterChips label="Type" hint="what kind of component" options={typeOptions} selected={type} onChange={setType} />
      <FilterChips label="Status" hint="sample health" options={statusOptions} selected={status} onChange={setStatus} />
      <FilterChips label="Region" hint="fictional location" options={regionOptions} selected={region} onChange={setRegion} />
      <FilterChips
        label="Sort by"
        options={sortOptions}
        selected={sortBy}
        onChange={setSortBy}
        allowAll={false}
      />

      <View style={styles.resultBar}>
        <Text style={styles.resultText}>
          {resources.length} {resources.length === 1 ? 'resource' : 'resources'} found
        </Text>
        {hasActiveFilters && (
          <Pressable onPress={clearFilters} hitSlop={8} accessibilityRole="button">
            <Text style={styles.clearAll}>Clear filters</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  if (error) {
    return <StateView title="Could not load resources" message={error} />;
  }

  return (
    <FlatList
      style={styles.page}
      contentContainerStyle={styles.content}
      data={resources}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled" // chips work while the keyboard is open
      renderItem={({ item }) => (
        <ResourceCard resource={item} onPress={() => router.push(`/resource/${item.id}`)} />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        loading ? (
          <StateView loading title="Searching local data…" />
        ) : (
          <StateView
            icon="🔍"
            title="No matching resources"
            message="Nothing in the local dataset matches your search and filters. Try another word or clear the filters."
            actionLabel="Clear filters"
            onAction={clearFilters}
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 12,
  },
  clearIcon: {
    color: colors.textMuted,
    fontSize: 16,
    padding: 4,
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
  clearAll: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 10,
  },
});
