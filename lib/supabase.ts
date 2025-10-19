import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
        'Missing Supabase configuration. Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY are set in .env.local',
    );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
