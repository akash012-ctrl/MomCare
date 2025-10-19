import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MotherhoodTheme } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

const { colors, radii, spacing, typography, shadows } = MotherhoodTheme;

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  order: number;
}

interface IndicatorProps {
  index: number;
  isActive: boolean;
}

function SlideIndicator({ index, isActive }: IndicatorProps) {
  return (
    <MotiView
      from={{ width: 12, opacity: 0.4 }}
      animate={{ width: isActive ? 28 : 12, opacity: isActive ? 1 : 0.4 }}
      transition={{ delay: index * 40, type: "timing", duration: 220 }}
      style={[styles.indicator, isActive && styles.indicatorActive]}
    />
  );
}

interface SlideCardProps {
  slide: OnboardingSlide;
  index: number;
}

function SlideCard({ slide, index }: SlideCardProps) {
  return (
    <View style={styles.slide}>
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: index * 60, type: "timing", duration: 400 }}
        style={styles.iconBadge}
      >
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconGradient}
        >
          <Feather name={slide.icon} size={26} color={colors.surface} />
        </LinearGradient>
      </MotiView>
      <Text style={styles.slideTitle}>{slide.title}</Text>
      <Text style={styles.slideDescription}>{slide.description}</Text>
    </View>
  );
}

interface OnboardingController {
  activeIndex: number;
  isFirstSlide: boolean;
  isLastSlide: boolean;
  listRef: React.RefObject<FlatList<OnboardingSlide> | null>;
  handleNext: () => void;
  handlePrevious: () => void;
  handleViewableItemsChanged: (info: { viewableItems: ViewToken[] }) => void;
  viewabilityConfig: { viewAreaCoveragePercentThreshold: number };
}

function useOnboardingController(
  slides: OnboardingSlide[]
): OnboardingController {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<OnboardingSlide> | null>(null);

  const viewabilityConfig = useMemo(
    () => ({ viewAreaCoveragePercentThreshold: 60 }),
    []
  );

  const isFirstSlide = activeIndex === 0;
  const isLastSlide = activeIndex === slides.length - 1;

  const goToSlide = (index: number) => {
    listRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleNext = () => {
    if (!isLastSlide) {
      goToSlide(activeIndex + 1);
      return;
    }
    router.replace("/(tabs)");
  };

  const handlePrevious = () => {
    if (!isFirstSlide) {
      goToSlide(activeIndex - 1);
    }
  };

  const handleViewableItemsChanged = ({
    viewableItems,
  }: {
    viewableItems: ViewToken[];
  }) => {
    if (
      viewableItems.length > 0 &&
      typeof viewableItems[0].index === "number"
    ) {
      setActiveIndex(viewableItems[0].index);
    }
  };

  return {
    activeIndex,
    isFirstSlide,
    isLastSlide,
    listRef,
    handleNext,
    handlePrevious,
    handleViewableItemsChanged,
    viewabilityConfig,
  };
}

export default function OnboardingCarouselScreen() {
  const [slides, setSlides] = useState<OnboardingSlide[]>([]);
  const [loading, setLoading] = useState(true);

  // Load slides from Supabase
  const loadSlides = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("onboarding_slides")
        .select("*")
        .order("order", { ascending: true });

      if (error) throw error;
      setSlides((data as OnboardingSlide[]) || []);
    } catch (error) {
      console.error("Error loading onboarding slides:", error);
      // Fallback to default slides
      setSlides([
        {
          id: "1",
          title: "AI Assistant",
          description: "Get instant answers to pregnancy questions",
          icon: "message-circle",
          order: 1,
        },
        {
          id: "2",
          title: "Smart Reminders",
          description: "Never miss vitamins, appointments, health checks",
          icon: "bell",
          order: 2,
        },
        {
          id: "3",
          title: "Track Everything",
          description: "Monitor symptoms, kicks, nutrition, wellness",
          icon: "activity",
          order: 3,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load slides on mount
  useEffect(() => {
    loadSlides();
  }, [loadSlides]);

  const {
    activeIndex,
    isFirstSlide,
    isLastSlide,
    listRef,
    handleNext,
    handlePrevious,
    handleViewableItemsChanged,
    viewabilityConfig,
  } = useOnboardingController(slides);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading onboarding...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          ref={listRef}
          data={slides}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item, index }) => (
            <SlideCard slide={item} index={index} />
          )}
        />

        <View style={styles.indicatorRow}>
          {slides.map((_: OnboardingSlide, index: number) => (
            <SlideIndicator
              key={index}
              index={index}
              isActive={index === activeIndex}
            />
          ))}
        </View>

        <View style={styles.navRow}>
          <Pressable
            accessibilityRole="button"
            disabled={isFirstSlide}
            onPress={handlePrevious}
            style={({ pressed }) => [
              styles.navButton,
              pressed && styles.navButtonPressed,
              isFirstSlide && styles.navButtonDisabled,
            ]}
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={handleNext}
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.ctaButtonPressed,
            ]}
          >
            <Text style={styles.ctaText}>
              {isLastSlide ? "Start My Journey" : "Next"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingVertical: spacing.xxxl,
    alignItems: "center",
    gap: spacing.xxl,
  },
  slide: {
    width: spacing.xxxl * 12,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.xxxl,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: radii.lg,
    ...shadows.soft,
  },
  iconGradient: {
    flex: 1,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  slideTitle: {
    fontSize: typography.headline,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  slideDescription: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  indicatorRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lavender,
  },
  indicatorActive: {
    backgroundColor: colors.primary,
  },
  navRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  navButton: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lavender,
    backgroundColor: colors.surface,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonPressed: {
    opacity: 0.85,
  },
  navButtonText: {
    color: colors.textSecondary,
    fontSize: typography.label,
    fontWeight: "600",
  },
  ctaButton: {
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    ...shadows.card,
  },
  ctaButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  ctaText: {
    color: colors.surface,
    fontWeight: "600",
    fontSize: typography.subtitle,
  },
  loadingContainer: {
    justifyContent: "center",
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.body,
    color: colors.textSecondary,
  },
});
