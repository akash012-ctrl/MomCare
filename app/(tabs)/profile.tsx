import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { PregnancyStartDatePicker } from "@/components/ui/pregnancy-start-date-picker";
import { MotherhoodTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import {
  ImageAnalysisResult,
  MealAnalysisResult,
  PostureAnalysisResult,
} from "@/lib/image-analysis-types";
import { getCurrentUserId } from "@/lib/rls-helpers";
import { supabase } from "@/lib/supabase";

const { colors, radii, spacing, typography, shadows } = MotherhoodTheme;

interface MealHistoryCardProps {
  analysis: ImageAnalysisResult;
}

function MealHistoryCard({ analysis }: MealHistoryCardProps) {
  const mealData = analysis.result as MealAnalysisResult;
  const date = new Date(analysis.created_at).toLocaleDateString();

  return (
    <View style={styles.historyCard}>
      {analysis.image_url && (
        <Image
          source={{ uri: analysis.image_url }}
          style={styles.historyImage}
        />
      )}
      <View style={styles.historyContent}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyDate}>{date}</Text>
          <Text style={styles.historyCalories}>
            {mealData?.total_calories || 0} cal
          </Text>
        </View>
        {mealData?.foods && mealData.foods.length > 0 && (
          <Text style={styles.historyFoods}>
            {mealData.foods.map((f) => f.name).join(", ")}
          </Text>
        )}
        {mealData?.recommendation && (
          <Text style={styles.historyRecommendation}>
            {mealData.recommendation}
          </Text>
        )}
      </View>
    </View>
  );
}

interface PostureHistoryCardProps {
  analysis: ImageAnalysisResult;
}

function PostureHistoryCard({ analysis }: PostureHistoryCardProps) {
  const postureData = analysis.result as PostureAnalysisResult;
  const date = new Date(analysis.created_at).toLocaleDateString();

  return (
    <View style={styles.historyCard}>
      {analysis.image_url && (
        <Image
          source={{ uri: analysis.image_url }}
          style={styles.historyImage}
        />
      )}
      <View style={styles.historyContent}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyDate}>{date}</Text>
          <View
            style={[
              styles.postureScore,
              {
                backgroundColor:
                  postureData?.posture_score >= 75
                    ? "#52C41A"
                    : postureData?.posture_score >= 50
                    ? "#FAAD14"
                    : "#FF4D4F",
              },
            ]}
          >
            <Text style={styles.postureScoreText}>
              {postureData?.posture_score || 0}
            </Text>
          </View>
        </View>
        {postureData?.safe_to_perform !== undefined && (
          <Text style={styles.historySafety}>
            Status: {postureData.safe_to_perform ? "✅ Safe" : "⚠️ Needs Work"}
          </Text>
        )}
        {postureData?.recommendations &&
          postureData.recommendations.length > 0 && (
            <Text style={styles.historyRecommendation}>
              {postureData.recommendations[0]}
            </Text>
          )}
      </View>
    </View>
  );
}

interface ProfileMenuItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  isDestructive?: boolean;
}

function ProfileMenuItem({
  icon,
  label,
  onPress,
  isDestructive,
}: ProfileMenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
      ]}
    >
      <View style={styles.menuItemLeft}>
        <Feather
          name={icon}
          size={20}
          color={isDestructive ? "#EF5350" : colors.primary}
        />
        <Text
          style={[
            styles.menuItemLabel,
            isDestructive && styles.destructiveLabel,
          ]}
        >
          {label}
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"meals" | "posture">("meals");
  const [mealHistory, setMealHistory] = useState<ImageAnalysisResult[]>([]);
  const [postureHistory, setPostureHistory] = useState<ImageAnalysisResult[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pregnancyStartDate, setPregnancyStartDate] = useState<string | null>(
    null
  );
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/welcome" as any);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const loadPregnancyData = useCallback(async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("pregnancy_start_date")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error loading pregnancy data:", error);
        return;
      }

      if (data?.pregnancy_start_date) {
        setPregnancyStartDate(data.pregnancy_start_date);
      }
    } catch (err) {
      console.error("Error in loadPregnancyData:", err);
    }
  }, []);

  const handleUpdatePregnancyDate = async (newDate: string) => {
    try {
      setIsUpdatingProfile(true);
      const userId = await getCurrentUserId();

      if (!userId) {
        setError("Not authenticated");
        return;
      }

      const { error } = await supabase
        .from("user_profiles")
        .update({ pregnancy_start_date: newDate })
        .eq("id", userId);

      if (error) throw error;

      setPregnancyStartDate(newDate);
      setError(null);
    } catch (err) {
      console.error("Error updating pregnancy date:", err);
      setError(err instanceof Error ? err.message : "Failed to update date");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateName = async (newName: string) => {
    try {
      setIsUpdatingProfile(true);
      const userId = await getCurrentUserId();

      if (!userId) {
        setError("Not authenticated");
        return;
      }

      const { error } = await supabase
        .from("user_profiles")
        .update({ full_name: newName })
        .eq("id", userId);

      if (error) throw error;

      setError(null);
    } catch (err) {
      console.error("Error updating name:", err);
      setError(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const fetchAnalysisHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = await getCurrentUserId();

      if (!userId) {
        setError("Not authenticated");
        return;
      }

      // Fetch meal analyses
      const { data: mealData, error: mealError } = await supabase
        .from("image_analysis_results")
        .select("*")
        .eq("user_id", userId)
        .eq("analysis_type", "meal")
        .order("created_at", { ascending: false })
        .limit(10);

      if (mealError) throw mealError;
      setMealHistory((mealData || []) as ImageAnalysisResult[]);

      // Fetch posture analyses
      const { data: postureData, error: postureError } = await supabase
        .from("image_analysis_results")
        .select("*")
        .eq("user_id", userId)
        .eq("analysis_type", "posture")
        .order("created_at", { ascending: false })
        .limit(10);

      if (postureError) throw postureError;
      setPostureHistory((postureData || []) as ImageAnalysisResult[]);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAnalysisHistory();
      loadPregnancyData();
    }, [fetchAnalysisHistory, loadPregnancyData])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header with user info */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
          style={styles.userCard}
        >
          <View style={styles.avatarPlaceholder}>
            <Feather name="user" size={32} color={colors.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || "Mama"}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </MotiView>

        {/* Pregnancy Start Date Picker */}
        {pregnancyStartDate && (
          <PregnancyStartDatePicker
            initialDate={pregnancyStartDate}
            initialName={user?.name || ""}
            onDateChange={handleUpdatePregnancyDate}
            onNameChange={handleUpdateName}
            isLoading={isUpdatingProfile}
          />
        )}

        

        {/* Analysis History Section */}
        <View style={styles.analysisSection}>
          <Text style={styles.sectionTitle}>Analysis History</Text>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[styles.tab, activeTab === "meals" && styles.activeTab]}
              onPress={() => setActiveTab("meals")}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === "meals" && styles.activeTabLabel,
                ]}
              >
                🍽️ Meals
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === "posture" && styles.activeTab]}
              onPress={() => setActiveTab("posture")}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === "posture" && styles.activeTabLabel,
                ]}
              >
                🧍 Posture
              </Text>
            </Pressable>
          </View>

          {/* Tab Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading history...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : activeTab === "meals" ? (
            <View style={styles.tabContent}>
              {mealHistory.length > 0 ? (
                mealHistory.map((analysis) => (
                  <MealHistoryCard key={analysis.id} analysis={analysis} />
                ))
              ) : (
                <View style={styles.historyCard}>
                  <Text style={styles.historyTitle}>No meals logged yet</Text>
                  <Text style={styles.historySubtitle}>
                    Start logging your meals to track nutrition!
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.tabContent}>
              {postureHistory.length > 0 ? (
                postureHistory.map((analysis) => (
                  <PostureHistoryCard key={analysis.id} analysis={analysis} />
                ))
              ) : (
                <View style={styles.historyCard}>
                  <Text style={styles.historyTitle}>No posture checks yet</Text>
                  <Text style={styles.historySubtitle}>
                    Start checking your posture to improve alignment!
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuList}>
            <ProfileMenuItem
              icon="bell"
              label="Notifications"
              onPress={() => {}}
            />
            <ProfileMenuItem
              icon="lock"
              label="Privacy & Security"
              onPress={() => {}}
            />
            <ProfileMenuItem
              icon="help-circle"
              label="Help & Support"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Sign Out Button */}
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && styles.signOutButtonPressed,
          ]}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.xxxl,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xxl,
    ...shadows.card,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.mutedPink,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.title,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: typography.label,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: "center",
    ...shadows.soft,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.label,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  menuSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.subtitle,
    fontWeight: "600",
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
  },
  menuList: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    ...shadows.soft,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F5D6DB",
  },
  menuItemPressed: {
    backgroundColor: colors.background,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  menuItemLabel: {
    fontSize: typography.body,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  destructiveLabel: {
    color: "#EF5350",
  },
  signOutButton: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: "#EF5350",
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  signOutButtonPressed: {
    backgroundColor: "rgba(239, 83, 80, 0.05)",
  },
  signOutText: {
    color: "#EF5350",
    fontWeight: "600",
    fontSize: typography.subtitle,
  },
  // Analysis History Styles
  analysisSection: {
    gap: spacing.md,
  },
  tabContainer: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.soft,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabLabel: {
    fontSize: typography.body,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  activeTabLabel: {
    color: "#fff",
    fontWeight: "600",
  },
  tabContent: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.md,
    ...shadows.soft,
  },
  historyTitle: {
    fontSize: typography.subtitle,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  historySubtitle: {
    fontSize: typography.label,
    color: colors.textSecondary,
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  errorContainer: {
    backgroundColor: "#FFE5E5",
    borderRadius: radii.md,
    padding: spacing.lg,
    marginVertical: spacing.md,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: typography.body,
    textAlign: "center",
  },
  historyImage: {
    width: "100%",
    height: 150,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  historyContent: {
    gap: spacing.sm,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyDate: {
    fontSize: typography.label,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  historyCalories: {
    fontSize: typography.subtitle,
    color: colors.primary,
    fontWeight: "700",
  },
  historyFoods: {
    fontSize: typography.body,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  historyRecommendation: {
    fontSize: typography.label,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  postureScore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  postureScoreText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: typography.subtitle,
  },
  historySafety: {
    fontSize: typography.label,
    color: colors.textSecondary,
  },
});
