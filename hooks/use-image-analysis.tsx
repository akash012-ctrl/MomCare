import {
  ImageAnalysisResult,
  MealAnalysisResult,
  PostureAnalysisResult,
} from "@/lib/image-analysis-types";
import { uploadAndAnalyzeImage } from "@/lib/supabase-api";
import { useCallback, useState } from "react";
import { useAuth } from "./use-auth";

interface UseImageAnalysisState {
  loading: boolean;
  success: boolean;
  error: string | null;
  result: ImageAnalysisResult | null;
  uploadUrl: string | null;
  progress: number; // 0-100
}

interface UseImageAnalysisReturn extends UseImageAnalysisState {
  analyzeImage: (
    base64: string,
    mimeType: string,
    analysisType: "meal" | "posture" | "general" | "ultrasound",
    width: number,
    height: number
  ) => Promise<void>;
  reset: () => void;
}

export function useImageAnalysis(): UseImageAnalysisReturn {
  const { user } = useAuth();
  const [state, setState] = useState<UseImageAnalysisState>({
    loading: false,
    success: false,
    error: null,
    result: null,
    uploadUrl: null,
    progress: 0,
  });

  const reset = useCallback(() => {
    setState({
      loading: false,
      success: false,
      error: null,
      result: null,
      uploadUrl: null,
      progress: 0,
    });
  }, []);

  const analyzeImage = useCallback(
    async (
      base64: string,
      mimeType: string,
      analysisType: "meal" | "posture" | "general" | "ultrasound",
      width: number,
      height: number
    ) => {
      setState({
        loading: true,
        success: false,
        error: null,
        result: null,
        uploadUrl: null,
        progress: 0,
      });

      try {
        if (!user?.id) {
          throw new Error("User not authenticated");
        }

        setState((prev) => ({ ...prev, progress: 10 }));

        // Call Edge Function via supabase-api (single unified call)
        const response = await uploadAndAnalyzeImage(
          user.id,
          base64,
          mimeType,
          analysisType
        );

        setState((prev) => ({ ...prev, progress: 70 }));

        // Create analysis result
        const analysisResult: ImageAnalysisResult = {
          id:
            response.resultId ||
            `${Date.now()}-${Math.random().toString(36).substring(7)}`,
          user_id: user.id,
          image_url: response.imageUrl,
          storage_path: response.imageUrl,
          analysis_type: analysisType,
          result: response.analysis,
          confidence: 0.95,
          model_used: "gpt-4o",
          tokens_used: response.tokensUsed || 0,
          error_message: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setState({
          loading: false,
          success: true,
          error: null,
          result: analysisResult,
          uploadUrl: response.imageUrl,
          progress: 100,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        setState({
          loading: false,
          success: false,
          error: errorMessage,
          result: null,
          uploadUrl: null,
          progress: 0,
        });
      }
    },
    [user?.id]
  );

  return {
    ...state,
    analyzeImage,
    reset,
  };
}

// Typed analysis result accessors
export function useMealAnalysisResult(
  result: ImageAnalysisResult | null
): MealAnalysisResult | null {
  if (!result || result.analysis_type !== "meal") {
    return null;
  }
  return result.result as MealAnalysisResult;
}

export function usePostureAnalysisResult(
  result: ImageAnalysisResult | null
): PostureAnalysisResult | null {
  if (!result || result.analysis_type !== "posture") {
    return null;
  }
  return result.result as PostureAnalysisResult;
}
