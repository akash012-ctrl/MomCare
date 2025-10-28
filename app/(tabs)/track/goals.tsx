import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
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

import { useAppAlert } from "@/components/ui/app-alert";
import { CircleIconButton } from "@/components/ui/circle-icon-button";
import { ProgressPill } from "@/components/ui/progress-pill";
import { MotherhoodTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

const { colors, radii, spacing, typography, shadows } = MotherhoodTheme;

type GoalStatus = "active" | "completed" | "paused";

interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  target_value: number;
  current_value: number;
  unit: string;
  status: GoalStatus;
  due_date?: string;
  created_at: string;
}

const GOAL_CATEGORIES = [
  { name: "Exercise", icon: "🏃‍♀️", color: colors.accent },
  { name: "Nutrition", icon: "🥗", color: colors.mint },
  { name: "Wellness", icon: "🧘‍♀️", color: colors.lavender },
  { name: "Sleep", icon: "😴", color: colors.lilac },
  { name: "Learning", icon: "📚", color: colors.peach },
  { name: "Other", icon: "⭐", color: colors.blush },
];

export default function Goals() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAppAlert();
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Wellness");
  const [targetValue, setTargetValue] = useState("10");
  const [unit, setUnit] = useState("times");

  // Data
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [completedGoals, setCompletedGoals] = useState<Goal[]>([]);

  const loadGoals = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setActiveGoals(
          data.filter((g) => g.status === "active" || g.status === "paused")
        );
        setCompletedGoals(data.filter((g) => g.status === "completed"));
      }
    } catch (error) {
      console.error("Error loading goals:", error);
      showAlert({
        title: "Error",
        message: "Failed to load goals",
        type: "error",
      });
    }
  }, [user?.id, showAlert]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
  }, [loadGoals]);

  const handleCreateGoal = useCallback(async () => {
    if (!user?.id || !title.trim()) {
      showAlert({
        title: "Missing title",
        message: "Please enter a goal title",
        type: "warning",
      });
      return;
    }

    try {
      const { error } = await supabase.from("goals").insert({
        user_id: user.id,
        title,
        description: description || null,
        category,
        target_value: parseInt(targetValue) || 10,
        current_value: 0,
        unit,
        status: "active",
      });

      if (error) throw error;

      setModalVisible(false);
      setTitle("");
      setDescription("");
      setTargetValue("10");
      setUnit("times");
      await loadGoals();
      showAlert({
        title: "Goal created",
        message: "Your new goal is ready to track",
        type: "success",
      });
    } catch (error) {
      console.error("Error creating goal:", error);
      showAlert({
        title: "Error",
        message: "Failed to create goal",
        type: "error",
      });
    }
  }, [
    user?.id,
    title,
    description,
    category,
    targetValue,
    unit,
    loadGoals,
    showAlert,
  ]);

  const incrementProgress = useCallback(
    async (goal: Goal) => {
      const newValue = Math.min(goal.current_value + 1, goal.target_value);
      const newStatus =
        newValue >= goal.target_value ? "completed" : goal.status;

      try {
        const { error } = await supabase
          .from("goals")
          .update({ current_value: newValue, status: newStatus })
          .eq("id", goal.id);

        if (error) throw error;
        await loadGoals();

        if (newStatus === "completed") {
          showAlert({
            title: "🎉 Congratulations!",
            message: "You've completed your goal!",
            type: "success",
          });
        }
      } catch (error) {
        console.error("Error updating goal:", error);
        showAlert({
          title: "Error",
          message: "Failed to update goal",
          type: "error",
        });
      }
    },
    [loadGoals, showAlert]
  );

  const decrementProgress = useCallback(
    async (goal: Goal) => {
      if (goal.current_value <= 0) return;

      const newValue = goal.current_value - 1;
      const newStatus = "active";

      try {
        const { error } = await supabase
          .from("goals")
          .update({ current_value: newValue, status: newStatus })
          .eq("id", goal.id);

        if (error) throw error;
        await loadGoals();
      } catch (error) {
        console.error("Error updating goal:", error);
        showAlert({
          title: "Error",
          message: "Failed to update goal",
          type: "error",
        });
      }
    },
    [loadGoals, showAlert]
  );

  const deleteGoal = useCallback(
    async (goalId: string) => {
      try {
        const { error } = await supabase
          .from("goals")
          .delete()
          .eq("id", goalId);
        if (error) throw error;
        await loadGoals();
      } catch (error) {
        console.error("Error deleting goal:", error);
        showAlert({
          title: "Error",
          message: "Failed to delete goal",
          type: "error",
        });
      }
    },
    [loadGoals, showAlert]
  );

  const renderGoalCard = ({ item }: { item: Goal }) => {
    const categoryInfo = GOAL_CATEGORIES.find((c) => c.name === item.category);
    const progress = Math.round((item.current_value / item.target_value) * 100);

    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 300 }}
        style={styles.goalCard}
      >
        <View style={styles.goalHeader}>
          <View style={styles.goalIconWrapper}>
            <Text style={styles.goalIcon}>{categoryInfo?.icon || "⭐"}</Text>
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>{item.title}</Text>
            {item.description && (
              <Text style={styles.goalDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <Text style={styles.goalCategory}>{item.category}</Text>
          </View>
        </View>

        <ProgressPill
          progress={progress}
          label={`${item.current_value} / ${item.target_value} ${item.unit}`}
          color={categoryInfo?.color || colors.primary}
        />

        {item.status !== "completed" && (
          <View style={styles.goalActions}>
            <CircleIconButton
              icon="remove"
              onPress={() => decrementProgress(item)}
              size={24}
              backgroundColor={colors.surface}
              color={colors.textPrimary}
              disabled={item.current_value <= 0}
            />
            <CircleIconButton
              icon="add"
              onPress={() => incrementProgress(item)}
              size={24}
              backgroundColor={colors.accent}
              color={colors.textPrimary}
            />
            <Pressable
              style={styles.deleteButton}
              onPress={async () => {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                showAlert({
                  title: "Delete Goal",
                  message: "Are you sure you want to remove this goal?",
                  type: "warning",
                  actions: [
                    { text: "Cancel", tone: "secondary" },
                    {
                      text: "Delete",
                      tone: "danger",
                      onPress: () => deleteGoal(item.id),
                    },
                  ],
                });
              }}
            >
              <Feather name="trash-2" size={20} color={colors.danger} />
            </Pressable>
          </View>
        )}
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: "height" })}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 20 })}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}>
            <Feather name="arrow-left" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>My Goals</Text>
          <Pressable onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setModalVisible(true);
          }}>
            <Feather name="plus" size={24} color={colors.primary} />
          </Pressable>
        </View>

        <FlatList
          data={[...activeGoals, ...completedGoals]}
          keyExtractor={(item) => item.id}
          renderItem={renderGoalCard}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="target" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No goals yet</Text>
              <Text style={styles.emptySubtext}>
                Tap + to create your first goal
              </Text>
            </View>
          }
        />

        {/* Create Goal Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.select({ ios: "padding", android: "height" })}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.select({ ios: 0, android: 20 })}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
              <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>New Goal</Text>
                    <Pressable onPress={() => setModalVisible(false)}>
                      <Feather name="x" size={24} color={colors.textPrimary} />
                    </Pressable>
                  </View>

                  {/* Title */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Goal Title</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g., Daily walk for 30 minutes"
                      placeholderTextColor={colors.textSecondary}
                      value={title}
                      onChangeText={setTitle}
                    />
                  </View>

                  {/* Category */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Category</Text>
                    <View style={styles.categoryGrid}>
                      {GOAL_CATEGORIES.map((cat) => (
                        <Pressable
                          key={cat.name}
                          style={[
                            styles.categoryCard,
                            {
                              backgroundColor:
                                category === cat.name ? cat.color : colors.surface,
                            },
                          ]}
                          onPress={async () => {
                            await Haptics.selectionAsync();
                            setCategory(cat.name);
                          }}
                        >
                          <Text style={styles.categoryIcon}>{cat.icon}</Text>
                          <Text
                            style={[
                              styles.categoryName,
                              category === cat.name && styles.categoryNameActive,
                            ]}
                          >
                            {cat.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Target & Unit */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Target</Text>
                    <View style={styles.targetRow}>
                      <TextInput
                        style={[styles.textInput, styles.targetInput]}
                        placeholder="10"
                        placeholderTextColor={colors.textSecondary}
                        value={targetValue}
                        onChangeText={setTargetValue}
                        keyboardType="number-pad"
                      />
                      <TextInput
                        style={[styles.textInput, styles.unitInput]}
                        placeholder="times"
                        placeholderTextColor={colors.textSecondary}
                        value={unit}
                        onChangeText={setUnit}
                      />
                    </View>
                  </View>

                  {/* Description */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Description (optional)</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      placeholder="Add more details..."
                      placeholderTextColor={colors.textSecondary}
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Create Button */}
                  <Pressable style={styles.saveButton} onPress={handleCreateGoal}>
                    <Text style={styles.saveButtonText}>Create Goal</Text>
                  </Pressable>
                </ScrollView>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  categoryCard: {
    alignItems: "center",
    borderRadius: radii.md,
    height: 80,
    justifyContent: "center",
    width: "31%",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  categoryName: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: "500",
  },
  categoryNameActive: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  deleteButton: {
    marginLeft: "auto",
    padding: spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
  },
  emptySubtext: {
    color: colors.textSecondary,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    marginTop: spacing.md,
  },
  goalActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.card,
  },
  goalCategory: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  goalDescription: {
    color: colors.textSecondary,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },
  goalHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  goalIcon: {
    fontSize: 24,
  },
  goalIconWrapper: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radii.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: "600",
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
  listContent: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: "90%",
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  modalLabel: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  modalOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "flex-end",
  },
  modalSection: {
    marginBottom: spacing.lg,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: "700",
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  saveButtonText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: "600",
  },
  targetInput: {
    flex: 1,
  },
  targetRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  textArea: {
    minHeight: 80,
    paddingTop: spacing.md,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    color: colors.textPrimary,
    fontSize: typography.body,
    padding: spacing.md,
  },
  unitInput: {
    flex: 1,
  },
});
