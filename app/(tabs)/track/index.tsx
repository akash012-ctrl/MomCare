import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { MotherhoodTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";

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
    title: "Goals",
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
  const { user } = useAuth();

  const renderGridItem = ({ item, index }: { item: typeof trackSections[0]; index: number }) => (
    <MotiView
      key={item.title}
      from={{ opacity: 0, translateY: 24 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: 80 * index, type: "timing", duration: 300 }}
      style={styles.gridItemWrapper}
    >
      <Pressable
        onPress={() => router.push(item.route as never)}
        style={({ pressed }) => [
          styles.gridCard,
          pressed && styles.gridCardPressed,
        ]}
      >
        <View style={styles.gridIconBadge}>
          <Feather
            name={item.icon as keyof typeof Feather.glyphMap}
            size={28}
            color={colors.primary}
          />
        </View>
        <Text style={styles.gridTitle}>{item.title}</Text>
        <Text style={styles.gridCaption}>{item.subtitle}</Text>
      </Pressable>
    </MotiView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.heading}>Track</Text>
          <Text style={styles.subheading}>
            Stay mindful of your health journey with these tools.
          </Text>
        </View>
        <FlatList
          data={trackSections}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.title}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          scrollEnabled={false}
          contentContainerStyle={styles.gridContainer}
        />
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  headerSection: {
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.mutedPink,
    paddingBottom: spacing.lg,
  },
  heading: {
    fontSize: typography.headline,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subheading: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  sectionList: {
    gap: spacing.md,
  },
  gridContainer: {
    gap: spacing.md,
  },
  columnWrapper: {
    gap: spacing.md,
  },
  gridItemWrapper: {
    flex: 1,
  },
  gridCard: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    minHeight: 160,
    ...shadows.card,
  },
  gridCardPressed: {
    transform: [{ scale: 0.95 }],
  },
  gridIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.mutedPink,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  gridTitle: {
    fontSize: typography.subtitle,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  gridCaption: {
    fontSize: typography.label,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
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
