import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Share,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { RoundedCard } from "@/components/ui/rounded-card";
import { MotherhoodTheme } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  read_time: number;
  image_url?: string;
  url?: string;
  tags: string[];
  is_trending?: boolean;
}

interface TabConfig {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}

const CATEGORIES = ["All", "Pregnancy", "Nutrition", "Posture", "Wellness"];

const TABS: TabConfig[] = [
  { id: "resources", label: "Resources", icon: "book" },
  { id: "tips", label: "Tips", icon: "zap" },
  { id: "trending", label: "Trending", icon: "trending-up" },
  { id: "saved", label: "Saved", icon: "bookmark" },
];

const BOOKMARKS_KEY = "@momcare_bookmarks";

interface ResourceCardProps {
  article: Article;
  onShare: (article: Article) => void;
  onSave: (article: Article) => void;
  isSaved: boolean;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  article,
  onShare,
  onSave,
  isSaved,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <RoundedCard style={styles.resourceCard}>
      <View>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
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
            <ThemedText style={styles.metaText}>
              {formatDate(article.date)}
            </ThemedText>
          </View>
          <View style={styles.metaItem}>
            <Feather
              size={12}
              name="clock"
              color={MotherhoodTheme.colors.textSecondary}
            />
            <ThemedText style={styles.metaText}>
              {article.read_time} min read
            </ThemedText>
          </View>
          <View style={styles.categoryBadge}>
            <ThemedText style={styles.categoryText}>
              {article.category}
            </ThemedText>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onShare(article)}
          >
            <Feather
              size={16}
              name="share-2"
              color={MotherhoodTheme.colors.primary}
            />
            <ThemedText style={styles.actionText}>Share</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, isSaved && styles.actionButtonActive]}
            onPress={() => onSave(article)}
          >
            <Feather
              size={16}
              name="bookmark"
              color={
                isSaved
                  ? MotherhoodTheme.colors.primary
                  : MotherhoodTheme.colors.textSecondary
              }
            />
            <ThemedText
              style={[styles.actionText, isSaved && styles.actionTextActive]}
            >
              {isSaved ? "Saved" : "Save"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </RoundedCard>
  );
};

interface CategoryChipProps {
  category: string;
  isActive: boolean;
  onPress: () => void;
}

const CategoryChip: React.FC<CategoryChipProps> = ({
  category,
  isActive,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.chip, isActive && styles.chipActive]}
      onPress={onPress}
    >
      <ThemedText style={[styles.chipText, isActive && styles.chipTextActive]}>
        {category}
      </ThemedText>
    </TouchableOpacity>
  );
};

export default function ExploreScreen() {
  const [activeTab, setActiveTab] = useState("resources");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedArticles, setSavedArticles] = useState<string[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [tips, setTips] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [articlesRes, tipsRes] = await Promise.all([
        supabase
          .from("articles")
          .select("*")
          .order("date", { ascending: false }),
        supabase.from("tips").select("*").order("date", { ascending: false }),
      ]);

      if (articlesRes.data) {
        setArticles(articlesRes.data as Article[]);
      }
      if (tipsRes.data) {
        setTips(tipsRes.data as Article[]);
      }
    } catch (error) {
      console.error("Error loading articles and tips:", error);
      Alert.alert("Error", "Failed to load content");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load saved bookmarks on focus
  useFocusEffect(
    useCallback(() => {
      const loadSavedBookmarks = async () => {
        try {
          const saved = await AsyncStorage.getItem(BOOKMARKS_KEY);
          if (saved) {
            setSavedArticles(JSON.parse(saved));
          }
        } catch (error) {
          console.error("Error loading bookmarks:", error);
        }
      };

      loadData();
      loadSavedBookmarks();
    }, [loadData])
  );

  const handleSaveArticle = useCallback(
    async (article: Article) => {
      try {
        const updatedSaved = savedArticles.includes(article.id)
          ? savedArticles.filter((id) => id !== article.id)
          : [...savedArticles, article.id];

        setSavedArticles(updatedSaved);
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updatedSaved));
      } catch (error) {
        console.error("Error saving bookmark:", error);
        Alert.alert("Error", "Failed to save bookmark");
      }
    },
    [savedArticles]
  );

  const handleShareArticle = useCallback(async (article: Article) => {
    try {
      const message = `Check out: ${article.title}\n\n${article.description}`;
      await Share.share({
        message,
        title: article.title,
        url: article.url,
      });
    } catch (error) {
      console.error("Error sharing article:", error);
    }
  }, []);

  const handleOpenLink = useCallback(async (url?: string) => {
    if (!url) {
      Alert.alert("Notice", "This article does not have an external link.");
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", `Cannot open URL: ${url}`);
      }
    } catch (error) {
      console.error("Error opening link:", error);
      Alert.alert("Error", "Failed to open link");
    }
  }, []);

  // Filter articles based on tab, category, and search query
  const filteredArticles = useMemo(() => {
    let result: Article[] = [];

    if (activeTab === "resources") {
      result = articles;
    } else if (activeTab === "tips") {
      result = tips;
    } else if (activeTab === "trending") {
      result = articles.filter((a) => a.is_trending);
    } else if (activeTab === "saved") {
      result = [...articles, ...tips].filter((a) =>
        savedArticles.includes(a.id)
      );
    }

    if (selectedCategory !== "All") {
      result = result.filter((a) => a.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query) ||
          a.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [activeTab, selectedCategory, searchQuery, savedArticles, articles, tips]);

  const renderTabButton = useCallback(
    (tab: TabConfig) => (
      <TouchableOpacity
        key={tab.id}
        style={[
          styles.tabButton,
          activeTab === tab.id && styles.tabButtonActive,
        ]}
        onPress={() => setActiveTab(tab.id)}
      >
        <Feather
          size={25}
          name={tab.icon}
          color={
            activeTab === tab.id
              ? MotherhoodTheme.colors.primary
              : MotherhoodTheme.colors.textSecondary
          }
        />
        <ThemedText
          style={[
            styles.tabLabel,
            activeTab === tab.id && styles.tabLabelActive,
          ]}
        >
          {tab.label}
        </ThemedText>
      </TouchableOpacity>
    ),
    [activeTab]
  );

  const renderArticle = useCallback(
    ({ item }: { item: Article }) => (
      <View>
        <ResourceCard
          article={item}
          onShare={handleShareArticle}
          onSave={handleSaveArticle}
          isSaved={savedArticles.includes(item.id)}
        />
        <TouchableOpacity
          style={styles.readMoreButton}
          onPress={() => handleOpenLink(item.url)}
        >
          <ThemedText style={styles.readMoreText}>
            Read Full Article →
          </ThemedText>
        </TouchableOpacity>
      </View>
    ),
    [handleShareArticle, handleSaveArticle, savedArticles, handleOpenLink]
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Explore</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Discover prenatal guides and wellness tips
          </ThemedText>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>{TABS.map(renderTabButton)}</View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather
          size={16}
          name="search"
          color={MotherhoodTheme.colors.textSecondary}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab}...`}
          placeholderTextColor={MotherhoodTheme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Feather
              size={16}
              name="x-circle"
              color={MotherhoodTheme.colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Filters (not shown for Saved tab) */}
      {activeTab !== "saved" && (
        <View style={styles.categoryContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            renderItem={({ item: category }) => (
              <CategoryChip
                category={category}
                isActive={selectedCategory === category}
                onPress={() => setSelectedCategory(category)}
              />
            )}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.categoryContent}
          />
        </View>
      )}

      {/* Articles List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={MotherhoodTheme.colors.primary}
          />
          <ThemedText style={styles.loadingText}>Loading content...</ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredArticles}
          renderItem={renderArticle}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather
                size={48}
                name="book-open"
                color={MotherhoodTheme.colors.textSecondary}
              />
              <ThemedText style={styles.emptyText}>
                No articles found
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Try adjusting your search or filters
              </ThemedText>
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MotherhoodTheme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 46,
    paddingBottom: 16,
    backgroundColor: MotherhoodTheme.colors.surface,
  },
  headerContent: {
    marginTop: 0,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 6,
    color: MotherhoodTheme.colors.textPrimary,
    lineHeight: 40,
  },
  headerSubtitle: {
    fontSize: 14,
    color: MotherhoodTheme.colors.textSecondary,
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: MotherhoodTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: MotherhoodTheme.colors.primary + "30",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: MotherhoodTheme.colors.primary + "20",
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "500",
    color: MotherhoodTheme.colors.textPrimary,
  },
  tabLabelActive: {
    fontWeight: "600",
    color: MotherhoodTheme.colors.primary,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 8,
    backgroundColor: MotherhoodTheme.colors.surface,
    borderWidth: 1,
    borderColor: MotherhoodTheme.colors.primary + "30",
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 14,
    color: MotherhoodTheme.colors.textPrimary,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryContent: {
    paddingRight: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: MotherhoodTheme.colors.surface,
    borderWidth: 1,
    borderColor: MotherhoodTheme.colors.primary + "50",
  },
  chipActive: {
    backgroundColor: MotherhoodTheme.colors.primary,
    borderColor: MotherhoodTheme.colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: MotherhoodTheme.colors.textPrimary,
  },
  chipTextActive: {
    color: MotherhoodTheme.colors.surface,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resourceCard: {
    marginBottom: 8,
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: MotherhoodTheme.colors.textPrimary,
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
    color: MotherhoodTheme.colors.textSecondary,
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
    color: MotherhoodTheme.colors.textSecondary,
  },
  categoryBadge: {
    marginLeft: "auto",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: MotherhoodTheme.colors.primary + "20",
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    color: MotherhoodTheme.colors.primary,
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: MotherhoodTheme.colors.primary + "20",
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
    backgroundColor: MotherhoodTheme.colors.primary + "20",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "500",
    color: MotherhoodTheme.colors.primary,
  },
  actionTextActive: {
    fontWeight: "600",
  },
  readMoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: MotherhoodTheme.colors.primary + "15",
    borderWidth: 1,
    borderColor: MotherhoodTheme.colors.primary + "30",
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: "600",
    color: MotherhoodTheme.colors.primary,
    textAlign: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    color: MotherhoodTheme.colors.textPrimary,
  },
  emptySubtext: {
    fontSize: 13,
    color: MotherhoodTheme.colors.textSecondary,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: MotherhoodTheme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: MotherhoodTheme.colors.textSecondary,
  },
});
