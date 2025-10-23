

import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatRequest {
    messages: ChatMessage[];
    userId: string;
    conversationId?: string;
    includeMemory?: boolean;
    language?: "en" | "hi";
}

export interface ChatResponse {
    success: boolean;
    conversationId: string;
    message: string;
    tokensUsed: number;
    timestamp: string;
}

// Realtime voice uses WebRTC with ephemeral token - no separate STT/TTS functions needed
export interface RealtimeTokenResponse {
    client_secret: string;
    expires_at: string;
    model: string;
    voice: string;
    language: string;
}

export interface RealtimeTokenOptions {
    language?: "en" | "hi";
    model?: string;
    voice?: string;
    instructions?: string;
}

export interface SymptomLog {
    id?: string;
    user_id?: string;
    symptom_type: string;
    severity: number;
    notes?: string;
    occurred_at?: string;
    created_at?: string;
}

export interface KickEntry {
    id?: string;
    user_id?: string;
    count: number;
    date: string;
    time_of_day?: string;
    notes?: string;
    created_at?: string;
}

export interface NutritionLog {
    id?: string;
    user_id?: string;
    meal_type: string;
    food_items?: Record<string, unknown>[];
    calories?: number;
    protein_g?: number;
    iron_mg?: number;
    calcium_mg?: number;
    folic_acid_mcg?: number;
    water_intake_ml?: number;
    notes?: string;
    logged_at?: string;
    created_at?: string;
}

export interface Goal {
    id?: string;
    user_id?: string;
    title: string;
    description?: string;
    category: string;
    target_value?: number;
    current_value?: number;
    unit?: string;
    frequency?: string;
    status?: 'active' | 'completed' | 'paused';
    due_date?: string;
    created_at?: string;
}

export interface HealthAlert {
    id?: string;
    user_id?: string;
    alert_type: string;
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    scheduled_for?: string;
    is_read?: boolean;
    is_dismissed?: boolean;
    metadata?: Record<string, unknown>;
    created_at?: string;
}

export interface UserProfile {
    id?: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    due_date?: string;
    pregnancy_week?: number;
    trimester?: number;
    pregnancy_start_date?: string;
    preferences?: Record<string, unknown>;
    created_at?: string;
}

export interface FileUploadRequest {
    userId: string;
    fileName: string;
    fileBase64: string;
    analysisType: 'meal' | 'posture' | 'general' | 'ultrasound';
    bucket?: string;
}

export interface FileUploadResponse {
    success: boolean;
    resultId: string;
    imageUrl: string;
    analysis: Record<string, unknown>;
    tokensUsed: number;
    timestamp: string;
}

export interface ImageAnalysisResult {
    id: string;
    user_id: string;
    image_url: string;
    storage_path: string;
    analysis_type: string;
    result: Record<string, unknown>;
    confidence: number;
    model_used: string;
    tokens_used?: number;
    processing_time_ms?: number;
    created_at: string;
}

// ============================================================================
// CHAT API - Replaces app/api/chat+api.ts and lib/ai-memory.ts
// ============================================================================

/**
 * Send a chat message and get AI response
 * @param messages Chat history with user and assistant messages
 * @param userId User ID for context
 * @param conversationId Optional existing conversation ID
 * @param includeMemory Include user's pregnancy context (default: true)
 * @returns AI response with conversation ID and tokens used
 */
export async function sendChatMessage(
    messages: ChatMessage[],
    userId: string,
    conversationId?: string,
    includeMemory: boolean = true,
    language: "en" | "hi" = "en"
): Promise<ChatResponse> {
    try {
        const { data, error } = await supabase.functions.invoke('chat-handler', {
            body: {
                messages,
                userId,
                conversationId,
                includeMemory,
                language,
            },
        });

        if (error) throw error;
        return data as ChatResponse;
    } catch (error) {
        console.error('Chat API error:', error);
        throw error;
    }
}

/**
 * Get conversation history
 * @param userId User ID
 * @param conversationId Conversation ID
 * @param limit Number of messages to retrieve
 * @returns Array of messages
 */
export async function getConversationHistory(
    userId: string,
    conversationId: string,
    limit: number = 50
): Promise<ChatMessage[]> {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('role, content')
            .eq('user_id', userId)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) throw error;
        return data as ChatMessage[];
    } catch (error) {
        console.error('Get conversation history error:', error);
        throw error;
    }
}

// ============================================================================
// VOICE API - Replaces app/api/voice+api.ts
// Uses WebRTC with realtime-token - no STT/TTS functions needed
// ============================================================================

/**
 * Get realtime token for WebRTC voice session
 * @param language Language preference for the session
 * @returns Ephemeral token and session config
 */
export async function getRealtimeToken(
    options: RealtimeTokenOptions = {}
): Promise<RealtimeTokenResponse> {
    try {
        const payload: Record<string, unknown> = {};

        if (options.language) {
            payload.language = options.language;
        }

        if (options.model) {
            payload.model = options.model;
        }

        if (options.voice) {
            payload.voice = options.voice;
        }

        if (options.instructions) {
            payload.instructions = options.instructions;
        }

        const { data, error } = await supabase.functions.invoke('realtime-token', {
            body: payload,
        });

        if (error) throw error;
        return data as RealtimeTokenResponse;
    } catch (error) {
        console.error('Get realtime token error:', error);
        throw error;
    }
}

// ============================================================================
// DATA API - Replaces lib/api.ts
// ============================================================================
export async function saveSymptom(
    userId: string,
    symptom: SymptomLog
): Promise<SymptomLog> {
    try {
        const { data, error } = await supabase.functions.invoke('data-api', {
            body: { ...symptom, userId, resource: 'symptoms' },
        });

        if (error) throw error;
        return data.data as SymptomLog;
    } catch (error) {
        console.error('Save symptom error:', error);
        throw error;
    }
}

export async function getSymptoms(userId: string): Promise<SymptomLog[]> {
    try {
        const { data, error } = await supabase.functions.invoke('data-api', {
            body: { userId, resource: 'symptoms' },
            method: 'GET',
        });

        if (error) throw error;
        return data.data as SymptomLog[];
    } catch (error) {
        console.error('Get symptoms error:', error);
        throw error;
    }
}

/**
 * Save or get kick counts
 */
export async function saveKick(
    userId: string,
    kick: KickEntry
): Promise<KickEntry> {
    try {
        const { data, error } = await supabase.functions.invoke('data-api', {
            body: { ...kick, userId, resource: 'kicks' },
        });

        if (error) throw error;
        return data.data as KickEntry;
    } catch (error) {
        console.error('Save kick error:', error);
        throw error;
    }
}

export async function getKicks(userId: string): Promise<KickEntry[]> {
    try {
        const { data, error } = await supabase.functions.invoke('data-api', {
            body: { userId, resource: 'kicks' },
            method: 'GET',
        });

        if (error) throw error;
        return data.data as KickEntry[];
    } catch (error) {
        console.error('Get kicks error:', error);
        throw error;
    }
}

/**
 * Save or get nutrition logs
 */
export async function saveNutrition(
    userId: string,
    nutrition: NutritionLog
): Promise<NutritionLog> {
    try {
        const { data, error } = await supabase.functions.invoke('data-api', {
            body: { ...nutrition, userId, resource: 'nutrition' },
        });

        if (error) throw error;
        return data.data as NutritionLog;
    } catch (error) {
        console.error('Save nutrition error:', error);
        throw error;
    }
}

export async function getNutrition(
    userId: string,
    date?: string
): Promise<NutritionLog[]> {
    try {
        const { data, error } = await supabase.functions.invoke('data-api', {
            body: { userId, resource: 'nutrition', date },
            method: 'GET',
        });

        if (error) throw error;
        return data.data as NutritionLog[];
    } catch (error) {
        console.error('Get nutrition error:', error);
        throw error;
    }
}

/**
 * Save or get goals
 */
export async function saveGoal(
    userId: string,
    goal: Goal
): Promise<Goal> {
    try {
        const { data, error } = await supabase.functions.invoke('data-api', {
            body: { ...goal, userId, resource: 'goals' },
        });

        if (error) throw error;
        return data.data as Goal;
    } catch (error) {
        console.error('Save goal error:', error);
        throw error;
    }
}

export async function getGoals(userId: string): Promise<Goal[]> {
    try {
        const { data, error } = await supabase.functions.invoke('data-api', {
            body: { userId, resource: 'goals' },
            method: 'GET',
        });

        if (error) throw error;
        return data.data as Goal[];
    } catch (error) {
        console.error('Get goals error:', error);
        throw error;
    }
}

export async function updateGoal(
    userId: string,
    goalId: string,
    updates: Partial<Goal>
): Promise<Goal> {
    try {
        const { data, error } = await supabase.functions.invoke('data-api', {
            body: { goalId, ...updates, userId, resource: 'goals' },
            method: 'PUT',
        });

        if (error) throw error;
        return data.data as Goal;
    } catch (error) {
        console.error('Update goal error:', error);
        throw error;
    }
}

/**
 * Save or get alerts
 */
export async function saveAlert(
    userId: string,
    alert: HealthAlert
): Promise<HealthAlert> {
    try {
        const { data, error } = await supabase.functions.invoke('data-api', {
            body: { ...alert, userId, resource: 'alerts' },
        });

        if (error) throw error;
        return data.data as HealthAlert;
    } catch (error) {
        console.error('Save alert error:', error);
        throw error;
    }
}

export async function getAlerts(userId: string): Promise<HealthAlert[]> {
    try {
        const { data, error } = await supabase.functions.invoke('data-api', {
            body: { userId, resource: 'alerts' },
            method: 'GET',
        });

        if (error) throw error;
        return data.data as HealthAlert[];
    } catch (error) {
        console.error('Get alerts error:', error);
        throw error;
    }
}

export async function updateAlert(
    userId: string,
    alertId: string,
    updates: Partial<HealthAlert>
): Promise<HealthAlert> {
    try {
        const { data, error } = await supabase.functions.invoke('data-api', {
            body: { alertId, ...updates, userId, resource: 'alerts' },
            method: 'PUT',
        });

        if (error) throw error;
        return data.data as HealthAlert;
    } catch (error) {
        console.error('Update alert error:', error);
        throw error;
    }
}

/**
 * Get or update user profile
 */
export async function getProfile(userId: string): Promise<UserProfile> {
    try {
        const { data, error } = await supabase.functions.invoke('data-api', {
            body: { userId, resource: 'profile' },
            method: 'GET',
        });

        if (error) throw error;
        return data.data as UserProfile;
    } catch (error) {
        console.error('Get profile error:', error);
        throw error;
    }
}

export async function updateProfileData(
    userId: string,
    updates: Partial<UserProfile>
): Promise<UserProfile> {
    try {
        const { data, error } = await supabase.functions.invoke('data-api', {
            body: { ...updates, userId, resource: 'profile' },
            method: 'PUT',
        });

        if (error) throw error;
        return data.data as UserProfile;
    } catch (error) {
        console.error('Update profile error:', error);
        throw error;
    }
}

// ============================================================================
// FILE UPLOAD API - Replaces local image upload logic
// ============================================================================

/**
 * Upload and analyze image
 * @param userId User ID
 * @param fileName File name
 * @param fileBase64 Base64 encoded file
 * @param analysisType Type of analysis
 * @param bucket Storage bucket
 * @returns Analysis result with image URL
 */
export async function uploadAndAnalyzeImage(
    userId: string,
    fileName: string,
    fileBase64: string,
    analysisType: 'meal' | 'posture' | 'general' | 'ultrasound',
    bucket: string = 'meal-images'
): Promise<FileUploadResponse> {
    try {
        const { data, error } = await supabase.functions.invoke('file-upload', {
            body: {
                userId,
                fileName,
                fileBase64,
                analysisType,
                bucket,
                action: 'upload',
            },
        });

        if (error) throw error;
        return data as FileUploadResponse;
    } catch (error) {
        console.error('Upload and analyze image error:', error);
        throw error;
    }
}

/**
 * Get image analysis results
 * @param userId User ID
 * @param analysisType Optional filter by analysis type
 * @returns Array of analysis results
 */
export async function getImageAnalysisResults(
    userId: string,
    analysisType?: string
): Promise<ImageAnalysisResult[]> {
    try {
        const { data, error } = await supabase.functions.invoke('file-upload', {
            body: {
                userId,
                analysisType,
                action: 'get-results',
            },
            method: 'GET',
        });

        if (error) throw error;
        return data.results as ImageAnalysisResult[];
    } catch (error) {
        console.error('Get image analysis results error:', error);
        throw error;
    }
}
