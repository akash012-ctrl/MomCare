import { Feather } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { MotiView } from "moti";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MotherhoodTheme } from "@/constants/theme";

const { colors, radii, spacing, shadows } = MotherhoodTheme;

const iconMap: Record<string, keyof typeof Feather.glyphMap> = {
  index: "home",
  assistant: "message-circle",
  track: "clipboard",
  profile: "user",
  explore: "compass",
};

const labelMap: Record<string, string> = {
  index: "Home",
  assistant: "Assistant",
  track: "Track",
  profile: "Profile",
  explore: "Explore",
};

interface MotherhoodTabBarItemProps {
  routeKey: string;
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
}

function MotherhoodTabBarItem({
  routeKey,
  routeName,
  isFocused,
  onPress,
  onLongPress,
  accessibilityLabel,
}: MotherhoodTabBarItemProps) {
  const label = labelMap[routeName] ?? routeName;
  const iconName = iconMap[routeName] ?? "circle";

  return (
    <Pressable
      key={routeKey}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tab}
    >
      {({ pressed }) => (
        <View style={styles.tabContent}>
          <MotiView
            from={{ scale: 1, opacity: 0.7 }}
            animate={{
              scale: isFocused ? 1.15 : pressed ? 0.95 : 1,
              opacity: isFocused ? 1 : 0.7,
            }}
            transition={{ type: "timing", duration: 200 }}
          >
            <Feather
              name={iconName}
              size={24}
              color={isFocused ? colors.secondary : colors.textSecondary}
            />
          </MotiView>
          <Text style={[styles.label, isFocused && styles.labelActive]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function MotherhoodTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const activeIndex = state.index;
  const indicatorWidth = useMemo(
    () => 100 / state.routes.length,
    [state.routes.length]
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.shadowContainer}>
        <View style={styles.container}>
          <MotiView
            transition={{ type: "timing", duration: 250 }}
            animate={{ translateX: `${indicatorWidth * activeIndex}%` }}
            style={[styles.indicator, { width: `${indicatorWidth}%` }]}
          />
          {state.routes.map((route, index) => {
            const isFocused = activeIndex === index;

            const handlePress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const handleLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            return (
              <MotherhoodTabBarItem
                key={route.key}
                routeKey={route.key}
                routeName={route.name}
                isFocused={isFocused}
                onPress={handlePress}
                onLongPress={handleLongPress}
                accessibilityLabel={
                  descriptors[route.key]?.options.tabBarAccessibilityLabel
                }
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "transparent",
  },
  shadowContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  container: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: "hidden",
    position: "relative",
    ...shadows.card,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
  },
  tabContent: {
    alignItems: "center",
    gap: spacing.xs,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  labelActive: {
    color: colors.secondary,
  },
  indicator: {
    position: "absolute",
    top: 0,
    height: 0,
    backgroundColor: "transparent",
    display: "none",
  },
});
