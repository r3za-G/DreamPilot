import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { COLORS, TYPOGRAPHY, SPACING } from "../theme/design";
import { getLevelTier } from "../data/levels";

type CircularProgressLevelProps = {
  level: number;
  currentXP: number;
  requiredXP: number;
  percentage: number;
};

export default function CircularProgressLevel({
  level,
  currentXP,
  requiredXP,
  percentage,
}: CircularProgressLevelProps) {
  const tier = getLevelTier(level);

  return (
    <View style={styles.container}>
      <AnimatedCircularProgress
        size={160}
        width={12}
        fill={percentage}
        tintColor={tier.color}
        backgroundColor={COLORS.border}
        rotation={0}
        lineCap="round"
        duration={1000}
      >
        {() => (
          <View style={styles.innerContent}>
            <Text style={styles.level}>{level}</Text>
            <Text style={styles.levelLabel}>Level</Text>
          </View>
        )}
      </AnimatedCircularProgress>

      <View style={styles.xpInfo}>
        <Text style={styles.xpText}>
          {currentXP} / {requiredXP} XP
        </Text>
        <Text style={[styles.tierText, { color: tier.color }]}>
          {tier.title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  innerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  level: {
    fontSize: 48,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  levelLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  xpInfo: {
    alignItems: "center",
    marginTop: SPACING.lg,
  },
  xpText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  tierText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
