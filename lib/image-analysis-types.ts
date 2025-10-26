/**
 * Image Analysis Types
 * TypeScript interfaces for image analysis and background job processing
 */

/**
 * Analysis types for different image analysis use cases
 */
export type AnalysisType = 'meal' | 'posture' | 'general' | 'ultrasound';

/**
 * Background job status types
 */
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Image analysis result structure
 */
export interface ImageAnalysisResult {
    id: string;
    user_id: string;
    image_url: string;
    storage_path: string;
    analysis_type: AnalysisType;
    result: ImageAnalysisData;
    confidence: number; // 0-1
    model_used: string;
    tokens_used?: number;
    processing_time_ms?: number;
    error_message?: string;
    created_at: string;
    updated_at: string;
}

/**
 * Generic image analysis data structure
 */
export interface ImageAnalysisData {
    [key: string]: any;
    description?: string;
    confidence?: number;
    tags?: string[];
    metadata?: Record<string, any>;
}

/**
 * Meal analysis specific data
 */
export interface MealAnalysisResult extends ImageAnalysisData {
    foods: MealItem[];
    total_calories: number;
    macronutrients: {
        protein_g: number;
        carbs_g: number;
        fat_g: number;
    };
    micronutrients: {
        iron_mg: number;
        calcium_mg: number;
        fiber_g: number;
        folic_acid_mcg?: number;
    };
    recommendation: string;
    description: string;
}

/**
 * Individual meal item
 */
export interface MealItem {
    name: string;
    portion: string;
    confidence: number;
    calories: number;
    macros: {
        protein: number;
        carbs: number;
        fat: number;
    };
}

/**
 * Posture analysis specific data
 */
export interface PostureAnalysisResult extends ImageAnalysisData {
    posture_score: number; // 0-100
    areas_of_concern: string[];
    recommendations: string[];
    safe_to_perform: boolean;
    description: string;
}

/**
 * Background job structure (from database)
 */
export interface BackgroundJob {
    id: string;
    user_id: string;
    job_type: string;
    status: JobStatus;
    priority: number;
    input_data: Record<string, any>;
    output_data?: Record<string, any>;
    error_message?: string;
    created_at: string;
    started_at?: string;
    completed_at?: string;
    retry_count: number;
    max_retries: number;
    metadata: Record<string, any>;
}

/**
 * Job handler payload
 */
export interface JobPayload {
    jobId: string;
    userId: string;
    jobType: string;
    inputData: Record<string, any>;
    priority: number;
}

/**
 * Job result structure
 */
export interface JobResult {
    success: boolean;
    data?: Record<string, any>;
    error?: string;
    metadata?: Record<string, any>;
}

/**
 * Image upload request
 */
export interface ImageUploadRequest {
    base64?: string;
    uri?: string;
    mimeType: string;
    fileName: string;
    analysisType: AnalysisType;
}

/**
 * Image upload response
 */
export interface ImageUploadResponse {
    success: boolean;
    imageUrl: string;
    storagePath: string;
    imageId: string;
    error?: string;
    nutritionLogId?: string | null;
}

/**
 * Image analysis request
 */
export interface ImageAnalysisRequest {
    imageUrl: string;
    analysisType: AnalysisType;
    priority?: number;
    metadata?: Record<string, any>;
}

/**
 * Image analysis response
 */
export interface ImageAnalysisResponse {
    success: boolean;
    analysisId: string;
    jobId?: string; // For async jobs
    status: 'immediate' | 'queued';
    result?: ImageAnalysisData;
    error?: string;
}

/**
 * Nutrition data extracted from meal image
 */
export interface ExtractedNutritionData {
    meal_type: string;
    food_items: MealItem[];
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    iron_mg: number;
    calcium_mg: number;
    fiber_g: number;
    folic_acid_mcg?: number;
    water_ml?: number;
    notes: string;
}

/**
 * Job scheduler configuration
 */
export interface ScheduledJobConfig {
    jobType: string;
    cronExpression: string; // e.g., "0 0 * * *" for daily at midnight
    priority: number;
    payload: Record<string, any>;
    enabled: boolean;
    description: string;
}

/**
 * Vision API request for GPT-4o
 */
export interface VisionAPIRequest {
    model: string;
    messages: {
        role: 'user' | 'assistant';
        content: {
            type: 'text' | 'image_url';
            text?: string;
            image_url?: {
                url: string;
                detail?: 'low' | 'high' | 'auto';
            };
        }[];
    }[];
    max_tokens: number;
}

/**
 * Vision API response from GPT-4o
 */
export interface VisionAPIResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
