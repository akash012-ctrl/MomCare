import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.50.0";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImageAnalysisRequest {
    userId: string;
    fileName: string;
    fileBase64: string;
    mimeType: string;
    analysisType: "meal" | "posture" | "general" | "ultrasound";
    bucket?: string;
}

interface ImageAnalysisResponse {
    success: boolean;
    analysisType: string;
    result: Record<string, unknown>;
    fileUrl?: string;
    timestamp: string;
    tokensUsed: number;
    model: string;
}

function buildPromptForAnalysisType(analysisType: string): string {
    const prompts: Record<string, string> = {
        meal: `Analyze meal image. Return JSON: {meals: [{name, calories}], totalCalories, summary}`,
        posture: `Analyze posture. Return JSON: {score: 0-100, issues: [{area, severity, fix}], summary}`,
        general: `Analyze image. Return JSON: {description, objects: [], suggestions: []}`,
        ultrasound: `Analyze ultrasound. Return JSON: {pregnancyWeek, weight_g, concerns: [], recommendations: []}`,
    };
    return prompts[analysisType] || prompts.general;
}

function sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function decodeBase64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function uploadToStorage(
    supabase: ReturnType<typeof createClient>,
    storagePath: string,
    bytes: Uint8Array,
    mimeType: string,
    bucket: string
): Promise<{ signedUrl: string; publicUrl: string }> {
    const { error } = await supabase.storage
        .from(bucket)
        .upload(storagePath, bytes, {
            contentType: mimeType,
            cacheControl: "3600",
            upsert: false,
        });

    if (error) {
        throw error;
    }

    // Create signed URL for OpenAI access (1 hour validity)
    const { data: signedData, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, 3600);

    if (signedError) {
        throw signedError;
    }

    // Get public URL for storage reference
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(storagePath);

    return {
        signedUrl: signedData.signedUrl,
        publicUrl: publicData.publicUrl,
    };
}

async function analyzeImage(
    imageUrl: string,
    analysisType: string,
    openaiApiKey: string
): Promise<{ result: Record<string, unknown>; tokensUsed: number }> {
    const prompt = buildPromptForAnalysisType(analysisType);

    const messages = [
        {
            role: "user",
            content: [
                {
                    type: "image_url",
                    image_url: {
                        url: imageUrl,
                        detail: "low",
                    },
                },
                {
                    type: "text",
                    text: prompt,
                },
            ],
        },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages,
            max_tokens: 512,
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        throw new Error(`Vision API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) {
        throw new Error("No content in Vision API response");
    }

    let analysisResult: Record<string, unknown>;
    try {
        const jsonMatch =
            content.match(/```json\n([\s\S]*?)\n```/) ||
            content.match(/```\n([\s\S]*?)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : content;
        analysisResult = JSON.parse(jsonString);
    } catch (parseError) {
        console.error("Failed to parse Vision API response:", content);
        throw new Error(`Failed to parse analysis result: ${parseError}`);
    }

    return {
        result: analysisResult,
        tokensUsed: data.usage?.total_tokens || 0,
    };
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: CORS_HEADERS });
    }

    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
    }

    try {
        const { userId, fileName, fileBase64, mimeType, analysisType, bucket = "user-uploads" } =
            (await req.json()) as ImageAnalysisRequest;

        if (!userId || !fileName || !fileBase64 || !mimeType || !analysisType) {
            return new Response(
                JSON.stringify({
                    error: "Missing required fields: userId, fileName, fileBase64, mimeType, analysisType",
                }),
                { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
            );
        }

        if (!["meal", "posture", "general", "ultrasound"].includes(analysisType)) {
            return new Response(
                JSON.stringify({
                    error: "Invalid analysisType. Must be: meal, posture, general, or ultrasound",
                }),
                { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
            );
        }

        const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!openaiApiKey || !supabaseUrl || !supabaseKey) {
            throw new Error("Missing required environment configuration");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Upload file to storage and get both signed and public URLs
        const safeName = sanitizeFileName(fileName);
        const storagePath = `${userId}/${Date.now()}-${safeName}`;
        const fileBytes = decodeBase64ToBytes(fileBase64);
        const { signedUrl, publicUrl } = await uploadToStorage(
            supabase,
            storagePath,
            fileBytes,
            mimeType,
            bucket
        );

        // Use signed URL for OpenAI analysis
        const { result, tokensUsed } = await analyzeImage(signedUrl, analysisType, openaiApiKey);

        const responsePayload: ImageAnalysisResponse = {
            success: true,
            analysisType,
            result,
            fileUrl: publicUrl, // Return public URL for user access
            timestamp: new Date().toISOString(),
            tokensUsed,
            model: "gpt-4o-mini",
        };

        return new Response(JSON.stringify(responsePayload), {
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Image analyzer error:", error);
        return new Response(
            JSON.stringify({
                error: "Image analysis failed",
                message: error instanceof Error ? error.message : "Unknown error",
            }),
            { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
    }
});
