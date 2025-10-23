import Ionicons from "@expo/vector-icons/Ionicons";
import { MotiView } from "moti";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";
import { RTCView } from "react-native-webrtc";

import { MotherhoodTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useRealtimeVoice } from "@/hooks/use-realtime-voice";
import type { ChatMessage, UserProfile } from "@/lib/supabase-api";
import {
  getConversationHistory,
  getProfile,
  sendChatMessage,
} from "@/lib/supabase-api";

import type { User } from "@/lib/types";

const { colors, radii, spacing, typography, shadows } = MotherhoodTheme;

type TabType = "chat" | "voice";
type AssistantMessage = ChatMessage & {
  id: string;
  metadata?: Record<string, unknown>;
};

function getMessageText(message: AssistantMessage): string {
  return (message.content ?? "").trim();
}

function getMessageTimestamp(message: AssistantMessage): Date {
  const metadata = message.metadata ?? {};
  const rawTimestamp =
    (metadata.timestamp as string | undefined) ??
    (metadata.createdAt as string | undefined) ??
    (metadata.created_at as string | undefined);

  if (rawTimestamp) {
    const parsed = new Date(rawTimestamp);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

function MessageBubble({
  message,
  isUser,
}: {
  message: AssistantMessage;
  isUser: boolean;
}) {
  const text = getMessageText(message);
  const timestamp = getMessageTimestamp(message);

  const markdownStyles = {
    body: {
      color: isUser ? colors.surface : colors.textPrimary,
      fontSize: typography.body,
    },
    text: {
      color: isUser ? colors.surface : colors.textPrimary,
      fontSize: typography.body,
    },
    strong: {
      color: isUser ? colors.surface : colors.textPrimary,
      fontWeight: "600" as const,
    },
    em: {
      color: isUser ? colors.surface : colors.textPrimary,
      fontStyle: "italic" as const,
    },
    heading1: {
      color: isUser ? colors.surface : colors.textPrimary,
      fontSize: 20,
      fontWeight: "700" as const,
      marginVertical: 8,
    },
    heading2: {
      color: isUser ? colors.surface : colors.textPrimary,
      fontSize: 18,
      fontWeight: "600" as const,
      marginVertical: 6,
    },
    heading3: {
      color: isUser ? colors.surface : colors.textPrimary,
      fontSize: 16,
      fontWeight: "600" as const,
      marginVertical: 4,
    },
    bullet_list: {
      marginVertical: 8,
    },
    ordered_list: {
      marginVertical: 8,
    },
    list_item: {
      flexDirection: "row" as const,
      marginVertical: 4,
    },
    bullet_list_icon: {
      marginRight: 8,
      color: isUser ? colors.surface : colors.textPrimary,
    },
    code_inline: {
      backgroundColor: isUser ? "rgba(255, 255, 255, 0.2)" : colors.surface,
      color: isUser ? colors.surface : colors.primary,
      paddingHorizontal: 4,
      borderRadius: 4,
      fontFamily: "Courier New",
    },
    code_block: {
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      padding: 8,
      borderRadius: 4,
      marginVertical: 8,
    },
    link: {
      color: colors.primary,
      textDecorationLine: "underline" as const,
    },
  };

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.85, translateY: 20 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{
        type: "timing",
        duration: 300,
        delay: 50,
      }}
      style={[styles.messageBubble, isUser && styles.userBubble]}
    >
      <View style={styles.messageBubbleContent}>
        <Markdown style={markdownStyles}>{text}</Markdown>
        <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
          {timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </MotiView>
  );
}

interface ChatInputProps {
  draft: string;
  onChangeDraft: (value: string) => void;
  onSend: () => void;
  onToggleImagePicker: () => void;
  isSubmitting: boolean;
  hasImage: boolean;
}

function ChatInput({
  draft,
  onChangeDraft,
  onSend,
  onToggleImagePicker,
  isSubmitting,
  hasImage,
}: ChatInputProps) {
  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        <Pressable
          onPress={onToggleImagePicker}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.imagePickerButton,
            pressed && styles.imagePickerButtonPressed,
            hasImage && styles.imagePickerButtonActive,
          ]}
        >
          <Ionicons
            name={hasImage ? "image" : "image-outline"}
            size={30}
            color={hasImage ? colors.primary : colors.textSecondary}
          />
        </Pressable>
        <TextInput
          value={draft}
          onChangeText={onChangeDraft}
          placeholder="Ask your doubts "
          placeholderTextColor="rgba(112, 76, 87, 0.5)"
          multiline
          maxLength={800}
          editable={!isSubmitting}
          style={styles.input}
        />
      </View>
      <MotiView
        from={{ scale: 1 }}
        animate={{ scale: isSubmitting ? 0.95 : 1 }}
        transition={{ type: "timing", duration: 100 }}
      >
        <Pressable
          onPress={onSend}
          disabled={isSubmitting || (!draft.trim() && !hasImage)}
          style={({ pressed }) => [
            styles.sendButton,
            (pressed || isSubmitting) && styles.sendButtonPressed,
            (!draft.trim() && !hasImage) || isSubmitting
              ? styles.sendButtonDisabled
              : null,
          ]}
        >
          <Ionicons
            name="send"
            size={18}
            color={
              (draft.trim() || hasImage) && !isSubmitting
                ? colors.surface
                : colors.textSecondary
            }
          />
        </Pressable>
      </MotiView>
    </View>
  );
}

function TabSelector({
  activeTab,
  onTabChange,
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}) {
  return (
    <View style={styles.tabContainer}>
      <Pressable
        onPress={() => onTabChange("chat")}
        style={[
          styles.tabButton,
          activeTab === "chat" && styles.tabButtonActive,
        ]}
      >
        <Ionicons
          name="chatbubbles"
          size={24}
          color={activeTab === "chat" ? colors.surface : colors.textSecondary}
        />
        <Text
          style={[
            styles.tabButtonText,
            activeTab === "chat" && styles.tabButtonTextActive,
          ]}
        >
          Chat Assistant
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onTabChange("voice")}
        style={[
          styles.tabButton,
          activeTab === "voice" && styles.tabButtonActive,
        ]}
      >
        <Ionicons
          name="mic"
          size={24}
          color={activeTab === "voice" ? colors.surface : colors.textSecondary}
        />
        <Text
          style={[
            styles.tabButtonText,
            activeTab === "voice" && styles.tabButtonTextActive,
          ]}
        >
          Voice Assistant
        </Text>
      </Pressable>
    </View>
  );
}

function VoiceAssistant({
  user,
  language,
}: {
  user: User | null;
  language: "en" | "hi";
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const transcriptListRef = useRef<FlatList<AssistantMessage>>(null);

  React.useEffect(() => {
    let isMounted = true;

    if (!user?.id) {
      setProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const hydrateProfile = async () => {
      try {
        setProfileLoading(true);
        const result = await getProfile(user.id);
        if (!isMounted) return;
        setProfile(result);
        setProfileError(null);
      } catch (err) {
        console.error("Failed to load profile for voice assistant:", err);
        if (isMounted) {
          setProfileError(
            err instanceof Error
              ? err.message
              : "Unable to load personalization data"
          );
        }
      } finally {
        if (isMounted) {
          setProfileLoading(false);
        }
      }
    };

    hydrateProfile();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const displayName = useMemo(() => {
    if (user?.name) {
      return user.name.split(" ")[0];
    }
    return language === "hi" ? "माँ" : "Mom";
  }, [language, user?.name]);

  const personalizedInstructions = useMemo(() => {
    const lines: string[] = [
      "You are MomCare's realtime pregnancy voice companion.",
      language === "hi"
        ? "Speak in warm, respectful Hindi that is easy to follow."
        : "Speak in warm, caring English that is easy to follow.",
      `Address the user as ${displayName}.`,
      "Offer empathetic, culturally aware guidance tailored to pregnancy wellbeing.",
      "Encourage contacting healthcare professionals for urgent or concerning symptoms.",
    ];

    if (profile?.pregnancy_week) {
      lines.push(
        `The user is in pregnancy week ${profile.pregnancy_week}. Weave in tips relevant to this stage.`
      );
    }

    if (profile?.trimester) {
      lines.push(
        `Focus on trimester ${profile.trimester} needs when suggesting care routines.`
      );
    }

    if (profile?.due_date) {
      lines.push(`Estimated due date: ${profile.due_date}.`);
    }

    if (profile?.preferences && typeof profile.preferences === "object") {
      const preferences = profile.preferences as Record<string, unknown>;
      const preferredTone = preferences.tone;
      if (typeof preferredTone === "string") {
        lines.push(`Maintain a ${preferredTone} tone as requested.`);
      }
    }

    return lines.join(" ");
  }, [displayName, language, profile]);

  const {
    status,
    transcripts,
    partialAssistantText,
    isMuted,
    isAssistantSpeaking,
    isUserSpeaking,
    error: voiceError,
    sessionDetails,
    connect,
    disconnect,
    toggleMute,
    remoteStreamUrl,
  } = useRealtimeVoice({
    language,
    instructions: personalizedInstructions,
  });

  React.useEffect(() => {
    if (!transcripts.length && !partialAssistantText) {
      return;
    }
    transcriptListRef.current?.scrollToEnd({ animated: true });
  }, [partialAssistantText, transcripts.length]);

  const voiceMessages = useMemo(() => {
    const items = transcripts.map((entry) => ({
      id: entry.id,
      role: entry.role,
      content: entry.text,
      metadata: {
        timestamp: new Date(entry.timestamp).toISOString(),
      } as Record<string, unknown>,
    }));

    if (partialAssistantText.trim().length > 0) {
      items.push({
        id: "assistant-live",
        role: "assistant",
        content: partialAssistantText,
        metadata: {
          timestamp: new Date().toISOString(),
          live: true,
        } as Record<string, unknown>,
      });
    }

    return items as AssistantMessage[];
  }, [partialAssistantText, transcripts]);

  const connecting = status === "connecting";
  const connected = status === "connected";
  const connectionBadgeLabel = connecting
    ? "Connecting"
    : connected
    ? "Connected"
    : "Offline";
  const errorMessage = voiceError ?? profileError;
  const isActivationActive =
    connected && (isAssistantSpeaking || isUserSpeaking);
  const primaryDisabled = connecting || !user?.id;
  const primaryButtonLabel = connected
    ? "End Voice Session"
    : "Start Voice Session";
  const primaryButtonIcon = connected ? "stop-circle" : "mic";

  const handlePrimaryAction = () => {
    if (!user?.id) return;

    if (connected) {
      void disconnect();
      return;
    }

    void connect().catch(() => undefined);
  };

  const personalizationSummary = useMemo(() => {
    if (profileLoading) {
      return language === "hi"
        ? "आपकी प्रोफ़ाइल लोड हो रही है..."
        : "Loading your profile details...";
    }

    if (!profile) {
      return language === "hi"
        ? "हम आपके अनुभव को व्यक्तिगत बनाने के लिए प्रोफ़ाइल बनाए रखते हैं।"
        : "We use your pregnancy profile to personalise every session.";
    }

    const facts: string[] = [];
    if (profile.pregnancy_week) {
      facts.push(`Week ${profile.pregnancy_week}`);
    }
    if (profile.trimester) {
      facts.push(`Trimester ${profile.trimester}`);
    }
    if (profile.due_date) {
      const parsed = new Date(profile.due_date);
      const dueLabel = Number.isNaN(parsed.getTime())
        ? profile.due_date
        : parsed.toLocaleDateString();
      facts.push(`Due ${dueLabel}`);
    }

    return facts.length
      ? facts.join(" • ")
      : language === "hi"
      ? "व्यक्तिगत विवरण तैयार हैं।"
      : "Personalization ready.";
  }, [language, profile, profileLoading]);

  return (
    <View style={styles.voiceContainer}>
      <View style={styles.voiceHeroCard}>
        <MotiView
          from={{ scale: 0.95, opacity: 0.85 }}
          animate={{ scale: isActivationActive ? 1.08 : 1, opacity: 1 }}
          transition={{ type: "timing", duration: 300 }}
          style={[
            styles.voiceWaveform,
            isActivationActive && styles.voiceWaveformActive,
            connected && styles.voiceWaveformConnected,
          ]}
        >
          <Ionicons
            name={connected ? (isMuted ? "mic-off" : "mic") : "mic-outline"}
            size={64}
            color={colors.surface}
          />
        </MotiView>

        <Text style={styles.voiceTitle}>Voice Assistant</Text>
        <Text style={styles.voiceSubtitle}>
          {connected
            ? `Hi ${displayName}, I am ready to listen.`
            : "Talk naturally with your AI pregnancy companion."}
        </Text>

        <View style={styles.voiceStatusRow}>
          <View
            style={[
              styles.voiceStatusChip,
              connected && styles.voiceStatusChipActive,
              connecting && styles.voiceStatusChipConnecting,
            ]}
          >
            <Ionicons
              name={connected ? "radio" : "ellipse-outline"}
              size={16}
              color={connected ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.voiceStatusChipText,
                (connected || connecting) && styles.voiceStatusChipTextActive,
              ]}
            >
              {connectionBadgeLabel}
            </Text>
          </View>

          <View
            style={[
              styles.voiceStatusChip,
              isMuted && styles.voiceStatusChipMuted,
            ]}
          >
            <Ionicons
              name={isMuted ? "volume-mute" : "volume-high"}
              size={16}
              color={isMuted ? colors.danger : colors.textSecondary}
            />
            <Text
              style={[
                styles.voiceStatusChipText,
                isMuted && styles.voiceStatusChipTextDanger,
              ]}
            >
              {isMuted ? "Muted" : "Live"}
            </Text>
          </View>

          {sessionDetails && (
            <View style={styles.voiceStatusChip}>
              <Ionicons
                name="hardware-chip-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.voiceStatusChipText}>
                {sessionDetails.model}
              </Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={handlePrimaryAction}
          disabled={primaryDisabled}
          style={({ pressed }) => [
            styles.voicePrimaryButton,
            connected && styles.voicePrimaryButtonConnected,
            primaryDisabled && styles.voicePrimaryButtonDisabled,
            pressed && !primaryDisabled && styles.voicePrimaryButtonPressed,
          ]}
        >
          {connecting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <>
              <Ionicons
                name={primaryButtonIcon as any}
                size={20}
                color={colors.surface}
              />
              <Text style={styles.voicePrimaryButtonText}>
                {primaryButtonLabel}
              </Text>
            </>
          )}
        </Pressable>

        {!user?.id && (
          <Text style={styles.voiceNote}>
            Sign in to unlock realtime voice conversations.
          </Text>
        )}
      </View>

      <View style={styles.voiceContentArea}>
        {voiceMessages.length === 0 ? (
          <View style={styles.voiceEmptyTranscripts}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={36}
              color={colors.primary}
            />
            <Text style={styles.voiceEmptyTitle}>Realtime conversation</Text>
            <Text style={styles.voiceEmptyText}>
              {connected
                ? "Start speaking whenever you are ready."
                : "Press start to begin a personalised voice session."}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={transcriptListRef}
            data={voiceMessages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble message={item} isUser={item.role === "user"} />
            )}
            contentContainerStyle={styles.voiceTranscriptList}
          />
        )}
      </View>

      {connected && (
        <View style={styles.voiceControls}>
          <Pressable
            onPress={toggleMute}
            style={({ pressed }) => [
              styles.voiceControlButton,
              pressed && styles.voiceControlButtonPressed,
            ]}
          >
            <Ionicons
              name={isMuted ? "mic-off" : "mic"}
              size={20}
              color={colors.primary}
            />
            <Text style={styles.voiceControlLabel}>
              {isMuted ? "Unmute" : "Mute"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => void disconnect()}
            style={({ pressed }) => [
              styles.voiceControlButton,
              styles.voiceControlButtonDanger,
              pressed && styles.voiceControlButtonPressed,
            ]}
          >
            <Ionicons name="close-circle" size={20} color={colors.surface} />
            <Text style={styles.voiceControlLabelDanger}>End</Text>
          </Pressable>
        </View>
      )}

      {remoteStreamUrl && (
        <RTCView
          streamURL={remoteStreamUrl}
          style={styles.voiceHiddenAudio}
          zOrder={0}
          objectFit="cover"
        />
      )}

      {errorMessage && (
        <View style={styles.voiceErrorBanner}>
          <Ionicons name="warning" size={16} color={colors.surface} />
          <Text style={styles.voiceErrorText}>{errorMessage}</Text>
        </View>
      )}

      <View style={styles.voicePersonalization}>
        <Text style={styles.voicePersonalizationTitle}>Personalization</Text>
        {profileLoading ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <Text style={styles.voicePersonalizationText}>
            {personalizationSummary}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function AssistantScreen() {
  const { user, preferredLanguage } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [draft, setDraft] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isHydrating, setIsHydrating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList<AssistantMessage>>(null);

  React.useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  // Load conversation history on mount
  React.useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      if (!user?.id || !activeConversationId) {
        return;
      }

      try {
        setIsHydrating(true);
        // Load conversation history from Edge Function
        const history = await getConversationHistory(
          user.id,
          activeConversationId
        );

        if (isMounted && history?.length) {
          const hydrated = history.map((message, index: number) => ({
            id: `${index}-${message.role}-${Date.now()}`,
            ...message,
            metadata: {
              timestamp: new Date().toISOString(),
            },
          }));

          setMessages(hydrated);
        }
      } catch (hydrateError) {
        console.error("Failed to hydrate assistant chat:", hydrateError);
      } finally {
        if (isMounted) {
          setIsHydrating(false);
        }
      }
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, [user?.id, activeConversationId]);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || !user?.id) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create user message
      const userMessage: AssistantMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        metadata: { timestamp: new Date().toISOString() },
      };

      // Update UI optimistically
      setMessages((prev) => [...prev, userMessage]);
      setDraft("");
      setSelectedImage(null);

      // Send only last 2 messages to reduce token usage
      const messageList: ChatMessage[] = messages.slice(-2).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content || "",
      }));
      messageList.push({ role: "user" as const, content: trimmed });

      const response = await sendChatMessage(
        messageList,
        user.id,
        activeConversationId || undefined,
        true, // includeMemory
        preferredLanguage // language preference
      );

      if (response?.message) {
        const assistantMessage: AssistantMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.message,
          metadata: { timestamp: new Date().toISOString() },
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setActiveConversationId(response.conversationId);
      }
    } catch (sendError) {
      console.error("Failed to send assistant message:", sendError);
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Failed to send message"
      );

      // Remove the user message if it failed
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsProcessing(false);
    }
  };

  const assistantMessages = useMemo(
    () => messages as AssistantMessage[],
    [messages]
  );

  const showEmptyState = assistantMessages.length === 0 && !isHydrating;

  const handleStop = () => {
    setIsProcessing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Pregnancy Assistant</Text>
        <Text style={styles.headerSubtitle}>
          {user?.name ? `Hi ${user.name.split(" ")[0]} ` : ""}
        </Text>
      </View>

      <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "chat" ? (
        <>
          {showEmptyState ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="chatbubble-ellipses"
                size={48}
                color={colors.primary}
              />
              <Text style={styles.emptyStateTitle}>Start a Conversation</Text>
              <Text style={styles.emptyStateText}>
                Ask anything about your pregnancy, and I will guide you step by
                step.
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={assistantMessages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              renderItem={({ item }) => (
                <MessageBubble message={item} isUser={item.role === "user"} />
              )}
              ListFooterComponent={
                isProcessing ? (
                  <MotiView
                    from={{ opacity: 0.6 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      type: "timing",
                      duration: 800,
                      loop: true,
                    }}
                    style={styles.loadingContainer}
                  >
                    <ActivityIndicator color={colors.primary} size="small" />
                    <Text style={styles.loadingLabel}>
                      MomCare is thinking...
                    </Text>
                    <Pressable onPress={handleStop} style={styles.stopButton}>
                      <Ionicons
                        name="square"
                        size={14}
                        color={colors.primary}
                      />
                      <Text style={styles.stopButtonText}>Stop</Text>
                    </Pressable>
                  </MotiView>
                ) : null
              }
            />
          )}

          {error && (
            <View style={styles.feedbackBanner}>
              <Ionicons name="warning" size={16} color={colors.primary} />
              <Text style={styles.feedbackText}>
                {error || "Something went wrong. Please try again."}
              </Text>
              <Pressable onPress={() => setError(null)}>
                <Ionicons name="close" size={18} color={colors.primary} />
              </Pressable>
            </View>
          )}

          <KeyboardAvoidingView
            behavior={Platform.select({ ios: "padding", android: undefined })}
            style={styles.keyboardAvoid}
          >
            {selectedImage && (
              <View style={styles.imagePreviewBanner}>
                <Ionicons name="image" size={16} color={colors.primary} />
                <Text style={styles.imagePreviewText}>
                  Image attached for analysis
                </Text>
                <Pressable onPress={() => setSelectedImage(null)}>
                  <Ionicons
                    name="close"
                    size={18}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>
            )}
            <ChatInput
              draft={draft}
              onChangeDraft={setDraft}
              onSend={handleSend}
              onToggleImagePicker={() => {}}
              isSubmitting={isProcessing}
              hasImage={!!selectedImage}
            />
          </KeyboardAvoidingView>
        </>
      ) : (
        <VoiceAssistant user={user} language={preferredLanguage} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F5D6DB",
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.label,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: typography.title,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 260,
  },
  messageList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  messageBubble: {
    maxWidth: "85%",
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    ...shadows.soft,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
  },
  messageBubbleContent: {
    flex: 1,
  },
  timestamp: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  userTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  loadingContainer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  stopButtonText: {
    fontSize: typography.caption,
    color: colors.primary,
    fontWeight: "500",
  },
  keyboardAvoid: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#F5D6DB",
    backgroundColor: colors.background,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  imagePickerButton: {
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  imagePickerButtonPressed: {
    opacity: 0.7,
  },
  imagePickerButtonActive: {
    backgroundColor: colors.mutedPink,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    paddingVertical: spacing.sm,
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },
  sendButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  imagePreviewBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.mutedPink,
    borderTopWidth: 1,
    borderTopColor: "#F5D6DB",
  },
  imagePreviewText: {
    flex: 1,
    fontSize: typography.label,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.mutedPink,
  },
  feedbackText: {
    flex: 1,
    fontSize: typography.caption,
    color: colors.textPrimary,
  },
  tabContainer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F5D6DB",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.surface,
  },
  voiceContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  voiceHeroCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    alignItems: "center",
    gap: spacing.md,
    ...shadows.soft,
  },
  voiceTitle: {
    fontSize: typography.headline,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  voiceSubtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  voiceNote: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
  },
  voiceWaveform: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },
  voiceWaveformActive: {
    backgroundColor: colors.secondary,
  },
  voiceWaveformConnected: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.7)",
  },
  voiceStatusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
  },
  voiceStatusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.mutedPink,
  },
  voiceStatusChipActive: {
    backgroundColor: colors.lilac,
  },
  voiceStatusChipConnecting: {
    backgroundColor: colors.peach,
  },
  voiceStatusChipMuted: {
    backgroundColor: "rgba(239, 154, 154, 0.35)",
  },
  voiceStatusChipText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  voiceStatusChipTextActive: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  voiceStatusChipTextDanger: {
    color: colors.danger,
    fontWeight: "600",
  },
  voicePrimaryButton: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    width: "100%",
    ...shadows.card,
  },
  voicePrimaryButtonConnected: {
    backgroundColor: colors.danger,
  },
  voicePrimaryButtonDisabled: {
    opacity: 0.6,
  },
  voicePrimaryButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  voicePrimaryButtonText: {
    fontSize: typography.subtitle,
    fontWeight: "600",
    color: colors.surface,
  },
  voiceContentArea: {
    flex: 1,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  voiceTranscriptList: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  voiceEmptyTranscripts: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  voiceEmptyTitle: {
    fontSize: typography.subtitle,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  voiceEmptyText: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  voiceControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.lg,
  },
  voiceControlButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  voiceControlButtonDanger: {
    backgroundColor: colors.danger,
  },
  voiceControlButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  voiceControlLabel: {
    fontSize: typography.caption,
    fontWeight: "600",
    color: colors.primary,
  },
  voiceControlLabelDanger: {
    fontSize: typography.caption,
    fontWeight: "600",
    color: colors.surface,
  },
  voiceErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.danger,
  },
  voiceErrorText: {
    flex: 1,
    fontSize: typography.caption,
    color: colors.surface,
  },
  voicePersonalization: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.mutedPink,
    gap: spacing.xs,
  },
  voicePersonalizationTitle: {
    fontSize: typography.label,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  voicePersonalizationText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  voiceHiddenAudio: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});
