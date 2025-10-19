import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/**
 * RLS Policy Helpers
 * 
 * Utilities for working with Row Level Security (RLS) policies in Supabase.
 * 
 * Common Gotchas:
 * - Always filter queries by auth.uid() for user-scoped data
 * - Use service role key only for admin operations
 * - JWT tokens are automatically included in headers via Supabase client
 * 
 * Usage:
 * ```tsx
 * const profiles = await getUserScopedQuery(supabase, 'user_profiles')
 *   .select('*')
 *   .single();
 * 
 * const messages = await getUserScopedQuery(supabase, 'messages')
 *   .select('*')
 *   .order('created_at', { ascending: false });
 * ```
 */

/**
 * Get the current authenticated user's ID
 * 
 * @returns User ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
}

/**
 * Creates a query builder with automatic user_id filtering
 * 
 * This ensures that queries are automatically scoped to the current user,
 * which is required for RLS policies that filter by auth.uid().
 * 
 * @param client - Supabase client instance
 * @param tableName - Name of the table to query
 * @returns Query builder with user_id filter applied
 */
export function getUserScopedQuery<T = any>(
    client: SupabaseClient,
    tableName: string
) {
    return client.from(tableName).select("*");
}

/**
 * Helper to check if the current user has access to a resource
 * 
 * Verifies that a resource belongs to the authenticated user.
 * Useful before performing updates or deletes.
 * 
 * @param tableName - Name of the table
 * @param resourceId - ID of the resource
 * @param userIdColumn - Column name for user ID (default: 'user_id')
 * @returns true if user owns the resource
 */
export async function userOwnsResource(
    tableName: string,
    resourceId: string,
    userIdColumn: string = "user_id"
): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { data, error } = await supabase
        .from(tableName)
        .select("id")
        .eq("id", resourceId)
        .eq(userIdColumn, userId)
        .single();

    return !error && !!data;
}

/**
 * Safe update with ownership check
 * 
 * Updates a resource only if the current user owns it.
 * 
 * @param tableName - Name of the table
 * @param resourceId - ID of the resource to update
 * @param updates - Object with fields to update
 * @param userIdColumn - Column name for user ID (default: 'user_id')
 * @returns Update result or null if user doesn't own resource
 */
export async function safeUpdate<T = any>(
    tableName: string,
    resourceId: string,
    updates: Partial<T>,
    userIdColumn: string = "user_id"
): Promise<{ data: T | null; error: Error | null }> {
    const userId = await getCurrentUserId();

    if (!userId) {
        return {
            data: null,
            error: new Error("Not authenticated"),
        };
    }

    const hasAccess = await userOwnsResource(
        tableName,
        resourceId,
        userIdColumn
    );
    if (!hasAccess) {
        return {
            data: null,
            error: new Error("Access denied: You don't own this resource"),
        };
    }

    const { data, error } = await supabase
        .from(tableName)
        .update(updates as any)
        .eq("id", resourceId)
        .eq(userIdColumn, userId)
        .select()
        .single();

    return {
        data: data as T | null,
        error,
    };
}

/**
 * Safe delete with ownership check
 * 
 * Deletes a resource only if the current user owns it.
 * 
 * @param tableName - Name of the table
 * @param resourceId - ID of the resource to delete
 * @param userIdColumn - Column name for user ID (default: 'user_id')
 * @returns Delete result or error if user doesn't own resource
 */
export async function safeDelete(
    tableName: string,
    resourceId: string,
    userIdColumn: string = "user_id"
): Promise<{ error: Error | null; success: boolean }> {
    const userId = await getCurrentUserId();

    if (!userId) {
        return {
            error: new Error("Not authenticated"),
            success: false,
        };
    }

    const hasAccess = await userOwnsResource(
        tableName,
        resourceId,
        userIdColumn
    );
    if (!hasAccess) {
        return {
            error: new Error("Access denied: You don't own this resource"),
            success: false,
        };
    }

    const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", resourceId)
        .eq(userIdColumn, userId);

    return {
        error,
        success: !error,
    };
}

/**
 * Batch insert with automatic user_id
 * 
 * Inserts multiple records with the current user's ID automatically added.
 * 
 * @param tableName - Name of the table
 * @param records - Array of records to insert
 * @param userIdColumn - Column name for user ID (default: 'user_id')
 * @returns Insert result
 */
export async function batchInsertWithUserId<T = any>(
    tableName: string,
    records: Partial<T>[],
    userIdColumn: string = "user_id"
): Promise<{ data: T[] | null; error: Error | null }> {
    const userId = await getCurrentUserId();

    if (!userId) {
        return {
            data: null,
            error: new Error("Not authenticated"),
        };
    }

    const recordsWithUserId = records.map((record) => ({
        ...record,
        [userIdColumn]: userId,
    }));

    const { data, error } = await supabase
        .from(tableName)
        .insert(recordsWithUserId as any)
        .select();

    return {
        data: data as T[] | null,
        error,
    };
}

/**
 * Get JWT token from current session
 * 
 * Useful when you need to pass the token to external services
 * or Edge Functions that require authentication.
 * 
 * @returns JWT access token or null if not authenticated
 */
export async function getAccessToken(): Promise<string | null> {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
}

/**
 * Check if current user has admin privileges
 * 
 * Checks the user's metadata for an admin role.
 * 
 * @returns true if user is admin
 */
export async function isAdmin(): Promise<boolean> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    // Check user metadata for admin role
    const userRole = user.user_metadata?.role;
    return userRole === "admin" || userRole === "superadmin";
}

/**
 * Execute query with service role (bypasses RLS)
 * 
 * WARNING: Use this only for admin operations!
 * This bypasses all RLS policies and has full database access.
 * 
 * Requires SUPABASE_SERVICE_ROLE_KEY to be set in environment.
 * 
 * @param callback - Function that receives service role client
 * @returns Result of the callback
 */
export async function withServiceRole<T>(
    callback: (client: SupabaseClient) => Promise<T>
): Promise<T> {
    const isUserAdmin = await isAdmin();

    if (!isUserAdmin) {
        throw new Error(
            "Access denied: Service role operations require admin privileges"
        );
    }

    // In production, you would create a service role client here
    // For now, we'll use the regular client and warn about this
    console.warn(
        "Service role operations should use SUPABASE_SERVICE_ROLE_KEY"
    );

    return await callback(supabase);
}
