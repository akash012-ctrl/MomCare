import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { MotherhoodTheme } from "@/constants/theme";

const { colors } = MotherhoodTheme;

export interface TabConfig {
    id: string;
    label: string;
    icon: React.ComponentProps<typeof Feather>["name"];
}

interface TabButtonProps {
    tab: TabConfig;
    isActive: boolean;
    onPress: () => void;
}

export function TabButton({ tab, isActive, onPress }: TabButtonProps) {
    return (
        <TouchableOpacity
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
            onPress={onPress}
        >
            <Feather
                size={25}
                name={tab.icon}
                color={isActive ? colors.primary : colors.textSecondary}
            />
            <ThemedText style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
            </ThemedText>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    tabButton: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        borderRadius: 8,
    },
    tabButtonActive: {
        backgroundColor: `${colors.primary}20`,
    },
    tabLabel: {
        fontSize: 11,
        marginTop: 4,
        fontWeight: "500",
        color: colors.textPrimary,
    },
    tabLabelActive: {
        fontWeight: "600",
        color: colors.primary,
    },
});
