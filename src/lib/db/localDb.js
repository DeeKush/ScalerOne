import { openDatabaseSync } from 'expo-sqlite';

const DATABASE_NAME = 'scalerone.db';

let db = null;

/**
 * Lazily opens the app's single on-device SQLite database. Every module's local
 * repo (Lost & Found, and future ones) shares this one file and uses
 * expo-sqlite's own API directly on the handle (execAsync / runAsync /
 * getAllAsync / getFirstAsync / withTransactionAsync).
 *
 * Opening is deferred to first call rather than import time, so importing this
 * module stays safe during `expo export`'s static render pass, which never
 * runs a query.
 */
export function getDatabase() {
  if (!db) {
    db = openDatabaseSync(DATABASE_NAME);
  }
  return db;
}
