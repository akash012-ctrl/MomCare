import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface JobStatus {
  id: string;
  job_type: string;
  status: "pending" | "processing" | "completed" | "failed";
  priority: number;
  retry_count: number;
  max_retries: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface BackgroundJobsMonitorProps {
  onClose?: () => void;
  adminOnly?: boolean;
}

export function BackgroundJobsMonitor({
  onClose,
  adminOnly = true,
}: BackgroundJobsMonitorProps): React.ReactElement {
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");

  const [jobs] = useState<JobStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | JobStatus["status"]>(
    "all"
  );

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadJobs = async () => {
    try {
      // In production, this would fetch from your API
      setLoading(false);
    } catch (error) {
      console.error("Failed to load jobs:", error);
      setLoading(false);
    }
  };

  const filteredJobs =
    filterStatus === "all"
      ? jobs
      : jobs.filter((job) => job.status === filterStatus);

  const getStatusColor = (status: JobStatus["status"]): string => {
    switch (status) {
      case "pending":
        return "#FAAD14"; // Yellow
      case "processing":
        return "#1890FF"; // Blue
      case "completed":
        return "#52C41A"; // Green
      case "failed":
        return "#FF4D4F"; // Red
      default:
        return "#999";
    }
  };

  const getStatusIcon = (
    status: JobStatus["status"]
  ):
    | "time"
    | "hourglass"
    | "checkmark-circle"
    | "close-circle"
    | "help-circle" => {
    switch (status) {
      case "pending":
        return "time";
      case "processing":
        return "hourglass";
      case "completed":
        return "checkmark-circle";
      case "failed":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  const getJobTypeLabel = (jobType: string): string => {
    const labels: Record<string, string> = {
      "image-analysis": "🖼️ Image Analysis",
      "nutrition-report": "🥗 Nutrition Report",
      reminders: "🔔 Reminder",
      summaries: "📊 Summary",
      "save-meal-analysis": "🍽️ Save Meal",
      default: jobType,
    };
    return labels[jobType] || labels.default;
  };

  const renderJobCard = (job: JobStatus) => {
    const statusColor = getStatusColor(job.status);
    const retryProgress =
      job.max_retries > 0
        ? Math.round((job.retry_count / job.max_retries) * 100)
        : 0;

    return (
      <View
        key={job.id}
        style={[
          styles.jobCard,
          {
            backgroundColor: `${backgroundColor}`,
            borderLeftColor: statusColor,
          },
        ]}
      >
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleContainer}>
            <Ionicons
              name={getStatusIcon(job.status)}
              size={20}
              color={statusColor}
            />
            <View>
              <Text style={[styles.jobType, { color: textColor }]}>
                {getJobTypeLabel(job.job_type)}
              </Text>
              <Text
                style={[styles.jobId, { color: textColor }]}
                numberOfLines={1}
              >
                {job.id}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.jobMetrics}>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: textColor }]}>
              Priority:
            </Text>
            <View style={styles.priorityBadges}>
              {Array.from({ length: job.priority }).map((_, i) => (
                <View key={i} style={styles.priorityDot} />
              ))}
            </View>
          </View>

          {job.max_retries > 0 && (
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: textColor }]}>
                Retries:
              </Text>
              <Text style={[styles.metricValue, { color: textColor }]}>
                {job.retry_count}/{job.max_retries}
              </Text>
            </View>
          )}

          {job.status === "processing" && job.max_retries > 0 && (
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${retryProgress}%`, backgroundColor: statusColor },
                ]}
              />
            </View>
          )}

          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: textColor }]}>
              Created:
            </Text>
            <Text style={[styles.metricValue, { color: textColor }]}>
              {formatTime(job.created_at)}
            </Text>
          </View>

          {job.completed_at && (
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: textColor }]}>
                Completed:
              </Text>
              <Text style={[styles.metricValue, { color: textColor }]}>
                {formatTime(job.completed_at)}
              </Text>
            </View>
          )}
        </View>

        {job.error_message && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color="#FF4D4F" />
            <Text style={styles.errorMessage} numberOfLines={2}>
              {job.error_message}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>
          Background Jobs
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filters}>
        {(["all", "pending", "processing", "completed", "failed"] as const).map(
          (status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.filterButtonActive,
                {
                  backgroundColor:
                    filterStatus === status ? "#DA70D6" : "rgba(0,0,0,0.05)",
                },
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === status && { color: "#fff" },
                  { color: textColor },
                ]}
              >
                {status === "all"
                  ? "All"
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DA70D6" />
        </View>
      ) : filteredJobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-done-circle" size={48} color="#52C41A" />
          <Text style={[styles.emptyText, { color: textColor }]}>
            No {filterStatus !== "all" ? filterStatus : ""} jobs
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          renderItem={({ item }) => renderJobCard(item)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: textColor }]}>
            Total:
          </Text>
          <Text style={[styles.summaryValue, { color: textColor }]}>
            {jobs.length}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: textColor }]}>
            Pending:
          </Text>
          <Text style={[styles.summaryValue, { color: "#FAAD14" }]}>
            {jobs.filter((j) => j.status === "pending").length}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: textColor }]}>
            Processing:
          </Text>
          <Text style={[styles.summaryValue, { color: "#1890FF" }]}>
            {jobs.filter((j) => j.status === "processing").length}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: textColor }]}>
            Completed:
          </Text>
          <Text style={[styles.summaryValue, { color: "#52C41A" }]}>
            {jobs.filter((j) => j.status === "completed").length}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: textColor }]}>
            Failed:
          </Text>
          <Text style={[styles.summaryValue, { color: "#FF4D4F" }]}>
            {jobs.filter((j) => j.status === "failed").length}
          </Text>
        </View>
      </View>
    </View>
  );
}

const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterButtonActive: {
    backgroundColor: "#DA70D6",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
  jobCard: {
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  jobTitleContainer: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  jobType: {
    fontSize: 14,
    fontWeight: "600",
  },
  jobId: {
    fontSize: 11,
    opacity: 0.6,
    maxWidth: 200,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  jobMetrics: {
    gap: 4,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  metricValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  priorityBadges: {
    flexDirection: "row",
    gap: 2,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#DA70D6",
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(255,77,79,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  errorMessage: {
    flex: 1,
    fontSize: 12,
    color: "#FF4D4F",
  },
  summary: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
  },
});
