import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAppAlert } from "@/components/ui/app-alert";
import { ProgressPill } from "@/components/ui/progress-pill";
import { RoundedCard } from "@/components/ui/rounded-card";
import { MotherhoodTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import {
  calculatePregnancyWeeks,
  getNutritionRequirements,
  type NutritionRequirements,
} from "@/lib/pregnancy-calendar";
import { supabase } from "@/lib/supabase";

const { colors, radii, spacing, typography, shadows } = MotherhoodTheme;

interface DailyIntake {
  water_ml: number;
  calories: number;
  protein_g: number;
  iron_mg: number;
  calcium_mg: number;
  folic_acid_mcg: number;
}

const ESSENTIAL_NUTRIENTS = [
  {
    key: "calories_extra" as keyof NutritionRequirements,
    name: "Calories",
    icon: "🔥",
    unit: "kcal",
    color: colors.primary,
  },
  {
    key: "protein_g" as keyof NutritionRequirements,
    name: "Protein",
    icon: "🥚",
    unit: "g",
    color: colors.peach,
  },
  {
    key: "iron_mg" as keyof NutritionRequirements,
    name: "Iron",
    icon: "🩸",
    unit: "mg",
    color: colors.accent,
  },
  {
    key: "calcium_mg" as keyof NutritionRequirements,
    name: "Calcium",
    icon: "🦴",
    unit: "mg",
    color: colors.mint,
  },
  {
    key: "folic_acid_mcg" as keyof NutritionRequirements,
    name: "Folic Acid",
    icon: "🥬",
    unit: "mcg",
    color: colors.lilac,
  },
  {
    key: "water_ml" as keyof NutritionRequirements,
    name: "Water",
    icon: "💧",
    unit: "ml",
    color: colors.lavender,
  },
];

export default function NutritionCoach() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAppAlert();
  const [refreshing, setRefreshing] = useState(false);

  const [requirements, setRequirements] =
    useState<NutritionRequirements | null>(null);
  const [todayIntake, setTodayIntake] = useState<DailyIntake>({
    water_ml: 0,
    calories: 0,
    protein_g: 0,
    iron_mg: 0,
    calcium_mg: 0,
    folic_acid_mcg: 0,
  });
  const [trimester, setTrimester] = useState(1);

  const loadNutritionData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Get pregnancy start date
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("pregnancy_start_date")
        .eq("id", user.id)
        .single();

      if (profile?.pregnancy_start_date) {
        const pregnancyInfo = calculatePregnancyWeeks(
          new Date(profile.pregnancy_start_date)
        );
        setTrimester(pregnancyInfo.trimester);
        const reqs = getNutritionRequirements(pregnancyInfo.trimester);
        setRequirements(reqs);
      }

      // Load today's nutrition logs
      const today = new Date().toISOString().split("T")[0];
      const { data: logs, error } = await supabase
        .from("nutrition_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_at", `${today}T00:00:00`)
        .lt("logged_at", `${today}T23:59:59`);

      if (error) throw error;

      if (logs && logs.length > 0) {
        const totals = logs.reduce(
          (acc, log) => ({
            water_ml: acc.water_ml + (log.water_intake_ml || 0),
            calories: acc.calories + (log.calories || 0),
            protein_g: acc.protein_g + (log.protein_g || 0),
            iron_mg: acc.iron_mg + (log.iron_mg || 0),
            calcium_mg: acc.calcium_mg + (log.calcium_mg || 0),
            folic_acid_mcg: acc.folic_acid_mcg + (log.folic_acid_mcg || 0),
          }),
          {
            water_ml: 0,
            calories: 0,
            protein_g: 0,
            iron_mg: 0,
            calcium_mg: 0,
            folic_acid_mcg: 0,
          }
        );
        setTodayIntake(totals);
      }
    } catch (error) {
      console.error("Error loading nutrition data:", error);
      showAlert({
        title: "Error",
        message: "Failed to load nutrition data",
        type: "error",
      });
    }
  }, [user?.id, showAlert]);

  useEffect(() => {
    loadNutritionData();
  }, [loadNutritionData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNutritionData();
    setRefreshing(false);
  }, [loadNutritionData]);

  const getProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentInsetAdjustmentBehavior="always"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerWrapper}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()}>
              <Feather name="arrow-left" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Nutrition Coach</Text>
            <Text style={styles.tipsBody}>
              Meal Logging feature is in progress. there might be some error
            </Text>
            <View style={{ width: 24 }} />
          </View>
        </View>

        {/* Trimester Info */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
          style={styles.trimesterCard}
        >
          <RoundedCard variant="primary">
            <View style={styles.trimesterInner}>
              <Text style={styles.trimesterEmoji}>🤰</Text>
              <View style={styles.trimesterText}>
                <Text style={styles.trimesterTitle}>
                  {trimester === 1 ? "1st" : trimester === 2 ? "2nd" : "3rd"}{" "}
                  Trimester
                </Text>
                <Text style={styles.trimesterSubtitle}>
                  Personalized nutrition guidance
                </Text>
              </View>
            </View>
          </RoundedCard>
        </MotiView>

        {/* Today's Progress */}
        {requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today&amp;s Progress</Text>
            {ESSENTIAL_NUTRIENTS.map((nutrient, index) => {
              const targetValue = requirements[nutrient.key] as number;
              const currentValue =
                nutrient.key === "calories_extra"
                  ? todayIntake.calories
                  : nutrient.key === "protein_g"
                  ? todayIntake.protein_g
                  : nutrient.key === "iron_mg"
                  ? todayIntake.iron_mg
                  : nutrient.key === "calcium_mg"
                  ? todayIntake.calcium_mg
                  : nutrient.key === "folic_acid_mcg"
                  ? todayIntake.folic_acid_mcg
                  : todayIntake.water_ml;

              return (
                <MotiView
                  key={nutrient.key}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{
                    delay: index * 80,
                    type: "timing",
                    duration: 400,
                  }}
                  style={styles.progressItem}
                >
                  <View style={styles.progressHeader}>
                    <View style={styles.nutrientInfo}>
                      <Text style={styles.nutrientIcon}>{nutrient.icon}</Text>
                      <Text style={styles.nutrientName}>{nutrient.name}</Text>
                    </View>
                    <Text style={styles.nutrientValues}>
                      {Math.round(currentValue)} / {targetValue} {nutrient.unit}
                    </Text>
                  </View>
                  <ProgressPill
                    progress={getProgress(currentValue, targetValue)}
                    color={nutrient.color}
                  />
                </MotiView>
              );
            })}
          </View>
        )}

        {/* ACOG Guidelines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACOG Guidelines</Text>
          <RoundedCard variant="secondary">
            <View style={styles.guidelinesCard}>
              <Feather name="book-open" size={24} color={colors.primary} />
              <View style={styles.guidelinesText}>
                <Text style={styles.guidelinesTitle}>
                  Key Nutrients During Pregnancy
                </Text>
                <Text style={styles.guidelinesBody}>
                  • <Text style={styles.bold}>Folic Acid (600 mcg):</Text>{" "}
                  Prevents neural tube defects{"\n"}•{" "}
                  <Text style={styles.bold}>Iron (27 mg):</Text> Supports blood
                  production{"\n"}•{" "}
                  <Text style={styles.bold}>Calcium (1000 mg):</Text> Builds
                  baby&amp;s bones{"\n"}•{" "}
                  <Text style={styles.bold}>Vitamin D (600 IU):</Text> Helps
                  calcium absorption{"\n"}•{" "}
                  <Text style={styles.bold}>DHA (200 mg):</Text> Supports brain
                  development
                </Text>
              </View>
            </View>
          </RoundedCard>
        </View>

        {/* Healthy Food Groups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Five Food Groups</Text>
          <View style={styles.foodGroupGrid}>
            {[
              { name: "Fruits", icon: "🍎", color: colors.accent },
              { name: "Vegetables", icon: "🥦", color: colors.mint },
              { name: "Grains", icon: "🌾", color: colors.peach },
              { name: "Protein", icon: "🥩", color: colors.primary },
              { name: "Dairy", icon: "🥛", color: colors.lavender },
            ].map((group) => (
              <View
                key={group.name}
                style={[styles.foodGroupCard, { backgroundColor: group.color }]}
              >
                <Text style={styles.foodGroupIcon}>{group.icon}</Text>
                <Text style={styles.foodGroupName}>{group.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <RoundedCard>
            <View style={styles.tipsCard}>
              <Feather name="info" size={24} color={colors.primary} />
              <View style={styles.tipsText}>
                <Text style={styles.tipsTitle}>Nutrition Tips</Text>
                <Text style={styles.tipsBody}>
                  • Eat small, frequent meals to manage nausea{"\n"}• Stay
                  hydrated - aim for 8-10 glasses daily{"\n"}• Choose whole
                  grains over refined carbs{"\n"}• Include lean protein with
                  each meal{"\n"}• Take prenatal vitamins as prescribed
                </Text>
              </View>
            </View>
          </RoundedCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bold: {
    fontWeight: "600",
  },
  foodGroupCard: {
    alignItems: "center",
    borderRadius: radii.md,
    height: 100,
    justifyContent: "center",
    width: "31%",
    ...shadows.card,
  },
  foodGroupGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  foodGroupIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  foodGroupName: {
    color: colors.textPrimary,
    fontSize: typography.label,
    fontWeight: "600",
  },
  guidelinesBody: {
    color: colors.textPrimary,
    fontSize: typography.body,
    lineHeight: 24,
  },
  guidelinesCard: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  guidelinesText: {
    flex: 1,
  },
  guidelinesTitle: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerWrapper: {
    paddingTop: spacing.xxxl,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.headline,
    fontWeight: "700",
  },
  nutrientIcon: {
    fontSize: 20,
  },
  nutrientInfo: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  nutrientName: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: "500",
  },
  nutrientValues: {
    color: colors.textSecondary,
    fontSize: typography.label,
  },
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  progressItem: {
    marginBottom: spacing.md,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  section: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  tipsBody: {
    color: colors.textPrimary,
    fontSize: typography.body,
    lineHeight: 24,
  },
  tipsCard: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  tipsText: {
    flex: 1,
  },
  tipsTitle: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  trimesterCard: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  trimesterEmoji: {
    fontSize: 48,
  },
  trimesterInner: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  trimesterSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.label,
  },
  trimesterText: {
    flex: 1,
  },
  trimesterTitle: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: "700",
  },
});
