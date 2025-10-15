import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "./Button";
import { COLORS, SPACING, TYPOGRAPHY } from "../theme/design";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export default function EmptyState({
  icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {emoji ? (
        <Text style={styles.emoji}>{emoji}</Text>
      ) : icon ? (
        <Ionicons name={icon} size={80} color={COLORS.textTertiary} />
      ) : null}

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionLabel && onAction && (
        <View style={styles.actions}>
          <Button
            title={actionLabel}
            onPress={onAction}
            style={styles.button}
          />
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              title={secondaryActionLabel}
              onPress={onSecondaryAction}
              variant="ghost"
              style={styles.button}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xxxl + 10,
    paddingVertical: SPACING.xxxl * 2,
  },
  emoji: {
    fontSize: 80,
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: SPACING.xxl,
  },
  actions: {
    width: "100%",
    gap: SPACING.md,
  },
  button: {
    width: "100%",
  },
});
