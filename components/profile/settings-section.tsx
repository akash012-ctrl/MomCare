import { Feather } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { MotherhoodTheme } from "@/constants/theme";

import { ProfileMenuItem } from "./profile-menu-item";

const { colors, spacing, typography, radii, shadows } = MotherhoodTheme;

interface SettingsSectionProps {
    onSignOut: () => void;
    isSigningOut?: boolean;
    emailVerified?: boolean;
    onResendVerification?: () => void;
    isResendingVerification?: boolean;
}

export function SettingsSection({
    onSignOut,
    isSigningOut = false,
    emailVerified = false,
    onResendVerification,
    isResendingVerification = false,
}: SettingsSectionProps) {
    return (
        <View style={styles.container}>
            {emailVerified === false && onResendVerification && (
                <View style={styles.verificationCard}>
                    <View style={styles.verificationHeader}>
                        <Feather name="alert-circle" size={24} color={colors.warning} />
                        <View style={styles.verificationTextContainer}>
                            <Text style={styles.verificationTitle}>Email Not Verified</Text>
                            <Text style={styles.verificationMessage}>
                                Please verify your email to access all features
                            </Text>
                        </View>
                    </View>
                    <Pressable
                        onPress={onResendVerification}
                        disabled={isResendingVerification}
                        style={({ pressed }) => [
                            styles.verifyButton,
                            pressed && !isResendingVerification && styles.verifyButtonPressed,
                            isResendingVerification && styles.verifyButtonDisabled,
                        ]}
                    >
                        {isResendingVerification ? (
                            <ActivityIndicator size="small" color={colors.surface} />
                        ) : (
                            <>
                                <Feather name="send" size={18} color={colors.surface} />
                                <Text style={styles.verifyButtonText}>
                                    Send Verification Email
                                </Text>
                            </>
                        )}
                    </Pressable>
                </View>
            )}

            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.menuList}>
                <ProfileMenuItem icon="bell" label="Notifications" onPress={() => { }} />
                <ProfileMenuItem icon="lock" label="Privacy & Security" onPress={() => { }} />
                <ProfileMenuItem icon="help-circle" label="Help & Support" onPress={() => { }} />
            </View>
            <Pressable
                onPress={onSignOut}
                disabled={isSigningOut}
                style={({ pressed }) => [
                    styles.signOutButton,
                    pressed && !isSigningOut && styles.signOutButtonPressed,
                    isSigningOut && styles.signOutButtonDisabled,
                ]}
            >
                <Text style={styles.signOutText}>
                    {isSigningOut ? "Signing out..." : "Sign Out"}
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: spacing.md,
    },
    sectionTitle: {
        fontSize: typography.subtitle,
        fontWeight: "600",
        color: colors.textPrimary,
        paddingHorizontal: spacing.md,
    },
    menuList: {
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        ...shadows.soft,
        overflow: "hidden",
    },
    signOutButton: {
        borderRadius: radii.md,
        borderWidth: 1.5,
        borderColor: "#EF5350",
        paddingVertical: spacing.lg,
        alignItems: "center",
    },
    signOutButtonPressed: {
        backgroundColor: "rgba(239, 83, 80, 0.05)",
    },
    signOutButtonDisabled: {
        opacity: 0.6,
    },
    signOutText: {
        color: "#EF5350",
        fontWeight: "600",
        fontSize: typography.subtitle,
    },
    verificationCard: {
        backgroundColor: colors.lilac,
        borderRadius: radii.lg,
        padding: spacing.lg,
        gap: spacing.md,
        borderWidth: 1,
        borderColor: colors.warning,
        ...shadows.soft,
    },
    verificationHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.md,
    },
    verificationTextContainer: {
        flex: 1,
    },
    verificationTitle: {
        fontSize: typography.subtitle,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    verificationMessage: {
        fontSize: typography.label,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    verifyButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        backgroundColor: colors.warning,
        borderRadius: radii.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        ...shadows.soft,
    },
    verifyButtonPressed: {
        opacity: 0.9,
    },
    verifyButtonDisabled: {
        opacity: 0.6,
    },
    verifyButtonText: {
        fontSize: typography.body,
        fontWeight: "600",
        color: colors.surface,
    },
});
