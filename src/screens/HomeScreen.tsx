import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LESSONS, Lesson } from "../data/lessons";
import { calculateStreak } from "../utils/streakCalculator";
import { checkAchievements } from "../utils/achievementChecker";
import AchievementModal from "../components/AchievementModal";
import { Achievement } from "../data/achievements";
import { Ionicons } from "@expo/vector-icons";
import { useData } from "../contexts/DataContext";
import { getProgressToNextLevel } from "../data/levels";
import { auth } from "../../firebaseConfig";
import Card from "../components/Card";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import CircularProgressLevel from "../components/CircularProgressLevel";
import DailyGoals from "../components/DailyGoals";
import LevelUpModal from "../components/LevelUpModal";
import { useRoute } from "@react-navigation/native";

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const {
    userData,
    dreams,
    completedLessons,
    loading,
    refreshData,
    refreshLessons,
    isPremium,
    refreshUserData,
  } = useData();
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
  const insets = useSafeAreaInsets();
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const route = useRoute<any>();

  useFocusEffect(
    React.useCallback(() => {
      // Check for level up params
      if (route.params?.showLevelUp && route.params?.newLevel) {
        setNewLevel(route.params.newLevel);
        setShowLevelUpModal(true);

        // Clear params so it doesn't show again
        navigation.setParams({
          showLevelUp: undefined,
          newLevel: undefined,
        });
      }
    }, [route.params])
  );

  useFocusEffect(
    React.useCallback(() => {
      refreshLessons();
    }, [])
  );

  useEffect(() => {
    if (!loading && userData && dreams.length >= 0) {
      checkForAchievements();
    }
  }, [loading, userData, dreams, completedLessons]);

  useEffect(() => {
    const firstIncomplete = LESSONS.find((lesson, index) => {
      const isCompleted = completedLessons.includes(lesson.id);
      const isPremiumLesson = index >= 5;

      // ✅ Skip if completed
      if (isCompleted) return false;

      // ✅ Skip if premium lesson and user is not premium
      if (isPremiumLesson && !isPremium) return false;

      // ✅ This is the next lesson to show
      return true;
    });

    setNextLesson(firstIncomplete || null);
  }, [completedLessons, isPremium]); // ✅ Add isPremium to dependencies

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
        <View style={styles.hero}>
          <Image
            source={require("../../assets/app_icons/icon.png")}
            style={styles.mascot}
          />
          <Text style={styles.heroGreeting}>Hello, {userData?.firstName}!</Text>
          <Text style={styles.heroSubtitle}>Ready to dream?</Text>
        </View>
        <View style={styles.section}>
          <Card style={styles.progressCard}>
            <CircularProgressLevel
              level={userData?.level || 1}
              currentXP={
                userData?.xp
                  ? getProgressToNextLevel(userData.totalXP).current
                  : 0
              }
              requiredXP={
                userData?.xp
                  ? getProgressToNextLevel(userData.totalXP).required
                  : 100
              }
              percentage={
                userData?.xp
                  ? getProgressToNextLevel(userData.totalXP).percentage
                  : 0
              }
            />
          </Card>
        </View>

        <View style={styles.statsGrid}>
          <Card style={styles.statCardStreak}>
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={styles.statNumber}>{currentStreak}</Text>
          </Card>
          <Card style={styles.statCardDreams}>
            <Text style={styles.statLabel}>Dreams</Text>
            <Text style={styles.statNumber}>{dreams.length}</Text>
          </Card>
          <Card style={styles.statCardLucid}>
            <Text style={styles.statLabel}>Lucid</Text>
            <Text style={styles.statNumber}>{lucidDreams}</Text>
          </Card>
        </View>
        {/* Daily Goals */}
        <View style={styles.section}>
          <DailyGoals
            goals={[
              {
                id: "1",
                text: "Log a dream",
                completed:
                  dreams.length > 0 &&
                  new Date(dreams[0].createdAt).toDateString() ===
                    new Date().toDateString(),
                icon: "book-outline",
              },
              {
                id: "2",
                text: "Maintain your streak",
                completed: currentStreak > 0,
                icon: "flame-outline",
              },
              {
                id: "3",
                text: "Complete a lesson",
                completed: completedLessons.length > 0,
                icon: "school-outline",
              },
            ]}
          />
        </View>

        {/* ✅ CLEANED: Today's Lesson - Simpler design */}
        {nextLesson && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Continue Learning</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                hapticFeedback.light();
                navigation.navigate("Lesson", { lessonId: nextLesson.id });
              }}
            >
              <Card variant="highlighted" style={styles.lessonCard}>
                <View style={styles.lessonContent}>
                  <Text style={styles.lessonTitle}>{nextLesson.title}</Text>
                  <Text style={styles.lessonDescription}>
                    {nextLesson.description}
                  </Text>
                  <View style={styles.lessonMeta}>
                    <Text style={styles.lessonDuration}>
                      {nextLesson.duration}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={COLORS.primary}
                />
              </Card>
            </TouchableOpacity>
          </View>
        )}

        {/* ✅ CLEANED: All lessons completed */}
        {!nextLesson && completedLessons.length > 0 && (
          <View style={styles.section}>
            <Card style={styles.completedCard}>
              <Text style={styles.completedTitle}>All Lessons Complete!</Text>
              <Text style={styles.completedText}>
                You've mastered the basics of lucid dreaming
              </Text>
            </Card>
          </View>
        )}

        {/* ✅ CLEANED: Quick Actions - Text only, no icons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleActionPress("DreamJournal")}
            style={styles.actionWrapper}
          >
            <Card style={styles.actionCard}>
              <Text style={styles.actionText}>Log a Dream</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textTertiary}
              />
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleActionPress("StreakCalendar")}
          >
            <Card style={styles.actionCard}>
              <Text style={styles.actionText}>View Calendar</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textTertiary}
              />
            </Card>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <AchievementModal
        visible={achievementModal.visible}
        achievement={achievementModal.achievement}
        onClose={handleCloseAchievement}
      />
      <LevelUpModal
        visible={showLevelUpModal}
        level={newLevel}
        onClose={async () => {
          setShowLevelUpModal(false);
          hapticFeedback.success();
          await refreshUserData();
        }}
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

  // ✅ NEW: Hero Section
  hero: {
    alignItems: "center",
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  mascot: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: SPACING.lg,
  },
  heroGreeting: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
  },

  // ✅ CLEANED: Streak Card
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },

  // ✅ CLEANED: Progress Card
  progressCard: {
    padding: SPACING.lg,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  levelNumber: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
  },
  levelBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  levelBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.background,
  },
  xpContainer: {
    width: "100%",
  },
  xpBar: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    overflow: "hidden",
    marginBottom: SPACING.xs,
  },
  xpProgress: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
  },
  xpText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: "right",
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  lessonCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
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
  lessonMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  lessonDuration: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
  },

  // ✅ Completed Card
  completedCard: {
    padding: SPACING.lg,
    backgroundColor: "#1a2f3a",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  completedTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.success,
    marginBottom: SPACING.xs,
  },
  completedText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
  },

  actionWrapper: {
    marginBottom: SPACING.sm,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.lg,
  },
  actionText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },

  bottomSpacer: {
    height: SPACING.xxxl,
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    padding: SPACING.lg,
    borderLeftWidth: 4,
  },
  statCardStreak: {
    flex: 1,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9600",
  },
  statCardDreams: {
    flex: 1,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  statCardLucid: {
    flex: 1,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: "#CE82FF",
  },
});
