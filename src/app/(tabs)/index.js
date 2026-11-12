// Screen 1 — Ecosystem Dashboard (route: "/")
// "index" is the default screen: the app opens here.

import PlaceholderScreen from '../../components/PlaceholderScreen';

export default function DashboardScreen() {
  return (
    <PlaceholderScreen
      title="Ecosystem Dashboard"
      description="Overview of the fictional cloud ecosystem: resource counts by type and status, a simulated health summary and recent sample events."
      milestone="Milestone 5"
      links={[
        { label: 'Test: open Resource Catalogue tab', href: '/catalogue' },
        { label: 'Test: open Architecture Library tab', href: '/architectures' },
      ]}
    />
  );
}
