export interface Migration {
    version: number;
    statements: string[];
}

export type SyncStatus = "pending" | "synced" | "failed";

export interface LocalProfile {
    id: string;
    email?: string | null;
    full_name?: string | null;
    preferred_language?: "en" | "hi" | null;
    pregnancy_start_date?: string | null;
    due_date?: string | null;
    updated_at?: string;
}

export interface LocalKickEntry {
    id: string;
    user_id: string;
    date: string;
    time_of_day: string;
    count: number;
    notes?: string | null;
    updated_at: string;
    sync_status: SyncStatus;
}

export interface LocalSymptomLog {
    id: string;
    user_id: string;
    symptom_type: string;
    severity: number;
    notes?: string | null;
    occurred_at: string;
    updated_at: string;
    sync_status: SyncStatus;
}

export interface LocalGoal {
    id: string;
    user_id: string;
    title: string;
    description?: string | null;
    category?: string | null;
    target_value: number;
    current_value: number;
    unit?: string | null;
    status: string;
    due_date?: string | null;
    created_at: string;
    updated_at: string;
    sync_status: SyncStatus;
}

export interface CachedArticle {
    id: string;
    category?: string | null;
    title: string;
    description?: string | null;
    content?: string | null;
    image_url?: string | null;
    url?: string | null;
    tags?: string[];
    is_trending?: number;
    updated_at?: string | null;
    expires_at?: number | null;
}

export interface CachedTip extends CachedArticle { }

export type SyncDomain =
    | "profile"
    | "kicks"
    | "symptoms"
    | "goals"
    | "content";
