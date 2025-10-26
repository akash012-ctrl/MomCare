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
    analysisType: "meal" | "posture" | "general" | "ultrasound";
    bucket?: string;
    mimeType?: string;
    mealType?: string;
}

const DEFAULT_MEAL_TYPE = "unspecified";

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
): Promise<string> {
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

    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    return data.publicUrl;
}

async function analyzeImage(
    imageUrl: string,
    analysisType: string
): Promise<{ analysis: Record<string, any>; tokensUsed: number }> {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) throw new Error("OPENAI_API_KEY not configured");

    const prompts: Record<string, string> = {
        meal: `Analyze this meal image and provide in JSON:\n{\n  "foods": [{"name": string, "confidence": 0-1}],\n  "calories": number,\n  "macros": {"protein": number, "carbs": number, "fat": number},\n  "micros": {"iron": number, "calcium": number, "folate": number},\n  "summary": string\n}`,
        posture: `Analyze posture and provide in JSON:\n{\n  "score": 0-100,\n  "issues": [{"area": string, "severity": "low|medium|high", "recommendation": string}],\n  "assessment": string,\n  "exercises": [string]\n}`,
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
            model: "gpt-4o",
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

async function storeAnalysisResult(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    imageUrl: string,
    storagePath: string,
    analysisType: string,
    result: Record<string, any>,
    confidence: number,
    tokensUsed: number
): Promise<string> {
    const { data, error } = await supabase
        .from("image_analysis_results")
        .insert({
            user_id: userId,
            image_url: imageUrl,
            storage_path: storagePath,
            analysis_type: analysisType,
            result,
            confidence,
            model_used: "gpt-4o",
            tokens_used: tokensUsed,
            processing_time_ms: 0,
        })
        .select("id")
        .single();

    if (error) throw error;
    return data.id;
}

function averageFoodConfidence(foods: unknown): number | null {
    if (!Array.isArray(foods) || foods.length === 0) {
        return null;
    }
    const total = foods.reduce((sum, item) => {
        const record = (item ?? {}) as Record<string, unknown>;
        const confidence = numericOrNull(record.confidence);
        return sum + (confidence ?? 0);
    }, 0);
    return total > 0 ? total / foods.length : null;
}

function buildMealNutritionPayload(params: {
    analysis: Record<string, any>;
    userId: string;
    analysisId: string;
    imageUrl: string;
    storagePath: string;
    tokensUsed: number;
    modelUsed: string;
    mealTypeOverride?: string;
}) {
    const { analysis, userId, analysisId, imageUrl, storagePath, tokensUsed, modelUsed, mealTypeOverride } = params;
    const foods = Array.isArray(analysis?.foods) ? analysis.foods : [];
    const macros = analysis?.macros ?? {};
    const micros = analysis?.micros ?? {};
    const mealType = mealTypeOverride && mealTypeOverride.trim().length > 0 ? mealTypeOverride : analysis?.meal_type ?? DEFAULT_MEAL_TYPE;

    const calories = numericOrNull(analysis?.calories);
    const protein = numericOrNull(macros?.protein);
    const carbs = numericOrNull(macros?.carbs);
    const fat = numericOrNull(macros?.fat);
    const iron = numericOrNull(micros?.iron);
    const calcium = numericOrNull(micros?.calcium);
    const folate = numericOrNull(micros?.folic_acid) ?? numericOrNull(micros?.folate);
    const water = numericOrNull(analysis?.water_ml) ?? 0;

    return {
        user_id: userId,
        meal_type: mealType,
        food_items: foods,
        calories,
        protein_g: protein,
        carbs_g: carbs,
        fat_g: fat,
        iron_mg: iron,
        calcium_mg: calcium,
        folic_acid_mcg: folate,
        water_intake_ml: water,
        notes: typeof analysis?.summary === "string" ? analysis.summary : null,
        image_url: imageUrl,
        storage_path: storagePath,
        analysis_id: analysisId,
        analysis_source: "ai_image",
        analysis_confidence: averageFoodConfidence(foods),
        model_used: modelUsed,
        tokens_used: numericOrNull(tokensUsed),
        raw_analysis: analysis ?? {},
        logged_at: new Date().toISOString(),
    };
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
                mealType,
                analysisType,
                bucket = "meal-images",
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
            const imageUrl = await uploadFileToStorage(
                supabase,
                storagePath,
                fileBase64,
                mimeType,
                bucket
            );

            const { analysis, tokensUsed } = await analyzeImage(
                imageUrl,
                analysisType
            );

            const resultId = await storeAnalysisResult(
                supabase,
                userId,
                imageUrl,
                storagePath,
                analysisType,
                analysis,
                0.95,
                tokensUsed
            );

            let nutritionLogId: string | null = null;
            if (analysisType === "meal") {
                const nutritionPayload = buildMealNutritionPayload({
                    analysis,
                    userId,
                    analysisId: resultId,
                    imageUrl,
                    storagePath,
                    tokensUsed,
                    modelUsed: "gpt-4o",
                    mealTypeOverride: mealType,
                });

                const { data: nutritionLog, error: nutritionError } = await supabase
                    .from("nutrition_logs")
                    .insert(nutritionPayload)
                    .select("id")
                    .single();

                if (nutritionError) {
                    throw nutritionError;
                }

                nutritionLogId = nutritionLog.id;
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    resultId,
                    imageUrl,
                    analysis,
                    tokensUsed,
                    nutritionLogId,
                    timestamp: new Date().toISOString(),
                }),
                {
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                }
            );
        } else if (action === "get-results") {
            const userId = url.searchParams.get("userId");
            const analysisType = url.searchParams.get("analysisType");

            if (!userId) {
                return new Response(
                    JSON.stringify({
                        error: "User ID is required",
                    }),
                    {
                        status: 400,
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                    }
                );
            }

            let query = supabase
                .from("image_analysis_results")
                .select("*")
                .eq("user_id", userId);

            if (analysisType) {
                query = query.eq("analysis_type", analysisType);
            }

            const { data, error } = await query.order("created_at", {
                ascending: false,
            });

            if (error) throw error;

            return new Response(
                JSON.stringify({
                    success: true,
                    results: data,
                }),
                {
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                }
            );
        } else {
            return new Response(
                JSON.stringify({
                    error: "Invalid action. Use ?action=upload or ?action=get-results",
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
