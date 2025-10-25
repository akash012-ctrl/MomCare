import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MotherhoodTheme } from "@/constants/theme";

const { colors, spacing, typography } = MotherhoodTheme;

interface ProfileMenuItemProps {
    icon: React.ComponentProps<typeof Feather>["name"];
    label: string;
    onPress: () => void;
    isDestructive?: boolean;
}

export function ProfileMenuItem({ icon, label, onPress, isDestructive }: ProfileMenuItemProps) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
            <View style={styles.itemLeft}>
                <Feather name={icon} size={20} color={isDestructive ? "#EF5350" : colors.primary} />
                <Text style={[styles.itemLabel, isDestructive && styles.destructiveLabel]}>{label}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    item: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: "#F5D6DB",
    },
    itemPressed: {
        backgroundColor: colors.background,
    },
    itemLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    itemLabel: {
        fontSize: typography.body,
        color: colors.textPrimary,
        fontWeight: "500",
    },
    destructiveLabel: {
        color: "#EF5350",
    },
});
