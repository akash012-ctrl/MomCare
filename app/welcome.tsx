import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MotherhoodTheme } from "@/constants/theme";

const { colors, radii, spacing, typography, shadows } = MotherhoodTheme;

export default function WelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    // Screen fade in handled by Moti when component mounts
  }, []);

  return (
    <LinearGradient
      colors={[colors.primary, colors.accent]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 700 }}
          style={styles.content}
        >
          <View style={styles.iconWrapper}>
            <Image
              source={require("@/assets/images/moms_logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>MomCare</Text>
          <Text style={styles.subtitle}>Your AI Pregnancy Companion</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/login")}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            {({ pressed }) => (
              <MotiView
                from={{ scale: 1 }}
                animate={{ scale: pressed ? 0.98 : 1 }}
                transition={{ type: "timing", duration: 150 }}
                style={styles.buttonInner}
              >
                <Text style={styles.buttonText}>Get Started</Text>
              </MotiView>
            )}
          </Pressable>
        </MotiView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
  },
  content: {
    width: "100%",
    alignItems: "center",
    gap: spacing.lg,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  heart: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    top: 18,
    right: 18,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontSize: typography.display,
    color: colors.surface,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: typography.subtitle,
    color: colors.surface,
    textAlign: "center",
    opacity: 0.9,
  },
  button: {
    width: "100%",
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  buttonInner: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  buttonText: {
    fontSize: typography.title,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
});
