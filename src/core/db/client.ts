// SQLite connection singleton + adapter that satisfies our SqlDriver contract.
// Uses the modern async API (SDK 57): openDatabaseAsync / execAsync / runAsync.

import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { migrateAndSeed, assertSeeded, type SqlDriver } from './schema';

const DB_NAME = 'dunu.db';

let _db: SQLiteDatabase | null = null;
let _ready: Promise<SQLiteDatabase> | null = null;

/** Thin adapter mapping expo-sqlite's API onto our driver contract. */
function adapt(db: SQLiteDatabase): SqlDriver {
  return {
    execAsync: (sql) => db.execAsync(sql),
    runAsync: async (sql, params) => {
      await db.runAsync(sql, (params ?? []) as never);
    },
    getFirstAsync: (sql, params) =>
      db.getFirstAsync(sql, (params ?? []) as never) as Promise<never>,
    getAllAsync: (sql, params) => db.getAllAsync(sql, (params ?? []) as never) as Promise<never>,
  };
}

export async function getDb(): Promise<SQLiteDatabase> {
  if (_db) return _db;
  if (!_ready) {
    _ready = (async () => {
      const db = await openDatabaseAsync(DB_NAME);
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync('PRAGMA foreign_keys = ON;');
      return db;
    })();
  }
  _db = await _ready;
  return _db;
}

export async function getDriver(): Promise<SqlDriver> {
  return adapt(await getDb());
}

/** Called once at app start before the first screen renders. */
export async function initDatabase(): Promise<void> {
  const driver = await getDriver();
  await migrateAndSeed(driver);
}

/** Used by the verification script to prove seeding worked. */
export async function verifySeed(): Promise<Record<string, number>> {
  const driver = await getDriver();
  return assertSeeded(driver);
}
