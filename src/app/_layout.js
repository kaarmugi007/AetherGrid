// ROOT LAYOUT — the first thing Expo Router renders.
// It wraps the whole app in a Stack navigator:
//   - "(tabs)" is the bottom-tab area (the 5 main screens)
//   - detail screens (architecture/[id], resource/[id]) are pushed ON TOP
//     of the tabs, so they get a back button automatically.
// It also opens the local SQLite database (SQLiteProvider) so that every
// screen inside can read data with useSQLiteContext().

import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { DATABASE_NAME, initDatabase } from '../database/initDatabase';
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
      {/* Opens aethergrid.db on the phone and runs initDatabase once at
          start-up. Screens are only shown after initDatabase has finished. */}
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
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
      </SQLiteProvider>
    </ThemeProvider>
  );
}
