import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Helper to build prompts for different analysis types
function buildPromptForAnalysisType(
    analysisType: string
): string {
    const prompts: Record<string, string> = {
        meal: `Analyze meal image. Return JSON: {meals: [{name, calories, protein_g, carbs_g, fat_g}], totalCalories, summary}`,
        posture: `Analyze posture. Return JSON: {score: 0-100, issues: [{area, severity, fix}], summary}`,
        general: `Analyze image. Return JSON: {description, objects: [], suggestions: []}`,
        ultrasound: `Analyze ultrasound. Return JSON: {pregnancyWeek, weight_g, fetalMovement: bool, concerns: [], recommendations: []}`,
    }
    return prompts[analysisType] || prompts.general
}

Deno.serve(async (req: Request) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST",
                "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            },
        })
    }

    try {
        const { imageUrl, analysisType, userId } = await req.json()

        // Validate inputs
        if (!imageUrl || !analysisType || !userId) {
            return new Response(
                JSON.stringify({
                    error: "Missing required fields: imageUrl, analysisType, userId",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            )
        }

        // Validate analysis type
        if (!["meal", "posture", "general", "ultrasound"].includes(analysisType)) {
            return new Response(
                JSON.stringify({
                    error:
                        "Invalid analysisType. Must be: meal, posture, general, or ultrasound",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            )
        }

        const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
        if (!openaiApiKey) {
            throw new Error("OPENAI_API_KEY environment variable not set")
        }

        // Build vision API request
        const prompt = buildPromptForAnalysisType(analysisType)
        const messages = [
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
                        text: prompt,
                    },
                ],
            },
        ]

        // Call OpenAI GPT-4o Vision API
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages,
                max_tokens: 1024,
                temperature: 0.7,
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error("OpenAI API error:", errorData)
            return new Response(
                JSON.stringify({
                    error: "Vision API error",
                    details: errorData,
                }),
                {
                    status: response.status,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            )
        }

        const data = await response.json()
        const content = data.choices[0]?.message?.content

        if (!content) {
            throw new Error("No content in Vision API response")
        }

        // Parse JSON from response
        let analysisResult
        try {
            // Extract JSON from markdown code blocks if present
            const jsonMatch =
                content.match(/```json\n([\s\S]*?)\n```/) ||
                content.match(/```\n([\s\S]*?)\n```/)
            const jsonString = jsonMatch ? jsonMatch[1] : content
            analysisResult = JSON.parse(jsonString)
        } catch (parseError) {
            console.error("Failed to parse Vision API response:", content)
            throw new Error(`Failed to parse analysis result: ${parseError}`)
        }

        // Return analysis result with metadata
        return new Response(
            JSON.stringify({
                success: true,
                analysisType,
                result: analysisResult,
                timestamp: new Date().toISOString(),
                tokensUsed: data.usage?.total_tokens || 0,
                model: "gpt-4o",
            }),
            {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        )
    } catch (error) {
        console.error("Image analyzer error:", error)
        return new Response(
            JSON.stringify({
                error: "Image analysis failed",
                message: error instanceof Error ? error.message : "Unknown error",
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        )
    }
})