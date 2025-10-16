import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "./Card";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";

type Goal = {
  id: string;
  text: string;
  completed: boolean;
  icon: string;
};

type DailyGoalsProps = {
  goals: Goal[];
};

export default function DailyGoals({ goals }: DailyGoalsProps) {
  const completedCount = goals.filter((g) => g.completed).length;
  const allComplete = completedCount === goals.length;

  return (
    <Card
      style={{
        ...styles.container,
        ...(allComplete ? styles.containerComplete : {}),
      }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Today's Goals</Text>
        <Text style={[styles.progress, allComplete && styles.progressComplete]}>
          {completedCount}/{goals.length}
        </Text>
      </View>

      <View style={styles.goalsList}>
        {goals.map((goal) => (
          <View key={goal.id} style={styles.goalItem}>
            <View
              style={[
                styles.checkbox,
                goal.completed && styles.checkboxComplete,
              ]}
            >
              {goal.completed && (
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={COLORS.textPrimary}
                />
              )}
            </View>
            <Ionicons
              name={goal.icon as any}
              size={18}
              color={goal.completed ? COLORS.success : COLORS.textSecondary}
              style={styles.goalIcon}
            />
            <Text
              style={[
                styles.goalText,
                goal.completed && styles.goalTextComplete,
              ]}
            >
              {goal.text}
            </Text>
          </View>
        ))}
      </View>

      {allComplete && (
        <View style={styles.celebration}>
          <Ionicons name="trophy" size={20} color={COLORS.warning} />
          <Text style={styles.celebrationText}>All goals complete! 🎉</Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
  },
  containerComplete: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    backgroundColor: "#1a3229",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  progress: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
  },
  progressComplete: {
    color: COLORS.success,
  },
  goalsList: {
    gap: SPACING.md,
  },
  goalItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxComplete: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  goalIcon: {
    marginRight: SPACING.sm,
  },
  goalText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
  },
  goalTextComplete: {
    color: COLORS.textTertiary,
    textDecorationLine: "line-through",
  },
  celebration: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  celebrationText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.success,
  },
});
