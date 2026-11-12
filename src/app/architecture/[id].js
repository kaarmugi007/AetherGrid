// Screen 2 — Infrastructure Explorer (route: "/architecture/<id>")
// The [id] in the file name is a DYNAMIC segment: whatever comes after
// "/architecture/" in the link becomes the "id" parameter.
// Example: "/architecture/arch-demo-01"  ->  id = "arch-demo-01"

import { useLocalSearchParams } from 'expo-router';

import PlaceholderScreen from '../../components/PlaceholderScreen';

export default function InfrastructureExplorerScreen() {
  // Read the id that was passed in the link.
  const { id } = useLocalSearchParams();

  return (
    <PlaceholderScreen
      title="Infrastructure Explorer"
      description={`Received architecture id: "${id}". This screen will show the architecture's resources grouped by type and how they connect.`}
      milestone="Milestone 4"
      links={[{ label: 'Test: open a resource in this architecture', href: '/resource/res-demo-02' }]}
    />
  );
}
