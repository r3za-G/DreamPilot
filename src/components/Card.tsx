import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../theme/design";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "highlighted" | "elevated";
  onPress?: () => void;
}

export default function Card({
  children,
  style,
  variant = "default",
}: CardProps) {
  const cardStyles = [
    styles.card,
    variant === "highlighted" && styles.highlighted,
    variant === "elevated" && styles.elevated,
    style,
  ];

  return <View style={cardStyles}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  highlighted: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  elevated: {
    ...SHADOWS.medium,
  },
});
