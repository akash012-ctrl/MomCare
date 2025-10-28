import { Feather } from "@expo/vector-icons";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { MotherhoodTheme } from "@/constants/theme";

type AlertType = "info" | "success" | "warning" | "error";
type AlertTone = "primary" | "secondary" | "danger";

interface AlertAction {
  text: string;
  onPress?: () => void;
  tone?: AlertTone;
}

export interface ShowAlertOptions {
  title: string;
  message?: string;
  type?: AlertType;
  actions?: AlertAction[];
  dismissible?: boolean;
  autoCloseMs?: number;
}

interface AlertState extends Required<Pick<ShowAlertOptions, "title">> {
  message?: string;
  type: AlertType;
  actions: AlertAction[];
  dismissible: boolean;
  autoCloseMs?: number;
  id: number;
}

type AlertListener = (state: AlertState | null) => void;

const alertListeners = new Set<AlertListener>();

function subscribe(listener: AlertListener) {
  alertListeners.add(listener);
  return () => {
    alertListeners.delete(listener);
  };
}

function notify(state: AlertState | null) {
  alertListeners.forEach((listener) => listener(state));
}

export function showAppAlert(options: ShowAlertOptions) {
  const fallbackAction: AlertAction = { text: "Okay", tone: "primary" };

  const alertState: AlertState = {
    id: Date.now(),
    title: options.title,
    message: options.message,
    type: options.type ?? "info",
    dismissible: options.dismissible ?? true,
    autoCloseMs: options.autoCloseMs,
    actions: (options.actions?.length ? options.actions : [fallbackAction]).map(
      (action) => ({
        ...action,
        tone: action.tone ?? "primary",
      })
    ),
  };

  notify(alertState);
}

export function hideAppAlert() {
  notify(null);
}

interface AlertContextValue {
  showAlert: (options: ShowAlertOptions) => void;
  hideAlert: () => void;
}

const AppAlertContext = createContext<AlertContextValue>({
  showAlert: showAppAlert,
  hideAlert: hideAppAlert,
});

export function useAppAlert(): AlertContextValue {
  return useContext(AppAlertContext);
}

const TYPE_STYLES: Record<
  AlertType,
  { icon: keyof typeof Feather.glyphMap; color: string }
> = {
  info: { icon: "info", color: MotherhoodTheme.colors.secondary },
  success: { icon: "check-circle", color: MotherhoodTheme.colors.success },
  warning: { icon: "alert-triangle", color: MotherhoodTheme.colors.warning },
  error: { icon: "x-circle", color: MotherhoodTheme.colors.danger },
};

const TONE_STYLES: Record<
  AlertTone,
  { backgroundColor: string; borderColor: string; textColor: string }
> = {
  primary: {
    backgroundColor: MotherhoodTheme.colors.secondary,
    borderColor: MotherhoodTheme.colors.secondary,
    textColor: "#FFFFFF",
  },
  secondary: {
    backgroundColor: MotherhoodTheme.colors.surface,
    borderColor: MotherhoodTheme.colors.lavender,
    textColor: MotherhoodTheme.colors.textPrimary,
  },
  danger: {
    backgroundColor: MotherhoodTheme.colors.danger,
    borderColor: MotherhoodTheme.colors.danger,
    textColor: "#FFFFFF",
  },
};

function useAlertAutoClose(alert: AlertState | null) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (alert?.autoCloseMs) {
      timerRef.current = setTimeout(() => {
        hideAppAlert();
      }, alert.autoCloseMs);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [alert]);
}

type AlertModalProps = {
  alert: AlertState | null;
  onDismiss: () => void;
  onActionPress: (action: AlertAction) => void;
};

function AlertModal({ alert, onDismiss, onActionPress }: AlertModalProps) {
  if (!alert) {
    return null;
  }

  const handleRequestClose = () => {
    if (alert.dismissible !== false) {
      onDismiss();
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={handleRequestClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={alert.dismissible === false ? undefined : onDismiss}
          disabled={alert.dismissible === false}
        />
        <View style={styles.cardWrapper} pointerEvents="box-none">
          <View style={styles.card}>
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: TYPE_STYLES[alert.type].color + "20" },
              ]}
            >
              <Feather
                name={TYPE_STYLES[alert.type].icon}
                size={28}
                color={TYPE_STYLES[alert.type].color}
              />
            </View>
            <ThemedText style={styles.title}>
              {alert.title}
            </ThemedText>
            {alert.message && alert.message.trim() !== "" ? (
              <ThemedText style={styles.message}>
                {alert.message}
              </ThemedText>
            ) : null}
            <View style={styles.actions}>
              {alert.actions.map((action, index) => {
                const toneStyle = TONE_STYLES[action.tone ?? "primary"];
                return (
                  <Pressable
                    key={`${alert.id}-${index}`}
                    onPress={() => onActionPress(action)}
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: toneStyle.backgroundColor,
                        borderColor: toneStyle.borderColor,
                        flex: alert.actions.length > 1 ? 1 : undefined,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[styles.actionText, { color: toneStyle.textColor }]}
                    >
                      {action.text}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AlertState | null>(null);

  useEffect(() => subscribe(setAlert), []);
  useAlertAutoClose(alert);

  const contextValue = useMemo<AlertContextValue>(
    () => ({
      showAlert: showAppAlert,
      hideAlert: hideAppAlert,
    }),
    []
  );

  const handleActionPress = useCallback((action: AlertAction) => {
    hideAppAlert();
    if (action.onPress) {
      setTimeout(action.onPress, 160);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    hideAppAlert();
  }, []);

  return (
    <AppAlertContext.Provider value={contextValue}>
      {children}
      <AlertModal
        alert={alert}
        onDismiss={handleDismiss}
        onActionPress={handleActionPress}
      />
    </AppAlertContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(47, 26, 28, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: MotherhoodTheme.spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  cardWrapper: {
    width: "100%",
    maxWidth: 360,
  },
  card: {
    backgroundColor: MotherhoodTheme.colors.surface,
    borderRadius: MotherhoodTheme.radii.xl,
    paddingHorizontal: MotherhoodTheme.spacing.xl,
    paddingVertical: MotherhoodTheme.spacing.xl,
    alignItems: "center",
    gap: MotherhoodTheme.spacing.md,
    ...MotherhoodTheme.shadows.soft,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: MotherhoodTheme.radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: MotherhoodTheme.typography.title,
    fontWeight: "700",
    textAlign: "center",
    color: MotherhoodTheme.colors.textPrimary,
  },
  message: {
    fontSize: MotherhoodTheme.typography.body,
    textAlign: "center",
    lineHeight: 22,
    color: MotherhoodTheme.colors.textSecondary,
    marginTop: MotherhoodTheme.spacing.xs,
  },
  actions: {
    marginTop: MotherhoodTheme.spacing.lg,
    flexDirection: "row",
    gap: MotherhoodTheme.spacing.sm,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  actionButton: {
    borderRadius: MotherhoodTheme.radii.lg,
    paddingVertical: MotherhoodTheme.spacing.md,
    paddingHorizontal: MotherhoodTheme.spacing.xl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: MotherhoodTheme.typography.body,
    fontWeight: "600",
  },
});
