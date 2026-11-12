// ROOT LAYOUT — the first thing Expo Router renders.
// It wraps the whole app in a Stack navigator:
//   - "(tabs)" is the bottom-tab area (the 5 main screens)
//   - detail screens (architecture/[id], resource/[id]) are pushed ON TOP
//     of the tabs, so they get a back button automatically.
// In Milestone 2 the SQLite database provider will also be added here.

import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '../theme/colors';

// Start from the built-in dark theme and swap in our own colours.
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={navigationTheme}>
      {/* Light status-bar icons, because our background is dark */}
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {/* The tabs draw their own headers, so hide the Stack header here */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="architecture/[id]" options={{ title: 'Infrastructure Explorer' }} />
        <Stack.Screen name="resource/[id]" options={{ title: 'Resource Details' }} />
      </Stack>
    </ThemeProvider>
  );
}
