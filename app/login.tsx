import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MotherhoodTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";

const { colors, radii, spacing, typography, shadows } = MotherhoodTheme;

type AuthMode = "signin" | "signup";

interface AuthFieldProps {
  icon: keyof typeof Feather.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  editable: boolean;
  autoCapitalize?: "none" | "words";
  keyboardType?: "default" | "email-address";
  textContentType?: TextInput["props"]["textContentType"];
  isPassword?: boolean;
}

function AuthField({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  editable,
  autoCapitalize = "none",
  keyboardType = "default",
  textContentType,
  isPassword = false,
}: AuthFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View style={styles.fieldWrapper}>
      <Feather
        name={icon}
        size={18}
        color={colors.textSecondary}
        style={styles.fieldIcon}
      />
      <TextInput
        value={value}
        editable={editable}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(112, 76, 87, 0.45)"
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        autoCorrect={false}
        secureTextEntry={isPassword && !showPassword}
        style={styles.input}
        textContentType={textContentType}
      />
      {isPassword && (
        <Pressable
          onPress={togglePasswordVisibility}
          style={styles.passwordToggle}
          hitSlop={8}
        >
          <Feather
            name={showPassword ? "eye" : "eye-off"}
            size={18}
            color={colors.textSecondary}
          />
        </Pressable>
      )}
    </View>
  );
}

interface AuthToggleProps {
  mode: AuthMode;
  isLoading: boolean;
  onToggle: () => void;
}

function AuthToggle({ mode, isLoading, onToggle }: AuthToggleProps) {
  return (
    <TouchableOpacity onPress={async () => {
      await Haptics.selectionAsync();
      onToggle();
    }} disabled={isLoading}>
      <Text style={styles.toggleText}>
        {mode === "signin"
          ? "Don't have an account? "
          : "Already have an account? "}
        <Text style={styles.toggleHighlight}>
          {mode === "signin" ? "Sign Up" : "Sign In"}
        </Text>
      </Text>
    </TouchableOpacity>
  );
}

interface AuthErrorBannerProps {
  message: string;
}

function AuthErrorBanner({ message }: AuthErrorBannerProps) {
  return (
    <View style={styles.errorBanner}>
      <Feather name="alert-triangle" size={18} color={colors.surface} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

interface AuthSuccessBannerProps {
  message: string;
}

function AuthSuccessBanner({ message }: AuthSuccessBannerProps) {
  return (
    <View style={styles.successBanner}>
      <Feather name="check-circle" size={18} color={colors.surface} />
      <Text style={styles.successText}>{message}</Text>
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signUp, authError, clearError, isLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  const title = useMemo(
    () => (mode === "signin" ? "Welcome Back" : "Create Account"),
    [mode]
  );
  const ctaLabel = useMemo(
    () => (mode === "signin" ? "Sign In" : "Sign Up"),
    [mode]
  );

  useEffect(() => {
    setLocalError(null);
    setVerificationMessage(null);
    clearError();
  }, [mode, clearError]);

  const validate = () => {
    if (!email.trim()) {
      return "Email is required.";
    }
    if (!password.trim()) {
      return "Password is required.";
    }
    if (mode === "signup" && !name.trim()) {
      return "Full name is required to sign up.";
    }
    return null;
  };

  const handleSubmit = async () => {
    try {
      const validationError = validate();
      if (validationError) {
        setLocalError(validationError);
        return;
      }

      setLocalError(null);
      setVerificationMessage(null);

      if (mode === "signup") {
        await signUp({ name, email, password });
        // Trigger success haptic
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Show verification message
        setVerificationMessage(
          "Account created! Please check your email to verify your account before signing in."
        );
        console.log("Sign up successful");
        // Don't navigate yet - user needs to verify email first
        return;
      } else {
        await signIn({ email, password });
        // Trigger success haptic
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log("Sign in successful");
      }

      // Wait a moment for state to update, then navigate
      setTimeout(() => {
        router.replace("/(tabs)" as any);
      }, 500);
    } catch (error) {
      // Trigger error haptic
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Authentication failed. Please try again.";
      setLocalError(errorMsg);
      console.error("Auth error:", error);
    }
  };

  const errorToShow = localError ?? authError;

  return (
    <LinearGradient
      colors={[colors.primary, colors.accent]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.select({ ios: "padding", android: "height" })}
          keyboardVerticalOffset={Platform.select({ ios: 0, android: 20 })}
        >
          <View style={styles.container}>
            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 500 }}
              style={styles.card}
            >
              <View style={styles.header}>
                <MotiView
                  from={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "timing", duration: 400, delay: 100 }}
                  style={styles.logoContainer}
                >
                  <Image
                    source={require("@/assets/images/moms_logo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </MotiView>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>
                  {mode === "signin"
                    ? "Sign in to continue your pregnancy journey."
                    : "Let's get you started with MomCare."}
                </Text>
              </View>

              {errorToShow ? <AuthErrorBanner message={errorToShow} /> : null}
              {verificationMessage ? <AuthSuccessBanner message={verificationMessage} /> : null}

              {mode === "signup" ? (
                <AuthField
                  icon="user"
                  placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                  editable={!isLoading}
                  autoCapitalize="words"
                  textContentType="name"
                />
              ) : null}

              <AuthField
                icon="mail"
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
                keyboardType="email-address"
                textContentType="emailAddress"
              />

              <AuthField
                icon="lock"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
                isPassword
                textContentType="password"
              />

              <Pressable
                accessibilityRole="button"
                onPress={handleSubmit}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.submitButton,
                  (pressed || isLoading) && styles.submitButtonPressed,
                ]}
              >
                <MotiView
                  from={{ scale: 1 }}
                  animate={{ scale: isLoading ? 0.98 : 1 }}
                  transition={{ type: "timing", duration: 160 }}
                  style={styles.submitInner}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <Text style={styles.submitText}>{ctaLabel}</Text>
                  )}
                </MotiView>
              </Pressable>

              <AuthToggle
                mode={mode}
                isLoading={isLoading}
                onToggle={() =>
                  setMode((current) =>
                    current === "signin" ? "signup" : "signin"
                  )
                }
              />
            </MotiView>
          </View>
        </KeyboardAvoidingView>
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
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    gap: spacing.lg,
    ...shadows.card,
  },
  header: {
    gap: spacing.md,
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontSize: typography.headline,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  fieldWrapper: {
    position: "relative",
    backgroundColor: colors.background,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    minHeight: 56,
  },
  fieldIcon: {
    position: "relative",
    marginRight: spacing.md,
    width: 18,
    height: 18,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingRight: spacing.lg,
    color: colors.textPrimary,
    fontSize: typography.body,
  },
  passwordToggle: {
    padding: spacing.md,
    marginRight: spacing.sm,
  },
  submitButton: {
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    ...shadows.soft,
  },
  submitButtonPressed: {
    opacity: 0.9,
  },
  submitInner: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
  },
  submitText: {
    color: colors.surface,
    fontWeight: "600",
    fontSize: typography.subtitle,
  },
  toggleText: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: typography.label,
  },
  toggleHighlight: {
    color: colors.primary,
    fontWeight: "600",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "#FF6B81",
  },
  errorText: {
    color: colors.surface,
    flex: 1,
    fontSize: typography.label,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.success,
  },
  successText: {
    color: colors.surface,
    flex: 1,
    fontSize: typography.label,
  },
});
