import { useCallback, useMemo, useRef, useState } from "react";

/**
 * Retry Configuration
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  backoffMultiplier: 2,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  maxRetries: 3,
};

/**
 * Chat Error Types
 */
export type ChatErrorType =
  | "network"
  | "server"
  | "timeout"
  | "rate_limit"
  | "unknown";

export interface ChatError {
  type: ChatErrorType;
  message: string;
  retryable: boolean;
  originalError?: Error;
}

/**
 * Determines error type and whether it's retryable
 */
function classifyError(error: Error): ChatError {
  const message = error.message.toLowerCase();

  // Network errors
  if (
    message.includes("network") ||
    message.includes("fetch failed") ||
    message.includes("connection")
  ) {
    return {
      message: "Network error. Please check your connection.",
      retryable: true,
      type: "network",
      originalError: error,
    };
  }

  // Timeout errors
  if (message.includes("timeout") || message.includes("timed out")) {
    return {
      message: "Request timed out. Please try again.",
      retryable: true,
      type: "timeout",
      originalError: error,
    };
  }

  // Rate limit errors
  if (message.includes("rate limit") || message.includes("429")) {
    return {
      message: "Too many requests. Please wait a moment.",
      retryable: true,
      type: "rate_limit",
      originalError: error,
    };
  }

  // Server errors (5xx)
  if (message.includes("500") || message.includes("503")) {
    return {
      message: "Server error. Please try again in a moment.",
      retryable: true,
      type: "server",
      originalError: error,
    };
  }

  // Client errors (4xx) - generally not retryable
  if (message.includes("400") || message.includes("401")) {
    return {
      message: "Invalid request. Please try rephrasing your message.",
      retryable: false,
      type: "unknown",
      originalError: error,
    };
  }

  // Unknown error
  return {
    message: "An unexpected error occurred. Please try again.",
    retryable: true,
    type: "unknown",
    originalError: error,
  };
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(
  attemptNumber: number,
  config: RetryConfig
): number {
  const delay =
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attemptNumber);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Enhanced chat hook with error handling and retry logic
 *
 * Wraps the AI SDK useChat hook with:
 * - Automatic retry with exponential backoff
 * - Error classification (network, server, timeout, etc.)
 * - User-friendly error messages
 * - Retry attempt tracking
 *
 * Usage:
 * ```tsx
 * const { chatError, retryCount, retry } = useChatWithRetry({
 *   onError: (error) => console.error("Chat error:", error),
 *   retryConfig: { maxRetries: 3 }
 * });
 * ```
 */
export interface UseChatWithRetryOptions {
  onError?: (error: ChatError) => void;
  retryConfig?: Partial<RetryConfig>;
}

export interface UseChatWithRetryState {
  chatError: ChatError | null;
  retryCount: number;
  isRetrying: boolean;
  retry: () => Promise<void>;
  clearError: () => void;
}

export function useChatWithRetry(
  options: UseChatWithRetryOptions = {}
): UseChatWithRetryState {
  const [chatError, setChatError] = useState<ChatError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const lastFailedActionRef = useRef<(() => Promise<void>) | null>(null);

  const config: RetryConfig = useMemo(
    () => ({
      ...DEFAULT_RETRY_CONFIG,
      ...options.retryConfig,
    }),
    [options.retryConfig]
  );

  const handleError = useCallback(
    (error: Error, action?: () => Promise<void>) => {
      const classified = classifyError(error);
      setChatError(classified);

      if (action) {
        lastFailedActionRef.current = action;
      }

      if (options.onError) {
        options.onError(classified);
      }

      console.error("Chat error:", {
        classified,
        originalError: error,
        retryCount,
      });
    },
    [options, retryCount]
  );

  const retry = useCallback(async () => {
    if (!lastFailedActionRef.current) {
      console.warn("No action to retry");
      return;
    }

    if (!chatError?.retryable) {
      console.warn("Error is not retryable");
      return;
    }

    if (retryCount >= config.maxRetries) {
      console.warn("Max retries exceeded");
      return;
    }

    setIsRetrying(true);
    const delay = calculateBackoffDelay(retryCount, config);

    try {
      // Wait with exponential backoff
      await sleep(delay);

      // Retry the action
      await lastFailedActionRef.current();

      // Success - clear error and reset retry count
      setChatError(null);
      setRetryCount(0);
      lastFailedActionRef.current = null;
    } catch (error) {
      // Retry failed - increment count
      setRetryCount((prev) => prev + 1);
      handleError(error as Error, lastFailedActionRef.current ?? undefined);
    } finally {
      setIsRetrying(false);
    }
  }, [chatError, retryCount, config, handleError]);

  const clearError = useCallback(() => {
    setChatError(null);
    setRetryCount(0);
    lastFailedActionRef.current = null;
  }, []);

  return {
    chatError,
    clearError,
    isRetrying,
    retry,
    retryCount,
  };
}

/**
 * Wrapper function for executing chat operations with retry logic
 *
 * Usage:
 * ```tsx
 * await withRetry(
 *   async () => {
 *     await sendMessage({ content: "Hello" });
 *   },
 *   {
 *     onError: (error) => setError(error.message),
 *     retryConfig: { maxRetries: 3 }
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
  action: () => Promise<T>,
  options: UseChatWithRetryOptions = {}
): Promise<T | null> {
  const config: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...options.retryConfig,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;
      const classified = classifyError(lastError);

      console.error(`Attempt ${attempt + 1} failed:`, classified);

      // Don't retry if error is not retryable or max retries reached
      if (!classified.retryable || attempt >= config.maxRetries) {
        if (options.onError) {
          options.onError(classified);
        }
        throw lastError;
      }

      // Wait before retrying
      const delay = calculateBackoffDelay(attempt, config);
      await sleep(delay);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError;
}
