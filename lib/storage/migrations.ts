import type { Migration } from "./types";

export const MIGRATIONS: Migration[] = [
    {
        version: 1,
        statements: [
            "PRAGMA journal_mode=WAL;",
            `CREATE TABLE IF NOT EXISTS user_profile_local (
        id TEXT PRIMARY KEY,
        email TEXT,
        full_name TEXT,
        preferred_language TEXT,
        pregnancy_start_date TEXT,
        due_date TEXT,
        updated_at TEXT
      );`,
            `CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT
      );`,
            `CREATE TABLE IF NOT EXISTS sync_state (
        domain TEXT PRIMARY KEY,
        last_success_at TEXT,
        last_error TEXT
      );`,
            `CREATE TABLE IF NOT EXISTS kick_entries_local (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        time_of_day TEXT NOT NULL,
        count INTEGER NOT NULL,
        notes TEXT,
        updated_at TEXT NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'pending'
      );`,
            `CREATE INDEX IF NOT EXISTS idx_kick_entries_user_date ON kick_entries_local(user_id, date);`,
            `CREATE TABLE IF NOT EXISTS symptom_logs_local (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        symptom_type TEXT NOT NULL,
        severity INTEGER NOT NULL,
        notes TEXT,
        occurred_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'pending'
      );`,
            `CREATE INDEX IF NOT EXISTS idx_symptom_logs_user ON symptom_logs_local(user_id, occurred_at DESC);`,
            `CREATE TABLE IF NOT EXISTS goals_local (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        target_value INTEGER NOT NULL,
        current_value INTEGER NOT NULL,
        unit TEXT,
        status TEXT NOT NULL,
        due_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'pending'
      );`,
            `CREATE INDEX IF NOT EXISTS idx_goals_user ON goals_local(user_id);`
        ],
    },
];
