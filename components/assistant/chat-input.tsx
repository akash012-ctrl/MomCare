import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import React, { useMemo } from "react";
import {
    Pressable,
    StyleSheet,
    TextInput,
    View,
    type PressableStateCallbackType,
} from "react-native";

import { MotherhoodTheme } from "@/constants/theme";

interface ChatInputProps {
    draft: string;
    onChangeDraft: (value: string) => void;
    onSend: () => void;
    onPickAttachment: () => void;
    isSubmitting?: boolean;
    hasAttachments?: boolean;
    isAttachmentUploading?: boolean;
    placeholder?: string;
    maxLength?: number;
    disabled?: boolean;
}

const DEFAULT_PLACEHOLDER = "Ask your doubts";
const DEFAULT_MAX_LENGTH = 800;

const { colors, radii, shadows, spacing, typography } = MotherhoodTheme;

function buildAttachmentButtonStyles(disabled: boolean, hasAttachment: boolean) {
    return ({ pressed }: PressableStateCallbackType) => [
        styles.attachmentButton,
        pressed && !disabled && styles.attachmentButtonPressed,
        hasAttachment && styles.attachmentButtonActive,
    ];
}

function buildSendButtonStyles(disabled: boolean) {
    return ({ pressed }: PressableStateCallbackType) => [
        styles.sendButton,
        pressed && !disabled && styles.sendButtonPressed,
        disabled && styles.sendButtonDisabled,
    ];
}

export function ChatInput({
    draft,
    onChangeDraft,
    onSend,
    onPickAttachment,
    isSubmitting = false,
    hasAttachments = false,
    isAttachmentUploading = false,
    placeholder = DEFAULT_PLACEHOLDER,
    maxLength = DEFAULT_MAX_LENGTH,
    disabled = false,
}: ChatInputProps) {
    const trimmedDraft = draft.trim();
    const sendDisabled =
        isSubmitting ||
        isAttachmentUploading ||
        (!trimmedDraft && !hasAttachments) ||
        disabled;

    const attachmentButtonStyles = useMemo(
        () =>
            buildAttachmentButtonStyles(
                isSubmitting || isAttachmentUploading || disabled,
                hasAttachments
            ),
        [disabled, hasAttachments, isAttachmentUploading, isSubmitting],
    );

    const sendButtonStyles = useMemo(
        () => buildSendButtonStyles(sendDisabled),
        [sendDisabled],
    );

    const sendIconColor = sendDisabled ? colors.primary : colors.surface;

    return (
        <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
                <Pressable
                    onPress={async () => {
                        if (disabled) {
                            return;
                        }
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onPickAttachment();
                    }}
                    disabled={isSubmitting || isAttachmentUploading || disabled}
                    style={attachmentButtonStyles}
                    accessibilityLabel="Attach file"
                >
                    <Ionicons
                        name={hasAttachments ? "attach" : "attach-outline"}
                        size={28}
                        color={hasAttachments ? colors.primary : colors.textSecondary}
                    />
                </Pressable>
                <TextInput
                    value={draft}
                    onChangeText={onChangeDraft}
                    placeholder={placeholder}
                    placeholderTextColor="rgba(112, 76, 87, 0.5)"
                    multiline
                    editable={!isSubmitting && !disabled}
                    maxLength={maxLength}
                    style={styles.input}
                    textAlignVertical="top"
                    accessibilityLabel="Chat message input"
                />
            </View>
            <MotiView
                from={{ scale: 1 }}
                animate={{ scale: sendDisabled ? 0.95 : 1 }}
                transition={{ type: "timing", duration: 100 }}
            >
                <Pressable
                    onPress={async () => {
                        if (disabled) {
                            return;
                        }
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        onSend();
                    }}
                    disabled={sendDisabled}
                    style={sendButtonStyles}
                    accessibilityLabel="Send message"
                >
                    <Ionicons name="send" size={18} color={sendIconColor} />
                </Pressable>
            </MotiView>
        </View>
    );
}

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: "transparent",
    },
    inputWrapper: {
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-end",
        gap: spacing.sm,
        borderRadius: radii.lg,
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        shadowColor: colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    attachmentButton: {
        padding: spacing.sm,
        borderRadius: radii.sm,
    },
    attachmentButtonPressed: {
        opacity: 0.7,
    },
    attachmentButtonActive: {
        backgroundColor: colors.mutedPink,
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
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
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.primary,
    },
});
