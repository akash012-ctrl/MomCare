import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import "react-native-reanimated";

import { AppAlertProvider } from "@/components/ui/app-alert";
import { MotherhoodTheme, NavigationTheme } from "@/constants/theme";
import { AuthProvider } from "@/hooks/use-auth";
import { initializeDatabase } from "@/lib/storage";
import { registerBackgroundSync, unregisterBackgroundSync } from "@/lib/storage/sync-manager";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message || "An unexpected error occurred"}
          </Text>
          <Text style={errorStyles.hint}>Please restart the app</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: MotherhoodTheme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  hint: {
    fontSize: 14,
    color: "#999",
  },
});

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    initializeDatabase().catch((error) => {
      console.warn("Failed to initialize local storage", error);
    });

    registerBackgroundSync().catch((error) => {
      console.warn("Background sync registration failed", error);
    });

    return () => {
      unregisterBackgroundSync().catch((error) => {
        console.warn("Background sync unregistration failed", error);
      });
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppAlertProvider>
          <ThemeProvider value={NavigationTheme}>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="welcome" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </AppAlertProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
