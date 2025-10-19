import { MotherhoodTheme } from "@/constants/theme";
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

  // Mark period from start date to today
  let current = new Date(startDay);
  let isFirst = true;
  let isLast = false;

  while (current <= todayFormatted) {
    const dateString = current.toISOString().split("T")[0];
    const isToday = current.getTime() === todayFormatted.getTime();

    // Check if it's the last day
    const nextDay = new Date(current);
    nextDay.setDate(nextDay.getDate() + 1);
    isLast = nextDay > todayFormatted;

    if (isFirst && isLast) {
      // Single day
      dates[dateString] = {
        color: colors.primary,
        textColor: colors.surface,
        marked: true,
        dotColor: isToday ? colors.accent : "transparent",
      };
    } else if (isFirst) {
      // Start of period
      dates[dateString] = {
        startingDay: true,
        color: colors.primary,
        textColor: colors.surface,
        marked: true,
        dotColor: isToday ? colors.accent : "transparent",
      };
    } else if (isLast) {
      // End of period
      dates[dateString] = {
        endingDay: true,
        color: colors.primary,
        textColor: colors.surface,
        marked: true,
        dotColor: isToday ? colors.accent : "transparent",
      };
    } else {
      // Middle of period
      dates[dateString] = {
        color: colors.primary,
        textColor: colors.surface,
        marked: true,
        dotColor: isToday ? colors.accent : "transparent",
      };
    }

    current.setDate(current.getDate() + 1);
    isFirst = false;
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
          onDateSelect?.(day.dateString);
        }}
        markedDates={allMarked}
        markingType="period"
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
            selectedDotColor: colors.accent,
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
});
