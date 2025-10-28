import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";

import { MotherhoodTheme } from "@/constants/theme";

const { colors, shadows } = MotherhoodTheme;

interface CircleIconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function CircleIconButton({
  icon,
  onPress,
  size = 24,
  color = colors.textPrimary,
  backgroundColor = colors.secondary,
  disabled = false,
  style,
}: CircleIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 999,
    height: 56,
    justifyContent: "center",
    width: 56,
    ...shadows.card,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});
