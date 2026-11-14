// DATABASE INITIALISATION — runs every time the app starts
// (it is passed to <SQLiteProvider onInit={initDatabase}> in src/app/_layout.js).
//
// How we avoid duplicate rows:
//   SQLite has a built-in number called "user_version" stored inside the
//   database file. It starts at 0 on a brand-new database.
//   - If user_version is already DATABASE_VERSION -> data exists, do nothing.
//   - If it is lower -> (re)create the tables, insert the seed data,
//     then set user_version = DATABASE_VERSION.
//   So the seed data is inserted exactly once per version.
//
// If we change the schema or dataset later, we increase DATABASE_VERSION
// and every phone rebuilds its database on the next launch.

import { Platform } from 'react-native';

import architectures from '../data/seed/architectures.json';
import dependencies from '../data/seed/dependencies.json';
import events from '../data/seed/events.json';
import resources from '../data/seed/resources.json';
import { CREATE_TABLES_SQL, DROP_TABLES_SQL } from './schema';
import { insertSeedData, validateSeedData } from './seedDatabase';

export const DATABASE_NAME = 'aethergrid.db';
const DATABASE_VERSION = 1;

export async function initDatabase(db) {
  // foreign_keys = make SQLite enforce the REFERENCES rules
  // (it is OFF by default and must be enabled per connection).
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // WAL = a faster, safer write mode for the phone's file storage.
  // The web version keeps the database in browser storage instead, so we
  // only switch WAL on for Android/iOS.
  if (Platform.OS !== 'web') {
    await db.execAsync('PRAGMA journal_mode = WAL;');
  }

  const row = await db.getFirstAsync('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return; // Already set up on an earlier launch — keep existing data.
  }

  const seed = { architectures, resources, dependencies, events };
  const problems = validateSeedData(seed);
  if (problems.length > 0) {
    // Stop instead of saving a broken dataset.
    throw new Error(`Seed data is invalid:\n${problems.join('\n')}`);
  }

  // A transaction: if any step fails, everything inside is undone.
  await db.withTransactionAsync(async () => {
    await db.execAsync(DROP_TABLES_SQL);
    await db.execAsync(CREATE_TABLES_SQL);
    await insertSeedData(db, seed);
  });

  // Remember that this version has been seeded.
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
