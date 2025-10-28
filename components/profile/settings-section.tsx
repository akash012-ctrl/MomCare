import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MotherhoodTheme } from "@/constants/theme";

import { ProfileMenuItem } from "./profile-menu-item";

const { colors, spacing, typography, radii, shadows } = MotherhoodTheme;

interface SettingsSectionProps {
    onSignOut: () => void;
    isSigningOut?: boolean;
}

export function SettingsSection({
    onSignOut,
    isSigningOut = false,
}: SettingsSectionProps) {
    return (
        <View style={styles.container}>
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
});
