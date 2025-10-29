import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { STORAGE_KEYS } from "@/constants/storage";
import { MotherhoodTheme } from "@/constants/theme";

const { colors } = MotherhoodTheme;

export default function InitialRoute() {
    const router = useRouter();

    useEffect(() => {
        const determineInitialRoute = async () => {
            try {
                // Check if user is logged in from cache first
                const isLoggedIn = await AsyncStorage.getItem(
                    STORAGE_KEYS.isLoggedIn
                );

                // If user was logged in, go directly to tabs
                if (isLoggedIn === "true") {
                    router.replace("/(tabs)");
                    return;
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

        determineInitialRoute();
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
