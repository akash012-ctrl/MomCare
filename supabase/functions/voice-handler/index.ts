/**
 * Voice Handler Edge Function
 * Handles speech-to-text transcription and text-to-speech synthesis
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface TranscribeRequest {
    audioBase64: string;
    userId: string;
    conversationId?: string;
}

interface SpeakRequest {
    text: string;
    userId: string;
}

async function transcribeAudio(
    audioBase64: string
): Promise<{ text: string; language: string }> {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) throw new Error("OPENAI_API_KEY not configured");

    const binaryString = atob(audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const formData = new FormData();
    formData.append("file", new Blob([bytes], { type: "audio/mp4" }), "audio.mp4");
    formData.append("model", "whisper-1");
    formData.append("language", "en");

    const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${openaiApiKey}`,
            },
            body: formData,
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Transcription API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return {
        text: data.text,
        language: data.language,
    };
}

async function generateSpeech(text: string): Promise<ArrayBuffer> {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) throw new Error("OPENAI_API_KEY not configured");

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
            model: "tts-1",
            input: text,
            voice: "nova",
            speed: 1,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`TTS API error: ${JSON.stringify(error)}`);
    }

    return response.arrayBuffer();
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

        if (action === "transcribe") {
            const body = (await req.json()) as TranscribeRequest;
            const { audioBase64, userId, conversationId } = body;

            if (!audioBase64 || !userId) {
                return new Response(
                    JSON.stringify({
                        error: "Missing required fields: audioBase64, userId",
                    }),
                    {
                        status: 400,
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                    }
                );
            }

            const { text, language } = await transcribeAudio(audioBase64);

            return new Response(
                JSON.stringify({
                    success: true,
                    text,
                    language,
                    timestamp: new Date().toISOString(),
                }),
                {
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                }
            );
        } else if (action === "speak") {
            const body = (await req.json()) as SpeakRequest;
            const { text, userId } = body;

            if (!text || !userId) {
                return new Response(
                    JSON.stringify({
                        error: "Missing required fields: text, userId",
                    }),
                    {
                        status: 400,
                        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                    }
                );
            }

            const audioBuffer = await generateSpeech(text);
            const base64Audio = btoa(
                String.fromCharCode.apply(null, Array.from(new Uint8Array(audioBuffer)))
            );

            return new Response(
                JSON.stringify({
                    success: true,
                    audioBase64: base64Audio,
                    mimeType: "audio/mp3",
                    timestamp: new Date().toISOString(),
                }),
                {
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                }
            );
        } else {
            return new Response(
                JSON.stringify({
                    error: "Invalid action. Use ?action=transcribe or ?action=speak",
                }),
                {
                    status: 400,
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                }
            );
        }
    } catch (error) {
        console.error("Voice handler error:", error);
        return new Response(
            JSON.stringify({
                error: "Voice processing failed",
                details: error instanceof Error ? error.message : "Unknown error",
            }),
            {
                status: 500,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            }
        );
    }
});
