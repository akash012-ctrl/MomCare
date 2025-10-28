import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { MotherhoodTheme } from "@/constants/theme";

const { colors, spacing, typography, radii, shadows } = MotherhoodTheme;

interface ProfileHeaderProps {
    name: string;
    email?: string | null;
    emailVerified?: boolean;
}

export function ProfileHeader({ name, email, emailVerified }: ProfileHeaderProps) {
    return (
        <View style={styles.container}>
            <View style={styles.avatarPlaceholder}>
                <Feather name="user" size={32} color={colors.secondary} />
            </View>
            <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                    <Text style={styles.userName}>{name}</Text>
                    {emailVerified !== undefined && (
                        <View style={[styles.badge, emailVerified ? styles.badgeVerified : styles.badgeUnverified]}>
                            <Feather
                                name={emailVerified ? "check-circle" : "alert-circle"}
                                size={12}
                                color={colors.surface}
                            />
                            <Text style={styles.badgeText}>
                                {emailVerified ? "Verified" : "Verification Needed"}
                            </Text>
                        </View>
                    )}
                </View>
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
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        flexWrap: "wrap",
    },
    userName: {
        fontSize: typography.title,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.full,
    },
    badgeVerified: {
        backgroundColor: colors.success,
    },
    badgeUnverified: {
        backgroundColor: colors.warning,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: "600",
        color: colors.surface,
    },
    userEmail: {
        fontSize: typography.label,
        color: colors.textSecondary,
    },
});
