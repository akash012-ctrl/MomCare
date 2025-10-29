/**
 * Data API Handler Edge Function
 * Unified API for all CRUD operations
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.50.0";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handlers for different resources
async function handleSymptoms(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    method: string,
    body: any
) {
    if (method === "GET") {
        const { data, error } = await supabase
            .from("symptoms")
            .select("*")
            .eq("user_id", userId)
            .order("occurred_at", { ascending: false });
        if (error) throw error;
        return data;
    } else if (method === "POST") {
        const { data, error } = await supabase
            .from("symptoms")
            .insert({
                user_id: userId,
                ...body,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
}

async function handleKicks(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    method: string,
    body: any
) {
    if (method === "GET") {
        const { data, error } = await supabase
            .from("kick_counts")
            .select("*")
            .eq("user_id", userId)
            .order("date", { ascending: false });
        if (error) throw error;
        return data;
    } else if (method === "POST") {
        const { data, error } = await supabase
            .from("kick_counts")
            .insert({
                user_id: userId,
                ...body,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
}

async function handleGoals(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    method: string,
    body: any
) {
    if (method === "GET") {
        const { data, error } = await supabase
            .from("goals")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
        if (error) throw error;
        return data;
    } else if (method === "POST") {
        const { data, error } = await supabase
            .from("goals")
            .insert({
                user_id: userId,
                status: "active",
                current_value: 0,
                ...body,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    } else if (method === "PUT") {
        const { goalId, ...updateData } = body;
        const { data, error } = await supabase
            .from("goals")
            .update(updateData)
            .eq("id", goalId)
            .eq("user_id", userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
}

async function handleProfile(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    method: string,
    body: any
) {
    if (method === "GET") {
        const { data, error } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", userId)
            .single();
        if (error) throw error;
        return data;
    } else if (method === "PUT") {
        const { data, error } = await supabase
            .from("user_profiles")
            .update(body)
            .eq("id", userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: CORS_HEADERS,
        });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing Supabase configuration");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const url = new URL(req.url);
        const pathname = url.pathname;
        const resource = pathname.split("/").pop();
        const method = req.method;
        const body = method !== "GET" ? await req.json() : null;
        const userId = body?.userId || url.searchParams.get("userId");

        if (!userId) {
            return new Response(
                JSON.stringify({
                    error: "User ID is required",
                }),
                {
                    status: 401,
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                }
            );
        }

        let result;

        switch (resource) {
            case "symptoms":
                result = await handleSymptoms(supabase, userId, method, body);
                break;
            case "kicks":
                result = await handleKicks(supabase, userId, method, body);
                break;
            case "goals":
                result = await handleGoals(supabase, userId, method, body);
                break;
            case "profile":
                result = await handleProfile(supabase, userId, method, body);
                break;
            default:
                return new Response(
                    JSON.stringify({
                        error: `Unknown resource: ${resource}`,
                    }),
                    {
                        status: 404,
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                    }
                );
        }

        return new Response(JSON.stringify({ success: true, data: result }), {
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Data API error:", error);
        return new Response(
            JSON.stringify({
                error: "Data operation failed",
                details: error instanceof Error ? error.message : "Unknown error",
            }),
            {
                status: 500,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            }
        );
    }
});
