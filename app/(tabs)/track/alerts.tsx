import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppAlert } from "@/components/ui/app-alert";
import { MotherhoodTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

const { colors, radii, spacing, typography, shadows } = MotherhoodTheme;

type AlertPriority = "low" | "medium" | "high" | "urgent";

interface HealthAlert {
  id: string;
  alert_type: string;
  title: string;
  description?: string;
  priority: AlertPriority;
  scheduled_for?: string;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

const PRIORITY_CONFIG: Record<
  AlertPriority,
  { color: string; icon: string; label: string }
> = {
  low: { color: colors.mint, icon: "ℹ️", label: "Low" },
  medium: { color: colors.peach, icon: "⚠️", label: "Medium" },
  high: { color: colors.primary, icon: "❗", label: "High" },
  urgent: { color: colors.danger, icon: "🚨", label: "Urgent" },
};

export default function Alerts() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAppAlert();
  const [refreshing, setRefreshing] = useState(false);

  const [unreadAlerts, setUnreadAlerts] = useState<HealthAlert[]>([]);
  const [readAlerts, setReadAlerts] = useState<HealthAlert[]>([]);

  const loadAlerts = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("health_alerts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_dismissed", false)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setUnreadAlerts(data.filter((a) => !a.is_read));
        setReadAlerts(data.filter((a) => a.is_read));
      }
    } catch (error) {
      console.error("Error loading alerts:", error);
      showAlert({
        title: "Error",
        message: "Failed to load alerts",
        type: "error",
      });
    }
  }, [user?.id, showAlert]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  }, [loadAlerts]);

  const markAsRead = useCallback(
    async (alertId: string) => {
      try {
        const { error } = await supabase
          .from("health_alerts")
          .update({ is_read: true })
          .eq("id", alertId);

        if (error) throw error;
        await loadAlerts();
      } catch (error) {
        console.error("Error marking alert as read:", error);
        showAlert({
          title: "Error",
          message: "Failed to update alert",
          type: "error",
        });
      }
    },
    [loadAlerts, showAlert]
  );

  const dismissAlert = useCallback(
    async (alertId: string) => {
      try {
        const { error } = await supabase
          .from("health_alerts")
          .update({ is_dismissed: true })
          .eq("id", alertId);

        if (error) throw error;
        await loadAlerts();
      } catch (error) {
        console.error("Error dismissing alert:", error);
        showAlert({
          title: "Error",
          message: "Failed to dismiss alert",
          type: "error",
        });
      }
    },
    [loadAlerts, showAlert]
  );

  const renderAlert = ({ item }: { item: HealthAlert }) => {
    const config = PRIORITY_CONFIG[item.priority];
    const date = new Date(item.created_at);
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
        from={{ opacity: 0, translateX: -20 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: "timing", duration: 300 }}
      >
        <Pressable
          style={[
            styles.alertCard,
            { borderLeftColor: config.color },
            !item.is_read && styles.alertCardUnread,
          ]}
          onPress={() => !item.is_read && markAsRead(item.id)}
        >
          <View style={styles.alertHeader}>
            <View style={styles.alertIconWrapper}>
              <Text style={styles.alertIcon}>{config.icon}</Text>
            </View>
            <View style={styles.alertInfo}>
              <View style={styles.alertTitleRow}>
                <Text style={styles.alertTitle}>{item.title}</Text>
                {!item.is_read && <View style={styles.unreadDot} />}
              </View>
              {item.description && (
                <Text style={styles.alertDescription} numberOfLines={3}>
                  {item.description}
                </Text>
              )}
              <View style={styles.alertMeta}>
                <Text style={styles.alertTime}>
                  {dateStr} at {timeStr}
                </Text>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: config.color },
                  ]}
                >
                  <Text style={styles.priorityText}>{config.label}</Text>
                </View>
              </View>
            </View>
          </View>

          <Pressable
            style={styles.dismissButton}
            onPress={() => {
              showAlert({
                title: "Dismiss Alert",
                message: "Are you sure?",
                type: "warning",
                actions: [
                  { text: "Cancel", tone: "secondary" },
                  {
                    text: "Dismiss",
                    tone: "danger",
                    onPress: () => dismissAlert(item.id),
                  },
                ],
              });
            }}
          >
            <Feather name="x" size={20} color={colors.textSecondary} />
          </Pressable>
        </Pressable>
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Health Alerts</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Unread Count */}
      {unreadAlerts.length > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadText}>
            {unreadAlerts.length} unread{" "}
            {unreadAlerts.length === 1 ? "alert" : "alerts"}
          </Text>
        </View>
      )}

      <FlatList
        data={[...unreadAlerts, ...readAlerts]}
        keyExtractor={(item) => item.id}
        renderItem={renderAlert}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="bell-off" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No alerts</Text>
            <Text style={styles.emptySubtext}>You&apos;re all caught up!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  alertCard: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    position: "relative",
    ...shadows.card,
  },
  alertCardUnread: {
    backgroundColor: colors.blush,
  },
  alertDescription: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  alertHeader: {
    flexDirection: "row",
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  alertIcon: {
    fontSize: 24,
  },
  alertIconWrapper: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radii.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  alertInfo: {
    flex: 1,
  },
  alertMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  alertTime: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  alertTitle: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: typography.subtitle,
    fontWeight: "600",
  },
  alertTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  dismissButton: {
    padding: spacing.sm,
    position: "absolute",
    right: spacing.sm,
    top: spacing.sm,
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
  priorityBadge: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  priorityText: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    fontWeight: "600",
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  unreadBanner: {
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
  },
  unreadDot: {
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    height: 8,
    width: 8,
  },
  unreadText: {
    color: colors.textPrimary,
    fontSize: typography.label,
    fontWeight: "600",
  },
});
