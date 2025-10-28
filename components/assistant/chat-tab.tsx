import Ionicons from "@expo/vector-icons/Ionicons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { MotiView } from "moti";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";

import { ChatInput } from "@/components/assistant/chat-input";
import { MessageBubble } from "@/components/assistant/message-bubble";
import type {
    AssistantMessage,
    ChatAttachmentPreview,
} from "@/components/assistant/types";
import { MotherhoodTheme } from "@/constants/theme";
import type { ChatMessage } from "@/lib/supabase-api";
import {
    getConversationHistory,
    sendChatMessage,
    uploadChatAttachment,
} from "@/lib/supabase-api";
import type { User } from "@/lib/types";

const { colors, spacing, typography, radii, shadows } = MotherhoodTheme;

const MAX_ATTACHMENT_SIZE_BYTES = 12 * 1024 * 1024; // 12 MB
const MAX_ATTACHMENTS_PER_MESSAGE = 3;
const ATTACHMENT_SIZE_LIMIT_LABEL = `${Math.round(
    MAX_ATTACHMENT_SIZE_BYTES / 1024 / 1024,
)}MB`;

const EXTENSION_MIME_MAP: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".heic": "image/heic",
    ".webp": "image/webp",
};

function resolveMimeType(
    mimeType?: string | null,
    fileName?: string | null,
): string {
    if (mimeType && mimeType !== "application/octet-stream") {
        return mimeType;
    }

    if (!fileName) {
        return mimeType ?? "application/octet-stream";
    }

    const lowerName = fileName.toLowerCase();
    const matchedEntry = Object.entries(EXTENSION_MIME_MAP).find(([ext]) =>
        lowerName.endsWith(ext),
    );

    if (matchedEntry) {
        return matchedEntry[1];
    }

    return mimeType ?? "application/octet-stream";
}

function isSupportedAttachmentType(mimeType: string): boolean {
    return mimeType === "application/pdf" || mimeType.startsWith("image/");
}

async function readFileAsBase64(uri: string): Promise<string> {
    return FileSystem.readAsStringAsync(uri, { encoding: "base64" });
}

async function getAssetSize(uri: string, fallback?: number): Promise<number> {
    if (typeof fallback === "number" && fallback > 0) {
        return fallback;
    }

    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists && typeof info.size === "number") {
        return info.size;
    }

    return 0;
}

interface ConversationState {
    activeConversationId: string | null;
    setActiveConversationId: (id: string | null) => void;
    messages: AssistantMessage[];
    setMessages: React.Dispatch<React.SetStateAction<AssistantMessage[]>>;
    isHydrating: boolean;
}

function useConversationState(user: User | null): ConversationState {
    const [activeConversationId, setActiveConversationId] = useState<string | null>(
        null,
    );
    const [messages, setMessages] = useState<AssistantMessage[]>([]);
    const [isHydrating, setIsHydrating] = useState(false);

    useEffect(() => {
        setMessages([]);
        setActiveConversationId(null);
    }, [user?.id]);

    useEffect(() => {
        let cancelled = false;

        if (!user?.id || !activeConversationId) {
            return () => {
                cancelled = true;
            };
        }

        const hydrateConversation = async () => {
            try {
                setIsHydrating(true);
                const history = await getConversationHistory(
                    user.id,
                    activeConversationId,
                );

                if (cancelled || !Array.isArray(history) || history.length === 0) {
                    return;
                }

                const hydrated: AssistantMessage[] = history.map((message, index) => ({
                    id: `${index}-${message.role}-${Date.now()}`,
                    ...message,
                    metadata: {
                        timestamp: new Date().toISOString(),
                    },
                }));

                setMessages(hydrated);
            } catch (hydrateError) {
                console.error("Failed to hydrate assistant chat:", hydrateError);
            } finally {
                if (!cancelled) {
                    setIsHydrating(false);
                }
            }
        };

        void hydrateConversation();

        return () => {
            cancelled = true;
        };
    }, [user?.id, activeConversationId]);

    return {
        activeConversationId,
        setActiveConversationId,
        messages,
        setMessages,
        isHydrating,
    };
}

interface AttachmentController {
    attachments: ChatAttachmentPreview[];
    readyAttachments: ChatAttachmentPreview[];
    isAttachmentUploading: boolean;
    attachmentLimitReached: boolean;
    pickAttachment: () => Promise<void>;
    removeAttachment: (id: string) => void;
    reset: () => void;
}

function useAttachmentController({
    user,
    activeConversationId,
    setError,
}: {
    user: User | null;
    activeConversationId: string | null;
    setError: (value: string | null) => void;
}): AttachmentController {
    const [attachments, setAttachments] = useState<ChatAttachmentPreview[]>([]);
    const [isAttachmentUploading, setIsAttachmentUploading] = useState(false);

    const readyAttachments = useMemo(
        () => attachments.filter((attachment) => attachment.status === "ready"),
        [attachments],
    );
    const attachmentLimitReached =
        attachments.length >= MAX_ATTACHMENTS_PER_MESSAGE;

    const removeAttachment = useCallback((attachmentId: string) => {
        setAttachments((prev) =>
            prev.filter((attachment) => attachment.id !== attachmentId),
        );
    }, []);

    const pickAttachment = useCallback(async () => {
        if (isAttachmentUploading) {
            return;
        }

        if (!user?.id) {
            setError("Please sign in to share documents.");
            return;
        }

        if (attachmentLimitReached) {
            setError(
                `You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`,
            );
            return;
        }

        try {
            setError(null);
            const result = await DocumentPicker.getDocumentAsync({
                type: ["image/*", "application/pdf"],
                multiple: false,
                copyToCacheDirectory: true,
            });

            if (result.canceled) {
                return;
            }

            const asset = result.assets?.[0];
            if (!asset || !asset.uri) {
                setError("Unable to read the selected file.");
                return;
            }

            const fileName = asset.name ?? `attachment-${Date.now()}`;
            const mimeType = resolveMimeType(asset.mimeType, fileName);

            if (!isSupportedAttachmentType(mimeType)) {
                setError("Unsupported file type. Please choose an image or PDF.");
                return;
            }

            const fileSize = await getAssetSize(asset.uri, asset.size);
            if (fileSize > MAX_ATTACHMENT_SIZE_BYTES) {
                setError(`File must be under ${ATTACHMENT_SIZE_LIMIT_LABEL}.`);
                return;
            }

            const localId = `pending-${Date.now()}`;
            setAttachments((prev) => [
                ...prev,
                {
                    id: localId,
                    title: fileName,
                    fileUrl: asset.uri,
                    mimeType,
                    status: "uploading",
                },
            ]);
            setIsAttachmentUploading(true);

            try {
                const fileBase64 = await readFileAsBase64(asset.uri);

                const uploadResult = await uploadChatAttachment({
                    userId: user.id,
                    conversationId: activeConversationId ?? undefined,
                    fileName,
                    fileBase64,
                    mimeType,
                });

                setAttachments((prev) =>
                    prev.map((attachment) =>
                        attachment.id === localId
                            ? {
                                ...attachment,
                                id: uploadResult.documentId,
                                fileUrl: uploadResult.fileUrl,
                                title: uploadResult.title ?? attachment.title,
                                summary: uploadResult.summary ?? attachment.summary,
                                status: "ready",
                            }
                            : attachment,
                    ),
                );
            } catch (uploadError) {
                console.error("Chat attachment upload failed", uploadError);
                setAttachments((prev) =>
                    prev.filter((attachment) => attachment.id !== localId),
                );
                setError(
                    uploadError instanceof Error
                        ? uploadError.message
                        : "Failed to upload attachment",
                );
            } finally {
                setIsAttachmentUploading(false);
            }
        } catch (pickerError) {
            console.error("Document picker error", pickerError);
            setError(
                pickerError instanceof Error
                    ? pickerError.message
                    : "Failed to open document picker",
            );
        }
    }, [
        activeConversationId,
        attachmentLimitReached,
        isAttachmentUploading,
        setError,
        user?.id,
    ]);

    const reset = useCallback(() => {
        setAttachments([]);
    }, []);

    return {
        attachments,
        readyAttachments,
        isAttachmentUploading,
        attachmentLimitReached,
        pickAttachment,
        removeAttachment,
        reset,
    };
}

interface ComposerController {
    isProcessing: boolean;
    handleSend: () => Promise<void>;
    handleStop: () => void;
}

function useChatComposer({
    user,
    language,
    draft,
    setDraft,
    conversation,
    attachments,
    setError,
}: {
    user: User | null;
    language: "en" | "hi";
    draft: string;
    setDraft: React.Dispatch<React.SetStateAction<string>>;
    conversation: ConversationState;
    attachments: AttachmentController;
    setError: (value: string | null) => void;
}): ComposerController {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSend = useCallback(async () => {
        const trimmed = draft.trim();
        const readyAttachmentSnapshot = attachments.readyAttachments.map(
            (attachment) => ({
                ...attachment,
            }),
        );

        if (!user?.id) {
            return;
        }

        if (attachments.isAttachmentUploading) {
            return;
        }

        if (trimmed.length === 0 && readyAttachmentSnapshot.length === 0) {
            return;
        }

        setIsProcessing(true);
        setError(null);

        const userMessageContent =
            trimmed.length > 0 ? trimmed : "Shared new document(s).";

        try {
            const userMessage: AssistantMessage = {
                id: `user-${Date.now()}`,
                role: "user",
                content: userMessageContent,
                metadata: {
                    timestamp: new Date().toISOString(),
                    autoGenerated: trimmed.length === 0,
                },
                attachments: readyAttachmentSnapshot,
            };

            conversation.setMessages((prev) => [...prev, userMessage]);
            setDraft("");

            const recentMessages: ChatMessage[] = conversation.messages
                .slice(-2)
                .map((item) => ({
                    role: item.role,
                    content: item.content ?? "",
                }));
            recentMessages.push({ role: "user", content: userMessageContent });

            const attachmentIds = readyAttachmentSnapshot
                .map((attachment) => attachment.id)
                .filter((id) => !id.startsWith("pending-"));

            const response = await sendChatMessage(
                recentMessages,
                user.id,
                conversation.activeConversationId ?? undefined,
                true,
                language,
                attachmentIds,
            );

            if (response?.message) {
                const assistantMessage: AssistantMessage = {
                    id: `assistant-${Date.now()}`,
                    role: "assistant",
                    content: response.message,
                    metadata: {
                        timestamp: response.timestamp ?? new Date().toISOString(),
                    },
                    sources:
                        response.sources && response.sources.length > 0
                            ? response.sources
                            : undefined,
                };

                conversation.setMessages((prev) => [...prev, assistantMessage]);
                conversation.setActiveConversationId(response.conversationId);
                attachments.reset();
            }
        } catch (sendError) {
            console.error("Failed to send assistant message:", sendError);
            setError(
                sendError instanceof Error
                    ? sendError.message
                    : "Failed to send message",
            );
            conversation.setMessages((prev) => prev.slice(0, -1));
        } finally {
            setIsProcessing(false);
        }
    }, [
        attachments,
        conversation,
        draft,
        language,
        setDraft,
        setError,
        user?.id,
    ]);

    const handleStop = useCallback(() => {
        setIsProcessing(false);
    }, []);

    return { isProcessing, handleSend, handleStop };
}

interface ChatAssistantTabProps {
    user: User | null;
    language: "en" | "hi";
}

export function ChatAssistantTab({
    user,
    language,
}: ChatAssistantTabProps): React.ReactElement {
    const [draft, setDraft] = useState("");
    const [error, setError] = useState<string | null>(null);
    const conversation = useConversationState(user);
    const attachments = useAttachmentController({
        user,
        activeConversationId: conversation.activeConversationId,
        setError,
    });
    const composer = useChatComposer({
        user,
        language,
        draft,
        setDraft,
        conversation,
        attachments,
        setError,
    });

    const flatListRef = useRef<FlatList<AssistantMessage>>(null);

    useEffect(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, [conversation.messages.length]);

    const showEmptyState =
        conversation.messages.length === 0 && !conversation.isHydrating;

    return (
        <View style={styles.container}>
            {showEmptyState ? (
                <ChatEmptyState />
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={conversation.messages}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messageList}
                    renderItem={({ item }) => (
                        <MessageBubble message={item} isUser={item.role === "user"} />
                    )}
                    ListFooterComponent={
                        <ChatLoadingFooter
                            visible={composer.isProcessing}
                            onStop={composer.handleStop}
                        />
                    }
                />
            )}

            <ChatErrorBanner error={error} onDismiss={() => setError(null)} />

            <View style={styles.inputWrapper}>
                <AttachmentPreviewList
                    attachments={attachments.attachments}
                    onRemove={attachments.removeAttachment}
                />
                <ChatInput
                    draft={draft}
                    onChangeDraft={setDraft}
                    onSend={composer.handleSend}
                    onPickAttachment={attachments.pickAttachment}
                    isSubmitting={composer.isProcessing}
                    hasAttachments={attachments.attachments.length > 0}
                    isAttachmentUploading={attachments.isAttachmentUploading}
                />
            </View>
        </View>
    );
}

function ChatEmptyState(): React.ReactElement {
    return (
        <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses" size={48} color={colors.primary} />
            <Text style={styles.emptyStateTitle}>Start a Conversation</Text>
            <Text style={styles.emptyStateText}>
                Ask anything about your pregnancy, and I will guide you step by step.
            </Text>
        </View>
    );
}

function ChatErrorBanner({
    error,
    onDismiss,
}: {
    error: string | null;
    onDismiss: () => void;
}): React.ReactElement | null {
    if (!error) {
        return null;
    }

    return (
        <View style={styles.feedbackBanner}>
            <Ionicons name="warning" size={16} color={colors.primary} />
            <Text style={styles.feedbackText}>{error}</Text>
            <Pressable onPress={onDismiss} accessibilityLabel="Dismiss error">
                <Ionicons name="close" size={18} color={colors.primary} />
            </Pressable>
        </View>
    );
}

function ChatLoadingFooter({
    visible,
    onStop,
}: {
    visible: boolean;
    onStop: () => void;
}): React.ReactElement | null {
    if (!visible) {
        return null;
    }

    return (
        <MotiView
            from={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 800, loop: true }}
            style={styles.loadingContainer}
        >
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingLabel}>MomCare is thinking...</Text>
            <Pressable onPress={onStop} style={styles.stopButton}>
                <Ionicons name="square" size={14} color={colors.primary} />
                <Text style={styles.stopButtonText}>Stop</Text>
            </Pressable>
        </MotiView>
    );
}

function AttachmentPreviewList({
    attachments,
    onRemove,
}: {
    attachments: ChatAttachmentPreview[];
    onRemove: (id: string) => void;
}): React.ReactElement | null {
    if (attachments.length === 0) {
        return null;
    }

    return (
        <View style={styles.attachmentPreviewContainer}>
            {attachments.map((attachment) => {
                const isUploading = attachment.status === "uploading";
                const iconName = attachment.mimeType?.startsWith("image/")
                    ? "image-outline"
                    : "document-text-outline";

                return (
                    <View key={attachment.id} style={styles.attachmentChip}>
                        <Ionicons name={iconName} size={20} color={colors.primary} />
                        <View style={styles.attachmentChipText}>
                            <Text style={styles.attachmentChipTitle} numberOfLines={1}>
                                {attachment.title ?? "Attachment"}
                            </Text>
                            <Text
                                style={[
                                    styles.attachmentChipStatus,
                                    isUploading
                                        ? styles.attachmentChipStatusUploading
                                        : styles.attachmentChipStatusReady,
                                ]}
                            >
                                {isUploading ? "Uploading..." : "Ready"}
                            </Text>
                        </View>
                        {isUploading ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Pressable
                                onPress={() => onRemove(attachment.id)}
                                style={styles.attachmentRemoveButton}
                                accessibilityLabel="Remove attachment"
                            >
                                <Ionicons name="close" size={16} color={colors.textSecondary} />
                            </Pressable>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    inputWrapper: {
        width: "100%",
    },
    attachmentPreviewContainer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
        paddingTop: spacing.sm,
        gap: spacing.sm,
    },
    attachmentChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: "#F5D6DB",
        ...shadows.soft,
    },
    attachmentChipText: {
        flex: 1,
    },
    attachmentChipTitle: {
        fontSize: typography.label,
        color: colors.textPrimary,
        fontWeight: "600",
    },
    attachmentChipStatus: {
        marginTop: 2,
        fontSize: typography.caption,
    },
    attachmentChipStatusUploading: {
        color: colors.textSecondary,
    },
    attachmentChipStatusReady: {
        color: colors.primary,
    },
    attachmentRemoveButton: {
        padding: spacing.xs,
        borderRadius: radii.full,
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
});
