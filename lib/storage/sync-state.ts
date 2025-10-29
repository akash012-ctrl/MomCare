import { initializeDatabase } from "./index";
import type { SyncDomain } from "./types";

interface SyncStateRecord {
    domain: SyncDomain;
    last_success_at?: string | null;
    last_error?: string | null;
}

export async function updateSyncState(record: SyncStateRecord): Promise<void> {
    const db = await initializeDatabase();
    await db.runAsync(
        `INSERT OR REPLACE INTO sync_state (domain, last_success_at, last_error)
     VALUES ($domain, $last_success_at, $last_error);`,
        {
            $domain: record.domain,
            $last_success_at: record.last_success_at ?? null,
            $last_error: record.last_error ?? null,
        }
    );
}

export async function getSyncState(domain: SyncDomain): Promise<SyncStateRecord | null> {
    const db = await initializeDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>(
        `SELECT domain, last_success_at, last_error FROM sync_state WHERE domain = $domain;`,
        { $domain: domain }
    );

    if (!row) {
        return null;
    }

    return {
        domain: row.domain as SyncDomain,
        last_success_at: (row.last_success_at as string | null) ?? null,
        last_error: (row.last_error as string | null) ?? null,
    };
}
