import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
        'Missing Supabase configuration. Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY are set.'
    );
}

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
    // If already initialized, return it
    if (supabaseInstance) return supabaseInstance;

    // Only initialize on runtime (not during build)
    if (typeof window === 'undefined') {
        // We're in a Node/EAS build environment
        // Return a stub client to prevent crashes
        return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                storage: {
                    getItem: async () => null,
                    setItem: async () => { },
                    removeItem: async () => { },
                },
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }

    // Runtime: React Native environment
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;

    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    });

    return supabaseInstance;
};

// Lazy-loaded export for backward compatibility
export const supabase = new Proxy({}, {
    get: (target, prop) => {
        const client = getSupabase();
        return (client as any)[prop];
    },
}) as SupabaseClient;