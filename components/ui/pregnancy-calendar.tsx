import { MotherhoodTheme } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";

const { colors, radii, spacing } = MotherhoodTheme;

interface PregnancyCalendarProps {
  onDateSelect?: (date: string) => void;
  markedDates?: Record<string, any>;
  pregnancyStartDate?: string;
}

const calculatePregnancyWeek = (startDate: Date): number => {
  const today = new Date();
  const timeDiff = today.getTime() - startDate.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
  return Math.floor(daysDiff / 7) + 1;
};

const getMarkedDates = (startDateString?: string) => {
  const dates: Record<string, any> = {};
  const today = new Date();

  if (!startDateString) {
    return dates;
  }

  const startDate = new Date(startDateString);
  const startDay = new Date(startDate);
  startDay.setHours(0, 0, 0, 0);

  const todayFormatted = new Date(today);
  todayFormatted.setHours(0, 0, 0, 0);

  // Mark each date from start date to today with individual dots
  let current = new Date(startDay);
  let dayCount = 0;

  while (current <= todayFormatted) {
    const dateString = current.toISOString().split("T")[0];
    const isToday = current.getTime() === todayFormatted.getTime();
    const isStart = current.getTime() === startDay.getTime();

    // Calculate which week this day belongs to
    const weekNumber = Math.floor(dayCount / 7) + 1;
    const isWeekMarker = dayCount > 0 && dayCount % 7 === 0; // Every 7th day after start

    // Mark each date with a dot
    dates[dateString] = {
      marked: true,
      dotColor: colors.primary,
      selected: isStart || isToday,
      selectedColor: isStart ? colors.primary : isToday ? colors.accent : undefined,
      selectedTextColor: (isStart || isToday) ? colors.surface : colors.textPrimary,
      weekLabel: isWeekMarker ? `W${weekNumber}` : undefined,
    };

    current.setDate(current.getDate() + 1);
    dayCount++;
  }

  return dates;
};

export const PregnancyCalendar: React.FC<PregnancyCalendarProps> = ({
  onDateSelect,
  markedDates = {},
  pregnancyStartDate,
}) => {
  const [selectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [pregnancyWeek, setPregnancyWeek] = useState<number | null>(null);

  useEffect(() => {
    if (pregnancyStartDate) {
      const startDate = new Date(pregnancyStartDate);
      const week = calculatePregnancyWeek(startDate);
      setPregnancyWeek(week);
    }
  }, [pregnancyStartDate]);

  const periodMarked = getMarkedDates(pregnancyStartDate);
  const allMarked = { ...periodMarked, ...markedDates };

  return (
    <View style={styles.container}>
      {pregnancyWeek !== null && (
        <View style={styles.weekIndicator}>
          <Text style={styles.weekText}>Week {pregnancyWeek}</Text>
        </View>
      )}
      <Calendar
        current={selectedDate}
        onDayPress={(day) => {
          Haptics.selectionAsync();
          onDateSelect?.(day.dateString);
        }}
        onMonthChange={(month) => {
          // Trigger haptic feedback when swiping between months
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        markedDates={allMarked}
        dayComponent={({ date, state }) => {
          if (!date) return <View style={styles.dayWrapper} />;

          const dateString = date.dateString;
          const marking = allMarked[dateString];
          const weekLabel = marking?.weekLabel;
          const isSelected = marking?.selected;
          const isDisabled = state === 'disabled';
          const isMarked = marking?.marked;

          return (
            <View style={styles.dayWrapper}>
              <View style={[
                styles.dayContainer,
                isSelected && styles.selectedDay,
                isDisabled && styles.disabledDay
              ]}>
                <Text style={[
                  styles.dayText,
                  isSelected && styles.selectedDayText,
                  isDisabled && styles.disabledDayText
                ]}>
                  {date.day}
                </Text>
                {weekLabel && (
                  <Text style={[
                    styles.weekLabel,
                    isSelected && styles.selectedWeekLabel
                  ]}>
                    {weekLabel}
                  </Text>
                )}
                {isMarked && !weekLabel && !isSelected && (
                  <View style={styles.dotIndicator} />
                )}
              </View>
            </View>
          );
        }}
        theme={
          {
            backgroundColor: "transparent",
            calendarBackground: colors.surface,
            textSectionTitleColor: colors.textPrimary,
            textSectionTitleDisabledColor: colors.textSecondary,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors.surface,
            todayTextColor: colors.primary,
            dayTextColor: colors.textPrimary,
            textDisabledColor: colors.textSecondary,
            dotColor: colors.primary,
            selectedDotColor: colors.surface,
            arrowColor: colors.primary,
            disabledArrowColor: colors.textSecondary,
            monthTextColor: colors.textPrimary,
            indicatorColor: colors.primary,
            textDayFontFamily: "System",
            textMonthFontFamily: "System",
            textDayHeaderFontFamily: "System",
            textDayFontSize: 12,
            textMonthFontSize: 14,
            textDayHeaderFontSize: 10,
          } as any
        }
        hideArrows={false}
        hideExtraDays={false}
        disableMonthChange={false}
        enableSwipeMonths
        style={{ paddingHorizontal: 0 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    overflow: "hidden",
    paddingVertical: spacing.sm,
  },
  weekIndicator: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    alignItems: "center",
  },
  weekText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "700",
  },
  weekSubtext: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  dayWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 48,
  },
  dayContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    minHeight: 32,
    borderRadius: 16,
  },
  selectedDay: {
    backgroundColor: colors.primary,
  },
  disabledDay: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: "400",
  },
  selectedDayText: {
    color: colors.surface,
    fontWeight: "600",
  },
  disabledDayText: {
    color: colors.textSecondary,
  },
  weekLabel: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: "700",
    marginTop: 1,
  },
  selectedWeekLabel: {
    color: colors.surface,
  },
  dotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
});
