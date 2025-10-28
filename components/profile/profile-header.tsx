import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { MotherhoodTheme } from "@/constants/theme";

const { colors, spacing, typography, radii, shadows } = MotherhoodTheme;

interface ProfileHeaderProps {
    name: string;
    email?: string | null;
}

export function ProfileHeader({ name, email }: ProfileHeaderProps) {
    return (
        <View style={styles.container}>
            <View style={styles.avatarPlaceholder}>
                <Feather name="user" size={32} color={colors.secondary} />
            </View>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{name}</Text>
                {email ? <Text style={styles.userEmail}>{email}</Text> : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.xxl,
        ...shadows.card,
    },
    avatarPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.lavender,
        alignItems: "center",
        justifyContent: "center",
    },
    userInfo: {
        flex: 1,
        gap: spacing.xs,
    },
    userName: {
        fontSize: typography.title,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    userEmail: {
        fontSize: typography.label,
        color: colors.textSecondary,
    },
});
