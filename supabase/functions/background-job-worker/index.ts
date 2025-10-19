import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2.50.0"

// Sleep utility
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

// Exponential backoff calculator
function calculateBackoff(retryCount: number): number {
    return Math.min(1000 * Math.pow(2, retryCount), 30000)
}

// Job handlers
const jobHandlers: Record<
    string,
    {
        handle: (
            job: Record<string, unknown>,
            supabaseClient: ReturnType<typeof createClient>
        ) => Promise<Record<string, unknown>>
    }
> = {
    "image-analysis": {
        handle: async (job, supabaseClient) => {
            const { imageUrl, analysisType } = job.payload as {
                imageUrl: string
                analysisType: string
            }

            // Call image-analyzer Edge Function
            const edgeFunctionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/image-analyzer`
            const response = await fetch(edgeFunctionUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                },
                body: JSON.stringify({
                    imageUrl,
                    analysisType,
                    userId: job.user_id,
                }),
            })

            if (!response.ok) {
                throw new Error(`Image analysis failed: ${response.statusText}`)
            }

            return await response.json()
        },
    },
    "generate-nutrition-report": {
        handle: async (job, supabaseClient) => {
            const { mealsData } = job.payload as {
                mealsData: { calories: number }[]
            }

            // Aggregate nutrition data and generate report
            const totalCalories = mealsData.reduce((sum, meal) => sum + meal.calories, 0)
            const report = {
                totalCalories,
                mealCount: mealsData.length,
                summary: `Logged ${mealsData.length} meals with total estimated ${totalCalories} calories`,
                timestamp: new Date().toISOString(),
            }

            return report
        },
    },
    "daily-posture-check-reminder": {
        handle: async (job, supabaseClient) => {
            const { userId } = job.payload as {
                userId: string
            }

            // Create notification in database
            const { error } = await supabaseClient.from("health_alerts").insert({
                user_id: userId,
                title: "Daily Posture Check",
                description: "Time for your daily posture assessment",
                type: "reminder",
                priority: "medium",
                read: false,
            })

            if (error) throw error

            return {
                notificationCreated: true,
            }
        },
    },
    "weekly-summary": {
        handle: async (job, supabaseClient) => {
            const { userId } = job.payload as {
                userId: string
            }

            // Aggregate weekly data
            const weekAgo = new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000
            ).toISOString()

            // Get all meal logs from past week
            const { data: meals } = await supabaseClient
                .from("image_analysis_results")
                .select("result")
                .eq("user_id", userId)
                .eq("analysis_type", "meal")
                .gte("created_at", weekAgo)

            // Get all posture checks from past week
            const { data: postureChecks } = await supabaseClient
                .from("image_analysis_results")
                .select("result")
                .eq("user_id", userId)
                .eq("analysis_type", "posture")
                .gte("created_at", weekAgo)

            const summary = {
                mealsLogged: meals?.length || 0,
                postureChecks: postureChecks?.length || 0,
                period: "weekly",
                weekStart: weekAgo,
            }

            return summary
        },
    },
}

async function processJob(
    job: Record<string, unknown>,
    supabaseClient: ReturnType<typeof createClient>
): Promise<void> {
    console.log(`Processing job ${job.id} of type ${job.type}`)

    try {
        // Update job status to processing
        await supabaseClient
            .from("background_jobs")
            .update({
                status: "processing",
                updated_at: new Date().toISOString(),
            })
            .eq("id", job.id)

        // Get the appropriate handler
        const handler = jobHandlers[job.type as string]
        if (!handler) {
            throw new Error(`No handler found for job type: ${job.type}`)
        }

        // Execute the job
        const result = await handler.handle(job, supabaseClient)

        // Update job with result
        await supabaseClient
            .from("background_jobs")
            .update({
                status: "completed",
                result,
                error_message: null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", job.id)

        console.log(`Job ${job.id} completed successfully`)
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error"
        console.error(`Job ${job.id} error:`, errorMessage)

        const retryCount = (job.retry_count as number) + 1
        const shouldRetry = retryCount < (job.max_retries as number)

        if (shouldRetry) {
            // Schedule retry with exponential backoff
            const backoffMs = calculateBackoff(retryCount)
            const retryAt = new Date(Date.now() + backoffMs).toISOString()

            await supabaseClient
                .from("background_jobs")
                .update({
                    status: "pending",
                    retry_count: retryCount,
                    error_message: `Attempt ${retryCount} failed: ${errorMessage}. Retrying in ${backoffMs}ms`,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", job.id)

            console.log(`Job ${job.id} scheduled for retry at ${retryAt}`)
        } else {
            // Mark as failed
            await supabaseClient
                .from("background_jobs")
                .update({
                    status: "failed",
                    error_message: `Failed after ${retryCount} attempts: ${errorMessage}`,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", job.id)

            console.error(`Job ${job.id} failed permanently after ${retryCount} attempts`)
        }
    }
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
        const supabaseUrl = Deno.env.get("SUPABASE_URL")
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error("Missing Supabase configuration")
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey)

        // Get pending jobs sorted by priority and creation time
        const { data: jobs, error } = await supabase
            .from("background_jobs")
            .select("*")
            .in("status", ["pending", "processing"])
            .order("priority", {
                ascending: false,
            })
            .order("created_at", {
                ascending: true,
            })
            .limit(10) // Process max 10 jobs per invocation

        if (error) {
            throw error
        }

        if (!jobs || jobs.length === 0) {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: "No pending jobs",
                    jobsProcessed: 0,
                }),
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            )
        }

        // Process each job
        let successCount = 0
        let failureCount = 0

        for (const job of jobs) {
            try {
                await processJob(job, supabase)
                successCount++
            } catch (jobError) {
                console.error(`Error processing job ${job.id}:`, jobError)
                failureCount++
            }

            // Small delay between jobs to avoid rate limiting
            await sleep(100)
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: "Job processing complete",
                jobsProcessed: jobs.length,
                successCount,
                failureCount,
            }),
            {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        )
    } catch (error) {
        console.error("Background job worker error:", error)
        return new Response(
            JSON.stringify({
                error: "Job processing failed",
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
