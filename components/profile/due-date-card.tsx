import { MotherhoodTheme } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const { colors, spacing, radii, typography, shadows } = MotherhoodTheme;

interface DueDateCardProps {
    pregnancyStartDate: string;
    language?: 'en' | 'hi';
}

const translations = {
    en: {
        title: 'Your Due Date',
        daysToGo: 'Days to go',
        overdueMessage: '🎉 Baby is ready to meet you!',
        soonMessage: '💝 Almost time to meet your baby!',
    },
    hi: {
        title: 'आपकी नियत तारीख',
        daysToGo: 'दिन शेष',
        overdueMessage: '🎉 बच्चा आपसे मिलने के लिए तैयार है!',
        soonMessage: '💝 जल्द ही आप अपने बच्चे से मिलेंगे!',
    },
};

export function DueDateCard({ pregnancyStartDate, language = 'en' }: DueDateCardProps) {
    const t = translations[language];
    const calculateDueDate = (startDate: string) => {
        const start = new Date(startDate);
        // Add 280 days (40 weeks) to pregnancy start date
        const dueDate = new Date(start.getTime() + 280 * 24 * 60 * 60 * 1000);
        return dueDate;
    };

    const formatDate = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        };
        return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', options);
    };

    const getDaysUntilDue = (dueDate: Date) => {
        const today = new Date();
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const dueDate = calculateDueDate(pregnancyStartDate);
    const daysLeft = getDaysUntilDue(dueDate);

    return (
        <View style={styles.card}>
            <View style={styles.header}>

                <Text style={styles.title}>{t.title}</Text>
            </View>

            <View style={styles.dateContainer}>
                <Text style={styles.date}>{formatDate(dueDate)}</Text>
            </View>

            <View style={styles.countdownContainer}>
                <View style={styles.countdownBox}>
                    <Text style={styles.countdownNumber}>{daysLeft > 0 ? daysLeft : 0}</Text>
                    <Text style={styles.countdownLabel}>{t.daysToGo}</Text>
                </View>

                {daysLeft < 0 && (
                    <View style={styles.overdueNotice}>
                        <Text style={styles.overdueText}>{t.overdueMessage}</Text>
                    </View>
                )}

                {daysLeft >= 0 && daysLeft <= 14 && (
                    <View style={styles.soonNotice}>
                        <Text style={styles.soonText}>{t.soonMessage}</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        ...shadows.card,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    icon: {
        fontSize: 32,
    },
    title: {
        color: colors.textPrimary,
        fontSize: typography.title,
        fontWeight: '600',
    },
    dateContainer: {
        backgroundColor: colors.primary,
        borderRadius: radii.md,
        padding: spacing.lg,
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    date: {
        color: colors.surface,
        fontSize: typography.headline,
        fontWeight: '700',
    },
    countdownContainer: {
        gap: spacing.md,
    },
    countdownBox: {
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    countdownNumber: {
        color: colors.primary,
        fontSize: 48,
        fontWeight: '700',
    },
    countdownLabel: {
        color: colors.textSecondary,
        fontSize: typography.body,
        marginTop: spacing.xs,
    },
    overdueNotice: {
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    overdueText: {
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: '600',
    },
    soonNotice: {
        backgroundColor: `${colors.accent}15`,
        borderRadius: radii.md,
        padding: spacing.md,
        alignItems: 'center',
    },
    soonText: {
        color: colors.textPrimary,
        fontSize: typography.body,
        fontWeight: '600',
    },
});
