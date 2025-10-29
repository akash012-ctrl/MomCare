import * as Haptics from "expo-haptics";
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
    const handleNotifications = () => {
        Haptics.selectionAsync();
        // TODO: Implement notifications settings
        console.log("Notifications settings - Coming soon");
    };

    const handlePrivacy = () => {
        Haptics.selectionAsync();
        // TODO: Implement privacy & security settings
        console.log("Privacy & Security settings - Coming soon");
    };

    const handleHelp = () => {
        Haptics.selectionAsync();
        // TODO: Implement help & support
        console.log("Help & Support - Coming soon");
    };

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.menuList}>
                <ProfileMenuItem icon="bell" label="Notifications" onPress={handleNotifications} />
                <ProfileMenuItem icon="lock" label="Privacy & Security" onPress={handlePrivacy} />
                <ProfileMenuItem icon="help-circle" label="Help & Support" onPress={handleHelp} />
            </View>
            <Pressable
                onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    onSignOut();
                }}
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
