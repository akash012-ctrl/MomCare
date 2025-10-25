import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { MotherhoodTheme } from "@/constants/theme";

const { colors } = MotherhoodTheme;

interface ExploreEmptyStateProps {
    icon: React.ComponentProps<typeof Feather>["name"];
    title: string;
    message: string;
}

export function ExploreEmptyState({ icon, title, message }: ExploreEmptyStateProps) {
    return (
        <View style={styles.container}>
            <Feather size={48} name={icon} color={colors.textSecondary} />
            <ThemedText style={styles.title}>{title}</ThemedText>
            <ThemedText style={styles.message}>{message}</ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
        marginTop: 16,
        color: colors.textPrimary,
    },
    message: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 4,
        textAlign: "center",
    },
});
