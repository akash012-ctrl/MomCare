import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { Linking, Share, StyleSheet } from "react-native";

import { ExploreArticleList } from "@/components/explore/article-list";
import { CategoryFilterList } from "@/components/explore/category-filter-list";
import { ExploreHeader } from "@/components/explore/explore-header";
import { ExploreSearchBar } from "@/components/explore/explore-search-bar";
import { ExploreTabBar } from "@/components/explore/explore-tab-bar";
import { type TabConfig } from "@/components/explore/tab-button";
import type { Article } from "@/components/explore/types";
import { ThemedView } from "@/components/themed-view";
import { useAppAlert, type ShowAlertOptions } from "@/components/ui/app-alert";
import { MotherhoodTheme } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["All", "Pregnancy", "Nutrition", "Posture", "Wellness"];

const TABS: TabConfig[] = [
  { id: "resources", label: "Resources", icon: "book" },
  { id: "tips", label: "Tips", icon: "zap" },
  { id: "trending", label: "Trending", icon: "trending-up" },
  { id: "saved", label: "Saved", icon: "bookmark" },
];

type TabId = TabConfig["id"];

type ShowAlertFn = (options: ShowAlertOptions) => void;

interface ArticleCollections {
  articles: Article[];
  tips: Article[];
}

interface ExploreArticlesResult extends ArticleCollections {
  loading: boolean;
  loadArticles: () => Promise<void>;
}

interface SavedArticlesResult {
  savedArticles: string[];
  toggleSavedArticle: (article: Article) => Promise<void>;
  loadSavedArticles: () => Promise<void>;
}

function useExploreArticles(showAlert: ShowAlertFn): ExploreArticlesResult {
  const [articles, setArticles] = useState<Article[]>([]);
  const [tips, setTips] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      const [articlesRes, tipsRes] = await Promise.all([
        supabase.from("articles").select("*").order("date", { ascending: false }),
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
      showAlert({
        title: "Error",
        message: "Failed to load content",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  return {
    articles,
    tips,
    loading,
    loadArticles,
  };
}

const BOOKMARKS_KEY = "@momcare_bookmarks";

function useSavedArticles(showAlert: ShowAlertFn): SavedArticlesResult {
  const [savedArticles, setSavedArticles] = useState<string[]>([]);

  const loadSavedArticles = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (saved) {
        setSavedArticles(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading bookmarks:", error);
    }
  }, []);

  const toggleSavedArticle = useCallback(
    async (article: Article) => {
      try {
        const updatedSaved = savedArticles.includes(article.id)
          ? savedArticles.filter((id) => id !== article.id)
          : [...savedArticles, article.id];

        setSavedArticles(updatedSaved);
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updatedSaved));
      } catch (error) {
        console.error("Error saving bookmark:", error);
        showAlert({
          title: "Error",
          message: "Failed to save bookmark",
          type: "error",
        });
      }
    },
    [savedArticles, showAlert]
  );

  return {
    savedArticles,
    toggleSavedArticle,
    loadSavedArticles,
  };
}

interface FilterParams extends ArticleCollections {
  activeTab: TabId;
  selectedCategory: string;
  searchQuery: string;
  savedArticles: string[];
}

function filterArticles({
  activeTab,
  selectedCategory,
  searchQuery,
  savedArticles,
  articles,
  tips,
}: FilterParams): Article[] {
  let result: Article[] = [];

  if (activeTab === "resources") {
    result = articles;
  } else if (activeTab === "tips") {
    result = tips;
  } else if (activeTab === "trending") {
    result = articles.filter((a) => a.is_trending);
  } else {
    result = [...articles, ...tips].filter((a) => savedArticles.includes(a.id));
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
}

export default function ExploreScreen() {
  const { showAlert } = useAppAlert();
  const { articles, tips, loading, loadArticles } = useExploreArticles(showAlert);
  const { savedArticles, toggleSavedArticle, loadSavedArticles } =
    useSavedArticles(showAlert);
  const [activeTab, setActiveTab] = useState<TabId>("resources");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadArticles();
      loadSavedArticles();
    }, [loadArticles, loadSavedArticles])
  );

  const filteredArticles = useMemo(
    () =>
      filterArticles({
        activeTab,
        selectedCategory,
        searchQuery,
        savedArticles,
        articles,
        tips,
      }),
    [activeTab, selectedCategory, searchQuery, savedArticles, articles, tips]
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

  const handleOpenLink = useCallback(
    async (url?: string) => {
      if (!url) {
        showAlert({
          title: "Heads up",
          message: "This article does not have an external link.",
          type: "info",
        });
        return;
      }

      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          showAlert({
            title: "Error",
            message: `Cannot open URL: ${url}`,
            type: "error",
          });
        }
      } catch (error) {
        console.error("Error opening link:", error);
        showAlert({
          title: "Error",
          message: "Failed to open link",
          type: "error",
        });
      }
    },
    [showAlert]
  );

  const clearSearch = useCallback(() => setSearchQuery(""), []);

  return (
    <ThemedView style={styles.container}>
      <ExploreHeader
        title="Explore"
        subtitle="Discover prenatal guides and wellness tips"
      />

      <ExploreTabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <ExploreSearchBar
        value={searchQuery}
        placeholder={`Search ${activeTab}...`}
        onChangeText={setSearchQuery}
        onClear={clearSearch}
      />

      {activeTab !== "saved" ? (
        <CategoryFilterList
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />
      ) : null}

      {/* Articles List */}
      <ExploreArticleList
        articles={filteredArticles}
        loading={loading}
        savedArticles={savedArticles}
        onShare={handleShareArticle}
        onSave={toggleSavedArticle}
        onOpenLink={handleOpenLink}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MotherhoodTheme.colors.background,
  },
});
