// Screen 4 — Resource Details + Dependency Explorer (route: "/resource/<id>")
// Like architecture/[id].js, the id comes from the link that opened it.

import { useLocalSearchParams } from 'expo-router';

import PlaceholderScreen from '../../components/PlaceholderScreen';

export default function ResourceDetailScreen() {
  const { id } = useLocalSearchParams();

  return (
    <PlaceholderScreen
      title="Resource Details & Dependencies"
      description={`Received resource id: "${id}". This screen will show the resource's properties, what it depends on, and what depends on it — each tappable to jump to that resource.`}
      milestone="Milestone 3"
      links={[
        // Pushing another resource on top shows that detail screens can chain.
        { label: 'Test: follow a dependency', href: '/resource/res-demo-03' },
      ]}
    />
  );
}
