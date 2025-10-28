import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { MotherhoodTheme } from "@/constants/theme";

const { colors, radii, shadows, spacing } = MotherhoodTheme;

interface RoundedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "primary" | "secondary";
}

export function RoundedCard({
  children,
  style,
  variant = "default",
}: RoundedCardProps) {
  return <View style={[styles.card, styles[variant], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  default: {
    backgroundColor: colors.surface,
  },
  primary: {
    backgroundColor: colors.mint,
    borderColor: colors.success,
    borderWidth: 1,
  },
  secondary: {
    backgroundColor: colors.lavender,
    borderColor: colors.secondary,
    borderWidth: 1,
  },
});
