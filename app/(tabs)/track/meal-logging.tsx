import { ImagePicker } from "@/components/image-picker";
import { useAppAlert } from "@/components/ui/app-alert";
import { useImageAnalysis } from "@/hooks/use-image-analysis";
import { useThemeColor } from "@/hooks/use-theme-color";
import { MealAnalysisResult } from "@/lib/image-analysis-types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MealLoggingScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const { showAlert } = useAppAlert();

  const imageAnalysis = useImageAnalysis();
  const { loading, success, error, result } = imageAnalysis;
  const [mealNotes, setMealNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleImageSelected = async (
    base64: string,
    mimeType: string,
    width: number,
    height: number
  ) => {
    try {
      await imageAnalysis.analyzeImage(base64, mimeType, "meal", width, height);
    } catch (err) {
      showAlert({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to analyze meal",
        type: "error",
      });
    }
  };

  const handleSaveMeal = async () => {
    if (!result) {
      showAlert({
        title: "Missing data",
        message: "No meal analysis result available",
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
        title: "Meal saved",
        message: "Meal logged successfully!",
        type: "success",
        actions: [
          {
            text: "OK",
            tone: "primary",
            onPress: () => {
              setMealNotes("");
            },
          },
        ],
      });
    } catch (err) {
      showAlert({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to save meal",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const mealData = result?.result as MealAnalysisResult | undefined;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: "padding", android: "height" })}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 20 })}
    >
      <View style={[styles.container, { backgroundColor }]}>
        <LinearGradient
          colors={["#FFB6C1", "#FF9FA3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top }]}
        >
          <View style={styles.headerContent}>
            <Ionicons name="restaurant" size={32} color="#fff" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Meal Logging</Text>
              <Text style={styles.headerSubtitle}>Track your nutrition</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {/* Image Picker Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              1. Take a Photo
            </Text>
            <ImagePicker
              onImageSelected={handleImageSelected}
              previewSize={160}
              maxSizeMB={5}
            />
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF9FA3" />
                <Text style={[styles.loadingText, { color: textColor }]}>
                  Analyzing meal...
                </Text>
              </View>
            )}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          {/* Analysis Results Section */}
          {success && mealData && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                2. Analysis Results
              </Text>

              {/* Calories Summary */}
              <View style={styles.resultCard}>
                <View style={styles.caloriesContainer}>
                  <Ionicons name="flame" size={32} color="#FF6B6B" />
                  <View style={styles.caloriesContent}>
                    <Text style={[styles.caloriesValue, { color: textColor }]}>
                      {mealData.totalCalories}
                    </Text>
                    <Text style={[styles.caloriesLabel, { color: textColor }]}>
                      calories
                    </Text>
                  </View>
                </View>

                {/* Macronutrients */}
                <View style={styles.macroGrid}>
                  <MacroCard
                    icon="flask"
                    label="Protein"
                    value={
                      mealData.meals && mealData.meals[0]?.macronutrients?.protein
                        ? `${mealData.meals[0].macronutrients.protein.toFixed(
                          1
                        )}g`
                        : "N/A"
                    }
                    color="#FF9FA3"
                  />
                  <MacroCard
                    icon="nutrition"
                    label="Carbs"
                    value={
                      mealData.meals && mealData.meals[0]?.macronutrients?.carbs
                        ? `${mealData.meals[0].macronutrients.carbs.toFixed(1)}g`
                        : "N/A"
                    }
                    color="#FFCCCB"
                  />
                  <MacroCard
                    icon="droplet"
                    label="Fat"
                    value={
                      mealData.meals && mealData.meals[0]?.macronutrients?.fat
                        ? `${mealData.meals[0].macronutrients.fat.toFixed(1)}g`
                        : "N/A"
                    }
                    color="#FFA07A"
                  />
                </View>

                {/* Foods Detected */}
                <View style={styles.foodsSection}>
                  <Text style={[styles.foodsTitle, { color: textColor }]}>
                    Foods Detected:
                  </Text>
                  {mealData.meals?.map((meal: any, idx: number) => (
                    <View key={idx} style={styles.foodItem}>
                      <Text style={[styles.foodName, { color: textColor }]}>
                        {meal.name}
                      </Text>
                      <Text style={styles.foodCalories}>
                        {meal.estimatedCalories} cal (
                        {(meal.confidence * 100).toFixed(0)}%)
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Nutrition Summary */}
                {mealData.nutritionSummary && (
                  <View style={styles.summaryBox}>
                    <Text style={[styles.summaryTitle, { color: textColor }]}>
                      Summary
                    </Text>
                    <Text style={[styles.summaryText, { color: textColor }]}>
                      {mealData.nutritionSummary}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Notes Section */}
          {success && mealData && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                3. Add Notes
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  { borderColor: "#FFB6C1", color: textColor },
                ]}
                placeholder="Add any notes about this meal (optional)"
                placeholderTextColor="#999"
                value={mealNotes}
                onChangeText={setMealNotes}
                multiline
              />
            </View>
          )}

          {/* Save Button */}
          {success && mealData && (
            <TouchableOpacity
              style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
              onPress={async () => {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                handleSaveMeal();
              }}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Meal</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

interface MacroCardProps {
  icon: string;
  label: string;
  value: string;
  color: string;
}

function MacroCard({
  icon,
  label,
  value,
  color,
}: MacroCardProps): React.ReactElement {
  const textColor = useThemeColor({}, "text");
  return (
    <View style={[styles.macroCard, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={[styles.macroLabel, { color: textColor }]}>{label}</Text>
      <Text style={[styles.macroValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 24,
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
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5E5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 13,
    flex: 1,
  },
  resultCard: {
    backgroundColor: "rgba(255, 182, 193, 0.15)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFB6C1",
  },
  caloriesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  caloriesContent: {
    flex: 1,
  },
  caloriesValue: {
    fontSize: 32,
    fontWeight: "bold",
  },
  caloriesLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  macroGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  macroCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  macroValue: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 2,
  },
  foodsSection: {
    marginBottom: 12,
  },
  foodsTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  foodItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 6,
    marginBottom: 6,
  },
  foodName: {
    fontSize: 13,
    fontWeight: "600",
  },
  foodCalories: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  summaryBox: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9FA3",
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 12,
    lineHeight: 18,
  },
  notesInput: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: "#FF9FA3",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 24,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
