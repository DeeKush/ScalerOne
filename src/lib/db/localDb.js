import { openDatabaseAsync } from 'expo-sqlite';

const DATABASE_NAME = 'scalerone.db';

let dbPromise = null;

/**
 * Lazily opens the app's single on-device SQLite database and returns a promise
 * for the handle. Every module's local repo (Lost & Found, and future ones)
 * shares this one file, then uses expo-sqlite's own API directly on the handle
 * (execAsync / runAsync / getAllAsync / getFirstAsync / withTransactionAsync).
 *
 * Async rather than openDatabaseSync: the sync path warns about blocking, and on
 * web it drives a SharedArrayBuffer worker shim that fails outright. Opening is
 * also deferred to first call (not import time), so importing this module stays
 * safe during `expo export`'s static render pass, which never runs a query.
 */
export function getDatabase() {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync(DATABASE_NAME).catch((err) => {
      // Don't cache a failed open — let the next call retry.
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}
