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

import { MotherhoodTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import type { ChatMessage } from "@/lib/supabase-api";
import {
  getConversationHistory,
  getRealtimeToken,
  sendChatMessage,
} from "@/lib/supabase-api";

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
  userId,
  language,
}: {
  userId: string;
  language: "en" | "hi";
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Get realtime token with language preference
      const tokenResponse = await getRealtimeToken(language);

      if (!tokenResponse?.client_secret) {
        throw new Error("Failed to obtain realtime token");
      }

      // TODO: Initialize WebRTC connection with token
      // const pc = new RTCPeerConnection();
      // const dc = pc.createDataChannel("oai-events");
      // ... WebRTC setup code ...

      // For now, show a placeholder
      setTimeout(() => {
        setIsConnected(true);
        setIsConnecting(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setIsSpeaking(false);
  };

  return (
    <View style={styles.voiceContainer}>
      {!isConnected ? (
        <View style={styles.voiceEmptyState}>
          <MotiView
            from={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 200 }}
          >
            <View style={styles.micIconContainer}>
              <Ionicons name="mic-outline" size={64} color={colors.primary} />
            </View>
          </MotiView>

          <Text style={styles.voiceTitle}>Voice Assistant</Text>
          <Text style={styles.voiceSubtitle}>
            Talk naturally with your AI pregnancy assistant.{"\n"}
            Just tap the button below to start.
          </Text>

          {error && (
            <View style={styles.voiceError}>
              <Ionicons name="warning" size={16} color={colors.danger} />
              <Text style={styles.voiceErrorText}>{error}</Text>
            </View>
          )}

          <Pressable
            onPress={handleConnect}
            disabled={isConnecting}
            style={({ pressed }) => [
              styles.voiceConnectButton,
              pressed && styles.voiceConnectButtonPressed,
              isConnecting && styles.voiceConnectButtonDisabled,
            ]}
          >
            {isConnecting ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <>
                <Ionicons name="mic" size={24} color={colors.surface} />
                <Text style={styles.voiceConnectButtonText}>
                  Start Voice Chat
                </Text>
              </>
            )}
          </Pressable>

          <Text style={styles.voiceNote}>
            Note: Voice Assistant feature is currently in development
          </Text>
        </View>
      ) : (
        <View style={styles.voiceActiveState}>
          <MotiView
            from={{ scale: 1 }}
            animate={{ scale: isSpeaking ? 1.1 : 1 }}
            transition={{
              type: "timing",
              duration: 500,
              loop: isSpeaking,
            }}
            style={[
              styles.voiceWaveform,
              isSpeaking && styles.voiceWaveformActive,
            ]}
          >
            <Ionicons
              name={isSpeaking ? "mic" : "mic-outline"}
              size={80}
              color={colors.surface}
            />
          </MotiView>

          <Text style={styles.voiceStatus}>
            {isSpeaking ? "Listening..." : "Ready to listen"}
          </Text>

          <View style={styles.voiceControls}>
            <Pressable
              onPress={() => setIsSpeaking(!isSpeaking)}
              style={styles.voiceControlButton}
            >
              <Ionicons
                name={isSpeaking ? "pause" : "play"}
                size={28}
                color={colors.primary}
              />
            </Pressable>

            <Pressable
              onPress={handleDisconnect}
              style={styles.voiceDisconnectButton}
            >
              <Ionicons name="close" size={28} color={colors.danger} />
            </Pressable>
          </View>

          <Text style={styles.voiceNote}>
            This is a preview. Full functionality coming soon.
          </Text>
        </View>
      )}
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
        <VoiceAssistant userId={user?.id || ""} language={preferredLanguage} />
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
  messageText: {
    fontSize: typography.body,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  userText: {
    color: colors.surface,
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
  retryText: {
    fontSize: typography.caption,
    color: colors.primary,
    fontWeight: "600",
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  voiceEmptyState: {
    alignItems: "center",
    gap: spacing.lg,
  },
  micIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.mutedPink,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
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
  voiceError: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: "rgba(239, 154, 154, 0.1)",
  },
  voiceErrorText: {
    fontSize: typography.caption,
    color: colors.danger,
  },
  voiceConnectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    ...shadows.card,
  },
  voiceConnectButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  voiceConnectButtonDisabled: {
    opacity: 0.6,
  },
  voiceConnectButtonText: {
    fontSize: typography.subtitle,
    fontWeight: "600",
    color: colors.surface,
  },
  voiceNote: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
  },
  voiceActiveState: {
    alignItems: "center",
    gap: spacing.xl,
  },
  voiceWaveform: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  voiceWaveformActive: {
    backgroundColor: colors.secondary,
  },
  voiceStatus: {
    fontSize: typography.title,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  voiceControls: {
    flexDirection: "row",
    gap: spacing.xl,
  },
  voiceControlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  voiceDisconnectButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
});
