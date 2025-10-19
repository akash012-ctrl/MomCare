import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PregnancyCalendar } from "@/components/ui/pregnancy-calendar";
import { MotherhoodTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import {
  calculatePregnancyWeeks,
  formatPregnancyProgress,
  getWeeklyTips,
  type PregnancyInfo,
} from "@/lib/pregnancy-calendar";
import { supabase } from "@/lib/supabase";

const { colors, radii, spacing, typography, shadows } = MotherhoodTheme;

interface FeatureCard {
  id: string;
  title: string;
  icon: string;
  route: string;
  order: number;
}

export default function HomeDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [pregnancyInfo, setPregnancyInfo] = useState<PregnancyInfo | null>(
    null
  );
  const [tips, setTips] = useState<string[]>([]);
  const [recentMealAnalysis, setRecentMealAnalysis] = useState<{
    totalCalories: number;
    mealCount: number;
  } | null>(null);
  const [postureScore, setPostureScore] = useState<number | null>(null);
  const [nutritionInsights, setNutritionInsights] = useState<string[]>([]);
  const [pregnancyStartDate, setPregnancyStartDate] = useState<string | null>(
    null
  );
  const [featureCards, setFeatureCards] = useState<FeatureCard[]>([]);

  // Load feature cards from Supabase
  const loadFeatureCards = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("feature_items")
        .select("*")
        .order("order", { ascending: true });

      if (data) {
        setFeatureCards(data as FeatureCard[]);
      }
    } catch (error) {
      console.error("Error loading feature cards:", error);
      // Fallback to default feature cards
      setFeatureCards([
        {
          id: "1",
          title: "Ask AI",
          icon: "message-circle",
          route: "/(tabs)/assistant",
          order: 1,
        },
        {
          id: "2",
          title: "Symptoms",
          icon: "activity",
          route: "/(tabs)/track/symptom-log",
          order: 2,
        },
        {
          id: "3",
          title: "Kicks",
          icon: "heart",
          route: "/(tabs)/track/kick-counter",
          order: 3,
        },
        {
          id: "4",
          title: "Goals",
          icon: "award",
          route: "/(tabs)/track/goals",
          order: 4,
        },
      ]);
    }
  }, []);

  const loadPregnancyData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("pregnancy_start_date, full_name")
        .eq("id", user.id)
        .single();

      if (profile?.pregnancy_start_date) {
        const startDate = new Date(profile.pregnancy_start_date);
        setPregnancyStartDate(profile.pregnancy_start_date);

        const info = calculatePregnancyWeeks(startDate);
        setPregnancyInfo(info);

        // Pregnancy info calculated

        const weeklyTips = getWeeklyTips(info.weeks);
        setTips(weeklyTips);
      }

      // Load recent meal analysis
      const { data: mealAnalyses } = await supabase
        .from("image_analysis_results")
        .select("result")
        .eq("user_id", user.id)
        .eq("analysis_type", "meal")
        .order("created_at", { ascending: false })
        .limit(5);

      if (mealAnalyses && mealAnalyses.length > 0) {
        let totalCalories = 0;
        mealAnalyses.forEach((item) => {
          const result = item.result as Record<string, unknown>;
          if (
            result?.totalCalories &&
            typeof result.totalCalories === "number"
          ) {
            totalCalories += result.totalCalories;
          }
        });
        setRecentMealAnalysis({
          totalCalories: Math.round(totalCalories),
          mealCount: mealAnalyses.length,
        });

        // Generate nutrition insights
        const avgCaloriesPerMeal = Math.round(
          totalCalories / mealAnalyses.length
        );
        const insights = [];
        if (avgCaloriesPerMeal > 2200) {
          insights.push("✨ Great nutrition intake for pregnancy!");
        } else if (avgCaloriesPerMeal < 1800) {
          insights.push(
            "📌 Consider increasing calorie intake by 300-500 kcal"
          );
        }
        if (mealAnalyses.length >= 3) {
          insights.push(
            `🎯 You've logged ${mealAnalyses.length} meals recently`
          );
        }
        setNutritionInsights(insights);
      }

      // Load latest posture score
      const { data: postureAnalyses } = await supabase
        .from("image_analysis_results")
        .select("result")
        .eq("user_id", user.id)
        .eq("analysis_type", "posture")
        .order("created_at", { ascending: false })
        .limit(1);

      if (postureAnalyses && postureAnalyses.length > 0) {
        const result = postureAnalyses[0].result as Record<string, unknown>;
        if (result?.postureScore && typeof result.postureScore === "number") {
          setPostureScore(Math.round(result.postureScore));
        }
      }
    } catch (error) {
      console.error("Error loading pregnancy data:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPregnancyData();
    loadFeatureCards();
  }, [loadPregnancyData, loadFeatureCards]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPregnancyData();
    setRefreshing(false);
  }, [loadPregnancyData]);

  const userName = user?.name?.split(" ")[0] || "Mom";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentInsetAdjustmentBehavior="always"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Greeting */}
        <View style={styles.headerWrapper}>
          <LinearGradient
            colors={[colors.primary, colors.blush]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 500 }}
            >
              <Text style={styles.headerGreeting}>Hello, {userName}</Text>
              {pregnancyInfo && (
                <Text style={styles.headerSubtext}>
                  {formatPregnancyProgress(pregnancyInfo)} •{" "}
                  {pregnancyInfo.trimester === 1
                    ? "1st"
                    : pregnancyInfo.trimester === 2
                    ? "2nd"
                    : "3rd"}{" "}
                  Trimester
                </Text>
              )}
            </MotiView>
          </LinearGradient>
        </View>
        {/* Quick Tips */}
        {tips.length > 0 && (
          <View style={styles.tipsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tipScroll}
            >
              {tips.map((tip: string, index: number) => (
                <MotiView
                  key={index}
                  from={{ opacity: 0, translateX: 20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{
                    delay: 300 + index * 80,
                    type: "timing",
                    duration: 400,
                  }}
                  style={styles.tipCard}
                >
                  <View style={styles.tipScroll} />
                  <Text style={[styles.tipText, { color: colors.danger }]}>
                    {tip}
                  </Text>
                </MotiView>
              ))}
            </ScrollView>
          </View>
        )}
        {/* Feature Cards - Compact Single Row */}
        <View style={styles.compactFeatureGrid}>
          {featureCards.map((card, index) => (
            <MotiView
              key={card.title}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                delay: 220 + index * 60,
                type: "timing",
                duration: 400,
              }}
              style={styles.compactFeatureWrapper}
            >
              <Pressable
                style={styles.compactFeatureCard}
                onPress={() => router.push(card.route as never)}
              >
                {({ pressed }) => (
                  <MotiView
                    from={{ scale: 1 }}
                    animate={{ scale: pressed ? 0.95 : 1 }}
                    transition={{ type: "timing", duration: 120 }}
                    style={styles.compactFeatureContent}
                  >
                    <View style={styles.compactFeatureIcon}>
                      <Feather
                        name={card.icon as keyof typeof Feather.glyphMap}
                        size={40}
                        color={colors.lavender}
                      />
                    </View>
                    <Text style={styles.compactFeatureTitle}>{card.title}</Text>
                  </MotiView>
                )}
              </Pressable>
            </MotiView>
          ))}
        </View>

        {/* Pregnancy Calendar with Week & Month Tracking */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 300, type: "timing", duration: 500 }}
        >
          <PregnancyCalendar
            pregnancyStartDate={pregnancyStartDate || undefined}
            onDateSelect={(date) => console.log("Selected date:", date)}
          />
        </MotiView>

        {/* Analysis Widgets */}
        {(recentMealAnalysis || postureScore !== null) && (
          <View style={styles.widgetsWrapper}>
            <Text style={styles.sectionHeading}>Your Health Insights</Text>

            {/* Meal Analysis Widget */}
            {recentMealAnalysis && (
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 400, type: "timing", duration: 500 }}
                style={styles.widgetCard}
              >
                <Pressable
                  style={styles.widgetContent}
                  onPress={() =>
                    router.push("/(tabs)/track/meal-logging" as any)
                  }
                >
                  <View style={styles.widgetHeader}>
                    <Text style={styles.widgetEmoji}>🍽️</Text>
                    <View style={styles.widgetTitleGroup}>
                      <Text style={styles.widgetTitle}>Recent Meals</Text>
                      <Text style={styles.widgetSubtitle}>
                        {recentMealAnalysis.mealCount} meals logged
                      </Text>
                    </View>
                  </View>
                  <View style={styles.widgetStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Total Calories</Text>
                      <Text style={styles.statValue}>
                        {recentMealAnalysis.totalCalories}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </MotiView>
            )}

            {/* Posture Widget */}
            {postureScore !== null && (
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 450, type: "timing", duration: 500 }}
                style={styles.widgetCard}
              >
                <Pressable
                  style={styles.widgetContent}
                  onPress={() =>
                    router.push("/(tabs)/track/posture-check" as any)
                  }
                >
                  <View style={styles.widgetHeader}>
                    <Text style={styles.widgetEmoji}>🧍</Text>
                    <View style={styles.widgetTitleGroup}>
                      <Text style={styles.widgetTitle}>Posture Score</Text>
                      <Text style={styles.widgetSubtitle}>Latest check</Text>
                    </View>
                  </View>
                  <View style={styles.widgetStats}>
                    <View style={[styles.statItem, styles.scoreCircle]}>
                      <Text
                        style={[
                          styles.statValue,
                          {
                            color:
                              postureScore >= 80
                                ? colors.success
                                : postureScore >= 60
                                ? colors.accent
                                : colors.danger,
                          },
                        ]}
                      >
                        {postureScore}%
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </MotiView>
            )}

            {/* Nutrition Insights */}
            {nutritionInsights.length > 0 && (
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 500, type: "timing", duration: 500 }}
                style={styles.insightCard}
              >
                <View style={styles.insightHeader}>
                  <Text style={styles.insightEmoji}>💡</Text>
                  <Text style={styles.insightTitle}>AI Suggestions</Text>
                </View>
                {nutritionInsights.map((insight, index) => (
                  <Text key={index} style={styles.insightText}>
                    {insight}
                  </Text>
                ))}
              </MotiView>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  compactFeatureGrid: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  compactFeatureWrapper: {
    flex: 1,
  },
  compactFeatureCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    ...shadows.card,
  },
  compactFeatureContent: {
    alignItems: "center",
    width: "100%",
  },
  compactFeatureIcon: {
    alignItems: "center",

    borderRadius: radii.md,
    height: 44,
    justifyContent: "center",
    width: 44,
    marginBottom: spacing.xs,
  },
  compactFeatureTitle: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    fontWeight: "600",
    textAlign: "center",
  },
  featureCard: {
    borderRadius: radii.lg,
    height: 140,
    width: "100%",
    ...shadows.card,
  },
  featureContent: {
    alignItems: "flex-start",
    flex: 1,
    justifyContent: "space-between",
    padding: spacing.md,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  featureIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: radii.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  featureSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  featureTitle: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: "600",
  },
  featureWrapper: {
    width: "48%",
  },
  header: {
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  headerGreeting: {
    color: colors.textPrimary,
    fontSize: typography.headline,
    fontWeight: "700",
  },
  headerSubtext: {
    color: colors.textSecondary,
    fontSize: typography.body,
    marginTop: spacing.xs,
  },
  headerWrapper: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  progressCard: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  progressDaysLeft: {
    color: colors.textSecondary,
    fontSize: typography.label,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  progressTitle: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionHeading: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  statusCard: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  statusCaption: {
    color: colors.textSecondary,
    fontSize: typography.label,
  },
  statusEmoji: {
    fontSize: 48,
  },
  statusInner: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  statusTextGroup: {
    flex: 1,
  },
  statusTitle: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: "600",
  },
  tipAccent: {
    backgroundColor: colors.primary,
    borderRadius: radii.xs,
    height: "100%",
    position: "absolute",
    width: 4,
  },
  tipCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginRight: spacing.md,
    minWidth: 280,
    padding: spacing.md,
    paddingLeft: spacing.lg,
    ...shadows.card,
  },
  tipScroll: {
    paddingRight: spacing.lg,
  },
  tipText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  tipsWrapper: {
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  // Dashboard Widgets Styles
  widgetsWrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  widgetCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  widgetContent: {
    padding: spacing.md,
  },
  widgetHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  widgetEmoji: {
    fontSize: 32,
  },
  widgetTitleGroup: {
    flex: 1,
  },
  widgetTitle: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: "600",
  },
  widgetSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },
  widgetStats: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    paddingVertical: spacing.md,
  },
  scoreCircle: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    height: 80,
    justifyContent: "center",
    width: 80,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.label,
  },
  statValue: {
    color: colors.primary,
    fontSize: typography.headline,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  insightCard: {
    backgroundColor: colors.lilac,
    borderLeftColor: colors.primary,
    borderLeftWidth: 4,
    borderRadius: radii.md,
    marginBottom: spacing.xxxl,
    padding: spacing.md,
  },
  insightHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  insightEmoji: {
    fontSize: 20,
  },
  insightTitle: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: "600",
  },
  insightText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
});
