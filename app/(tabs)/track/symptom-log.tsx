import { Feather } from "@expo/vector-icons";
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
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAppAlert } from "@/components/ui/app-alert";
import { MotherhoodTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

const { colors, radii, spacing, typography, shadows } = MotherhoodTheme;

interface Symptom {
  id: string;
  symptom_type: string;
  severity: number;
  notes?: string;
  occurred_at: string;
}

const COMMON_SYMPTOMS = [
  { name: "Nausea", icon: "🤢", color: colors.mint },
  { name: "Fatigue", icon: "😴", color: colors.lavender },
  { name: "Back Pain", icon: "🩹", color: colors.peach },
  { name: "Headache", icon: "🤕", color: colors.lilac },
  { name: "Heartburn", icon: "🔥", color: colors.primary },
  { name: "Swelling", icon: "💧", color: colors.accent },
  { name: "Cramping", icon: "⚡", color: colors.blush },
  { name: "Dizziness", icon: "💫", color: colors.mint },
];

const SEVERITY_LEVELS = [
  { value: 1, label: "Very Mild", color: "#A8E6CF" },
  { value: 2, label: "Mild", color: "#DCEDC1" },
  { value: 3, label: "Moderate", color: "#FFD3B6" },
  { value: 4, label: "Severe", color: "#FFAAA5" },
  { value: 5, label: "Very Severe", color: "#FF8B94" },
];

export default function SymptomLog() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAppAlert();
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSymptom, setSelectedSymptom] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState(3);
  const [notes, setNotes] = useState("");

  // Data
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);

  const loadSymptoms = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("symptoms")
        .select("*")
        .eq("user_id", user.id)
        .order("occurred_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data) setSymptoms(data);
    } catch (error) {
      console.error("Error loading symptoms:", error);
      showAlert({
        title: "Error",
        message: "Failed to load symptoms",
        type: "error",
      });
    }
  }, [user?.id, showAlert]);

  useEffect(() => {
    loadSymptoms();
  }, [loadSymptoms]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSymptoms();
    setRefreshing(false);
  }, [loadSymptoms]);

  const handleOpenModal = (symptomName: string) => {
    setSelectedSymptom(symptomName);
    setSelectedSeverity(3);
    setNotes("");
    setModalVisible(true);
  };

  const handleSaveSymptom = useCallback(async () => {
    if (!user?.id || !selectedSymptom) return;

    try {
      const { error } = await supabase.from("symptoms").insert({
        user_id: user.id,
        symptom_type: selectedSymptom,
        severity: selectedSeverity,
        notes: notes || null,
        occurred_at: new Date().toISOString(),
      });

      if (error) throw error;

      setModalVisible(false);
      await loadSymptoms();
      showAlert({
        title: "Logged",
        message: "Symptom saved successfully",
        type: "success",
      });
    } catch (error) {
      console.error("Error saving symptom:", error);
      showAlert({
        title: "Error",
        message: "Failed to save symptom",
        type: "error",
      });
    }
  }, [
    user?.id,
    selectedSymptom,
    selectedSeverity,
    notes,
    loadSymptoms,
    showAlert,
  ]);

  const renderSymptomCard = ({ item }: { item: Symptom }) => {
    const symptomInfo = COMMON_SYMPTOMS.find(
      (s) => s.name === item.symptom_type
    );
    const severityInfo = SEVERITY_LEVELS.find((s) => s.value === item.severity);
    const date = new Date(item.occurred_at);
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 300 }}
        style={styles.symptomCard}
      >
        <View style={styles.symptomHeader}>
          <View style={styles.symptomIconWrapper}>
            <Text style={styles.symptomIcon}>{symptomInfo?.icon || "📝"}</Text>
          </View>
          <View style={styles.symptomInfo}>
            <Text style={styles.symptomName}>{item.symptom_type}</Text>
            <Text style={styles.symptomTime}>
              {dateStr} at {timeStr}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.severityBadge,
            { backgroundColor: severityInfo?.color || colors.surface },
          ]}
        >
          <Text style={styles.severityText}>
            {severityInfo?.label || `Severity ${item.severity}`}
          </Text>
        </View>

        {item.notes && (
          <Text style={styles.symptomNotes} numberOfLines={2}>
            {item.notes}
          </Text>
        )}
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: "height" })}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 20 })}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Symptom Log</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Quick Log Section */}
        <View style={styles.quickLogSection}>
          <Text style={styles.sectionTitle}>Quick Log</Text>
          <View style={styles.symptomGrid}>
            {COMMON_SYMPTOMS.map((symptom) => (
              <Pressable
                key={symptom.name}
                style={[styles.quickLogCard, { backgroundColor: symptom.color }]}
                onPress={() => handleOpenModal(symptom.name)}
              >
                <Text style={styles.quickLogIcon}>{symptom.icon}</Text>
                <Text style={styles.quickLogName}>{symptom.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Symptoms</Text>
          <FlatList
            data={symptoms}
            keyExtractor={(item) => item.id}
            renderItem={renderSymptomCard}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Feather
                  name="clipboard"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyText}>No symptoms logged yet</Text>
                <Text style={styles.emptySubtext}>
                  Tap a symptom above to start tracking
                </Text>
              </View>
            }
          />
        </View>

        {/* Log Symptom Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Log {selectedSymptom}</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Feather name="x" size={24} color={colors.textPrimary} />
                </Pressable>
              </View>

              {/* Severity Selector */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Severity</Text>
                <View style={styles.severitySelector}>
                  {SEVERITY_LEVELS.map((level) => (
                    <Pressable
                      key={level.value}
                      style={[
                        styles.severityOption,
                        {
                          backgroundColor:
                            selectedSeverity === level.value
                              ? level.color
                              : colors.surface,
                        },
                      ]}
                      onPress={() => setSelectedSeverity(level.value)}
                    >
                      <Text
                        style={[
                          styles.severityOptionText,
                          selectedSeverity === level.value &&
                          styles.severityOptionTextActive,
                        ]}
                      >
                        {level.value}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.severityLabel}>
                  {
                    SEVERITY_LEVELS.find((l) => l.value === selectedSeverity)
                      ?.label
                  }
                </Text>
              </View>

              {/* Notes */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Notes (optional)</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Any additional details..."
                  placeholderTextColor={colors.textSecondary}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Save Button */}
              <Pressable style={styles.saveButton} onPress={handleSaveSymptom}>
                <Text style={styles.saveButtonText}>Log Symptom</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  historySection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
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
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    color: colors.textPrimary,
    fontSize: typography.body,
    minHeight: 80,
    padding: spacing.md,
  },
  quickLogCard: {
    alignItems: "center",
    borderRadius: radii.md,
    height: 100,
    justifyContent: "center",
    width: "23%",
    ...shadows.card,
  },
  quickLogIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  quickLogName: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    fontWeight: "500",
    textAlign: "center",
  },
  quickLogSection: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
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
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  severityBadge: {
    alignSelf: "flex-start",
    borderRadius: radii.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  severityLabel: {
    color: colors.textSecondary,
    fontSize: typography.label,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  severityOption: {
    alignItems: "center",
    borderRadius: radii.full,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  severityOptionText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    fontWeight: "600",
  },
  severityOptionTextActive: {
    color: colors.textPrimary,
  },
  severitySelector: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
  severityText: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    fontWeight: "600",
  },
  symptomCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.card,
  },
  symptomGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  symptomHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  symptomIcon: {
    fontSize: 24,
  },
  symptomIconWrapper: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radii.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  symptomInfo: {
    flex: 1,
  },
  symptomName: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: "600",
  },
  symptomNotes: {
    color: colors.textSecondary,
    fontSize: typography.label,
    fontStyle: "italic",
    marginTop: spacing.sm,
  },
  symptomTime: {
    color: colors.textSecondary,
    fontSize: typography.label,
  },
});
