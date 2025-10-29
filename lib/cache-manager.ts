import { STORAGE_KEYS } from "@/constants/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Cache Manager for optimized app performance
 * Stores and retrieves user session data from local storage
 */

export interface CachedUserSession {
    isLoggedIn: boolean;
    userId: string | null;
    userEmail: string | null;
}

/**
 * Get cached user session for instant app loading
 */
export async function getCachedUserSession(): Promise<CachedUserSession> {
    try {
        const [isLoggedIn, userId, userEmail] = await AsyncStorage.multiGet([
            STORAGE_KEYS.isLoggedIn,
            STORAGE_KEYS.userId,
            STORAGE_KEYS.userEmail,
        ]);

        return {
            isLoggedIn: isLoggedIn[1] === "true",
            userId: userId[1],
            userEmail: userEmail[1],
        };
    } catch (error) {
        console.error("Error getting cached user session:", error);
        return {
            isLoggedIn: false,
            userId: null,
            userEmail: null,
        };
    }
}

/**
 * Cache user session data
 */
export async function cacheUserSession(
    userId: string,
    userEmail: string
): Promise<void> {
    try {
        await AsyncStorage.multiSet([
            [STORAGE_KEYS.isLoggedIn, "true"],
            [STORAGE_KEYS.userId, userId],
            [STORAGE_KEYS.userEmail, userEmail],
        ]);
    } catch (error) {
        console.error("Error caching user session:", error);
    }
}

/**
 * Clear cached user session
 */
export async function clearCachedUserSession(): Promise<void> {
    try {
        await AsyncStorage.multiRemove([
            STORAGE_KEYS.isLoggedIn,
            STORAGE_KEYS.userId,
            STORAGE_KEYS.userEmail,
        ]);
    } catch (error) {
        console.error("Error clearing cached user session:", error);
    }
}

/**
 * Check if user has valid cached session
 */
export async function hasValidCachedSession(): Promise<boolean> {
    try {
        const isLoggedIn = await AsyncStorage.getItem(STORAGE_KEYS.isLoggedIn);
        return isLoggedIn === "true";
    } catch (error) {
        console.error("Error checking cached session:", error);
        return false;
    }
}
