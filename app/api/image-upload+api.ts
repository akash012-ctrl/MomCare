import { getCurrentUserId } from '@/lib/rls-helpers';
import { supabase } from '@/lib/supabase';

interface ImageUploadRequest {
    base64: string;
    mimeType: string;
    analysisType: 'meal' | 'posture' | 'general' | 'ultrasound';
    width: number;
    height: number;
}

interface ImageUploadResponse {
    success: boolean;
    uploadUrl?: string;
    storagePath?: string;
    error?: string;
}

export async function POST(request: Request): Promise<Response> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return new Response(
                JSON.stringify({ success: false, error: 'Unauthorized' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const body: ImageUploadRequest = await request.json();
        const { base64, mimeType, analysisType, width, height } = body;

        if (!base64 || !mimeType || !analysisType) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Missing required fields: base64, mimeType, analysisType',
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Determine storage bucket and path
        const bucket = `${analysisType}-images`;
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const extension = mimeType === 'image/png' ? 'png' : 'jpg';
        const fileName = `${userId}/${timestamp}-${randomId}.${extension}`;

        // Convert base64 to binary
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, bytes, {
                contentType: mimeType,
                upsert: false,
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: `Upload failed: ${uploadError.message}`,
                }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get public URL
        const {
            data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(fileName);

        // Create image_analysis_results record
        const { error: dbError } = await supabase
            .from('image_analysis_results')
            .insert({
                user_id: userId,
                image_url: publicUrl,
                storage_path: fileName,
                analysis_type: analysisType,
                result: null,
                confidence: null,
                model_used: 'pending',
                tokens_used: 0,
                error_message: null,
            });

        if (dbError) {
            console.error('Database insert error:', dbError);
            // Try to clean up uploaded file
            await supabase.storage.from(bucket).remove([fileName]);

            return new Response(
                JSON.stringify({
                    success: false,
                    error: `Database error: ${dbError.message}`,
                }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const response: ImageUploadResponse = {
            success: true,
            uploadUrl: publicUrl,
            storagePath: fileName,
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Image upload error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
