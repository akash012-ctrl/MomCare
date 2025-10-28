import { MotherhoodTheme } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

const { colors, radii, spacing, typography, shadows } = MotherhoodTheme;

interface PregnancyStartDatePickerProps {
  initialDate?: string;
  onDateChange: (date: string) => void;
  onNameChange: (name: string) => void;
  initialName?: string;
  isLoading?: boolean;
}

export const PregnancyStartDatePicker: React.FC<
  PregnancyStartDatePickerProps
> = ({
  initialDate,
  onDateChange,
  onNameChange,
  initialName = "",
  isLoading = false,
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(initialDate || "");
    const [displayName, setDisplayName] = useState(initialName);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
      setSelectedDate(initialDate || "");
    }, [initialDate]);

    const handleDateSelect = (date: string) => {
      // Trigger haptic feedback on date selection
      Haptics.selectionAsync();
      setSelectedDate(date);
      setHasChanges(true);
    };

    const handleNameChange = (name: string) => {
      setDisplayName(name);
      setHasChanges(true);
    };

    const handleSave = async () => {
      // Trigger haptic feedback on save
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (selectedDate) {
        onDateChange(selectedDate);
      }
      if (displayName !== initialName) {
        onNameChange(displayName);
      }
      setHasChanges(false);
      setModalVisible(false);
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return "Select date";
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    };

    const calculateWeek = (dateString: string) => {
      if (!dateString) return 0;
      const startDate = new Date(dateString);
      const today = new Date();
      const timeDiff = today.getTime() - startDate.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
      return Math.floor(daysDiff / 7) + 1;
    };

    const pregnancyWeek = calculateWeek(selectedDate);
    const hasDate = selectedDate && selectedDate.length > 0;

    return (
      <View>
        {/* Display Card */}
        <Pressable
          style={styles.displayCard}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.displayContent}>
            <View style={styles.iconContainer}>
              <Feather name="calendar" size={28} color={colors.secondary} />
            </View>
            <View style={styles.displayText}>
              {!hasDate && (
                <Text style={styles.dateLabel}>Pregnancy Start Date</Text>
              )}
              <Text style={[styles.dateValue, !hasDate && styles.placeholderText]}>
                {formatDate(selectedDate)}
              </Text>
              {pregnancyWeek > 0 && hasDate && (
                <Text style={styles.weekInfo}>Week {pregnancyWeek}</Text>
              )}
            </View>
            <Feather
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </View>
        </Pressable>

        {/* Edit Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Feather name="x" size={24} color={colors.textPrimary} />
                </Pressable>
              </View>

              {/* Name Input */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <Feather
                    name="user"
                    size={20}
                    color={colors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.textSecondary}
                    value={displayName}
                    onChangeText={handleNameChange}
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Date Picker */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Pregnancy Start Date</Text>
                <Calendar
                  current={selectedDate}
                  onDayPress={(day) => handleDateSelect(day.dateString)}
                  markedDates={{
                    [selectedDate]: {
                      selected: true,
                      selectedColor: colors.secondary,
                      selectedTextColor: colors.surface,
                    },
                  }}
                  theme={
                    {
                      backgroundColor: "transparent",
                      calendarBackground: colors.surface,
                      textSectionTitleColor: colors.textPrimary,
                      selectedDayBackgroundColor: colors.secondary,
                      selectedDayTextColor: colors.surface,
                      todayTextColor: colors.secondary,
                      dayTextColor: colors.textPrimary,
                      textDisabledColor: colors.textSecondary,
                      arrowColor: colors.secondary,
                      monthTextColor: colors.textPrimary,
                      textDayFontSize: 12,
                      textMonthFontSize: 14,
                      textDayHeaderFontSize: 10,
                    } as any
                  }
                  maxDate={new Date().toISOString().split("T")[0]}
                />
              </View>

              {/* Info Text */}
              {pregnancyWeek > 0 && (
                <View style={styles.infoBox}>
                  <Feather name="info" size={18} color={colors.secondary} />
                  <Text style={styles.infoText}>
                    You are currently at week {pregnancyWeek} of your pregnancy
                  </Text>
                </View>
              )}

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <Pressable
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.button,
                    styles.saveButton,
                    isLoading && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={isLoading || !hasChanges}
                >
                  <Text style={styles.saveButtonText}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

const styles = StyleSheet.create({
  displayCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  displayContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  displayText: {
    flex: 1,
  },
  dateLabel: {
    color: colors.textSecondary,
    fontSize: typography.label,
    marginBottom: spacing.xs,
  },
  dateValue: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: "600",
  },
  weekInfo: {
    color: colors.success,
    fontSize: typography.label,
    marginTop: spacing.xs,
    fontWeight: "500",
  },
  placeholderText: {
    color: colors.textSecondary,
    fontWeight: "400",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: "700",
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.body,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.lilac,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.body,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "600",
  },
});
