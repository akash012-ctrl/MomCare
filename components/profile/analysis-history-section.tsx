import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { MotherhoodTheme } from "@/constants/theme";
import type { ImageAnalysisResult } from "@/lib/image-analysis-types";

import { HistoryEmptyState } from "./history-empty-state";
import { MealHistoryCard } from "./meal-history-card";
import { PostureHistoryCard } from "./posture-history-card";

const { colors, radii, spacing, typography, shadows } = MotherhoodTheme;

export type AnalysisTab = "meals" | "posture";

interface AnalysisHistorySectionProps {
    activeTab: AnalysisTab;
    onTabChange: (tab: AnalysisTab) => void;
    mealHistory: ImageAnalysisResult[];
    postureHistory: ImageAnalysisResult[];
    loading: boolean;
    error: string | null;
}

export function AnalysisHistorySection({
    activeTab,
    onTabChange,
    mealHistory,
    postureHistory,
    loading,
    error,
}: AnalysisHistorySectionProps) {
    const renderTabButton = (tab: AnalysisTab, label: string, emoji: string) => (
        <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => onTabChange(tab)}
        >
            <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>
                {`${emoji} ${label}`}
            </Text>
        </Pressable>
    );

    const tabButtons = [
        renderTabButton("meals", "Meals", "🍽️"),
        renderTabButton("posture", "Posture", "🧍"),
    ];

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
    } else if (activeTab === "meals") {
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
    } else {
        content = (
            <View style={styles.tabContent}>
                {postureHistory.length > 0 ? (
                    postureHistory.map((analysis) => (
                        <PostureHistoryCard key={analysis.id} analysis={analysis} />
                    ))
                ) : (
                    <HistoryEmptyState
                        title="No posture checks yet"
                        subtitle="Start checking your posture to improve alignment!"
                    />
                )}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Analysis History</Text>
            <View style={styles.tabContainer}>{tabButtons}</View>
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
    tabContainer: {
        flexDirection: "row",
        gap: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.md,
        ...shadows.soft,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        alignItems: "center",
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: "transparent",
    },
    activeTab: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    tabLabel: {
        fontSize: typography.body,
        fontWeight: "500",
        color: colors.textSecondary,
    },
    activeTabLabel: {
        color: "#fff",
        fontWeight: "600",
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
