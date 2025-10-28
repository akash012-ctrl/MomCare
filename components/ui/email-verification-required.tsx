import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { MotherhoodTheme } from "@/constants/theme";

const { colors, radii, spacing, typography, shadows } = MotherhoodTheme;

interface EmailVerificationRequiredProps {
    message?: string;
    showNavigateButton?: boolean;
    isResending?: boolean;
    onResendEmail?: () => void;
}

export const EmailVerificationRequired: React.FC<
    EmailVerificationRequiredProps
> = ({
    message = "Please verify your email to access this feature.",
    showNavigateButton = true,
    isResending = false,
    onResendEmail,
}) => {
        const router = useRouter();

        const handleNavigateToProfile = () => {
            router.push("/(tabs)/profile");
        };

        return (
            <View style={styles.container}>
                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <Feather name="mail" size={48} color={colors.warning} />
                    </View>

                    <Text style={styles.title}>Email Verification Required</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.infoBox}>
                        <Feather name="info" size={16} color={colors.secondary} />
                        <Text style={styles.infoText}>
                            Check your inbox for the verification link. Don't forget to check
                            your spam folder.
                        </Text>
                    </View>

                    {onResendEmail && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.resendButton,
                                pressed && styles.resendButtonPressed,
                                isResending && styles.resendButtonDisabled,
                            ]}
                            onPress={onResendEmail}
                            disabled={isResending}
                        >
                            {isResending ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <>
                                    <Feather name="send" size={18} color={colors.primary} />
                                    <Text style={styles.resendButtonText}>
                                        Resend Verification Email
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    )}

                    {showNavigateButton && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.navigateButton,
                                pressed && styles.navigateButtonPressed,
                            ]}
                            onPress={handleNavigateToProfile}
                        >
                            <Text style={styles.navigateButtonText}>Go to Profile</Text>
                            <Feather name="arrow-right" size={18} color={colors.surface} />
                        </Pressable>
                    )}
                </View>
            </View>
        );
    };

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.xl,
        backgroundColor: colors.background,
    },
    card: {
        width: "100%",
        maxWidth: 400,
        backgroundColor: colors.surface,
        borderRadius: radii.xl,
        padding: spacing.xxl,
        alignItems: "center",
        gap: spacing.lg,
        ...shadows.card,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.lilac,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.md,
    },
    title: {
        fontSize: typography.title,
        fontWeight: "700",
        color: colors.textPrimary,
        textAlign: "center",
    },
    message: {
        fontSize: typography.body,
        color: colors.textSecondary,
        textAlign: "center",
        lineHeight: 22,
    },
    infoBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: colors.background,
        borderRadius: radii.md,
        padding: spacing.md,
        gap: spacing.sm,
        width: "100%",
    },
    infoText: {
        flex: 1,
        fontSize: typography.label,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    resendButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.primary,
        backgroundColor: colors.surface,
        width: "100%",
    },
    resendButtonPressed: {
        opacity: 0.7,
    },
    resendButtonDisabled: {
        opacity: 0.5,
    },
    resendButtonText: {
        fontSize: typography.body,
        fontWeight: "600",
        color: colors.primary,
    },
    navigateButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: radii.md,
        backgroundColor: colors.primary,
        width: "100%",
        ...shadows.soft,
    },
    navigateButtonPressed: {
        opacity: 0.9,
    },
    navigateButtonText: {
        fontSize: typography.body,
        fontWeight: "600",
        color: colors.surface,
    },
});
