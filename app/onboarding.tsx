import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { STORAGE_KEYS } from "@/constants/storage";
import { MotherhoodTheme } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

const { colors, radii, spacing, typography, shadows } = MotherhoodTheme;

// Onboarding background images
const ONBOARDING_IMAGES = [
  require("@/assets/onboarding_images/1_illustration.jpg"),
  require("@/assets/onboarding_images/4_illustration.jpg"),
  require("@/assets/onboarding_images/5_illustration.jpg"),
  require("@/assets/onboarding_images/6_illustration.jpg"),
];

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
  const imageIndex = index % ONBOARDING_IMAGES.length;

  return (
    <View style={styles.slide}>
      <ImageBackground
        source={ONBOARDING_IMAGES[imageIndex]}
        style={styles.slideBackground}
        resizeMode="cover"
      >
        {/* Dark overlay for text visibility */}
        <View style={styles.darkOverlay} />

        <View style={styles.slideContent}>
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: index * 60, type: "timing", duration: 400 }}
          >
          </MotiView>
          <Text style={styles.slideTitle}>{slide.title}</Text>
          <Text style={styles.slideDescription}>{slide.description}</Text>
        </View>
      </ImageBackground>
    </View>
  );
}

interface OnboardingController {
  activeIndex: number;
  isFirstSlide: boolean;
  isLastSlide: boolean;
  listRef: React.RefObject<FlatList<OnboardingSlide> | null>;
  handleNext: () => Promise<void>;
  handlePrevious: () => void;
  handleViewableItemsChanged: (info: { viewableItems: ViewToken[] }) => void;
  viewabilityConfig: { viewAreaCoveragePercentThreshold: number };
}

interface OnboardingContentProps {
  slides: OnboardingSlide[];
  activeIndex: number;
  listRef: React.RefObject<FlatList<OnboardingSlide> | null>;
  handleViewableItemsChanged: (info: { viewableItems: ViewToken[] }) => void;
  viewabilityConfig: { viewAreaCoveragePercentThreshold: number };
  isFirstSlide: boolean;
  isLastSlide: boolean;
  handlePrevious: () => void;
  handleNext: () => Promise<void>;
}

function OnboardingContent({
  slides,
  activeIndex,
  listRef,
  handleViewableItemsChanged,
  viewabilityConfig,
  isFirstSlide,
  isLastSlide,
  handlePrevious,
  handleNext,
}: OnboardingContentProps) {
  return (
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
        style={styles.flatList}
      />

      {/* Overlay indicators and buttons on top of images */}
      <View style={styles.overlayControls}>
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
            onPress={() => void handleNext()}
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
    </View>
  );
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

  const goToSlide = useCallback((index: number) => {
    listRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  const handleNext = useCallback(async () => {
    if (!isLastSlide) {
      goToSlide(activeIndex + 1);
      return;
    }

    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.hasCompletedOnboarding,
        "true"
      );
    } catch (error) {
      console.error("Failed to persist onboarding completion:", error);
    }

    router.replace("/(tabs)");
  }, [activeIndex, goToSlide, isLastSlide, router]);

  const handlePrevious = useCallback(() => {
    if (!isFirstSlide) {
      goToSlide(activeIndex - 1);
    }
  }, [activeIndex, goToSlide, isFirstSlide]);

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (
        viewableItems.length > 0 &&
        typeof viewableItems[0].index === "number"
      ) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

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
      <OnboardingContent
        slides={slides}
        activeIndex={activeIndex}
        listRef={listRef}
        handleViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        isFirstSlide={isFirstSlide}
        isLastSlide={isLastSlide}
        handlePrevious={handlePrevious}
        handleNext={handleNext}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  flatList: {
    flex: 1,
  },
  overlayControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    gap: spacing.xxl,
  },
  slide: {
    width: Dimensions.get("window").width,
    height: "100%",
  },
  slideBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  slideContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.xxxl,
  },
  slideHeading: {
    fontSize: typography.title,
    fontWeight: "800",
    color: colors.surface,
    textAlign: "center",
    marginBottom: spacing.md,
    textShadowColor: "rgba(0, 0, 0, 0.9)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  slideTitle: {
    fontSize: typography.headline,
    fontWeight: "700",
    color: colors.surface,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.9)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  slideDescription: {
    fontSize: typography.body,
    color: colors.surface,
    textAlign: "center",
    lineHeight: 22,
    textShadowColor: "rgba(0, 0, 0, 0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
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
