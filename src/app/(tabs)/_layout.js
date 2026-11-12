// TABS LAYOUT — the bottom tab bar with the 5 main screens.
// Each <Tabs.Screen name="..."> matches a file in this (tabs) folder:
//   name="index"         -> (tabs)/index.js
//   name="catalogue"     -> (tabs)/catalogue.js   ... and so on.
// The folder name "(tabs)" is in brackets, which means it groups files
// WITHOUT adding "/tabs" to the URL.

import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { colors } from '../../theme/colors';

// Emoji icons: built into the phone, so they need no extra library
// and always work offline.
function TabIcon({ symbol, focused }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{symbol}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      {/* title = header text at the top; tabBarLabel = short text under the icon */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ecosystem Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon symbol="📊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="catalogue"
        options={{
          title: 'Resource Catalogue',
          tabBarLabel: 'Catalogue',
          tabBarIcon: ({ focused }) => <TabIcon symbol="🗂️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="architectures"
        options={{
          title: 'Architecture Library',
          tabBarLabel: 'Library',
          tabBarIcon: ({ focused }) => <TabIcon symbol="🏛️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="simulation"
        options={{
          title: 'Failure Simulation Lab',
          tabBarLabel: 'Simulate',
          tabBarIcon: ({ focused }) => <TabIcon symbol="⚡" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity Centre',
          tabBarLabel: 'Activity',
          tabBarIcon: ({ focused }) => <TabIcon symbol="📜" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
