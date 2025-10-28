import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

import { MotherhoodTheme } from "@/constants/theme";

const { colors } = MotherhoodTheme;

interface ExploreSearchBarProps {
    value: string;
    placeholder?: string;
    onChangeText: (text: string) => void;
    onClear?: () => void;
}

export function ExploreSearchBar({ value, placeholder, onChangeText, onClear }: ExploreSearchBarProps) {
    const hasValue = useMemo(() => value.trim().length > 0, [value]);

    return (
        <View style={styles.container}>
            <Feather size={16} name="search" color={colors.textSecondary} />
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.textSecondary}
            />
            {hasValue ? (
                <TouchableOpacity
                    onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onClear?.();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                >
                    <Feather size={16} name="x-circle" color={colors.textSecondary} />
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 8,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: `${colors.primary}30`,
    },
    input: {
        flex: 1,
        marginHorizontal: 8,
        fontSize: 14,
        color: colors.textPrimary,
    },
});
