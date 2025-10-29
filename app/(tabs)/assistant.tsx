import Ionicons from "@expo/vector-icons/Ionicons";
import { useNetInfo } from "@react-native-community/netinfo";
import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatAssistantTab } from "@/components/assistant/chat-tab";
import { VoiceAssistant } from "@/components/assistant/voice-assistant";
import { MotherhoodTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/lib/types";

const { colors, spacing, typography, radii, shadows } = MotherhoodTheme;

type TabType = "chat" | "voice";

const translations = {
  en: {
    title: 'MomCare Assistant',
    chatTab: 'Chat',
    voiceTab: 'Voice',
    chatOffline: 'Connect to the internet to chat with MomCare.',
    voiceOffline: 'Connect to the internet to use realtime voice conversations.',
    voiceSignIn: 'Sign in to unlock realtime voice conversations.',
  },
  hi: {
    title: 'मॉमकेयर सहायक',
    chatTab: 'चैट',
    voiceTab: 'वॉयस',
    chatOffline: 'मॉमकेयर से चैट करने के लिए इंटरनेट से कनेक्ट करें।',
    voiceOffline: 'रियलटाइम वॉयस वार्तालाप का उपयोग करने के लिए इंटरनेट से कनेक्ट करें।',
    voiceSignIn: 'रियलटाइम वॉयस वार्तालाप अनलॉक करने के लिए साइन इन करें।',
  },
};

export default function AssistantScreen(): React.ReactElement {
  const { user, preferredLanguage } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const netInfo = useNetInfo();
  const isOnline = Boolean(netInfo.isConnected && netInfo.isInternetReachable !== false);
  const language = preferredLanguage === "hi" ? "hi" : "en";
  const t = translations[language];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: "padding", android: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.title}</Text>
          </View>

          <TabSelector activeTab={activeTab} onTabChange={setActiveTab} user={user} isOnline={isOnline} translations={t} />

          <View style={styles.tabContainer}>
            {activeTab === "chat" ? (
              <ChatAssistantTab user={user} language={language} isOnline={isOnline} />
            ) : (
              <VoiceAssistant user={user} language={language} isOnline={isOnline} />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TabSelector({
  activeTab,
  onTabChange,
  user,
  isOnline,
  translations,
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  user: User | null;
  isOnline: boolean;
  translations: typeof translations.en;
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
        label: translations.chatTab,
        icon: "chatbubbles",
        disabled: !isOnline,
        helperText: isOnline
          ? undefined
          : translations.chatOffline,
      },
      {
        key: "voice",
        label: translations.voiceTab,
        icon: "mic",
        disabled: !isOnline || !user,
        helperText: !isOnline
          ? translations.voiceOffline
          : user
            ? undefined
            : translations.voiceSignIn,
      },
    ],
    [isOnline, user, translations],
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
  flex: {
    flex: 1,
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
    fontSize: typography.subtitle,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  tabContainer: {
    flex: 1,
    borderRadius: radii.xl,
    overflow: "hidden",
    backgroundColor: colors.surface,
    ...shadows.card,
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
