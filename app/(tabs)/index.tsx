import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

import { getPregnancyWeekInfo, type WeeklyPregnancyInfo } from "@/constants/pregnancy-weeks-data";
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

const translations = {
  en: {
    hello: 'Hello',
    trimester: (num: number) => `${num === 1 ? '1st' : num === 2 ? '2nd' : '3rd'} Trimester`,
    week: 'Week',
    babySize: 'Baby is the size of a',
    babyDevelopment: "Baby's Development",
    weight: 'Weight',
    length: 'Length',
    yourBodyChanges: 'Your Body Changes',
    commonSymptoms: 'Common Symptoms',
    tipsAdvice: 'Tips & Advice',
    mealAnalysis: 'Meal Analysis',
    calories: 'calories',
    meals: 'meals',
    nutritionInsights: 'Nutrition Insights',
  },
  hi: {
    hello: 'नमस्ते',
    trimester: (num: number) => `${num === 1 ? 'पहली' : num === 2 ? 'दूसरी' : 'तीसरी'} तिमाही`,
    week: 'सप्ताह',
    babySize: 'बच्चा इतना बड़ा है',
    babyDevelopment: 'बच्चे का विकास',
    weight: 'वजन',
    length: 'लंबाई',
    yourBodyChanges: 'आपके शरीर में बदलाव',
    commonSymptoms: 'सामान्य लक्षण',
    tipsAdvice: 'सुझाव और सलाह',
    mealAnalysis: 'भोजन विश्लेषण',
    calories: 'कैलोरी',
    meals: 'भोजन',
    nutritionInsights: 'पोषण जानकारी',
  },
};

interface FeatureCard {
  id: string;
  title: string;
  icon: string;
  route: string;
  order: number;
}

export default function HomeDashboard() {
  const router = useRouter();
  const { user, preferredLanguage } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [pregnancyInfo, setPregnancyInfo] = useState<PregnancyInfo | null>(
    null
  );
  const [tips, setTips] = useState<string[]>([]);
  const [recentMealAnalysis, setRecentMealAnalysis] = useState<{
    totalCalories: number;
    mealCount: number;
  } | null>(null);

  const [nutritionInsights, setNutritionInsights] = useState<string[]>([]);
  const [pregnancyStartDate, setPregnancyStartDate] = useState<string | null>(
    null
  );
  const [featureCards, setFeatureCards] = useState<FeatureCard[]>([]);
  const [weeklyInfo, setWeeklyInfo] = useState<WeeklyPregnancyInfo | null>(null);

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

        // Load weekly pregnancy information with language
        const weekInfo = getPregnancyWeekInfo(info.weeks, preferredLanguage || 'en');
        if (weekInfo) {
          setWeeklyInfo(weekInfo);
          // Use tips from dataset
          setTips(weekInfo.tipsAndAdvice.slice(0, 3));
        } else {
          // Fallback to generic tips
          const weeklyTips = getWeeklyTips(info.weeks);
          setTips(weeklyTips);
        }
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


    } catch (error) {
      console.error("Error loading pregnancy data:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPregnancyData();
    loadFeatureCards();
  }, [loadPregnancyData, loadFeatureCards]);

  // Reload pregnancy info when language changes
  useEffect(() => {
    if (pregnancyInfo && preferredLanguage) {
      const weekInfo = getPregnancyWeekInfo(pregnancyInfo.weeks, preferredLanguage);
      if (weekInfo) {
        setWeeklyInfo(weekInfo);
        setTips(weekInfo.tipsAndAdvice.slice(0, 3));
      }
    }
  }, [preferredLanguage, pregnancyInfo]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPregnancyData();
    setRefreshing(false);
  }, [loadPregnancyData]);

  const userName = user?.name?.split(" ")[0] || "Mom";
  const t = translations[preferredLanguage || 'en'];

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
              <Text style={styles.headerGreeting}>{t.hello}, {userName}</Text>
              {pregnancyInfo && (
                <Text style={styles.headerSubtext}>
                  {formatPregnancyProgress(pregnancyInfo)} •{" "}
                  {t.trimester(pregnancyInfo.trimester)}
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
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(card.route as never);
                }}
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

        {/* Weekly Pregnancy Information */}
        {weeklyInfo && pregnancyInfo && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 300, type: "timing", duration: 500 }}
            style={styles.weeklyInfoSection}
          >
            <View style={styles.weekCard}>
              <View style={styles.weekHeader}>
                <Text style={styles.weekIcon}>{weeklyInfo.icon}</Text>
                <View style={styles.weekHeaderText}>
                  <Text style={styles.weekTitle}>{t.week} {weeklyInfo.week}</Text>
                  <Text style={styles.weekSubtitle}>{t.babySize} {weeklyInfo.babySize}</Text>
                </View>
              </View>

              {weeklyInfo.milestone && (
                <View style={styles.milestoneCard}>
                  <Text style={styles.milestoneIcon}>🎉</Text>
                  <Text style={styles.milestoneText}>{weeklyInfo.milestone}</Text>
                </View>
              )}

              {/* Baby Development */}
              <View style={styles.infoSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>👶</Text>
                  <Text style={styles.sectionTitle}>{t.babyDevelopment}</Text>
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>{t.weight}</Text>
                    <Text style={styles.statValue}>{weeklyInfo.babyWeight}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>{t.length}</Text>
                    <Text style={styles.statValue}>{weeklyInfo.babyLength}</Text>
                  </View>
                </View>
                {weeklyInfo.babyDevelopment.map((item, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>

              {/* Maternal Changes */}
              <View style={styles.infoSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>💪</Text>
                  <Text style={styles.sectionTitle}>{t.yourBodyChanges}</Text>
                </View>
                {weeklyInfo.maternalChanges.map((item, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>

              {/* Common Symptoms */}
              <View style={styles.infoSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>🌼</Text>
                  <Text style={styles.sectionTitle}>{t.commonSymptoms}</Text>
                </View>
                <View style={styles.symptomsGrid}>
                  {weeklyInfo.symptoms.map((symptom, index) => (
                    <View key={index} style={styles.symptomChip}>
                      <Text style={styles.symptomText}>{symptom}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Tips & Advice */}
              <View style={styles.infoSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>✨</Text>
                  <Text style={styles.sectionTitle}>{t.tipsAdvice}</Text>
                </View>
                {weeklyInfo.tipsAndAdvice.map((tip, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <Text style={styles.bullet}>✓</Text>
                    <Text style={styles.bulletText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>
          </MotiView>
        )}

        {/* Analysis Widgets */}
        {recentMealAnalysis && (
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
    color: colors.success,
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
  // Weekly Information Styles
  weeklyInfoSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  weekCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.card,
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  weekIcon: {
    fontSize: 60,
  },
  weekHeaderText: {
    flex: 1,
  },
  weekTitle: {
    color: colors.textPrimary,
    fontSize: typography.headline,
    fontWeight: "700",
  },
  weekSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.subtitle,
    marginTop: spacing.xs,
  },
  milestoneCard: {
    backgroundColor: colors.blush,
    borderRadius: radii.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  milestoneIcon: {
    fontSize: 24,
  },
  milestoneText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: "600",
    flex: 1,
  },
  infoSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionIcon: {
    fontSize: 24,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.mint,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: "center",
  },
  bulletItem: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  bullet: {
    color: colors.success,
    fontSize: typography.body,
    fontWeight: "700",
    width: 20,
  },
  bulletText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    flex: 1,
    lineHeight: 22,
  },
  symptomsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  symptomChip: {
    backgroundColor: colors.peach,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  symptomText: {
    color: colors.textPrimary,
    fontSize: typography.label,
  },
});
