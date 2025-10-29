import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

import { MIGRATIONS } from "./migrations";
import type { Migration } from "./types";

const DB_NAME = "momcare.db";
const DB_VERSION_KEY = "db_version";

let database: SQLiteDatabase | null = null;
let initializationPromise: Promise<SQLiteDatabase> | null = null;

async function ensureDatabase(): Promise<SQLiteDatabase> {
  if (database) {
    return database;
  }

  if (!initializationPromise) {
    initializationPromise = (async () => {
      const db = await openDatabaseAsync(DB_NAME, { useNewConnection: true });
      await runMigrations(db);
      database = db;
      return db;
    })();
  }

  return initializationPromise;
}

async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);");

  const currentVersion = await getCurrentVersion(db);
  const pendingMigrations = MIGRATIONS.filter((migration) => migration.version > currentVersion).sort(
    (a, b) => a.version - b.version
  );

  for (const migration of pendingMigrations) {
    await applyMigration(db, migration);
  }
}

async function applyMigration(db: SQLiteDatabase, migration: Migration): Promise<void> {
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const statement of migration.statements) {
      await txn.execAsync(statement);
    }

    await txn.runAsync("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?);", [
      DB_VERSION_KEY,
      String(migration.version),
    ]);
  });
}

async function getCurrentVersion(db: SQLiteDatabase): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM meta WHERE key = ?;",
      [DB_VERSION_KEY]
    );

    if (!result?.value) {
      return 0;
    }

    const parsed = Number(result.value);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch (error) {
    console.warn("SQLite meta table not ready yet, defaulting to version 0", error);
    return 0;
  }
}

export async function initializeDatabase(): Promise<SQLiteDatabase> {
  return ensureDatabase();
}

export function getDbConnection(): SQLiteDatabase {
  if (!database) {
    throw new Error("Database not initialized. Call initializeDatabase() before accessing the connection.");
  }
  return database;
}
