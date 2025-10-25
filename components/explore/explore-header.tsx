import React from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { MotherhoodTheme } from "@/constants/theme";

const { colors } = MotherhoodTheme;

interface ExploreHeaderProps {
    title: string;
    subtitle: string;
}

export function ExploreHeader({ title, subtitle }: ExploreHeaderProps) {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <ThemedText style={styles.title}>{title}</ThemedText>
                <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: 46,
        paddingBottom: 16,
        backgroundColor: colors.surface,
    },
    content: {
        marginTop: 0,
    },
    title: {
        fontSize: 32,
        fontWeight: "700",
        marginBottom: 6,
        color: colors.textPrimary,
        lineHeight: 40,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
});
