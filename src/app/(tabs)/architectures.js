// Screen 6 — Architecture Library (route: "/architectures")

import PlaceholderScreen from '../../components/PlaceholderScreen';

export default function ArchitecturesScreen() {
  return (
    <PlaceholderScreen
      title="Architecture Library"
      description="Browse prebuilt fictional reference architectures with their purpose, complexity and resource count."
      milestone="Milestone 4"
      links={[
        // Temporary test link: opens the Infrastructure Explorer with a sample id.
        { label: 'Test: open an architecture', href: '/architecture/arch-demo-01' },
      ]}
    />
  );
}
