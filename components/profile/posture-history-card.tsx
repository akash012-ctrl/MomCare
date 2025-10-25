import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { MotherhoodTheme } from "@/constants/theme";
import type { ImageAnalysisResult, PostureAnalysisResult } from "@/lib/image-analysis-types";

const { colors, radii, spacing, typography } = MotherhoodTheme;

interface PostureHistoryCardProps {
    analysis: ImageAnalysisResult;
}

function getScoreColor(score: number | undefined) {
    if (typeof score !== "number") {
        return "#FF4D4F";
    }

    if (score >= 75) return "#52C41A";
    if (score >= 50) return "#FAAD14";
    return "#FF4D4F";
}

function getStatusLabel(isSafe: boolean | undefined) {
    if (typeof isSafe === "undefined") {
        return null;
    }
    return `Status: ${isSafe ? "✅ Safe" : "⚠️ Needs Work"}`;
}

function getPrimaryRecommendation(recommendations: string[] | undefined) {
    if (!recommendations || recommendations.length === 0) {
        return null;
    }
    return recommendations[0];
}

export function PostureHistoryCard({ analysis }: PostureHistoryCardProps) {
    const postureData = analysis.result as PostureAnalysisResult;
    const date = new Date(analysis.created_at).toLocaleDateString();
    const scoreColor = getScoreColor(postureData?.posture_score);
    const statusLabel = getStatusLabel(postureData?.safe_to_perform);
    const primaryRecommendation = getPrimaryRecommendation(postureData?.recommendations);

    return (
        <View style={styles.container}>
            {analysis.image_url ? (
                <Image source={{ uri: analysis.image_url }} style={styles.image} />
            ) : null}
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.date}>{date}</Text>
                    <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
                        <Text style={styles.scoreText}>{postureData?.posture_score || 0}</Text>
                    </View>
                </View>
                {statusLabel ? <Text style={styles.safety}>{statusLabel}</Text> : null}
                {primaryRecommendation ? (
                    <Text style={styles.recommendation}>{primaryRecommendation}</Text>
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
    scoreBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    scoreText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: typography.subtitle,
    },
    safety: {
        fontSize: typography.label,
        color: colors.textSecondary,
    },
    recommendation: {
        fontSize: typography.label,
        color: colors.textSecondary,
    },
});
