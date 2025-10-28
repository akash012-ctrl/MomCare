import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { MotherhoodTheme } from "@/constants/theme";

const { colors, radii, spacing, typography } = MotherhoodTheme;

interface ProgressPillProps {
  progress: number; // 0-100
  label?: string;
  color?: string;
  style?: ViewStyle;
}

export function ProgressPill({
  progress,
  label,
  color = colors.success,
  style,
}: ProgressPillProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.pillContainer}>
        <View style={styles.pillBackground}>
          <View
            style={[
              styles.pillFill,
              { width: `${clampedProgress}%`, backgroundColor: color },
            ]}
          />
        </View>
        <Text style={styles.percentage}>{Math.round(clampedProgress)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.label,
    marginBottom: spacing.xs,
  },
  percentage: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    fontWeight: "600",
    marginLeft: spacing.sm,
    minWidth: 40,
    textAlign: "right",
  },
  pillBackground: {
    backgroundColor: colors.mint,
    borderRadius: radii.full,
    flex: 1,
    height: 8,
    overflow: "hidden",
  },
  pillContainer: {
    alignItems: "center",
    flexDirection: "row",
  },
  pillFill: {
    borderRadius: radii.full,
    height: "100%",
  },
});
