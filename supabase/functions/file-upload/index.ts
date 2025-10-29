/**
 * File Upload & Image Processing Handler
 * Handles file uploads and AI vision analysis
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.50.0";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface UploadRequest {
    userId: string;
    fileName: string;
    fileBase64: string;
    analysisType: "food_safety" | "general" | "ultrasound";
    bucket?: string;
    mimeType?: string;
}

function sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function numericOrNull(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

async function uploadFileToStorage(
    supabase: ReturnType<typeof createClient>,
    storagePath: string,
    fileBase64: string,
    mimeType: string | undefined,
    bucket: string
): Promise<{ signedUrl: string; publicUrl: string }> {
    const binaryString = atob(fileBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const contentType = mimeType && mimeType.trim().length > 0 ? mimeType : "image/jpeg";

    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, bytes, {
            contentType,
            cacheControl: "3600",
        });

    if (uploadError) throw uploadError;

    // Create signed URL for OpenAI access (1 hour validity)
    const { data: signedData, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, 3600); // 3600 seconds = 1 hour

    if (signedError) throw signedError;

    // Get public URL for storage reference
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(storagePath);

    return {
        signedUrl: signedData.signedUrl,
        publicUrl: publicData.publicUrl
    };
}

async function analyzeImage(
    imageUrl: string,
    analysisType: string
): Promise<{ analysis: Record<string, any>; tokensUsed: number }> {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) throw new Error("OPENAI_API_KEY not configured");

    const prompts: Record<string, string> = {
        food_safety: `Analyze this food image for pregnancy safety and provide in JSON:\n{\n  "food_name": string,\n  "safety_level": "safe"|"caution"|"avoid",\n  "reasons": [string],\n  "nutrients": [string],\n  "alternatives": [string],\n  "confidence": 0-1\n}`,

        general: `Analyze and provide in JSON:\n{\n  "description": string,\n  "objects": [string],\n  "suggestions": [string]\n}`,
        ultrasound: `Analyze ultrasound and provide in JSON:\n{\n  "week": number|null,\n  "weight": number|null,\n  "movement": boolean,\n  "anomalies": [string],\n  "recommendations": [string]\n}`,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "image_url",
                            image_url: {
                                url: imageUrl,
                                detail: "high",
                            },
                        },
                        {
                            type: "text",
                            text: prompts[analysisType] || prompts.general,
                        },
                    ],
                },
            ],
            max_tokens: 1024,
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Vision API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    const tokens = data.usage?.total_tokens || 0;

    if (!content) throw new Error("No content in Vision API response");

    let analysis;
    try {
        const jsonMatch =
            content.match(/```json\n([\s\S]*)\n```/) ||
            content.match(/```\n([\s\S]*)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : content;
        analysis = JSON.parse(jsonString);
    } catch (parseError) {
        console.error("Failed to parse response:", content);
        throw new Error("Failed to parse analysis result");
    }

    return { analysis, tokensUsed: tokens };
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: CORS_HEADERS,
        });
    }

    try {
        const url = new URL(req.url);
        const action = url.searchParams.get("action");

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing Supabase configuration");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        if (action === "upload") {
            const body = (await req.json()) as UploadRequest;
            const {
                userId,
                fileName,
                fileBase64,
                mimeType,
                analysisType,
                bucket = "user-uploads",
            } = body;

            if (!userId || !fileName || !fileBase64) {
                return new Response(
                    JSON.stringify({
                        error: "Missing required fields: userId, fileName, fileBase64",
                    }),
                    {
                        status: 400,
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                    }
                );
            }

            const safeFileName = sanitizeFileName(fileName);
            const storagePath = `${userId}/${Date.now()}-${safeFileName}`;
            const { signedUrl, publicUrl } = await uploadFileToStorage(
                supabase,
                storagePath,
                fileBase64,
                mimeType,
                bucket
            );

            // Use signed URL for OpenAI analysis (1 hour access)
            const { analysis, tokensUsed } = await analyzeImage(
                signedUrl,
                analysisType
            );

            // For food safety scans, store in food_safety_scans table
            if (analysisType === "food_safety") {
                const { data: scanData, error: scanError } = await supabase
                    .from("food_safety_scans")
                    .insert({
                        user_id: userId,
                        image_url: publicUrl,
                        storage_path: storagePath,
                        food_name: analysis?.food_name || "Unknown",
                        safety_level: analysis?.safety_level || "unknown",
                        reasons: analysis?.reasons || [],
                        nutrients: analysis?.nutrients || [],
                        alternatives: analysis?.alternatives || [],
                        confidence: analysis?.confidence || 0.0,
                        raw_analysis: analysis,
                    })
                    .select("id")
                    .single();

                if (scanError) throw scanError;

                return new Response(
                    JSON.stringify({
                        success: true,
                        scanId: scanData.id,
                        imageUrl: publicUrl,
                        analysis,
                        tokensUsed,
                        timestamp: new Date().toISOString(),
                    }),
                    {
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                    }
                );
            }

            // For other analysis types, return analysis without storing
            return new Response(
                JSON.stringify({
                    success: true,
                    imageUrl: publicUrl,
                    analysis,
                    tokensUsed,
                    timestamp: new Date().toISOString(),
                }),
                {
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                }
            );
        } else {
            return new Response(
                JSON.stringify({
                    error: "Invalid action. Use ?action=upload",
                }),
                {
                    status: 400,
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                }
            );
        }
    } catch (error) {
        console.error("File upload error:", error);
        return new Response(
            JSON.stringify({
                error: "File processing failed",
                details: error instanceof Error ? error.message : "Unknown error",
            }),
            {
                status: 500,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            }
        );
    }
});
