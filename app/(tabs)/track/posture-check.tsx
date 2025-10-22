import { ImagePicker } from "@/components/image-picker";
import { useAppAlert } from "@/components/ui/app-alert";
import { useImageAnalysis } from "@/hooks/use-image-analysis";
import { useThemeColor } from "@/hooks/use-theme-color";
import { PostureAnalysisResult } from "@/lib/image-analysis-types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PostureCheckScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const { showAlert } = useAppAlert();

  const imageAnalysis = useImageAnalysis();
  const { loading, success, error, result } = imageAnalysis;
  const [submitting, setSubmitting] = useState(false);

  const handleImageSelected = async (
    base64: string,
    mimeType: string,
    width: number,
    height: number
  ) => {
    try {
      await imageAnalysis.analyzeImage(
        base64,
        mimeType,
        "posture",
        width,
        height
      );
    } catch (err) {
      showAlert({
        title: "Error",
        message:
          err instanceof Error ? err.message : "Failed to analyze posture",
        type: "error",
      });
    }
  };

  const handleSavePosture = async () => {
    if (!result) {
      showAlert({
        title: "Missing data",
        message: "No posture analysis result available",
        type: "warning",
      });
      return;
    }

    setSubmitting(true);
    try {
      // The image analysis result has already been stored in the database
      // by the uploadAndAnalyzeImage function in the file-upload Edge Function.
      // No additional job creation needed.

      // Show confirmation
      showAlert({
        title: "Posture recorded",
        message: "Posture check saved successfully!",
        type: "success",
        actions: [
          {
            text: "OK",
            tone: "primary",
            onPress: () => {
              imageAnalysis.reset?.();
            },
          },
        ],
      });
    } catch (err) {
      showAlert({
        title: "Error",
        message:
          err instanceof Error ? err.message : "Failed to save posture check",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const postureData = result?.result as PostureAnalysisResult | undefined;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <LinearGradient
        colors={["#DDA0DD", "#DA70D6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerContent}>
          <Ionicons name="body" size={32} color="#fff" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Posture Check</Text>
            <Text style={styles.headerSubtitle}>Improve your alignment</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ImagePicker onImageSelected={handleImageSelected} />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DA70D6" />
            <Text style={[styles.loadingText, { color: textColor }]}>
              Analyzing posture...
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={24} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {postureData && (
          <View style={styles.resultCard}>
            <View style={styles.scoreContainer}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreValue}>
                  {postureData.overallScore}
                </Text>
                <Text style={styles.scoreLabel}>Overall Score</Text>
              </View>
              <View style={styles.scoreMetrics}>
                <Text style={[styles.metricLabel, { color: textColor }]}>
                  Assessment:
                </Text>
                {postureData.overallScore >= 80 ? (
                  <View style={styles.excellentBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.badgeText}>Excellent Posture</Text>
                  </View>
                ) : postureData.overallScore >= 60 ? (
                  <View style={styles.goodBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.badgeText}>Good Posture</Text>
                  </View>
                ) : (
                  <View style={styles.needsWorkBadge}>
                    <Ionicons name="alert-circle" size={20} color="#fff" />
                    <Text style={styles.badgeText}>Needs Improvement</Text>
                  </View>
                )}
              </View>
            </View>

            {postureData.segments && postureData.segments.length > 0 && (
              <View style={styles.segmentsContainer}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  Body Segments
                </Text>
                {postureData.segments.map((segment: any, index: number) => (
                  <View key={index} style={styles.segmentCard}>
                    <View style={styles.segmentHeader}>
                      <Text style={[styles.segmentName, { color: textColor }]}>
                        {segment.body_part}
                      </Text>
                      <View
                        style={[
                          styles.segmentScore,
                          {
                            backgroundColor:
                              segment.score >= 75
                                ? "#52C41A"
                                : segment.score >= 50
                                ? "#FAAD14"
                                : "#FF4D4F",
                          },
                        ]}
                      >
                        <Text style={styles.segmentScoreText}>
                          {segment.score}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.alignmentText, { color: textColor }]}>
                      Alignment:{" "}
                      <Text style={styles.alignmentValue}>
                        {segment.alignment}
                      </Text>
                    </Text>
                    {segment.issues && segment.issues.length > 0 && (
                      <View style={styles.issuesContainer}>
                        <Text style={[styles.issueTitle, { color: textColor }]}>
                          Issues:
                        </Text>
                        {segment.issues.map((issue: string, i: number) => (
                          <Text
                            key={i}
                            style={[styles.issueItem, { color: textColor }]}
                          >
                            • {issue}
                          </Text>
                        ))}
                      </View>
                    )}
                    {segment.recommendations &&
                      segment.recommendations.length > 0 && (
                        <View style={styles.recommendationsContainer}>
                          <Text
                            style={[
                              styles.recommendationTitle,
                              { color: textColor },
                            ]}
                          >
                            Recommendations:
                          </Text>
                          {segment.recommendations.map(
                            (rec: string, i: number) => (
                              <Text
                                key={i}
                                style={[
                                  styles.recommendationItem,
                                  { color: textColor },
                                ]}
                              >
                                ✓ {rec}
                              </Text>
                            )
                          )}
                        </View>
                      )}
                  </View>
                ))}
              </View>
            )}

            {postureData.riskFactors && postureData.riskFactors.length > 0 && (
              <View style={styles.warningContainer}>
                <View style={styles.warningHeader}>
                  <Ionicons name="warning" size={20} color="#FAAD14" />
                  <Text style={[styles.warningTitle, { color: textColor }]}>
                    Risk Factors
                  </Text>
                </View>
                {postureData.riskFactors.map(
                  (factor: string, index: number) => (
                    <Text
                      key={index}
                      style={[styles.riskItem, { color: textColor }]}
                    >
                      ⚠ {factor}
                    </Text>
                  )
                )}
              </View>
            )}

            {postureData.improvements &&
              postureData.improvements.length > 0 && (
                <View style={styles.improvementsContainer}>
                  <View style={styles.improvementsHeader}>
                    <Ionicons name="trending-up" size={20} color="#1890FF" />
                    <Text
                      style={[styles.improvementsTitle, { color: textColor }]}
                    >
                      Ways to Improve
                    </Text>
                  </View>
                  {postureData.improvements.map(
                    (improvement: string, index: number) => (
                      <Text
                        key={index}
                        style={[styles.improvementItem, { color: textColor }]}
                      >
                        → {improvement}
                      </Text>
                    )
                  )}
                </View>
              )}

            {success && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSavePosture}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>
                      Record Posture Check
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {!loading && !error && !postureData && (
          <View style={styles.emptyState}>
            <Ionicons name="image-outline" size={48} color="#DA70D6" />
            <Text style={[styles.emptyText, { color: textColor }]}>
              Take a photo to check your posture
            </Text>
            <Text style={[styles.emptySubtext, { color: textColor }]}>
              Stand up straight and take a photo of your body from the side
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  errorCard: {
    backgroundColor: "#FFF1F0",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    flex: 1,
    fontWeight: "500",
  },
  resultCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#DA70D6",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: "700",
    color: "#fff",
  },
  scoreLabel: {
    fontSize: 12,
    color: "#fff",
    textAlign: "center",
  },
  scoreMetrics: {
    flex: 1,
    gap: 8,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  excellentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#52C41A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  goodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FAAD14",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  needsWorkBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FF4D4F",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  segmentsContainer: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  segmentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  segmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  segmentName: {
    fontSize: 15,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  segmentScore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  segmentScoreText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  alignmentText: {
    fontSize: 13,
  },
  alignmentValue: {
    fontWeight: "600",
    textTransform: "capitalize",
  },
  issuesContainer: {
    gap: 4,
    marginTop: 4,
  },
  issueTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF4D4F",
  },
  issueItem: {
    fontSize: 12,
    marginLeft: 8,
  },
  recommendationsContainer: {
    gap: 4,
    marginTop: 4,
  },
  recommendationTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#52C41A",
  },
  recommendationItem: {
    fontSize: 12,
    marginLeft: 8,
  },
  warningContainer: {
    backgroundColor: "#FFFBE6",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FAAD14",
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  riskItem: {
    fontSize: 13,
    marginLeft: 28,
  },
  improvementsContainer: {
    backgroundColor: "#E6F7FF",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#1890FF",
  },
  improvementsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  improvementsTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  improvementItem: {
    fontSize: 13,
    marginLeft: 28,
  },
  saveButton: {
    backgroundColor: "#DA70D6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
});
