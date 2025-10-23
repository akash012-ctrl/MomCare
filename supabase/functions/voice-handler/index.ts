// @ts-nocheck
/**
 * Voice handler has been decommissioned. Clients must use the realtime-token
 * Edge Function to obtain WebRTC credentials for voice interactions.
 */

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve((req: Request): Response => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    return new Response(
        JSON.stringify({
            error: "Voice handler endpoint removed. Use realtime-token for WebRTC voice sessions.",
        }),
        {
            status: 410,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
            },
        }
    );
});
