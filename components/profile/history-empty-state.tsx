import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { MotherhoodTheme } from "@/constants/theme";

const { colors, radii, spacing, typography } = MotherhoodTheme;

interface HistoryEmptyStateProps {
    title: string;
    subtitle: string;
}

export function HistoryEmptyState({ title, subtitle }: HistoryEmptyStateProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
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
    title: {
        fontSize: typography.subtitle,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    subtitle: {
        fontSize: typography.label,
        color: colors.textSecondary,
        textAlign: "center",
    },
});
