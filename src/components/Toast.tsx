import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Animated,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from "../theme/design";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type,
  visible,
  onDismiss,
  duration = 3000,
}: ToastProps) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-100)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        dismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const getToastConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: "checkmark-circle" as const,
          color: COLORS.success,
          backgroundColor: "#1a3229", // Dark green
        };
      case "error":
        return {
          icon: "close-circle" as const,
          color: COLORS.error,
          backgroundColor: "#3a1a1a", // Dark red
        };
      case "warning":
        return {
          icon: "warning" as const,
          color: COLORS.warning,
          backgroundColor: "#3a2a1a", // Dark orange
        };
      case "info":
      default:
        return {
          icon: "information-circle" as const,
          color: COLORS.primary,
          backgroundColor: "#1a1a3a", // Dark blue
        };
    }
  };

  const config = getToastConfig();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <View style={styles.modalOverlay} pointerEvents="box-none">
        {/* ✅ Added pointerEvents */}
        <Animated.View
          style={[
            styles.container,
            {
              top: insets.top + 16,
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.toast,
              {
                backgroundColor: config.backgroundColor,
                borderLeftColor: config.color,
              },
            ]}
            onPress={dismiss}
            activeOpacity={0.9}
          >
            <Ionicons name={config.icon} size={24} color={config.color} />
            <Text style={styles.message}>{message}</Text>
            <TouchableOpacity
              onPress={dismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1, // ✅ Take full screen
  },
  container: {
    position: "absolute",
    left: SPACING.lg,
    right: SPACING.lg,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    gap: SPACING.md,
    ...SHADOWS.large,
  },
  message: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
