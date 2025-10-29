import NetInfo from "@react-native-community/netinfo";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";

import { getCachedUserSession } from "../cache-manager";
import { supabase } from "../supabase";
import { cacheArticles, cacheTips, purgeExpiredContent } from "./content-cache";
import {
    getPendingGoals,
    getPendingKickEntries,
    getPendingSymptomLogs,
    markGoalsSynced,
    markKickEntriesSynced,
    markSymptomLogsSynced,
    upsertLocalGoal,
    upsertLocalKickEntry,
    upsertLocalSymptomLog,
} from "./pregnancy-metrics-store";
import { upsertLocalProfile } from "./profile-store";
import { updateSyncState } from "./sync-state";
import type { LocalGoal, LocalKickEntry, LocalSymptomLog, SyncDomain } from "./types";

const SYNC_TASK_NAME = "momcare-background-sync";
const CONTENT_TTL_MS = 1000 * 60 * 60 * 24 * 2; // 48 hours

interface SyncOptions {
    includeContent?: boolean;
    skipIfOffline?: boolean;
}

async function isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
}

async function recordSyncSuccess(domain: SyncDomain): Promise<void> {
    await updateSyncState({ domain, last_success_at: new Date().toISOString(), last_error: null });
}

async function recordSyncFailure(domain: SyncDomain, error: unknown): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);
    await updateSyncState({ domain, last_error: message, last_success_at: null });
}

interface PendingItem {
    id: string;
}

interface PendingSyncConfig<Pending extends PendingItem, Payload> {
    fetchPending: (userId: string) => Promise<Pending[]>;
    mapToPayload: (item: Pending) => Payload;
    upload: (payload: Payload[]) => Promise<void>;
    markSynced: (ids: string[]) => Promise<void>;
}

async function pushPendingChanges<Pending extends PendingItem, Payload>(
    userId: string,
    config: PendingSyncConfig<Pending, Payload>,
): Promise<void> {
    const pending = await config.fetchPending(userId);
    if (pending.length === 0) return;

    const payload = pending.map((item) => config.mapToPayload(item));
    await config.upload(payload);
    await config.markSynced(pending.map((item) => item.id));
}

interface RemoteSyncConfig<Remote, Local> {
    fetchRemote: (userId: string) => Promise<Remote[]>;
    mapToLocal: (row: Remote) => Local;
    upsertLocal: (item: Local) => Promise<void>;
}

async function pullRemoteChanges<Remote, Local>(userId: string, config: RemoteSyncConfig<Remote, Local>): Promise<void> {
    const rows = await config.fetchRemote(userId);
    if (!rows || rows.length === 0) return;

    await Promise.all(rows.map(async (row) => config.upsertLocal(config.mapToLocal(row))));
}

interface MetricSyncConfig<Pending extends PendingItem, Payload, Remote, Local> {
    domain: SyncDomain;
    logLabel: string;
    pending: PendingSyncConfig<Pending, Payload>;
    remote: RemoteSyncConfig<Remote, Local>;
}

async function syncMetricDomain<Pending extends PendingItem, Payload, Remote, Local>(
    userId: string,
    config: MetricSyncConfig<Pending, Payload, Remote, Local>,
): Promise<void> {
    try {
        await pushPendingChanges(userId, config.pending);
        await pullRemoteChanges(userId, config.remote);
        await recordSyncSuccess(config.domain);
    } catch (error) {
        console.error(`${config.logLabel} sync failed`, error);
        await recordSyncFailure(config.domain, error);
        throw error;
    }
}

interface RemoteFetcherConfig {
    table: string;
    select: string;
    orderBy: { column: string; ascending?: boolean };
    limit?: number;
}

function createRemoteFetcher<Remote>(config: RemoteFetcherConfig) {
    return async (userId: string): Promise<Remote[]> => {
        let query = supabase
            .from(config.table)
            .select(config.select)
            .eq("user_id", userId)
            .order(config.orderBy.column, { ascending: config.orderBy.ascending ?? false });

        if (config.limit) {
            query = query.limit(config.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data ?? []) as Remote[];
    };
}

function createPayloadUploader<Payload>(table: string) {
    return async (payload: Payload[]): Promise<void> => {
        if (payload.length === 0) return;
        const { error } = await supabase.from(table).upsert(payload, { onConflict: "id" });
        if (error) throw error;
    };
}

interface KickRow {
    id: string;
    user_id: string;
    date: string;
    time_of_day: string;
    count: number;
    notes?: string | null;
    updated_at?: string | null;
}

interface KickPayload {
    id: string;
    user_id: string;
    date: string;
    time_of_day: string;
    count: number;
    notes: string | null;
    updated_at: string;
}

const toKickPayload = (entry: LocalKickEntry): KickPayload => ({
    id: entry.id,
    user_id: entry.user_id,
    date: entry.date,
    time_of_day: entry.time_of_day,
    count: entry.count,
    notes: entry.notes ?? null,
    updated_at: entry.updated_at,
});

const toKickLocal = (row: KickRow): LocalKickEntry => ({
    id: row.id,
    user_id: row.user_id,
    date: row.date,
    time_of_day: row.time_of_day,
    count: row.count,
    notes: row.notes ?? null,
    updated_at: row.updated_at ?? new Date().toISOString(),
    sync_status: "synced",
});

const fetchKickRows = createRemoteFetcher<KickRow>({
    table: "kick_counts",
    select: "id,user_id,date,time_of_day,count,notes,updated_at",
    orderBy: { column: "date", ascending: true },
});

const uploadKickPayload = createPayloadUploader<KickPayload>("kick_counts");

interface SymptomRow {
    id: string;
    user_id: string;
    symptom_type: string;
    severity: number;
    notes?: string | null;
    occurred_at: string;
    updated_at?: string | null;
}

interface SymptomPayload {
    id: string;
    user_id: string;
    symptom_type: string;
    severity: number;
    notes: string | null;
    occurred_at: string;
    updated_at: string;
}

const toSymptomPayload = (log: LocalSymptomLog): SymptomPayload => ({
    id: log.id,
    user_id: log.user_id,
    symptom_type: log.symptom_type,
    severity: log.severity,
    notes: log.notes ?? null,
    occurred_at: log.occurred_at,
    updated_at: log.updated_at,
});

const toSymptomLocal = (row: SymptomRow): LocalSymptomLog => ({
    id: row.id,
    user_id: row.user_id,
    symptom_type: row.symptom_type,
    severity: row.severity,
    notes: row.notes ?? null,
    occurred_at: row.occurred_at,
    updated_at: row.updated_at ?? new Date().toISOString(),
    sync_status: "synced",
});

const fetchSymptomRows = createRemoteFetcher<SymptomRow>({
    table: "symptoms",
    select: "id,user_id,symptom_type,severity,notes,occurred_at,updated_at",
    orderBy: { column: "occurred_at", ascending: false },
    limit: 200,
});

const uploadSymptomPayload = createPayloadUploader<SymptomPayload>("symptoms");

interface GoalRow {
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
    updated_at?: string | null;
}

interface GoalPayload {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    category: string | null;
    target_value: number;
    current_value: number;
    unit: string | null;
    status: string;
    due_date: string | null;
    created_at: string;
    updated_at: string;
}

const toGoalPayload = (goal: LocalGoal): GoalPayload => ({
    id: goal.id,
    user_id: goal.user_id,
    title: goal.title,
    description: goal.description ?? null,
    category: goal.category ?? null,
    target_value: goal.target_value,
    current_value: goal.current_value,
    unit: goal.unit ?? null,
    status: goal.status,
    due_date: goal.due_date ?? null,
    created_at: goal.created_at,
    updated_at: goal.updated_at,
});

const toGoalLocal = (row: GoalRow): LocalGoal => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description ?? null,
    category: row.category ?? null,
    target_value: row.target_value,
    current_value: row.current_value,
    unit: row.unit ?? null,
    status: row.status,
    due_date: row.due_date ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at ?? new Date().toISOString(),
    sync_status: "synced",
});

const fetchGoalRows = createRemoteFetcher<GoalRow>({
    table: "goals",
    select:
        "id,user_id,title,description,category,target_value,current_value,unit,status,due_date,created_at,updated_at",
    orderBy: { column: "created_at", ascending: false },
});

const uploadGoalPayload = createPayloadUploader<GoalPayload>("goals");

const kickSyncConfig: MetricSyncConfig<LocalKickEntry, KickPayload, KickRow, LocalKickEntry> = {
    domain: "kicks",
    logLabel: "Kick entries",
    pending: {
        fetchPending: getPendingKickEntries,
        mapToPayload: toKickPayload,
        upload: uploadKickPayload,
        markSynced: markKickEntriesSynced,
    },
    remote: {
        fetchRemote: fetchKickRows,
        mapToLocal: toKickLocal,
        upsertLocal: upsertLocalKickEntry,
    },
};

const symptomSyncConfig: MetricSyncConfig<LocalSymptomLog, SymptomPayload, SymptomRow, LocalSymptomLog> = {
    domain: "symptoms",
    logLabel: "Symptom log",
    pending: {
        fetchPending: getPendingSymptomLogs,
        mapToPayload: toSymptomPayload,
        upload: uploadSymptomPayload,
        markSynced: markSymptomLogsSynced,
    },
    remote: {
        fetchRemote: fetchSymptomRows,
        mapToLocal: toSymptomLocal,
        upsertLocal: upsertLocalSymptomLog,
    },
};

const goalSyncConfig: MetricSyncConfig<LocalGoal, GoalPayload, GoalRow, LocalGoal> = {
    domain: "goals",
    logLabel: "Goal",
    pending: {
        fetchPending: getPendingGoals,
        mapToPayload: toGoalPayload,
        upload: uploadGoalPayload,
        markSynced: markGoalsSynced,
    },
    remote: {
        fetchRemote: fetchGoalRows,
        mapToLocal: toGoalLocal,
        upsertLocal: upsertLocalGoal,
    },
};

async function syncProfile(userId: string): Promise<void> {
    try {
        const { data, error } = await supabase
            .from("user_profiles")
            .select("id,email,full_name,preferred_language,pregnancy_start_date,due_date,updated_at")
            .eq("id", userId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return;

        await upsertLocalProfile({
            id: data.id,
            email: data.email,
            full_name: data.full_name,
            preferred_language: data.preferred_language as "en" | "hi" | null,
            pregnancy_start_date: data.pregnancy_start_date,
            due_date: data.due_date,
            updated_at: data.updated_at,
        });

        await recordSyncSuccess("profile");
    } catch (error) {
        console.error("Profile sync failed", error);
        await recordSyncFailure("profile", error);
        throw error;
    }
}

async function syncKickEntries(userId: string): Promise<void> {
    await syncMetricDomain(userId, kickSyncConfig);
}

async function syncSymptoms(userId: string): Promise<void> {
    await syncMetricDomain(userId, symptomSyncConfig);
}

async function syncGoals(userId: string): Promise<void> {
    await syncMetricDomain(userId, goalSyncConfig);
}

interface ContentRow {
    id: string;
    category?: string | null;
    title: string;
    description?: string | null;
    content?: string | null;
    image_url?: string | null;
    url?: string | null;
    tags?: string[] | null;
    is_trending?: boolean | number | null;
    updated_at?: string | null;
}

interface RemoteContentSets {
    articles: ContentRow[];
    tips: ContentRow[];
}

async function fetchRemoteContent(): Promise<RemoteContentSets> {
    const [articleResult, tipResult] = await Promise.all([
        supabase
            .from("articles")
            .select("id,category,title,description,content,image_url,url,tags,is_trending,updated_at")
            .order("updated_at", { ascending: false })
            .limit(50),
        supabase
            .from("tips")
            .select("id,category,title,description,content,image_url,url,tags,is_trending,updated_at")
            .order("updated_at", { ascending: false })
            .limit(50),
    ]);

    if (articleResult.error) throw articleResult.error;
    if (tipResult.error) throw tipResult.error;

    return {
        articles: articleResult.data ?? [],
        tips: tipResult.data ?? [],
    };
}

function toCachedContent(row: ContentRow) {
    return {
        id: row.id,
        category: row.category ?? null,
        title: row.title,
        description: row.description ?? null,
        content: row.content ?? null,
        image_url: row.image_url ?? null,
        url: row.url ?? null,
        tags: Array.isArray(row.tags) ? row.tags.filter((tag) => typeof tag === "string") : [],
        is_trending: row.is_trending ? 1 : 0,
        updated_at: row.updated_at ?? new Date().toISOString(),
    };
}

async function persistContentSets({ articles, tips }: RemoteContentSets): Promise<void> {
    await purgeExpiredContent();

    await Promise.all([
        cacheArticles(articles.map(toCachedContent), CONTENT_TTL_MS),
        cacheTips(tips.map(toCachedContent), CONTENT_TTL_MS),
    ]);
}

async function syncContent(): Promise<void> {
    try {
        const content = await fetchRemoteContent();
        await persistContentSets(content);

        await recordSyncSuccess("content");
    } catch (error) {
        console.error("Content sync failed", error);
        await recordSyncFailure("content", error);
        throw error;
    }
}

export async function syncAll(userId: string, options: SyncOptions = {}): Promise<void> {
    if (!userId) {
        return;
    }

    if (options.skipIfOffline) {
        const online = await isOnline();
        if (!online) {
            return;
        }
    }

    await syncProfile(userId);
    await Promise.all([syncKickEntries(userId), syncSymptoms(userId), syncGoals(userId)]);

    if (options.includeContent) {
        await syncContent();
    }
}

async function backgroundTaskHandler(): Promise<BackgroundFetch.BackgroundFetchResult> {
    try {
        const { isLoggedIn, userId } = await getCachedUserSession();
        if (!isLoggedIn || !userId) {
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        const online = await isOnline();
        if (!online) {
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        await syncAll(userId, { includeContent: true });
        return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
        console.error("Background sync error", error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
}

let backgroundTaskDefined = false;

function ensureBackgroundTaskDefined(): void {
    if (backgroundTaskDefined) return;

    try {
        TaskManager.defineTask(SYNC_TASK_NAME, backgroundTaskHandler);

        backgroundTaskDefined = true;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("already defined")) {
            backgroundTaskDefined = true;
            return;
        }

        throw error;
    }
}

export async function registerBackgroundSync(): Promise<void> {
    ensureBackgroundTaskDefined();

    const isRegistered = await TaskManager.isTaskRegisteredAsync(SYNC_TASK_NAME);
    if (isRegistered) {
        return;
    }

    await BackgroundFetch.registerTaskAsync(SYNC_TASK_NAME, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
    });
}

export async function unregisterBackgroundSync(): Promise<void> {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(SYNC_TASK_NAME);
    if (isRegistered) {
        await BackgroundFetch.unregisterTaskAsync(SYNC_TASK_NAME);
    }
}
