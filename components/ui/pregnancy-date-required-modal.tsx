import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Calendar } from "react-native-calendars";

import { MotherhoodTheme } from "@/constants/theme";

const { colors, spacing, radii, typography } = MotherhoodTheme;

interface PregnancyDateRequiredModalProps {
    visible: boolean;
    onDateSelected: (date: string) => Promise<void>;
}

export function PregnancyDateRequiredModal({
    visible,
    onDateSelected,
}: PregnancyDateRequiredModalProps) {
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedDate) return;

        setIsSubmitting(true);
        try {
            await onDateSelected(selectedDate);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "Tap to select date";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <Modal
            visible={visible}
            transparent={false}
            animationType="slide"
            statusBarTranslucent
        >
            <View style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Feather name="calendar" size={48} color={colors.primary} />
                    </View>

                    <Text style={styles.title}>Set Your Pregnancy Start Date</Text>

                    <Text style={styles.message}>
                        To provide you with personalized pregnancy insights, weekly updates, and
                        tailored recommendations, we need to know when your pregnancy started.
                    </Text>

                    <View style={styles.infoBox}>
                        <Feather
                            name="info"
                            size={16}
                            color={colors.primary}
                            style={styles.infoIcon}
                        />
                        <Text style={styles.infoText}>
                            This helps us calculate your current pregnancy week and provide relevant
                            health tips and milestone information.
                        </Text>
                    </View>

                    <View style={styles.dateSection}>
                        <Text style={styles.dateLabel}>Selected Date</Text>
                        <View style={styles.selectedDateBox}>
                            <Feather name="calendar" size={20} color={colors.primary} />
                            <Text style={[styles.dateText, !selectedDate && styles.placeholderText]}>
                                {formatDate(selectedDate)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.calendarContainer}>
                        <Calendar
                            current={selectedDate || new Date().toISOString().split("T")[0]}
                            onDayPress={(day) => setSelectedDate(day.dateString)}
                            markedDates={{
                                [selectedDate]: {
                                    selected: true,
                                    selectedColor: colors.primary,
                                    selectedTextColor: colors.surface,
                                },
                            }}
                            theme={{
                                backgroundColor: "transparent",
                                calendarBackground: colors.surface,
                                textSectionTitleColor: colors.textPrimary,
                                selectedDayBackgroundColor: colors.primary,
                                selectedDayTextColor: colors.surface,
                                todayTextColor: colors.primary,
                                dayTextColor: colors.textPrimary,
                                textDisabledColor: colors.textSecondary,
                                arrowColor: colors.primary,
                                monthTextColor: colors.textPrimary,
                                textDayFontSize: 14,
                                textMonthFontSize: 16,
                                textDayHeaderFontSize: 12,
                            }}
                            maxDate={new Date().toISOString().split("T")[0]}
                        />
                    </View>

                    <Pressable
                        style={[styles.submitButton, (isSubmitting || !selectedDate) && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting || !selectedDate}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color={colors.surface} />
                        ) : (
                            <>
                                <Text style={styles.submitButtonText}>Continue</Text>
                                <Feather name="arrow-right" size={20} color={colors.surface} />
                            </>
                        )}
                    </Pressable>

                    <Text style={styles.footnote}>
                        You can always update this date later in your profile settings.
                    </Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
    },
    content: {
        width: "100%",
        maxWidth: 400,
        alignItems: "center",
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: radii.full,
        backgroundColor: `${colors.primary}15`,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: colors.textPrimary,
        textAlign: "center",
        marginBottom: spacing.md,
    },
    message: {
        fontSize: typography.body,
        color: colors.textSecondary,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: spacing.lg,
    },
    infoBox: {
        flexDirection: "row",
        backgroundColor: `${colors.primary}10`,
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
        padding: spacing.md,
        borderRadius: radii.md,
        marginBottom: spacing.xl,
    },
    infoIcon: {
        marginRight: spacing.sm,
        marginTop: 2,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    dateSection: {
        width: "100%",
        marginBottom: spacing.md,
    },
    dateLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    selectedDateBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor: colors.surface,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    dateText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.primary,
        flex: 1,
    },
    placeholderText: {
        color: colors.textSecondary,
        fontWeight: "400",
    },
    calendarContainer: {
        width: "100%",
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.sm,
        marginBottom: spacing.xl,
    },
    submitButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: radii.full,
        width: "100%",
        marginBottom: spacing.md,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.surface,
    },
    footnote: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: "center",
        fontStyle: "italic",
    },
});
