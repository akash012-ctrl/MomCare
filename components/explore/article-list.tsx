import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

import { ExploreEmptyState } from "@/components/explore/explore-empty-state";
import { ResourceCard } from "@/components/explore/resource-card";
import type { Article } from "@/components/explore/types";
import { ThemedText } from "@/components/themed-text";
import { MotherhoodTheme } from "@/constants/theme";

const { colors } = MotherhoodTheme;

interface ExploreArticleListProps {
    articles: Article[];
    loading: boolean;
    savedArticles: string[];
    onShare: (article: Article) => void | Promise<void>;
    onSave: (article: Article) => void | Promise<void>;
    onOpenLink: (url?: string) => void | Promise<void>;
}

export function ExploreArticleList({
    articles,
    loading,
    savedArticles,
    onShare,
    onSave,
    onOpenLink,
}: ExploreArticleListProps) {
    const renderArticle = useCallback(
        ({ item }: { item: Article }) => (
            <View>
                <ResourceCard
                    article={item}
                    onShare={onShare}
                    onSave={onSave}
                    isSaved={savedArticles.includes(item.id)}
                />
                <TouchableOpacity
                    style={styles.readMoreButton}
                    onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onOpenLink(item.url);
                    }}
                >
                    <ThemedText style={styles.readMoreText}>Read Full Article →</ThemedText>
                </TouchableOpacity>
            </View>
        ),
        [onOpenLink, onSave, onShare, savedArticles]
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText style={styles.loadingText}>Loading content...</ThemedText>
            </View>
        );
    }

    return (
        <FlatList
            data={articles}
            renderItem={renderArticle}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
                <ExploreEmptyState
                    icon="book-open"
                    title="No articles found"
                    message="Try adjusting your search or filters"
                />
            }
        />
    );
}

const styles = StyleSheet.create({
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    readMoreButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 12,
        borderRadius: 8,
        backgroundColor: `${colors.primary}15`,
        borderWidth: 1,
        borderColor: `${colors.primary}30`,
    },
    readMoreText: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.primary,
        textAlign: "center",
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: colors.textSecondary,
    },
});
