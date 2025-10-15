import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LESSONS, Lesson } from "../data/lessons";
import { calculateStreak } from "../utils/streakCalculator";
import { checkAchievements } from "../utils/achievementChecker";
import AchievementModal from "../components/AchievementModal";
import { Achievement } from "../data/achievements";
import { Ionicons } from "@expo/vector-icons";
import { useData } from "../contexts/DataContext";
import { getLevelTier, getProgressToNextLevel } from "../data/levels";
import { auth } from "../../firebaseConfig";
import Card from "../components/Card";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { userData, dreams, completedLessons, loading, refreshData } =
    useData();
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [achievementModal, setAchievementModal] = useState<{
    visible: boolean;
    achievement: Achievement | null;
  }>({
    visible: false,
    achievement: null,
  });
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);

  useEffect(() => {
    if (!loading && userData && dreams.length >= 0) {
      checkForAchievements();
    }
  }, [loading, userData, dreams, completedLessons]);

  useEffect(() => {
    const firstIncomplete = LESSONS.find(
      (lesson) => !completedLessons.includes(lesson.id)
    );
    setNextLesson(firstIncomplete || null);
  }, [completedLessons]);

  const checkForAchievements = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const dreamEntries = dreams.map((d) => ({ createdAt: d.createdAt }));
      const currentStreak = calculateStreak(dreamEntries);
      const lucidDreams = dreams.filter((d) => d.isLucid).length;

      const newAchievements = await checkAchievements(user.uid, {
        currentStreak,
        totalDreams: dreams.length,
        lucidDreams,
        completedLessons: completedLessons.length,
      });

      if (newAchievements.length > 0) {
        setAchievementQueue(newAchievements);
        setAchievementModal({
          visible: true,
          achievement: newAchievements[0],
        });
      }
    } catch (error) {
      console.error("Error checking achievements:", error);
    }
  };

  const onRefresh = async () => {
    hapticFeedback.light();
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleCloseAchievement = () => {
    const remaining = achievementQueue.slice(1);
    setAchievementQueue(remaining);

    if (remaining.length > 0) {
      setTimeout(() => {
        setAchievementModal({
          visible: true,
          achievement: remaining[0],
        });
      }, 300);
    } else {
      setAchievementModal({
        visible: false,
        achievement: null,
      });
    }
  };

  const handleActionPress = (action: string) => {
    hapticFeedback.light();
    navigation.navigate(action);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your dreams...</Text>
      </View>
    );
  }

  const lucidDreams = dreams.filter((d) => d.isLucid).length;
  const dreamEntries = dreams.map((d) => ({ createdAt: d.createdAt }));
  const currentStreak = calculateStreak(dreamEntries);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>
              Hello, {userData?.firstName}! 👋
            </Text>
            <Text style={styles.subtitle}>Ready to explore your dreams?</Text>
          </View>
        </View>

        {/* Level Progress Card */}
        <View style={styles.section}>
          <Card variant="highlighted" style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <Text style={styles.levelIcon}>
                {userData?.level ? getLevelTier(userData.level).icon : "😴"}
              </Text>
              <View style={styles.levelInfo}>
                <Text style={styles.levelTitle}>
                  {userData?.level
                    ? getLevelTier(userData.level).title
                    : "Beginner Dreamer"}
                </Text>
                <Text
                  style={[
                    styles.levelText,
                    {
                      color: userData?.level
                        ? getLevelTier(userData.level).color
                        : COLORS.textSecondary,
                    },
                  ]}
                >
                  Level {userData?.level || 1}
                </Text>
              </View>
            </View>

            {/* XP Progress Bar */}
            <View style={styles.xpContainer}>
              <View style={styles.xpBar}>
                <View
                  style={[
                    styles.xpProgress,
                    {
                      width: `${
                        userData?.xp
                          ? getProgressToNextLevel(userData.totalXP).percentage
                          : 0
                      }%`,
                      backgroundColor: userData?.level
                        ? getLevelTier(userData.level).color
                        : COLORS.textSecondary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.xpText}>
                {userData?.xp
                  ? getProgressToNextLevel(userData.totalXP).current
                  : 0}{" "}
                /{" "}
                {userData?.xp
                  ? getProgressToNextLevel(userData.totalXP).required
                  : 100}{" "}
                XP
              </Text>
            </View>
          </Card>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statNumber}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statIcon}>📖</Text>
            <Text style={styles.statNumber}>{dreams.length}</Text>
            <Text style={styles.statLabel}>Dreams</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statIcon}>✨</Text>
            <Text style={styles.statNumber}>{lucidDreams}</Text>
            <Text style={styles.statLabel}>Lucid</Text>
          </Card>
        </View>

        {/* Streak Motivation Banner */}
        {currentStreak > 0 && (
          <View style={styles.section}>
            <Card style={styles.motivationBanner}>
              <Text style={styles.motivationText}>
                {currentStreak < 7
                  ? `🔥 ${currentStreak} day streak! Keep it going!`
                  : currentStreak < 30
                  ? `⭐ Amazing ${currentStreak}-day streak!`
                  : `🏆 Incredible ${currentStreak}-day streak!`}
              </Text>
            </Card>
          </View>
        )}

        {/* Daily Lesson Card */}
        {nextLesson && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Lesson</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                hapticFeedback.light();
                navigation.navigate("Lesson", { lessonId: nextLesson.id });
              }}
            >
              <Card variant="highlighted">
                <View style={styles.lessonCard}>
                  <View style={styles.lessonIconCircle}>
                    <Ionicons name="book" size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.lessonContent}>
                    <Text style={styles.lessonTitle}>{nextLesson.title}</Text>
                    <Text style={styles.lessonDescription}>
                      {nextLesson.description}
                    </Text>
                    <Text style={styles.lessonDuration}>
                      ⏱️ {nextLesson.duration}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={COLORS.textTertiary}
                  />
                </View>
              </Card>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleActionPress("DreamJournal")}
            style={styles.actionWrapper}
          >
            <Card>
              <View style={styles.actionButton}>
                <Ionicons name="create" size={22} color={COLORS.primary} />
                <Text style={styles.actionText}>Log a Dream</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.textTertiary}
                />
              </View>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleActionPress("StreakCalendar")}
          >
            <Card>
              <View style={styles.actionButton}>
                <Ionicons name="calendar" size={22} color={COLORS.warning} />
                <Text style={styles.actionText}>View Streak Calendar</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.textTertiary}
                />
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <AchievementModal
        visible={achievementModal.visible}
        achievement={achievementModal.achievement}
        onClose={handleCloseAchievement}
      />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  greeting: {
    fontSize: TYPOGRAPHY.sizes.xxxl - 4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  // Level Card
  levelCard: {
    padding: SPACING.lg,
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  levelIcon: {
    fontSize: 32,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  levelText: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  xpContainer: {
    width: "100%",
  },
  xpBar: {
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    overflow: "hidden",
    marginBottom: SPACING.xs,
  },
  xpProgress: {
    height: "100%",
    borderRadius: RADIUS.sm,
  },
  xpText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: "right",
  },
  // Stats
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    padding: SPACING.md,
    alignItems: "center",
  },
  statIcon: {
    fontSize: 24,
    marginBottom: SPACING.sm,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  // Motivation Banner
  motivationBanner: {
    backgroundColor: "#1a3229",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    padding: SPACING.lg,
  },
  motivationText: {
    color: COLORS.success,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textAlign: "center",
  },
  // Lesson Card
  lessonCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  lessonIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  lessonDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  lessonDuration: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.primary,
  },
  // Actions
  actionWrapper: {
    marginBottom: SPACING.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  bottomSpacer: {
    height: SPACING.xxl,
  },
});
