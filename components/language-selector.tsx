import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MotherhoodTheme } from "@/constants/theme";

const { colors, radii, spacing, typography, shadows } = MotherhoodTheme;

interface LanguageSelectorProps {
  selectedLanguage: "en" | "hi";
  onLanguageChange: (language: "en" | "hi") => Promise<void>;
  isLoading?: boolean;
}

export function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  isLoading = false,
}: LanguageSelectorProps) {
  const languages = useMemo(
    () => [
      { code: "en", label: "English", flag: "🇬🇧" },
      { code: "hi", label: "हिंदी", flag: "🇮🇳" },
    ],
    []
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="globe-outline" size={24} color={colors.primary} />
        <Text style={styles.title}>Language Preference</Text>
      </View>

      <View style={styles.languageGrid}>
        {languages.map((lang) => (
          <Pressable
            key={lang.code}
            onPress={async () => {
              await Haptics.selectionAsync();
              onLanguageChange(lang.code as "en" | "hi");
            }}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.languageButton,
              selectedLanguage === lang.code && styles.languageButtonActive,
              pressed && !isLoading && styles.languageButtonPressed,
              isLoading && styles.languageButtonDisabled,
            ]}
          >
            <Text style={styles.languageFlag}>{lang.flag}</Text>
            <Text
              style={[
                styles.languageLabel,
                selectedLanguage === lang.code && styles.languageLabelActive,
              ]}
            >
              {lang.label}
            </Text>
            {selectedLanguage === lang.code && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={18} color={colors.primary} />
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <Text style={styles.subtitle}>
        Choose your preferred language for chat and voice interactions
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginVertical: spacing.md,
    ...shadows.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.title,
    fontWeight: "600",
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  languageGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.md,
  },
  languageButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.mutedPink,
    backgroundColor: colors.background,
  },
  languageButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "15",
  },
  languageButtonPressed: {
    opacity: 0.7,
  },
  languageButtonDisabled: {
    opacity: 0.5,
  },
  languageFlag: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  languageLabel: {
    fontSize: typography.body,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  languageLabelActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  checkmark: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
  },
  subtitle: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
