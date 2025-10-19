import { useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { MotherhoodTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";

const { colors } = MotherhoodTheme;

/**
 * AuthGuard Component
 *
 * Protects routes by checking authentication status and redirecting
 * unauthenticated users to the login screen.
 *
 * Handles:
 * - Loading state during auth check
 * - Automatic redirection to login for unauthenticated users
 * - Automatic redirection to tabs for authenticated users on public routes
 *
 * Usage:
 * Wrap this around your protected screens in _layout.tsx
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(tabs)";
    const inPublicRoutes = ["welcome", "login", "onboarding"].includes(
      segments[0] as string
    );

    // Redirect unauthenticated users to login
    if (!user && inAuthGroup) {
      router.replace("/login");
      return;
    }

    // Redirect authenticated users away from public routes
    if (user && inPublicRoutes) {
      router.replace("/(tabs)");
      return;
    }
  }, [user, segments, isLoading, router]);

  // Show loading screen during auth check
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
  },
});
