import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { MotherhoodTheme } from "@/constants/theme";

const { colors, radii, spacing, typography, shadows } = MotherhoodTheme;

const trackSections = [
  {
    title: "Symptom Log",
    subtitle: "Capture today's symptoms",
    icon: "edit-3",
    route: "/(tabs)/track/symptom-log",
  },
  {
    title: "Kick Counter",
    subtitle: "Track baby movements",
    icon: "activity",
    route: "/(tabs)/track/kick-counter",
  },
  {
    title: "Nutrition Coach",
    subtitle: "Stay on top of meals and hydration",
    icon: "coffee",
    route: "/(tabs)/track/nutrition-coach",
  },
  {
    title: "Goals & Achievements",
    subtitle: "Celebrate weekly wins",
    icon: "award",
    route: "/(tabs)/track/goals",
  },
  {
    title: "Alerts",
    subtitle: "Important reminders and notices",
    icon: "bell",
    route: "/(tabs)/track/alerts",
  },
];

export default function TrackHubScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Track & Reflect</Text>
        <Text style={styles.subheading}>
          Stay mindful of your health journey with these tools.
        </Text>
        <View style={styles.sectionList}>
          {trackSections.map((section, index) => (
            <MotiView
              key={section.title}
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 80 * index, type: "timing", duration: 300 }}
            >
              <Pressable
                onPress={() => router.push(section.route as never)}
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={styles.iconBadge}>
                  <Feather
                    name={section.icon as keyof typeof Feather.glyphMap}
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.title}>{section.title}</Text>
                  <Text style={styles.caption}>{section.subtitle}</Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={22}
                  color={colors.textSecondary}
                />
              </Pressable>
            </MotiView>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heading: {
    fontSize: typography.headline,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subheading: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  sectionList: {
    gap: spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.mutedPink,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
  },
  title: {
    fontSize: typography.subtitle,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  caption: {
    fontSize: typography.label,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
