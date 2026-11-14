// Screen 5 — Failure Simulation Lab (route: "/simulation")
//
// The user picks a resource and "fails" it. calculateImpact() (a pure BFS
// function in simulationService.js) works out which resources rely on it,
// directly or through a chain. Everything happens in this screen's memory:
// resource records and statuses in SQLite are NEVER changed. The only thing
// written is one 'simulation' event, so the run appears in the Activity Centre.
//
// The result is drawn as an "impact map":
//   FAILED resource (red)
//        ↓  the failure spreads to resources that rely on it
//   LEVEL 1 · direct impact (amber)      <- BFS depth 1
//        ↓
//   LEVEL 2+ · indirect impact (violet)  <- BFS depth 2, 3, ...
//   Not affected (grey)                  <- the rest of the architecture

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SeverityBadge, StatusBadge } from '../../components/Badge';
import Button from '../../components/Button';
import Collapsible from '../../components/Collapsible';
import ConceptCard from '../../components/ConceptCard';
import FilterChips from '../../components/FilterChips';
import Legend from '../../components/Legend';
import ScreenIntro from '../../components/ScreenIntro';
import Section from '../../components/Section';
import StateView from '../../components/StateView';
import { CONCEPTS } from '../../constants/explanations';
import { getStatusMeta, getTypeMeta } from '../../constants/resourceMeta';
import { getArchitectures } from '../../services/architectureService';
import { getAllDependencies } from '../../services/dependencyService';
import { addSimulationEvent } from '../../services/eventService';
import { getResources } from '../../services/resourceService';
import { calculateImpact, getImpactSeverity } from '../../services/simulationService';
import { colors } from '../../theme/colors';

// Colours of the impact map (always shown together with text labels).
const IMPACT_COLORS = {
  failed: colors.critical, // red
  direct: colors.degraded, // amber
  indirect: colors.accent, // violet
  unaffected: colors.textMuted, // grey
};

const STEPS = ['Architecture', 'Resource', 'Simulate', 'Explore'];

export default function SimulationScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const params = useLocalSearchParams(); // optional { resourceId, ts } from Resource Details
  const scrollRef = useRef(null);

  // Data loaded from SQLite
  const [architectures, setArchitectures] = useState([]);
  const [resources, setResources] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simulation state (kept in memory only)
  const [architectureId, setArchitectureId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [result, setResult] = useState(null); // null = no simulation shown
  const [eventSaved, setEventSaved] = useState(null); // true / false / null

  useEffect(() => {
    let isActive = true;

    async function load() {
      try {
        const architectureRows = await getArchitectures(db);
        const resourceRows = await getResources(db, { sortBy: 'type' });
        const dependencyRows = await getAllDependencies(db);
        if (isActive) {
          setArchitectures(architectureRows);
          setResources(resourceRows);
          setDependencies(dependencyRows);
          setArchitectureId(architectureRows[0]?.id ?? null); // start with the first architecture
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
  }, [db]);

  // Quick lookup: resource id -> resource row (to show names along a path).
  const resourceById = useMemo(() => new Map(resources.map((r) => [r.id, r])), [resources]);

  // How many resources rely on each resource directly (shown in the picker).
  const dependantCount = useMemo(() => {
    const counts = {};
    for (const dep of dependencies) {
      counts[dep.target_id] = (counts[dep.target_id] ?? 0) + 1;
    }
    return counts;
  }, [dependencies]);

  // "Simulate this failure" on Resource Details sends { resourceId, ts }.
  // Apply each new request once (same pattern as the Catalogue filters).
  const [appliedRequest, setAppliedRequest] = useState(null);
  if (params.ts && params.ts !== appliedRequest && resourceById.has(params.resourceId)) {
    setAppliedRequest(params.ts);
    setArchitectureId(resourceById.get(params.resourceId).architecture_id);
    setSelectedId(params.resourceId);
    setResult(null);
    setEventSaved(null);
  }

  const visibleResources = resources.filter((r) => r.architecture_id === architectureId);
  const selected = selectedId ? resourceById.get(selectedId) : null;

  // Which step of the 4-step flow the user is on (0-based).
  const currentStep = result ? 3 : selected ? 2 : architectureId ? 1 : 0;

  function chooseArchitecture(id) {
    setArchitectureId(id);
    setSelectedId(null);
  }

  async function runSimulation() {
    if (!selected) return;

    // 1. Calculate the impact (pure function, nothing in the database changes).
    const impact = calculateImpact(selected.id, dependencies);
    const severity = getImpactSeverity(impact.affected.length);
    setResult({ ...impact, severity });
    setEventSaved(null);
    scrollRef.current?.scrollTo({ y: 0, animated: true });

    // 2. Record the run in the activity history as a 'simulation' event.
    try {
      await addSimulationEvent(db, {
        resourceId: selected.id,
        severity,
        message:
          `Simulated failure of ${selected.name}: ${impact.affected.length} resource(s) potentially affected ` +
          `(${impact.direct.length} direct, ${impact.indirect.length} indirect). ` +
          'Local simulation only; no real infrastructure was changed.',
      });
      setEventSaved(true);
    } catch {
      setEventSaved(false);
    }
  }

  // Reset: forget the result and the selection and return to the picker.
  // The database is untouched, so the sample environment and the event
  // history (including earlier simulation events) stay exactly as they are.
  function resetSimulation() {
    setResult(null);
    setSelectedId(null);
    setEventSaved(null);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function openResource(id) {
    router.push(`/resource/${id}`);
  }

  if (loading) {
    return <StateView loading title="Loading the dependency model…" />;
  }
  if (error) {
    return <StateView icon="⚠️" title="Could not load simulation data" message={error} />;
  }
  if (resources.length === 0) {
    return <StateView icon="🗂️" title="Nothing to simulate" message="The local dataset has no resources." />;
  }

  const architectureOptions = architectures.map((a) => ({ value: a.id, label: a.name }));

  return (
    <View style={styles.page}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <StepIndicator current={currentStep} />

        {result ? (
          <SimulationResult
            result={result}
            resources={resources}
            resourceById={resourceById}
            eventSaved={eventSaved}
            onOpenResource={openResource}
            onOpenActivity={() => router.navigate('/activity')}
          />
        ) : (
          <>
            <ScreenIntro
              eyebrow="Educational simulation"
              title="What happens if something breaks?"
              text="Choose a resource and pretend it stops working. AetherGrid follows the dependency links to show which other resources would be in trouble, and why. It runs only on this device using fictional sample data."
            />

            <ConceptCard
              icon="🧭"
              title={CONCEPTS.simulation.title}
              simple={CONCEPTS.simulation.simple}
              technical={CONCEPTS.simulation.technical}
            />

            <FilterChips
              label="Step 1 · Choose an architecture"
              hint="a group of connected resources"
              options={architectureOptions}
              selected={architectureId}
              onChange={chooseArchitecture}
              allowAll={false}
            />

            <View style={styles.stepBlock}>
              <Text style={styles.stepLabel}>Step 2 · Select the resource to fail</Text>
              <Text style={styles.stepHint}>
                Resources that many others rely on usually cause bigger chain reactions.
              </Text>
            </View>
            {visibleResources.map((resource) => (
              <PickerRow
                key={resource.id}
                resource={resource}
                dependants={dependantCount[resource.id] ?? 0}
                selected={resource.id === selectedId}
                onPress={() => setSelectedId(resource.id)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Action bar fixed at the bottom of the screen */}
      <View style={styles.actionBar}>
        {result ? (
          <Button label="↺ Reset and choose another resource" variant="secondary" onPress={resetSimulation} />
        ) : (
          <>
            {selected && (
              <Text style={styles.selectionNote} numberOfLines={2}>
                Step 3 · {selected.name} will be treated as unavailable.{' '}
                {dependantCount[selected.id] ?? 0} resource(s) rely on it directly.
              </Text>
            )}
            <Button
              label={selected ? `⚡ Simulate failure of ${selected.name}` : 'Select a resource first'}
              variant="danger"
              disabled={!selected}
              onPress={runSimulation}
            />
          </>
        )}
      </View>
    </View>
  );
}

// "1 Architecture — 2 Resource — 3 Simulate — 4 Explore"
function StepIndicator({ current }) {
  return (
    <View style={styles.steps} accessibilityLabel={`Step ${current + 1} of ${STEPS.length}: ${STEPS[current]}`}>
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <View key={label} style={styles.step}>
            <View style={[styles.stepCircle, done && styles.stepDone, active && styles.stepActive]}>
              <Text style={[styles.stepNumber, (done || active) && styles.stepNumberOn]}>{done ? '✓' : index + 1}</Text>
            </View>
            <Text style={[styles.stepText, active && styles.stepTextActive]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

// One selectable resource in the picker (works like a radio button).
function PickerRow({ resource, dependants, selected, onPress }) {
  const type = getTypeMeta(resource.type);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pickerRow, selected && styles.pickerRowSelected]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.radio, selected && styles.radioSelected]}>{selected ? '◉' : '○'}</Text>
      <Text style={styles.pickerIcon}>{type.icon}</Text>
      <View style={styles.pickerBody}>
        <Text style={styles.pickerName}>{resource.name}</Text>
        <Text style={styles.pickerMeta}>
          {type.label} ·{' '}
          {dependants === 0 ? 'nothing relies on it' : `${dependants} resource(s) rely on it directly`}
        </Text>
      </View>
    </Pressable>
  );
}

// "A", "A and B", "A, B and C", "A, B and 3 others"
function listNames(names) {
  if (names.length <= 1) return names.join('');
  if (names.length <= 3) return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `${names.slice(0, 2).join(', ')} and ${names.length - 2} others`;
}

function levelTitle(depth) {
  if (depth === 1) return 'Level 1 · Direct impact';
  if (depth === 2) return 'Level 2 · Indirect impact';
  return `Level ${depth} · Further impact`;
}

// The results view shown after "Simulate failure".
function SimulationResult({ result, resources, resourceById, eventSaved, onOpenResource, onOpenActivity }) {
  const failed = resourceById.get(result.failedId);
  const nameOf = (id) => resourceById.get(id)?.name ?? id;
  const count = result.affected.length;

  // Group affected resources by BFS depth: { 1: [...], 2: [...], ... }
  const levels = [];
  for (const item of result.affected) {
    if (!levels[item.depth]) levels[item.depth] = [];
    levels[item.depth].push(item);
  }
  const depths = Object.keys(levels).map(Number); // e.g. [1, 2, 3]
  const maxDepth = depths.length > 0 ? Math.max(...depths) : 0;

  // Unaffected = the failed resource's architecture minus the failed one and
  // everything the BFS reached. Reliable because we have the full resource list.
  const affectedIds = new Set(result.affected.map((item) => item.resourceId));
  const unaffected = resources.filter(
    (r) => r.architecture_id === failed.architecture_id && r.id !== failed.id && !affectedIds.has(r.id)
  );

  // Plain-language summary built from the real numbers.
  const summary =
    count === 0
      ? `${failed.name} has failed. No other resources are affected by this failure.`
      : `${failed.name} has failed. ${count} ${count === 1 ? 'resource is' : 'resources are'} affected by this failure: ` +
        `${result.direct.length} directly and ${result.indirect.length} indirectly.`;

  return (
    <>
      <Text style={styles.resultTag}>SIMULATION RESULT · EDUCATIONAL MODEL, NOT A REAL FAILURE</Text>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>{summary}</Text>
        <View style={styles.summaryNumbers}>
          <SummaryNumber value={count} label="affected" color={IMPACT_COLORS.failed} />
          <SummaryNumber value={result.direct.length} label="direct" color={IMPACT_COLORS.direct} />
          <SummaryNumber value={result.indirect.length} label="indirect" color={IMPACT_COLORS.indirect} />
          <SummaryNumber value={maxDepth} label="levels deep" color={colors.text} />
        </View>
        <View style={styles.summaryFooter}>
          <Text style={styles.summaryFooterText}>Illustrative impact level:</Text>
          <SeverityBadge severity={result.severity} />
        </View>
        {eventSaved === true && (
          <Pressable onPress={onOpenActivity} accessibilityRole="button" hitSlop={6}>
            <Text style={styles.savedText}>✓ Saved to the Activity Centre as a simulation event ›</Text>
          </Pressable>
        )}
        {eventSaved === false && <Text style={styles.errorText}>Could not save this run to the activity history.</Text>}
      </View>

      {/* Visual impact map */}
      <Section title="Impact map" subtitle="Tap any resource to open its details">
        <Legend
          items={[
            { label: 'Failed', color: IMPACT_COLORS.failed },
            { label: 'Direct impact', color: IMPACT_COLORS.direct },
            { label: 'Indirect impact', color: IMPACT_COLORS.indirect },
            { label: 'Not affected', color: IMPACT_COLORS.unaffected },
          ]}
        />
        <Text style={styles.directionNote}>
          Read from top to bottom: ↓ means “the failure spreads to the resources that rely on the one above”. Each card
          says <Text style={styles.bold}>why</Text> it is affected.
        </Text>

        <MapNode
          resource={failed}
          color={IMPACT_COLORS.failed}
          caption="✖ Failed (simulated)"
          reason={`Treated as unavailable. Its stored status stays “${getStatusMeta(failed.status).label}”.`}
          onPress={() => onOpenResource(failed.id)}
        />

        {depths.map((depth) => {
          const color = depth === 1 ? IMPACT_COLORS.direct : IMPACT_COLORS.indirect;
          return (
            <View key={depth} style={styles.level}>
              <Connector color={color} />
              <Text style={[styles.levelTitle, { color }]}>
                {levelTitle(depth)} ({levels[depth].length})
              </Text>
              {levels[depth].map((item) => (
                <MapNode
                  key={item.resourceId}
                  resource={resourceById.get(item.resourceId)}
                  color={color}
                  reason={`Why: it ${item.relationship} ${nameOf(item.viaId)}`}
                  onPress={() => onOpenResource(item.resourceId)}
                />
              ))}
            </View>
          );
        })}

        {count === 0 && (
          <Text style={styles.contained}>
            The failure stays contained: no resource relies on {failed.name}, so nothing else is affected.
          </Text>
        )}

        {unaffected.length > 0 && (
          <View style={styles.unaffected}>
            <Text style={styles.unaffectedTitle}>
              Not affected in this architecture ({unaffected.length})
            </Text>
            <View style={styles.chips}>
              {unaffected.map((r) => (
                <Pressable key={r.id} onPress={() => onOpenResource(r.id)} style={styles.chip} accessibilityRole="button">
                  <Text style={styles.chipText}>
                    {getTypeMeta(r.type).icon} {r.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </Section>

      {/* Plain-language explanation */}
      <Section title="What does this mean?">
        {count === 0 ? (
          <Text style={styles.paragraph}>
            Nothing in this model relies on {failed.name}. It would still be unavailable itself, but its failure does
            not spread. Try a database or network resource to see a chain reaction.
          </Text>
        ) : (
          <>
            <Text style={styles.paragraph}>
              {listNames(result.direct.map((item) => nameOf(item.resourceId)))}{' '}
              {result.direct.length === 1 ? 'relies' : 'rely'} on {failed.name} directly, so{' '}
              {result.direct.length === 1 ? 'it' : 'they'} can no longer work normally.
            </Text>
            <Text style={styles.paragraph}>
              {result.indirect.length > 0
                ? `The problem then spreads: ${result.indirect.length} more ${
                    result.indirect.length === 1 ? 'resource relies' : 'resources rely'
                  } on those affected resources, reaching ${maxDepth} levels away from the original failure.`
                : 'Nothing else relies on those resources, so the impact stops after one level.'}
            </Text>
            <Text style={styles.paragraph}>
              The more resources depend on a component, the more of the application its failure can disrupt.
            </Text>
          </>
        )}
      </Section>

      {/* Technical details for the viva */}
      <Collapsible title="Technical details" subtitle="Algorithm, depth and dependency chains">
        <DetailRow label="Failed resource id" value={failed.id} />
        <DetailRow label="Affected (total)" value={String(count)} />
        <DetailRow label="Direct (depth 1)" value={String(result.direct.length)} />
        <DetailRow label="Indirect (depth ≥ 2)" value={String(result.indirect.length)} />
        <DetailRow label="Maximum depth" value={String(maxDepth)} />
        <DetailRow label="Impact level rule" value="0 = info · 1–2 = warning · 3+ = critical" />

        <Text style={styles.techHeading}>Dependency chains (failure spreads →)</Text>
        {result.affected.length === 0 ? (
          <Text style={styles.paragraph}>No chains: nothing relies on the failed resource.</Text>
        ) : (
          result.affected.map((item) => (
            <View key={item.resourceId} style={styles.chain}>
              <Text style={styles.chainDepth}>Depth {item.depth}</Text>
              <Text style={styles.chainText}>{item.path.map(nameOf).join('  →  ')}</Text>
            </View>
          ))
        )}

        <Text style={styles.techHeading}>How it was calculated</Text>
        <Text style={styles.paragraph}>
          Breadth-first search (BFS) over the dependency table. Each link means “source relies on target”, so the search
          starts at the failed resource and repeatedly finds links whose target is an affected resource; their sources
          are affected next. BFS visits level by level, so each depth is the shortest chain length. A visited set
          counts every resource once, so loops in the links cannot repeat forever.
        </Text>
      </Collapsible>

      {/* Limitations */}
      <View style={styles.limitations}>
        <Text style={styles.limitationsTitle}>⚠️ Limitations of this model</Text>
        <Text style={styles.paragraph}>
          This is an educational simulation using fictional data. It assumes every dependency is essential and does not
          simulate redundancy, failover or automatic recovery. For example, a load balancer could keep working if only
          one of its two frontend nodes failed. Results are not predictions of real cloud outages.
        </Text>
      </View>
    </>
  );
}

// A small vertical line + arrow between levels of the impact map.
function Connector({ color }) {
  return (
    <View style={styles.connector}>
      <View style={[styles.connectorLine, { backgroundColor: color }]} />
      <Text style={[styles.connectorArrow, { color }]}>▼</Text>
    </View>
  );
}

// One resource "node" in the impact map, coloured by impact level.
function MapNode({ resource, color, caption, reason, onPress }) {
  const type = getTypeMeta(resource.type);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.node, { borderColor: color }, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <View style={[styles.nodeStripe, { backgroundColor: color }]} />
      <View style={styles.nodeBody}>
        {caption ? <Text style={[styles.nodeCaption, { color }]}>{caption}</Text> : null}
        <View style={styles.nodeTop}>
          <Text style={styles.nodeName}>
            {type.icon} {resource.name}
          </Text>
          <StatusBadge status={resource.status} />
        </View>
        <Text style={styles.nodeReason}>{reason}</Text>
      </View>
    </Pressable>
  );
}

function SummaryNumber({ value, label, color }) {
  return (
    <View style={styles.summaryNumber}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
    gap: 14,
    paddingBottom: 24,
  },
  bold: {
    color: colors.text,
    fontWeight: '700',
  },

  // Step indicator
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDone: {
    backgroundColor: colors.healthy,
    borderColor: colors.healthy,
  },
  stepActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNumber: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  stepNumberOn: {
    color: colors.background,
  },
  stepText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  stepTextActive: {
    color: colors.text,
    fontWeight: '700',
  },

  // Picker
  stepBlock: {
    gap: 2,
  },
  stepLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepHint: {
    color: colors.textMuted,
    fontSize: 13,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    minHeight: 56,
  },
  pickerRowSelected: {
    borderColor: colors.critical,
    backgroundColor: colors.surfaceAlt,
  },
  radio: {
    color: colors.textMuted,
    fontSize: 20,
  },
  radioSelected: {
    color: colors.critical,
  },
  pickerIcon: {
    fontSize: 22,
  },
  pickerBody: {
    flex: 1,
    gap: 2,
  },
  pickerName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  pickerMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },

  // Bottom action bar
  actionBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: 12,
    gap: 8,
  },
  selectionNote: {
    color: colors.textMuted,
    fontSize: 13,
  },

  // Result: summary
  resultTag: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  summary: {
    backgroundColor: colors.surface,
    borderColor: colors.critical,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  summaryText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  summaryNumbers: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingVertical: 10,
  },
  summaryNumber: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryFooterText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  savedText: {
    color: colors.healthy,
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: colors.critical,
    fontSize: 13,
  },

  // Result: impact map
  directionNote: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  level: {
    gap: 8,
  },
  levelTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  connector: {
    alignItems: 'center',
    marginTop: -2,
  },
  connectorLine: {
    width: 2,
    height: 14,
    opacity: 0.8,
  },
  connectorArrow: {
    fontSize: 12,
    marginTop: -3,
  },
  node: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  nodeStripe: {
    width: 5,
  },
  nodeBody: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  nodeCaption: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nodeTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  nodeName: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  nodeReason: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  contained: {
    color: colors.healthy,
    fontSize: 14,
    lineHeight: 20,
  },
  unaffected: {
    marginTop: 6,
    gap: 8,
  },
  unaffectedTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 12,
  },

  // Result: text sections
  paragraph: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  techHeading: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  detailValue: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  chain: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: 10,
    gap: 2,
  },
  chainDepth: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  chainText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  limitations: {
    backgroundColor: colors.surface,
    borderColor: colors.degraded,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  limitationsTitle: {
    color: colors.degraded,
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
