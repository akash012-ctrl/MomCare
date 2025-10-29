import { initializeDatabase } from "./index";
import type { LocalProfile } from "./types";

export async function upsertLocalProfile(profile: LocalProfile): Promise<void> {
    const db = await initializeDatabase();
    const payload = {
        ...profile,
        updated_at: profile.updated_at ?? new Date().toISOString(),
    };

    await db.runAsync(
        `INSERT OR REPLACE INTO user_profile_local (id, email, full_name, preferred_language, pregnancy_start_date, due_date, updated_at)
     VALUES ($id, $email, $full_name, $preferred_language, $pregnancy_start_date, $due_date, $updated_at);`,
        {
            $id: payload.id,
            $email: payload.email ?? null,
            $full_name: payload.full_name ?? null,
            $preferred_language: payload.preferred_language ?? null,
            $pregnancy_start_date: payload.pregnancy_start_date ?? null,
            $due_date: payload.due_date ?? null,
            $updated_at: payload.updated_at,
        }
    );
}

export async function getLocalProfile(userId: string): Promise<LocalProfile | null> {
    const db = await initializeDatabase();
    const row = await db.getFirstAsync<LocalProfile & Record<string, string | null>>(
        `SELECT id, email, full_name, preferred_language, pregnancy_start_date, due_date, updated_at
     FROM user_profile_local WHERE id = $id;`,
        { $id: userId }
    );

    if (!row) {
        return null;
    }

    return {
        id: row.id,
        email: row.email ?? undefined,
        full_name: row.full_name ?? undefined,
        preferred_language: (row.preferred_language as LocalProfile["preferred_language"]) ?? undefined,
        pregnancy_start_date: row.pregnancy_start_date ?? undefined,
        due_date: row.due_date ?? undefined,
        updated_at: row.updated_at ?? new Date().toISOString(),
    };
}

export async function clearLocalProfile(userId: string): Promise<void> {
    const db = await initializeDatabase();
    await db.runAsync(`DELETE FROM user_profile_local WHERE id = $id;`, { $id: userId });
}
