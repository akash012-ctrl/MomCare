import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { MotherhoodTheme } from "@/constants/theme";
import type { ImageAnalysisResult, MealAnalysisResult } from "@/lib/image-analysis-types";

const { colors, radii, spacing, typography } = MotherhoodTheme;

interface MealHistoryCardProps {
    analysis: ImageAnalysisResult;
}

export function MealHistoryCard({ analysis }: MealHistoryCardProps) {
    const mealData = analysis.result as MealAnalysisResult;
    const date = new Date(analysis.created_at).toLocaleDateString();

    return (
        <View style={styles.container}>
            {analysis.image_url ? (
                <Image source={{ uri: analysis.image_url }} style={styles.image} />
            ) : null}
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.date}>{date}</Text>
                    <Text style={styles.calories}>{mealData?.total_calories || 0} cal</Text>
                </View>
                {mealData?.foods && mealData.foods.length > 0 ? (
                    <Text style={styles.foods}>
                        {mealData.foods.map((food) => food.name).join(", ")}
                    </Text>
                ) : null}
                {mealData?.recommendation ? (
                    <Text style={styles.recommendation}>{mealData.recommendation}</Text>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        alignItems: "center",
        gap: spacing.md,
        ...MotherhoodTheme.shadows.soft,
    },
    image: {
        width: "100%",
        height: 150,
        borderRadius: radii.md,
        marginBottom: spacing.md,
    },
    content: {
        gap: spacing.sm,
        alignSelf: "stretch",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    date: {
        fontSize: typography.label,
        color: colors.textSecondary,
        fontWeight: "600",
    },
    calories: {
        fontSize: typography.subtitle,
        color: colors.primary,
        fontWeight: "700",
    },
    foods: {
        fontSize: typography.body,
        color: colors.textPrimary,
        fontWeight: "500",
    },
    recommendation: {
        fontSize: typography.label,
        color: colors.textSecondary,
        fontStyle: "italic",
    },
});
