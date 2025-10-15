import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LESSONS, Lesson, LessonSection } from "../data/lessons";
import { auth, db } from "../../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { awardXP } from "../utils/xpManager";
import { XP_REWARDS } from "../data/levels";
import Button from "../components/Button";
import Card from "../components/Card";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";

type LessonScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

export default function LessonScreen({ navigation, route }: LessonScreenProps) {
  const { lessonId } = route.params;
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLesson();
  }, []);

  const loadLesson = async () => {
    const foundLesson = LESSONS.find((l) => l.id === lessonId);
    if (foundLesson) {
      setLesson(foundLesson);
      await checkIfCompleted(lessonId);
    }
    setLoading(false);
  };

  const checkIfCompleted = async (lessonId: number) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const progressDoc = await getDoc(
        doc(db, "users", user.uid, "lessonProgress", `lesson_${lessonId}`)
      );

      if (progressDoc.exists()) {
        setCompleted(progressDoc.data().completed);
      }
    } catch (error) {
      console.error("Error checking lesson completion:", error);
    }
  };

  const markAsComplete = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !lesson) return;

      setLoading(true);

      await setDoc(
        doc(db, "users", user.uid, "lessonProgress", `lesson_${lesson.id}`),
        {
          lessonId: lesson.id,
          completed: true,
          completedAt: new Date().toISOString(),
        }
      );

      await awardXP(
        user.uid,
        XP_REWARDS.LESSON_COMPLETED,
        `Completed lesson: ${lesson.title}`
      );

      setCompleted(true);
      hapticFeedback.success();

      Alert.alert(
        "Lesson Complete! 🎉",
        `+${XP_REWARDS.LESSON_COMPLETED} XP!\n\n${
          lesson.content.practiceTask
            ? `Now go practice: ${lesson.content.practiceTask}`
            : "Well done! Keep up the great work!"
        }`,
        [
          {
            text: "Continue",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("Error marking lesson complete:", error);
      hapticFeedback.error();
      Alert.alert("Error", "Failed to save progress");
    } finally {
      setLoading(false);
    }
  };

  const renderSection = (section: LessonSection, index: number) => {
    switch (section.type) {
      case "heading":
        return (
          <Text key={index} style={styles.heading}>
            {section.content}
          </Text>
        );

      case "text":
        return (
          <Text key={index} style={styles.bodyText}>
            {section.content}
          </Text>
        );

      case "bullet":
        // ✅ Split content by newlines to show all bullets
        const bulletPoints = section.content
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map((line) => line.replace(/^•\s*/, "")); // Remove existing bullets

        return (
          <View key={index} style={styles.bulletList}>
            {bulletPoints.map((point, i) => (
              <View key={i} style={styles.bulletContainer}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{point}</Text>
              </View>
            ))}
          </View>
        );

      case "tip":
        return (
          <Card key={index} style={styles.tipBox}>
            <Text style={styles.tipLabel}>💡 Tip</Text>
            <Text style={styles.tipText}>{section.content}</Text>
          </Card>
        );

      case "exercise":
        return (
          <Card key={index} style={styles.exerciseBox}>
            <Text style={styles.exerciseLabel}>✨ Exercise</Text>
            <Text style={styles.exerciseText}>{section.content}</Text>
          </Card>
        );

      default:
        return null;
    }
  };

  if (loading || !lesson) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{lesson.title}</Text>
          <View style={styles.metaContainer}>
            <View style={styles.metaChip}>
              <Text style={styles.duration}>⏱ {lesson.duration}</Text>
            </View>
            <View style={[styles.metaChip, styles.levelChip]}>
              <Text style={styles.level}>Level {lesson.level}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {lesson.content.sections.map((section, index) =>
            renderSection(section, index)
          )}
        </View>

        {completed ? (
          <Card style={styles.completedBanner}>
            <Text style={styles.completedText}>✅ Lesson Completed</Text>
          </Card>
        ) : (
          <View style={styles.buttonWrapper}>
            <Button
              title="Mark as Complete"
              onPress={markAsComplete}
              loading={loading}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.md,
    marginTop: SPACING.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl + 10,
  },
  header: {
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl - 4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  metaContainer: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  metaChip: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  levelChip: {
    borderColor: COLORS.primary,
  },
  duration: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  level: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  content: {
    padding: SPACING.xl,
  },
  heading: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xxl,
    marginBottom: SPACING.md,
  },
  bodyText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    lineHeight: 26,
    marginBottom: SPACING.md,
  },
  bulletContainer: {
    flexDirection: "row",
    marginBottom: SPACING.md,
    paddingLeft: SPACING.sm,
  },
  bullet: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.primary,
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    lineHeight: 26,
  },
  tipBox: {
    backgroundColor: "#1a2332",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginVertical: SPACING.md,
  },
  tipLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  tipText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  exerciseBox: {
    backgroundColor: "#1a3229",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    marginVertical: SPACING.md,
  },
  exerciseLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.success,
    marginBottom: SPACING.xs,
  },
  exerciseText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  completedBanner: {
    marginHorizontal: SPACING.xl,
    backgroundColor: "#1a3229",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  completedText: {
    color: COLORS.success,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  buttonWrapper: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  bulletList: {
    marginBottom: SPACING.md,
  },
});
