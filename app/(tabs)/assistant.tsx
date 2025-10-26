import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatAssistantTab } from "@/components/assistant/chat-tab";
import { VoiceAssistant } from "@/components/assistant/voice-assistant";
import { MotherhoodTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/lib/types";

const { colors, spacing, typography, radii, shadows } = MotherhoodTheme;

type TabType = "chat" | "voice";

export default function AssistantScreen(): React.ReactElement {
  const { user, preferredLanguage } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const language = preferredLanguage === "hi" ? "hi" : "en";

  const subtitle = useMemo(() => {
    if (language === "hi") {
      return "अपनी गर्भावस्था से जुड़े किसी भी प्रश्न पर चैट या वॉयस में सहायता प्राप्त करें।";
    }
    return "Chat or speak with MomCare for gentle support during your pregnancy.";
  }, [language]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>MomCare Assistant</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <TabSelector activeTab={activeTab} onTabChange={setActiveTab} user={user} />

        <View style={styles.tabContainer}>
          {activeTab === "chat" ? (
            <ChatAssistantTab user={user} language={language} />
          ) : (
            <VoiceAssistant user={user} language={language} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function TabSelector({
  activeTab,
  onTabChange,
  user,
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  user: User | null;
}): React.ReactElement {
  const tabs: Array<{
    key: TabType;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    disabled?: boolean;
    helperText?: string;
  }> = useMemo(
    () => [
      {
        key: "chat",
        label: "Chat",
        icon: "chatbubbles",
      },
      {
        key: "voice",
        label: "Voice",
        icon: "mic",
        disabled: !user,
        helperText: user
          ? undefined
          : "Sign in to unlock realtime voice conversations.",
      },
    ],
    [user],
  );

  const helper = useMemo(() => {
    const activeHelper = tabs.find((tab) => tab.key === activeTab)?.helperText;
    if (activeHelper) {
      return activeHelper;
    }
    return tabs.find((tab) => tab.helperText)?.helperText ?? null;
  }, [activeTab, tabs]);

  return (
    <View>
      <View style={styles.tabSwitcher}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => !tab.disabled && onTabChange(tab.key)}
              style={[
                styles.tabButton,
                isActive && styles.tabButtonActive,
                tab.disabled && styles.tabButtonDisabled,
              ]}
              accessibilityState={{ selected: isActive, disabled: tab.disabled }}
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={isActive ? colors.surface : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {helper && <Text style={styles.tabHelper}>{helper}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.display,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  tabContainer: {
    flex: 1,
    borderRadius: radii.xl,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    padding: spacing.xs,
    gap: spacing.xs,
    ...shadows.soft,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabButtonDisabled: {
    opacity: 0.55,
  },
  tabLabel: {
    fontSize: typography.label,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: colors.surface,
  },
  tabHelper: {
    marginTop: spacing.xs,
    marginHorizontal: spacing.xs,
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
});
