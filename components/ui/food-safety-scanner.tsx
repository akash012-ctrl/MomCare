import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { MotiView } from "moti";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { MotherhoodTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { uploadAndAnalyzeImage } from "@/lib/supabase-api";

const { colors, radii, spacing, typography, shadows } = MotherhoodTheme;

interface FoodSafetyScanResult {
    food_name: string;
    safety_rating: "safe" | "caution" | "avoid" | "unknown";
    safety_score: number;
    description: string;
    benefits: string[];
    risks: string[];
    serving_recommendations: string;
    trimester_specific_advice: {
        first?: string;
        second?: string;
        third?: string;
    };
    nutritional_highlights: {
        key_nutrients?: string[];
        vitamins?: string[];
        minerals?: string[];
    };
}

interface FoodSafetyScannerProps {
    visible: boolean;
    onClose: () => void;
    onScanComplete?: (result: FoodSafetyScanResult) => void;
}

export function FoodSafetyScanner({
    visible,
    onClose,
    onScanComplete,
}: FoodSafetyScannerProps) {
    const { user } = useAuth();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [result, setResult] = useState<FoodSafetyScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const pickImage = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                setError("Permission to access photos is required");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                setSelectedImage(result.assets[0].uri);
                await analyzeFood(result.assets[0].base64, result.assets[0].mimeType || "image/jpeg");
            }
        } catch (err) {
            console.error("Error picking image:", err);
            setError("Failed to select image");
        }
    };

    const takePhoto = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
                setError("Permission to access camera is required");
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                setSelectedImage(result.assets[0].uri);
                await analyzeFood(result.assets[0].base64, result.assets[0].mimeType || "image/jpeg");
            }
        } catch (err) {
            console.error("Error taking photo:", err);
            setError("Failed to take photo");
        }
    };

    const analyzeFood = async (base64: string, mimeType: string) => {
        if (!user?.id) {
            setError("User not authenticated");
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const fileName = `food-safety-${Date.now()}.jpg`;

            // Use the existing image analysis endpoint with a new analysis type
            const response = await uploadAndAnalyzeImage({
                userId: user.id,
                fileName,
                fileBase64: base64,
                mimeType,
                analysisType: "food_safety" as any, // Extended type
            });

            // Parse the AI response
            const analysis = response.analysis as unknown as FoodSafetyScanResult;

            // Save to database
            const { error: dbError } = await supabase.from("food_safety_scans").insert({
                user_id: user.id,
                image_url: response.imageUrl,
                storage_path: response.imageUrl,
                food_name: analysis.food_name,
                safety_rating: analysis.safety_rating,
                safety_score: analysis.safety_score,
                description: analysis.description,
                benefits: analysis.benefits,
                risks: analysis.risks,
                serving_recommendations: analysis.serving_recommendations,
                trimester_specific_advice: analysis.trimester_specific_advice,
                nutritional_highlights: analysis.nutritional_highlights,
                confidence: 0.9,
                model_used: "gpt-4o",
                tokens_used: response.tokensUsed,
            });

            if (dbError) throw dbError;

            setResult(analysis);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onScanComplete?.(analysis);
        } catch (err) {
            console.error("Error analyzing food:", err);
            setError(err instanceof Error ? err.message : "Failed to analyze food");
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleClose = () => {
        setSelectedImage(null);
        setResult(null);
        setError(null);
        onClose();
    };

    const getSafetyColor = (rating: string) => {
        switch (rating) {
            case "safe":
                return colors.success;
            case "caution":
                return colors.warning;
            case "avoid":
                return colors.danger;
            default:
                return colors.textSecondary;
        }
    };

    const getSafetyIcon = (rating: string) => {
        switch (rating) {
            case "safe":
                return "check-circle";
            case "caution":
                return "alert-triangle";
            case "avoid":
                return "x-circle";
            default:
                return "help-circle";
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={handleClose} style={styles.closeButton}>
                        <Feather name="x" size={24} color={colors.textPrimary} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Scan Food Safety</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {!selectedImage && !result && (
                        <View style={styles.initialState}>
                            <Feather name="camera" size={64} color={colors.primary} />
                            <Text style={styles.initialTitle}>Scan Food for Safety</Text>
                            <Text style={styles.initialSubtitle}>
                                Get instant pregnancy-safe food recommendations
                            </Text>

                            <View style={styles.buttonGroup}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.actionButton,
                                        pressed && styles.actionButtonPressed,
                                    ]}
                                    onPress={takePhoto}
                                >
                                    <Feather name="camera" size={24} color={colors.surface} />
                                    <Text style={styles.actionButtonText}>Take Photo</Text>
                                </Pressable>

                                <Pressable
                                    style={({ pressed }) => [
                                        styles.actionButton,
                                        pressed && styles.actionButtonPressed,
                                    ]}
                                    onPress={pickImage}
                                >
                                    <Feather name="image" size={24} color={colors.surface} />
                                    <Text style={styles.actionButtonText}>Choose from Gallery</Text>
                                </Pressable>
                            </View>
                        </View>
                    )}

                    {isAnalyzing && (
                        <View style={styles.loadingState}>
                            {selectedImage && (
                                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                            )}
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={styles.loadingText}>Analyzing food safety...</Text>
                        </View>
                    )}

                    {result && selectedImage && (
                        <MotiView
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: "timing", duration: 500 }}
                        >
                            <Image source={{ uri: selectedImage }} style={styles.resultImage} />

                            {/* Safety Rating */}
                            <View
                                style={[
                                    styles.safetyBadge,
                                    { backgroundColor: getSafetyColor(result.safety_rating) },
                                ]}
                            >
                                <Feather
                                    name={getSafetyIcon(result.safety_rating) as any}
                                    size={24}
                                    color={colors.surface}
                                />
                                <Text style={styles.safetyText}>
                                    {result.safety_rating.toUpperCase()}
                                </Text>
                                <Text style={styles.safetyScore}>{result.safety_score}%</Text>
                            </View>

                            {/* Food Name */}
                            <Text style={styles.foodName}>{result.food_name}</Text>
                            <Text style={styles.description}>{result.description}</Text>

                            {/* Benefits */}
                            {result.benefits.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Feather name="plus-circle" size={20} color={colors.success} />
                                        <Text style={styles.sectionTitle}>Benefits</Text>
                                    </View>
                                    {result.benefits.map((benefit, index) => (
                                        <Text key={index} style={styles.listItem}>
                                            • {benefit}
                                        </Text>
                                    ))}
                                </View>
                            )}

                            {/* Risks */}
                            {result.risks.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Feather name="alert-circle" size={20} color={colors.danger} />
                                        <Text style={styles.sectionTitle}>Risks & Precautions</Text>
                                    </View>
                                    {result.risks.map((risk, index) => (
                                        <Text key={index} style={styles.listItem}>
                                            • {risk}
                                        </Text>
                                    ))}
                                </View>
                            )}

                            {/* Serving Recommendations */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Feather name="info" size={20} color={colors.primary} />
                                    <Text style={styles.sectionTitle}>Serving Recommendations</Text>
                                </View>
                                <Text style={styles.bodyText}>{result.serving_recommendations}</Text>
                            </View>

                            {/* Trimester-Specific Advice */}
                            {Object.keys(result.trimester_specific_advice).length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Feather name="calendar" size={20} color={colors.accent} />
                                        <Text style={styles.sectionTitle}>Trimester-Specific Advice</Text>
                                    </View>
                                    {result.trimester_specific_advice.first && (
                                        <View style={styles.trimesterAdvice}>
                                            <Text style={styles.trimesterLabel}>1st Trimester:</Text>
                                            <Text style={styles.bodyText}>
                                                {result.trimester_specific_advice.first}
                                            </Text>
                                        </View>
                                    )}
                                    {result.trimester_specific_advice.second && (
                                        <View style={styles.trimesterAdvice}>
                                            <Text style={styles.trimesterLabel}>2nd Trimester:</Text>
                                            <Text style={styles.bodyText}>
                                                {result.trimester_specific_advice.second}
                                            </Text>
                                        </View>
                                    )}
                                    {result.trimester_specific_advice.third && (
                                        <View style={styles.trimesterAdvice}>
                                            <Text style={styles.trimesterLabel}>3rd Trimester:</Text>
                                            <Text style={styles.bodyText}>
                                                {result.trimester_specific_advice.third}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Scan Another Button */}
                            <Pressable
                                style={({ pressed }) => [
                                    styles.scanAnotherButton,
                                    pressed && styles.actionButtonPressed,
                                ]}
                                onPress={() => {
                                    setSelectedImage(null);
                                    setResult(null);
                                }}
                            >
                                <Text style={styles.scanAnotherText}>Scan Another Food</Text>
                            </Pressable>
                        </MotiView>
                    )}

                    {error && (
                        <View style={styles.errorState}>
                            <Feather name="alert-circle" size={48} color={colors.danger} />
                            <Text style={styles.errorText}>{error}</Text>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.retryButton,
                                    pressed && styles.actionButtonPressed,
                                ]}
                                onPress={() => {
                                    setError(null);
                                    setSelectedImage(null);
                                }}
                            >
                                <Text style={styles.retryButtonText}>Try Again</Text>
                            </Pressable>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.textSecondary + "30",
    },
    closeButton: {
        padding: spacing.sm,
    },
    headerTitle: {
        fontSize: typography.title,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    content: {
        flex: 1,
        padding: spacing.xl,
    },
    initialState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.xxxl * 2,
    },
    initialTitle: {
        fontSize: typography.headline,
        fontWeight: "700",
        color: colors.textPrimary,
        marginTop: spacing.xl,
        textAlign: "center",
    },
    initialSubtitle: {
        fontSize: typography.body,
        color: colors.textSecondary,
        marginTop: spacing.sm,
        textAlign: "center",
        paddingHorizontal: spacing.xl,
    },
    buttonGroup: {
        marginTop: spacing.xxxl,
        gap: spacing.lg,
        width: "100%",
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primary,
        paddingVertical: spacing.lg,
        borderRadius: radii.md,
        gap: spacing.md,
        ...shadows.card,
    },
    actionButtonPressed: {
        opacity: 0.8,
    },
    actionButtonText: {
        fontSize: typography.subtitle,
        fontWeight: "600",
        color: colors.surface,
    },
    loadingState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.xxxl,
        gap: spacing.lg,
    },
    previewImage: {
        width: "100%",
        height: 200,
        borderRadius: radii.lg,
        marginBottom: spacing.lg,
    },
    loadingText: {
        fontSize: typography.body,
        color: colors.textSecondary,
    },
    resultImage: {
        width: "100%",
        height: 250,
        borderRadius: radii.lg,
        marginBottom: spacing.lg,
    },
    safetyBadge: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.lg,
        borderRadius: radii.lg,
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    safetyText: {
        fontSize: typography.title,
        fontWeight: "700",
        color: colors.surface,
    },
    safetyScore: {
        fontSize: typography.headline,
        fontWeight: "800",
        color: colors.surface,
    },
    foodName: {
        fontSize: typography.display,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    description: {
        fontSize: typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.xl,
        lineHeight: 24,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: typography.subtitle,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    listItem: {
        fontSize: typography.body,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
        lineHeight: 22,
    },
    bodyText: {
        fontSize: typography.body,
        color: colors.textPrimary,
        lineHeight: 22,
    },
    trimesterAdvice: {
        marginBottom: spacing.md,
    },
    trimesterLabel: {
        fontSize: typography.body,
        fontWeight: "600",
        color: colors.accent,
        marginBottom: spacing.xs,
    },
    scanAnotherButton: {
        backgroundColor: colors.secondary,
        paddingVertical: spacing.lg,
        borderRadius: radii.md,
        alignItems: "center",
        marginTop: spacing.xl,
        ...shadows.soft,
    },
    scanAnotherText: {
        fontSize: typography.subtitle,
        fontWeight: "600",
        color: colors.surface,
    },
    errorState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.xxxl,
        gap: spacing.lg,
    },
    errorText: {
        fontSize: typography.body,
        color: colors.danger,
        textAlign: "center",
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.lg,
        borderRadius: radii.md,
        marginTop: spacing.lg,
    },
    retryButtonText: {
        fontSize: typography.subtitle,
        fontWeight: "600",
        color: colors.surface,
    },
});

import { SafeAreaView } from "react-native-safe-area-context";

