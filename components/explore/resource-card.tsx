import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { RoundedCard } from "@/components/ui/rounded-card";
import { MotherhoodTheme } from "@/constants/theme";

import type { Article } from "./types";

const { colors } = MotherhoodTheme;

interface ResourceCardProps {
    article: Article;
    onShare: (article: Article) => void;
    onSave: (article: Article) => void;
    isSaved: boolean;
}

function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function ResourceCard({ article, onShare, onSave, isSaved }: ResourceCardProps) {
    return (
        <RoundedCard style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                    <ThemedText style={styles.cardTitle} numberOfLines={2}>
                        {article.title}
                    </ThemedText>
                    {article.is_trending && (
                        <View style={styles.trendingBadge}>
                            <Feather size={12} name="trending-up" color="#FF6B6B" />
                            <ThemedText style={styles.trendingText}>Trending</ThemedText>
                        </View>
                    )}
                </View>
            </View>

            <ThemedText style={styles.cardDescription} numberOfLines={2}>
                {article.description}
            </ThemedText>

            <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                    <ThemedText style={styles.metaText}>{formatDate(article.date)}</ThemedText>
                </View>
                <View style={styles.metaItem}>
                    <Feather size={12} name="clock" color={colors.textSecondary} />
                    <ThemedText style={styles.metaText}>{article.read_time} min read</ThemedText>
                </View>
                <View style={styles.categoryBadge}>
                    <ThemedText style={styles.categoryText}>{article.category}</ThemedText>
                </View>
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => onShare(article)}>
                    <Feather size={16} name="share-2" color={colors.primary} />
                    <ThemedText style={styles.actionText}>Share</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, isSaved && styles.actionButtonActive]}
                    onPress={() => onSave(article)}
                >
                    <Feather
                        size={16}
                        name="bookmark"
                        color={isSaved ? colors.primary : colors.textSecondary}
                    />
                    <ThemedText style={[styles.actionText, isSaved && styles.actionTextActive]}>
                        {isSaved ? "Saved" : "Save"}
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </RoundedCard>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 8,
        padding: 14,
    },
    cardHeader: {
        flexDirection: "row",
        marginBottom: 8,
        alignItems: "flex-start",
    },
    titleContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
        color: colors.textPrimary,
    },
    trendingBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: "rgba(255, 107, 107, 0.15)",
        alignSelf: "flex-start",
    },
    trendingText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#FF6B6B",
        marginLeft: 4,
    },
    cardDescription: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 10,
        lineHeight: 18,
    },
    cardMeta: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        gap: 8,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    metaText: {
        fontSize: 11,
        color: colors.textSecondary,
    },
    categoryBadge: {
        marginLeft: "auto",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: `${colors.primary}20`,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: "600",
        color: colors.primary,
    },
    cardActions: {
        flexDirection: "row",
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: `${colors.primary}20`,
        paddingTop: 10,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 6,
    },
    actionButtonActive: {
        backgroundColor: `${colors.primary}20`,
    },
    actionText: {
        fontSize: 12,
        fontWeight: "500",
        color: colors.primary,
    },
    actionTextActive: {
        fontWeight: "600",
    },
});
