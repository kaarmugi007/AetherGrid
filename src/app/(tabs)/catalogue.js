// Screen 3 — Resource Catalogue (route: "/catalogue")

import PlaceholderScreen from '../../components/PlaceholderScreen';

export default function CatalogueScreen() {
  return (
    <PlaceholderScreen
      title="Resource Catalogue"
      description="Search, filter and sort every fictional cloud resource (compute, storage, database, network, security), then open a resource to see its details."
      milestone="Milestone 3"
      links={[
        // Temporary test link: opens the detail screen with a sample id.
        { label: 'Test: open a resource detail', href: '/resource/res-demo-01' },
      ]}
    />
  );
}
