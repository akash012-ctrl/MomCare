import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Environment variables for security
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface EphemeralTokenRequest {
    model?: string;
    voice?: string;
    instructions?: string;
    language?: "en" | "hi";
}

interface EphemeralTokenResponse {
    client_secret: {
        value: string;
        expires_at: number;
    };
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Verify authentication
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "Missing authorization header" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Initialize Supabase client with service role
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            global: {
                headers: { Authorization: authHeader },
            },
        });

        // Verify the user is authenticated
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Parse request body
        const body: EphemeralTokenRequest = await req.json();
        const model = body.model || "gpt-realtime-mini";
        const voice = body.voice || "alloy";
        const language = body.language || "en";

        const defaultInstructions = `You are MomCare's caring pregnancy companion.
You speak in ${language === "hi" ? "polite Hindi" : "warm English"}, adapt to the mother's emotional state, and provide actionable, culturally aware guidance.
Always encourage consultation with healthcare professionals for medical issues.
User ID: ${user.id}.`;

        const instructions = body.instructions || defaultInstructions;

        // Generate ephemeral token from OpenAI
        const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: model,
                voice: voice,
                modalities: ["text", "audio"],
                tools: [
                    {
                        type: "web_search",
                    },
                ],
                tool_choice: "auto",
                instructions: instructions,
                turn_detection: {
                    type: "server_vad",
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 500
                },
                input_audio_format: "pcm16",
                output_audio_format: "pcm16",
                temperature: 0.7,
                max_response_output_tokens: 4096,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("OpenAI API error:", error);
            return new Response(
                JSON.stringify({ error: "Failed to generate ephemeral token", details: error }),
                { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const data: EphemeralTokenResponse = await response.json();

        // Log usage for analytics
        await supabase.from("token_usage").insert({
            user_id: user.id,
            request_type: "realtime_voice",
            created_at: new Date().toISOString(),
        });

        return new Response(
            JSON.stringify({
                client_secret: data.client_secret.value,
                expires_at: data.client_secret.expires_at,
                model: model,
                voice: voice,
                language: language,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error in realtime-token function:", error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
