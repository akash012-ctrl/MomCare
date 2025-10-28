import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { MotherhoodTheme } from "@/constants/theme";

const { colors } = MotherhoodTheme;

interface CategoryChipProps {
    category: string;
    isActive: boolean;
    onPress: () => void;
}

export function CategoryChip({ category, isActive, onPress }: CategoryChipProps) {
    return (
        <TouchableOpacity style={[styles.chip, isActive && styles.chipActive]} onPress={async () => {
            await Haptics.selectionAsync();
            onPress();
        }}>
            <ThemedText style={[styles.chipText, isActive && styles.chipTextActive]}>
                {category}
            </ThemedText>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: `${colors.secondary}50`,
    },
    chipActive: {
        backgroundColor: colors.secondary,
        borderColor: colors.secondary,
    },
    chipText: {
        fontSize: 13,
        fontWeight: "500",
        color: colors.textPrimary,
    },
    chipTextActive: {
        color: colors.surface,
        fontWeight: "600",
    },
});
