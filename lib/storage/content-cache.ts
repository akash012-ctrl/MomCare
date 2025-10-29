import { initializeDatabase } from "./index";
import type { CachedArticle, CachedTip } from "./types";

function serializeTags(tags?: string[] | null): string | null {
    if (!tags || tags.length === 0) {
        return null;
    }
    return JSON.stringify(tags);
}

function deserializeTags(raw?: string | null): string[] {
    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
    } catch (error) {
        console.warn("Failed to parse cached tags", error);
        return [];
    }
}

export async function cacheArticles(items: CachedArticle[], ttlMs: number): Promise<void> {
    if (items.length === 0) return;
    const db = await initializeDatabase();
    const expiresAt = Date.now() + ttlMs;

    await db.withExclusiveTransactionAsync(async (txn) => {
        for (const article of items) {
            await txn.runAsync(
                `INSERT OR REPLACE INTO articles_cache
          (id, category, title, description, content, image_url, url, tags, is_trending, updated_at, expires_at)
         VALUES ($id, $category, $title, $description, $content, $image_url, $url, $tags, $is_trending, $updated_at, $expires_at);`,
                {
                    $id: article.id,
                    $category: article.category ?? null,
                    $title: article.title,
                    $description: article.description ?? null,
                    $content: article.content ?? null,
                    $image_url: article.image_url ?? null,
                    $url: article.url ?? null,
                    $tags: serializeTags(article.tags),
                    $is_trending: article.is_trending ?? 0,
                    $updated_at: article.updated_at ?? new Date().toISOString(),
                    $expires_at: article.expires_at ?? expiresAt,
                }
            );
        }
    });
}

export async function cacheTips(items: CachedTip[], ttlMs: number): Promise<void> {
    if (items.length === 0) return;
    const db = await initializeDatabase();
    const expiresAt = Date.now() + ttlMs;

    await db.withExclusiveTransactionAsync(async (txn) => {
        for (const tip of items) {
            await txn.runAsync(
                `INSERT OR REPLACE INTO tips_cache
          (id, category, title, description, content, image_url, url, tags, is_trending, updated_at, expires_at)
         VALUES ($id, $category, $title, $description, $content, $image_url, $url, $tags, $is_trending, $updated_at, $expires_at);`,
                {
                    $id: tip.id,
                    $category: tip.category ?? null,
                    $title: tip.title,
                    $description: tip.description ?? null,
                    $content: tip.content ?? null,
                    $image_url: tip.image_url ?? null,
                    $url: tip.url ?? null,
                    $tags: serializeTags(tip.tags),
                    $is_trending: tip.is_trending ?? 0,
                    $updated_at: tip.updated_at ?? new Date().toISOString(),
                    $expires_at: tip.expires_at ?? expiresAt,
                }
            );
        }
    });
}

interface ContentQueryOptions {
    category?: string;
    includeExpired?: boolean;
}

export async function getCachedArticles(options: ContentQueryOptions = {}): Promise<CachedArticle[]> {
    const db = await initializeDatabase();
    const now = Date.now();
    const includeExpired = options.includeExpired ?? false;
    const categoryClause = options.category ? "AND category = $category" : "";
    const expiryClause = includeExpired ? "" : "AND (expires_at IS NULL OR expires_at >= $now)";

    const rows = await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM articles_cache WHERE 1=1 ${categoryClause} ${expiryClause} ORDER BY updated_at DESC;`,
        {
            ...(options.category ? { $category: options.category } : {}),
            ...(includeExpired ? {} : { $now: now }),
        }
    );

    return rows.map((row) => ({
        id: String(row.id),
        category: (row.category as string | null) ?? null,
        title: String(row.title),
        description: (row.description as string | null) ?? null,
        content: (row.content as string | null) ?? null,
        image_url: (row.image_url as string | null) ?? null,
        url: (row.url as string | null) ?? null,
        tags: deserializeTags(row.tags as string | null),
        is_trending: Number(row.is_trending ?? 0),
        updated_at: (row.updated_at as string | null) ?? null,
        expires_at: typeof row.expires_at === "number" ? Number(row.expires_at) : null,
    }));
}

export async function getCachedTips(options: ContentQueryOptions = {}): Promise<CachedTip[]> {
    const db = await initializeDatabase();
    const now = Date.now();
    const includeExpired = options.includeExpired ?? false;
    const categoryClause = options.category ? "AND category = $category" : "";
    const expiryClause = includeExpired ? "" : "AND (expires_at IS NULL OR expires_at >= $now)";

    const rows = await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM tips_cache WHERE 1=1 ${categoryClause} ${expiryClause} ORDER BY updated_at DESC;`,
        {
            ...(options.category ? { $category: options.category } : {}),
            ...(includeExpired ? {} : { $now: now }),
        }
    );

    return rows.map((row) => ({
        id: String(row.id),
        category: (row.category as string | null) ?? null,
        title: String(row.title),
        description: (row.description as string | null) ?? null,
        content: (row.content as string | null) ?? null,
        image_url: (row.image_url as string | null) ?? null,
        url: (row.url as string | null) ?? null,
        tags: deserializeTags(row.tags as string | null),
        is_trending: Number(row.is_trending ?? 0),
        updated_at: (row.updated_at as string | null) ?? null,
        expires_at: typeof row.expires_at === "number" ? Number(row.expires_at) : null,
    }));
}

export async function purgeExpiredContent(): Promise<void> {
    const db = await initializeDatabase();
    const now = Date.now();
    await db.runAsync(`DELETE FROM articles_cache WHERE expires_at IS NOT NULL AND expires_at < $now;`, { $now: now });
    await db.runAsync(`DELETE FROM tips_cache WHERE expires_at IS NOT NULL AND expires_at < $now;`, { $now: now });
}
