import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { MotherhoodTheme } from "@/constants/theme";

const { colors, radii, spacing, typography } = MotherhoodTheme;

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: "default" | "primary" | "secondary";
  style?: ViewStyle;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = "default",
  style,
}: StatCardProps) {
  return (
    <View style={[styles.container, styles[variant], style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, styles[`${variant}Value`]]}>{value}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    flexDirection: "row",
    padding: spacing.md,
  },
  content: {
    flex: 1,
  },
  default: {
    backgroundColor: colors.surface,
  },
  defaultValue: {
    color: colors.textPrimary,
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  primary: {
    backgroundColor: colors.mint,
  },
  primaryValue: {
    color: colors.success,
  },
  secondary: {
    backgroundColor: colors.lavender,
  },
  secondaryValue: {
    color: colors.secondary,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  title: {
    color: colors.textSecondary,
    fontSize: typography.label,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: typography.headline,
    fontWeight: "700",
  },
});
