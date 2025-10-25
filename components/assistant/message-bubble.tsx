import { MotiView } from "moti";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Markdown from "react-native-markdown-display";

import { MotherhoodTheme } from "@/constants/theme";

import type { AssistantMessage } from "./types";

const { colors, spacing, typography, shadows, radii } = MotherhoodTheme;

function getMarkdownStyles(isUser: boolean) {
    const textColor = isUser ? colors.surface : colors.textPrimary;
    return {
        body: {
            color: textColor,
            fontSize: typography.body,
        },
        text: {
            color: textColor,
            fontSize: typography.body,
        },
        strong: {
            color: textColor,
            fontWeight: "600" as const,
        },
        em: {
            color: textColor,
            fontStyle: "italic" as const,
        },
        heading1: {
            color: textColor,
            fontSize: 20,
            fontWeight: "700" as const,
            marginVertical: 8,
        },
        heading2: {
            color: textColor,
            fontSize: 18,
            fontWeight: "600" as const,
            marginVertical: 6,
        },
        heading3: {
            color: textColor,
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
            color: textColor,
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
}

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

interface MessageBubbleProps {
    message: AssistantMessage;
    isUser: boolean;
}

export function MessageBubble({ message, isUser }: MessageBubbleProps) {
    const text = getMessageText(message);
    const timestamp = getMessageTimestamp(message);
    const markdownStyles = getMarkdownStyles(isUser);

    return (
        <MotiView
            from={{ opacity: 0, scale: 0.85, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 300, delay: 50 }}
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

const styles = StyleSheet.create({
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
});
