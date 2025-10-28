import { useAppAlert } from "@/components/ui/app-alert";
import { CircleIconButton } from "@/components/ui/circle-icon-button";
import { StatCard } from "@/components/ui/stat-card";
import { MotherhoodTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { colors, radii, spacing, typography } = MotherhoodTheme;

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

interface KickCount {
  id: string;
  count: number;
  time_of_day: TimeOfDay;
  notes?: string;
  created_at: string;
}

const TIME_PERIODS = [
  {
    value: "morning" as TimeOfDay,
    label: "Morning",
    icon: "☀️",
    color: colors.mint,
  },
  {
    value: "afternoon" as TimeOfDay,
    label: "Afternoon",
    icon: "🌤️",
    color: colors.peach,
  },
  {
    value: "evening" as TimeOfDay,
    label: "Evening",
    icon: "🌅",
    color: colors.primary,
  },
  {
    value: "night" as TimeOfDay,
    label: "Night",
    icon: "🌙",
    color: colors.lilac,
  },
];

export default function KickCounter() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAppAlert();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimeOfDay>("morning");
  const [currentCount, setCurrentCount] = useState(0);
  const [notes, setNotes] = useState("");
  const [todayKicks, setTodayKicks] = useState<KickCount[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [weeklyAverage, setWeeklyAverage] = useState(0);

  const loadKickData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const { data: todayData } = await supabase
        .from("kick_counts")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today);

      if (todayData) {
        setTodayKicks(todayData);
        const total = todayData.reduce(
          (sum: number, k: KickCount) => sum + k.count,
          0
        );
        setTodayTotal(total);
        const periodData = todayData.find(
          (k) => k.time_of_day === selectedPeriod
        );
        if (periodData) {
          setCurrentCount(periodData.count);
          setNotes(periodData.notes || "");
        }
      }

      const { data: weekData } = await supabase
        .from("kick_counts")
        .select("count")
        .eq("user_id", user.id)
        .gte("date", weekAgo)
        .lte("date", today);

      if (weekData && weekData.length > 0) {
        const avg =
          weekData.reduce((sum: number, k: any) => sum + k.count, 0) /
          Math.max(weekData.length, 1);
        setWeeklyAverage(Math.round(avg));
      }
    } catch (error) {
      console.error("Error loading:", error);
    }
  }, [user?.id, selectedPeriod]);

  useEffect(() => {
    loadKickData();
  }, [loadKickData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadKickData();
    setRefreshing(false);
  }, [loadKickData]);

  const incrementKicks = useCallback(async () => {
    if (!user?.id) return;
    // Trigger haptic feedback on increment
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newCount = currentCount + 1;
    setCurrentCount(newCount);
  }, [user?.id, currentCount]);

  const decrementKicks = useCallback(async () => {
    if (!user?.id || currentCount <= 0) return;
    // Trigger haptic feedback on decrement
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newCount = currentCount - 1;
    setCurrentCount(newCount);
  }, [user?.id, currentCount]);

  const saveNotes = useCallback(async () => {
    if (!user?.id) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      await supabase.from("kick_counts").upsert({
        user_id: user.id,
        date: today,
        time_of_day: selectedPeriod,
        count: currentCount,
        notes: notes || null,
      });
      showAlert({
        title: "Saved",
        message: "Your kick counter notes are updated",
        type: "success",
      });
      // Reset the log after saving
      setCurrentCount(0);
      setNotes("");
    } catch {
      showAlert({
        title: "Error",
        message: "Failed to save notes",
        type: "error",
      });
    }
  }, [user?.id, selectedPeriod, currentCount, notes, showAlert]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="always"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Kick Counter</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statWrapper}>
              <StatCard
                title="Today"
                value={todayTotal}
                subtitle="kicks"
                variant="primary"
              />
            </View>
            <View style={styles.statWrapper}>
              <StatCard
                title="Avg"
                value={weeklyAverage}
                subtitle="per day"
                variant="secondary"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Period</Text>
            <View style={styles.periodGrid}>
              {TIME_PERIODS.map((period) => (
                <Pressable
                  key={period.value}
                  style={[
                    styles.periodCard,
                    {
                      backgroundColor:
                        selectedPeriod === period.value
                          ? period.color
                          : colors.surface,
                    },
                  ]}
                  onPress={async () => {
                    // Trigger haptic feedback on period selection
                    await Haptics.selectionAsync();
                    setSelectedPeriod(period.value);
                    const existing = todayKicks.find(
                      (k) => k.time_of_day === period.value
                    );
                    setCurrentCount(existing?.count || 0);
                    setNotes(existing?.notes || "");
                  }}
                >
                  <Text style={styles.periodEmoji}>{period.icon}</Text>
                  <Text
                    style={[
                      styles.periodLabel,
                      selectedPeriod === period.value &&
                      styles.periodLabelActive,
                    ]}
                  >
                    {period.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 300 }}
            style={styles.counterSection}
          >
            <View style={styles.counterCard}>
              <Text style={styles.counterLabel}>
                {TIME_PERIODS.find((p) => p.value === selectedPeriod)?.label}
              </Text>
              <Text style={styles.counterValue}>{currentCount}</Text>
              <View style={styles.counterButtons}>
                <CircleIconButton
                  icon="remove"
                  onPress={decrementKicks}
                  size={32}
                  backgroundColor={colors.surface}
                  color={colors.textPrimary}
                  disabled={currentCount <= 0}
                />
                <CircleIconButton
                  icon="add"
                  onPress={incrementKicks}
                  size={32}
                  backgroundColor={colors.accent}
                  color={colors.textPrimary}
                />
              </View>
            </View>
          </MotiView>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesContainer}>
              <TextInput
                style={styles.notesInput}
                placeholder="How did baby feel?"
                placeholderTextColor={colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Pressable style={styles.saveButton} onPress={async () => {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                saveNotes();
              }}>
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  counterButtons: {
    flexDirection: "row",
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  counterCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: "center",
  },
  counterLabel: { color: colors.textSecondary, fontSize: typography.body },
  counterSection: { marginBottom: spacing.lg, paddingHorizontal: spacing.lg },
  counterValue: {
    color: colors.textPrimary,
    fontSize: 72,
    fontWeight: "700",
    marginVertical: spacing.sm,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.headline,
    fontWeight: "700",
  },
  notesContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  notesInput: {
    color: colors.textPrimary,
    fontSize: typography.body,
    minHeight: 80,
    padding: spacing.md,
    paddingBottom: spacing.md,
  },
  periodCard: {
    alignItems: "center",
    borderRadius: radii.md,
    height: 100,
    justifyContent: "center",
    width: "48%",
  },
  periodEmoji: { fontSize: 32, marginBottom: spacing.xs },
  periodGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  periodLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: "500",
  },
  periodLabelActive: { color: colors.textPrimary, fontWeight: "600" },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
  },
  saveButtonText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: "600",
  },
  section: { marginBottom: spacing.lg, paddingHorizontal: spacing.lg },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  statWrapper: { flex: 1 },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
});
