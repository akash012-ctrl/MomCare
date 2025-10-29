import { initializeDatabase } from "./index";
import type {
    LocalGoal,
    LocalKickEntry,
    LocalSymptomLog,
    SyncStatus,
} from "./types";

type SqlRow = Record<string, unknown>;

const TABLE_NAMES = {
    kicks: "kick_entries_local",
    symptoms: "symptom_logs_local",
    goals: "goals_local",
} as const;

function generateId(): string {
    try {
        if (typeof globalThis.crypto?.randomUUID === "function") {
            return globalThis.crypto.randomUUID();
        }
    } catch (error) {
        console.warn("randomUUID unavailable, falling back to timestamp id", error);
    }
    return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureId<T extends { id: string }>(record: Partial<T>): string {
    return typeof record.id === "string" && record.id.length > 0 ? record.id : generateId();
}

const resolveStatus = (status?: SyncStatus): SyncStatus => status ?? "pending";

const mapKickRow = (row: SqlRow): LocalKickEntry => ({
    id: String(row.id),
    user_id: String(row.user_id),
    date: String(row.date),
    time_of_day: String(row.time_of_day),
    count: Number(row.count ?? 0),
    notes: (row.notes as string | null) ?? null,
    updated_at: String(row.updated_at ?? new Date().toISOString()),
    sync_status: (row.sync_status as SyncStatus) ?? "pending",
});

const mapSymptomRow = (row: SqlRow): LocalSymptomLog => ({
    id: String(row.id),
    user_id: String(row.user_id),
    symptom_type: String(row.symptom_type),
    severity: Number(row.severity ?? 0),
    notes: (row.notes as string | null) ?? null,
    occurred_at: String(row.occurred_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
    sync_status: (row.sync_status as SyncStatus) ?? "pending",
});

const mapGoalRow = (row: SqlRow): LocalGoal => ({
    id: String(row.id),
    user_id: String(row.user_id),
    title: String(row.title),
    description: (row.description as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    target_value: Number(row.target_value ?? 0),
    current_value: Number(row.current_value ?? 0),
    unit: (row.unit as string | null) ?? null,
    status: String(row.status ?? "active"),
    due_date: (row.due_date as string | null) ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
    sync_status: (row.sync_status as SyncStatus) ?? "pending",
});

function buildInClause(ids: string[]): { clause: string; params: Record<string, string> } {
    const params: Record<string, string> = {};
    const placeholders = ids.map((id, index) => {
        const key = `$id_${index}`;
        params[key] = id;
        return key;
    });
    return { clause: placeholders.join(","), params };
}

async function markRowsSynced(table: typeof TABLE_NAMES[keyof typeof TABLE_NAMES], ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await initializeDatabase();
    const { clause, params } = buildInClause(ids);
    await db.runAsync(
        `UPDATE ${table} SET sync_status = 'synced', updated_at = $updated_at WHERE id IN (${clause});`,
        {
            ...params,
            $updated_at: new Date().toISOString(),
        }
    );
}

export async function upsertLocalKickEntry(entry: Partial<LocalKickEntry>): Promise<void> {
    const db = await initializeDatabase();
    const payload: LocalKickEntry = {
        id: ensureId<LocalKickEntry>(entry),
        user_id: entry.user_id!,
        date: entry.date!,
        time_of_day: entry.time_of_day ?? "morning",
        count: entry.count ?? 0,
        notes: entry.notes ?? null,
        updated_at: entry.updated_at ?? new Date().toISOString(),
        sync_status: resolveStatus(entry.sync_status),
    };

    await db.runAsync(
        `INSERT OR REPLACE INTO kick_entries_local
      (id, user_id, date, time_of_day, count, notes, updated_at, sync_status)
     VALUES ($id, $user_id, $date, $time_of_day, $count, $notes, $updated_at, $sync_status);`,
        {
            $id: payload.id,
            $user_id: payload.user_id,
            $date: payload.date,
            $time_of_day: payload.time_of_day,
            $count: payload.count,
            $notes: payload.notes ?? null,
            $updated_at: payload.updated_at,
            $sync_status: payload.sync_status,
        }
    );
}

export async function getLocalKickEntries(userId: string, date?: string): Promise<LocalKickEntry[]> {
    const db = await initializeDatabase();
    const whereClause = date ? "AND date = $date" : "";
    const rows = await db.getAllAsync<SqlRow>(
        `SELECT id, user_id, date, time_of_day, count, notes, updated_at, sync_status
     FROM kick_entries_local WHERE user_id = $user_id ${whereClause}
     ORDER BY date DESC, time_of_day ASC;`,
        {
            $user_id: userId,
            ...(date ? { $date: date } : {}),
        }
    );

    return rows.map(mapKickRow);
}

export async function getPendingKickEntries(userId: string): Promise<LocalKickEntry[]> {
    const db = await initializeDatabase();
    const rows = await db.getAllAsync<SqlRow>(
        `SELECT * FROM kick_entries_local WHERE user_id = $user_id AND sync_status != 'synced';`,
        { $user_id: userId }
    );

    return rows.map(mapKickRow);
}

export async function markKickEntriesSynced(ids: string[]): Promise<void> {
    await markRowsSynced(TABLE_NAMES.kicks, ids);
}

export async function upsertLocalSymptomLog(log: Partial<LocalSymptomLog>): Promise<void> {
    const db = await initializeDatabase();
    const payload: LocalSymptomLog = {
        id: ensureId<LocalSymptomLog>(log),
        user_id: log.user_id!,
        symptom_type: log.symptom_type ?? "general",
        severity: log.severity ?? 1,
        notes: log.notes ?? null,
        occurred_at: log.occurred_at ?? new Date().toISOString(),
        updated_at: log.updated_at ?? new Date().toISOString(),
        sync_status: resolveStatus(log.sync_status),
    };

    await db.runAsync(
        `INSERT OR REPLACE INTO symptom_logs_local
      (id, user_id, symptom_type, severity, notes, occurred_at, updated_at, sync_status)
     VALUES ($id, $user_id, $symptom_type, $severity, $notes, $occurred_at, $updated_at, $sync_status);`,
        {
            $id: payload.id,
            $user_id: payload.user_id,
            $symptom_type: payload.symptom_type,
            $severity: payload.severity,
            $notes: payload.notes ?? null,
            $occurred_at: payload.occurred_at,
            $updated_at: payload.updated_at,
            $sync_status: payload.sync_status,
        }
    );
}

export async function getLocalSymptomLogs(userId: string, limit = 50): Promise<LocalSymptomLog[]> {
    const db = await initializeDatabase();
    const rows = await db.getAllAsync<SqlRow>(
        `SELECT id, user_id, symptom_type, severity, notes, occurred_at, updated_at, sync_status
     FROM symptom_logs_local WHERE user_id = $user_id
     ORDER BY occurred_at DESC LIMIT $limit;`,
        { $user_id: userId, $limit: limit }
    );

    return rows.map(mapSymptomRow);
}

export async function getPendingSymptomLogs(userId: string): Promise<LocalSymptomLog[]> {
    const db = await initializeDatabase();
    const rows = await db.getAllAsync<SqlRow>(
        `SELECT * FROM symptom_logs_local WHERE user_id = $user_id AND sync_status != 'synced';`,
        { $user_id: userId }
    );

    return rows.map(mapSymptomRow);
}

export async function markSymptomLogsSynced(ids: string[]): Promise<void> {
    await markRowsSynced(TABLE_NAMES.symptoms, ids);
}

export async function upsertLocalGoal(goal: Partial<LocalGoal>): Promise<void> {
    const db = await initializeDatabase();
    const payload: LocalGoal = {
        id: ensureId<LocalGoal>(goal),
        user_id: goal.user_id!,
        title: goal.title ?? "Untitled",
        description: goal.description ?? null,
        category: goal.category ?? null,
        target_value: goal.target_value ?? 0,
        current_value: goal.current_value ?? 0,
        unit: goal.unit ?? null,
        status: goal.status ?? "active",
        due_date: goal.due_date ?? null,
        created_at: goal.created_at ?? new Date().toISOString(),
        updated_at: goal.updated_at ?? new Date().toISOString(),
        sync_status: resolveStatus(goal.sync_status),
    };

    await db.runAsync(
        `INSERT OR REPLACE INTO goals_local
      (id, user_id, title, description, category, target_value, current_value, unit, status, due_date, created_at, updated_at, sync_status)
     VALUES ($id, $user_id, $title, $description, $category, $target_value, $current_value, $unit, $status, $due_date, $created_at, $updated_at, $sync_status);`,
        {
            $id: payload.id,
            $user_id: payload.user_id,
            $title: payload.title,
            $description: payload.description ?? null,
            $category: payload.category ?? null,
            $target_value: payload.target_value,
            $current_value: payload.current_value,
            $unit: payload.unit ?? null,
            $status: payload.status,
            $due_date: payload.due_date ?? null,
            $created_at: payload.created_at,
            $updated_at: payload.updated_at,
            $sync_status: payload.sync_status,
        }
    );
}

export async function getLocalGoals(userId: string): Promise<LocalGoal[]> {
    const db = await initializeDatabase();
    const rows = await db.getAllAsync<SqlRow>(
        `SELECT id, user_id, title, description, category, target_value, current_value, unit, status, due_date, created_at, updated_at, sync_status
     FROM goals_local WHERE user_id = $user_id ORDER BY created_at DESC;`,
        { $user_id: userId }
    );

    return rows.map(mapGoalRow);
}

export async function getPendingGoals(userId: string): Promise<LocalGoal[]> {
    const db = await initializeDatabase();
    const rows = await db.getAllAsync<SqlRow>(
        `SELECT * FROM goals_local WHERE user_id = $user_id AND sync_status != 'synced';`,
        { $user_id: userId }
    );

    return rows.map(mapGoalRow);
}

export async function markGoalsSynced(ids: string[]): Promise<void> {
    await markRowsSynced(TABLE_NAMES.goals, ids);
}

export async function removeLocalGoal(id: string): Promise<void> {
    const db = await initializeDatabase();
    await db.runAsync(`DELETE FROM goals_local WHERE id = $id;`, { $id: id });
}
