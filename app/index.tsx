import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { STORAGE_KEYS } from "@/constants/storage";
import { MotherhoodTheme } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

const { colors } = MotherhoodTheme;

export default function InitialRoute() {
    const router = useRouter();

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;

        const determineInitialRoute = async () => {
            try {
                // Check if user is logged in from cache first
                const isLoggedIn = await AsyncStorage.getItem(
                    STORAGE_KEYS.isLoggedIn
                );

                // Verify with Supabase session to ensure cache is valid
                const { data: { session } } = await supabase.auth.getSession();

                // If both cache and session exist, go directly to tabs
                if (isLoggedIn === "true" && session) {
                    router.replace("/(tabs)");
                    return;
                }

                // If cache says logged in but no session, clear cache and show login
                if (isLoggedIn === "true" && !session) {
                    await AsyncStorage.removeItem(STORAGE_KEYS.isLoggedIn);
                    await AsyncStorage.removeItem(STORAGE_KEYS.userId);
                    await AsyncStorage.removeItem(STORAGE_KEYS.userEmail);
                }

                // Check if user has completed onboarding
                const hasCompleted = await AsyncStorage.getItem(
                    STORAGE_KEYS.hasCompletedOnboarding
                );

                if (hasCompleted) {
                    router.replace("/welcome");
                    return;
                }

                router.replace("/onboarding");
            } catch (error) {
                console.error("Failed to determine initial route:", error);
                router.replace("/welcome");
            }
        };

        // Set a timeout fallback in case something hangs
        timeoutId = setTimeout(() => {
            console.warn("Initial route determination timed out, defaulting to welcome");
            router.replace("/welcome");
        }, 5000);

        determineInitialRoute().finally(() => {
            clearTimeout(timeoutId);
        });

        return () => clearTimeout(timeoutId);
    }, [router]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
    },
});
