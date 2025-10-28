import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { MotherhoodTheme } from "@/constants/theme";
import type { ImageAnalysisResult } from "@/lib/image-analysis-types";

import { HistoryEmptyState } from "./history-empty-state";
import { MealHistoryCard } from "./meal-history-card";

const { colors, radii, spacing, typography, shadows } = MotherhoodTheme;

export type AnalysisTab = "meals";

interface AnalysisHistorySectionProps {
    mealHistory: ImageAnalysisResult[];
    loading: boolean;
    error: string | null;
}

export function AnalysisHistorySection({
    mealHistory,
    loading,
    error,
}: AnalysisHistorySectionProps) {
    let content: React.ReactNode = null;

    if (loading) {
        content = (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading history...</Text>
            </View>
        );
    } else if (error) {
        content = (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    } else {
        content = (
            <View style={styles.tabContent}>
                {mealHistory.length > 0 ? (
                    mealHistory.map((analysis) => (
                        <MealHistoryCard key={analysis.id} analysis={analysis} />
                    ))
                ) : (
                    <HistoryEmptyState
                        title="No meals logged yet"
                        subtitle="Start logging your meals to track nutrition!"
                    />
                )}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Meal History</Text>
            {content}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: spacing.md,
    },
    sectionTitle: {
        fontSize: typography.subtitle,
        fontWeight: "600",
        color: colors.textPrimary,
        paddingHorizontal: spacing.md,
    },
    tabContent: {
        gap: spacing.md,
        marginTop: spacing.md,
    },
    loadingContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.xxxl,
        gap: spacing.md,
    },
    loadingText: {
        fontSize: typography.body,
        color: colors.textSecondary,
    },
    errorContainer: {
        backgroundColor: "#FFE5E5",
        borderRadius: radii.md,
        padding: spacing.lg,
        marginVertical: spacing.md,
    },
    errorText: {
        color: "#FF6B6B",
        fontSize: typography.body,
        textAlign: "center",
    },
});
