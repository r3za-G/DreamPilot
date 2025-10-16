import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { ACHIEVEMENTS } from "../data/achievements";
import { calculateStreak } from "../utils/streakCalculator";
import { getLevelTier } from "../data/levels";
import { useData } from "../contexts/DataContext";
import Card from "../components/Card";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EmptyState from "../components/EmptyState";
import { SkeletonAchievementCard } from "../components/SkeletonLoader";

type ProgressScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ProgressScreen({ navigation }: ProgressScreenProps) {
  const { userData, dreams, loading, refreshData } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [achievementsUnlocked, setAchievementsUnlocked] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!loading && userData) {
      loadAchievements();
    }
  }, [loading, userData]);

  const loadAchievements = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const achievementsDoc = await getDoc(
        doc(db, "users", user.uid, "data", "achievements")
      );
      const achievementData = achievementsDoc.exists()
        ? achievementsDoc.data()
        : {};
      setAchievementsUnlocked(achievementData?.achievements?.length || 0);
    } catch (error) {
      console.error("Error loading achievements:", error);
    }
  };

  const onRefresh = async () => {
    hapticFeedback.light();
    setRefreshing(true);
    await refreshData();
    await loadAchievements();
    setRefreshing(false);
  };

  const calculateLongestStreak = (dreamsList: any[]): number => {
    if (dreamsList.length === 0) return 0;

    const sortedDates = dreamsList
      .map((d) => new Date(d.createdAt).toDateString())
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    let longest = 1;
    let current = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);

      const diffDays = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        current++;
        longest = Math.max(longest, current);
      } else if (diffDays > 1) {
        current = 1;
      }
    }

    return longest;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  const totalDreams = dreams.length;
  const lucidDreams = dreams.filter((d) => d.isLucid).length;
  const dreamEntries = dreams.map((d) => ({ createdAt: d.createdAt }));
  const currentStreak = calculateStreak(dreamEntries);
  const longestStreak = calculateLongestStreak(dreams);
  const lucidPercentage =
    totalDreams > 0 ? Math.round((lucidDreams / totalDreams) * 100) : 0;
  const achievementProgress = Math.round(
    (achievementsUnlocked / ACHIEVEMENTS.length) * 100
  );

  const tier = userData?.level
    ? getLevelTier(userData.level)
    : { title: "Beginner Dreamer", icon: "😴", color: COLORS.textTertiary };

  // ✅ Check if we have enough data for insights (at least 3 dreams)
  const hasEnoughDataForInsights = totalDreams >= 3;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
            <Text style={styles.title}>Your Progress</Text>
            <Card variant="highlighted" style={{ borderColor: tier.color }}>
              <View style={styles.levelCardContent}>
                <View
                  style={[styles.levelBadge, { backgroundColor: tier.color }]}
                >
                  <Text style={styles.levelBadgeText}>
                    {userData?.level || 1}
                  </Text>
                </View>
                <View style={styles.levelInfo}>
                  <Text style={styles.levelTitle}>{tier.title}</Text>
                  <Text style={[styles.levelText, { color: tier.color }]}>
                    Level {userData?.level || 1}
                  </Text>
                </View>
                <View style={styles.xpInfo}>
                  <Text style={styles.xpNumber}>{userData?.totalXP || 0}</Text>
                  <Text style={styles.xpLabel}>XP</Text>
                </View>
              </View>
            </Card>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Dream Statistics</Text>

            <View style={styles.statsGrid}>
              <Card style={styles.statBox}>
                <Text style={styles.statNumber}>{totalDreams}</Text>
                <Text style={styles.statLabel}>Total Dreams</Text>
              </Card>

              <Card style={styles.statBox}>
                <Text style={[styles.statNumber, { color: COLORS.secondary }]}>
                  {lucidDreams}
                </Text>
                <Text style={styles.statLabel}>Lucid Dreams</Text>
              </Card>

              <Card style={styles.statBox}>
                <Text style={[styles.statNumber, { color: COLORS.warning }]}>
                  {lucidPercentage}%
                </Text>
                <Text style={styles.statLabel}>Lucid Rate</Text>
              </Card>

              <Card style={styles.statBox}>
                <Text style={[styles.statNumber, { color: COLORS.success }]}>
                  {currentStreak}
                </Text>
                <Text style={styles.statLabel}>Current Streak</Text>
              </Card>

              <Card style={styles.statBox}>
                <Text style={[styles.statNumber, { color: COLORS.error }]}>
                  {longestStreak}
                </Text>
                <Text style={styles.statLabel}>Longest Streak</Text>
              </Card>

              <Card style={styles.statBox}>
                <Text style={[styles.statNumber, { color: "#3b82f6" }]}>
                  {userData?.totalXP || 0}
                </Text>
                <Text style={styles.statLabel}>Total XP</Text>
              </Card>
            </View>
          </View>

          {/* ✅ Achievements Section - With EmptyState */}
          <View style={styles.achievementsWrapper}>
            {achievementsUnlocked === 0 ? (
              <Card>
                <View style={styles.achievementsHeader}>
                  <Text style={styles.sectionTitle}>Achievements</Text>
                </View>
                <View style={styles.emptyStateContainer}>
                  <Ionicons
                    name="trophy-outline"
                    size={48}
                    color={COLORS.warning}
                    style={{ marginBottom: SPACING.md }}
                  />
                  <Text style={styles.emptyStateTitle}>
                    No achievements yet
                  </Text>

                  <Text style={styles.emptyStateText}>
                    Start logging dreams and completing lessons to unlock
                    achievements!
                  </Text>
                  <View style={styles.emptyStateActions}>
                    <TouchableOpacity
                      style={styles.emptyStateButton}
                      onPress={() => {
                        hapticFeedback.light();
                        navigation.navigate("DreamJournal");
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.emptyStateButtonText}>
                        Log a Dream
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.emptyStateButton,
                        styles.emptyStateButtonSecondary,
                      ]}
                      onPress={() => {
                        hapticFeedback.light();
                        navigation.navigate("Achievements");
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.emptyStateButtonTextSecondary}>
                        View All
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  navigation.navigate("Achievements");
                }}
                activeOpacity={0.7}
              >
                <Card>
                  <View style={styles.achievementsHeader}>
                    <Text style={styles.sectionTitle}>Achievements</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={COLORS.textSecondary}
                    />
                  </View>

                  <View style={styles.achievementProgress}>
                    <View style={styles.achievementInfo}>
                      <Text style={styles.achievementCount}>
                        {achievementsUnlocked}/{ACHIEVEMENTS.length}
                      </Text>
                      <Text style={styles.achievementLabel}>Unlocked</Text>
                    </View>

                    <View style={styles.progressCircle}>
                      <Text style={styles.progressPercentage}>
                        {achievementProgress}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${achievementProgress}%` },
                      ]}
                    />
                  </View>

                  <Text style={styles.viewAllText}>
                    Tap to view all achievements →
                  </Text>
                </Card>
              </TouchableOpacity>
            )}
          </View>

          {/* ✅ Dream Insights Section - With EmptyState */}
          <View style={styles.insightsWrapper}>
            {!hasEnoughDataForInsights ? (
              <Card
                variant="highlighted"
                style={{ borderColor: COLORS.secondary }}
              >
                <View style={styles.insightsHeader}>
                  <Ionicons
                    name="analytics"
                    size={24}
                    color={COLORS.secondary}
                  />
                  <Text style={styles.sectionTitle}>Dream Insights</Text>
                </View>
                <View style={styles.emptyStateContainer}>
                  <Ionicons
                    name="bar-chart-outline"
                    size={48}
                    color={COLORS.secondary}
                    style={{ marginBottom: SPACING.md }}
                  />
                  <Text style={styles.emptyStateTitle}>
                    Not enough data yet
                  </Text>

                  <Text style={styles.emptyStateText}>
                    You need at least 3 dreams to generate insights. You have{" "}
                    {totalDreams} {totalDreams === 1 ? "dream" : "dreams"} so
                    far.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => {
                      hapticFeedback.light();
                      navigation.navigate("DreamJournal");
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emptyStateButtonText}>
                      Log More Dreams
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  navigation.navigate("Insights");
                }}
                activeOpacity={0.7}
              >
                <Card
                  variant="highlighted"
                  style={{ borderColor: COLORS.secondary }}
                >
                  <View style={styles.insightsHeader}>
                    <Ionicons
                      name="analytics"
                      size={24}
                      color={COLORS.secondary}
                    />
                    <Text style={styles.sectionTitle}>Dream Insights</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={COLORS.textSecondary}
                    />
                  </View>

                  <Text style={styles.insightsDescription}>
                    Discover patterns and trends in your dreams
                  </Text>

                  <View style={styles.insightsFeatures}>
                    <View style={styles.insightFeature}>
                      <Ionicons
                        name="trending-up"
                        size={18}
                        color={COLORS.primary}
                      />
                      <Text style={styles.insightFeatureText}>
                        Activity Trends
                      </Text>
                    </View>
                    <View style={styles.insightFeature}>
                      <Ionicons
                        name="pie-chart"
                        size={18}
                        color={COLORS.success}
                      />
                      <Text style={styles.insightFeatureText}>
                        Common Themes
                      </Text>
                    </View>
                    <View style={styles.insightFeature}>
                      <Ionicons
                        name="calendar"
                        size={18}
                        color={COLORS.warning}
                      />
                      <Text style={styles.insightFeatureText}>
                        Dream Patterns
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footer} />
        </ScrollView>
      </View>
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
    padding: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl - 4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  levelCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },

  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  levelText: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  xpInfo: {
    alignItems: "flex-end",
  },
  xpNumber: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
  },
  xpLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  statsSection: {
    padding: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },
  statBox: {
    width: "31%",
    padding: SPACING.md,
    alignItems: "center",
  },
  statNumber: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  achievementsWrapper: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  achievementsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  achievementProgress: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementCount: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.warning,
  },
  achievementLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
  },
  progressCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.warning,
  },
  progressPercentage: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.warning,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    overflow: "hidden",
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: "100%",
    backgroundColor: COLORS.warning,
    borderRadius: RADIUS.sm,
  },
  viewAllText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  insightsWrapper: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  insightsDescription: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  insightsFeatures: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  insightFeature: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    gap: SPACING.xs,
  },
  insightFeatureText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
    textAlign: "center",
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: SPACING.lg,
  },
  emptyStateTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  emptyStateActions: {
    flexDirection: "row",
    gap: SPACING.sm,
    width: "100%",
  },
  emptyStateButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl, // ✅ Increase horizontal padding (was probably md or lg)
    paddingVertical: SPACING.lg, // ✅ Increase vertical padding
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  emptyStateButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyStateButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  emptyStateButtonTextSecondary: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
  },
  footer: {
    height: SPACING.xxxl,
  },
  levelBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  levelBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.background,
  },
});
