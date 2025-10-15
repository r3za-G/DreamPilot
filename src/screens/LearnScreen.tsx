import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LESSONS } from "../data/lessons";
import { Ionicons } from "@expo/vector-icons";
import { useData } from "../contexts/DataContext";
import Card from "../components/Card";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "../components/EmptyState";
import { SkeletonLessonCard } from "../components/SkeletonLoader";
import { useFocusEffect } from "@react-navigation/native";

type LearnScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function LearnScreen({ navigation }: LearnScreenProps) {
  const { completedLessons, refreshLessons, isPremium, loading } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "completed" | "incomplete">(
    "all"
  );

  useFocusEffect(
    React.useCallback(() => {
      refreshLessons();
    }, [])
  );

  const onRefresh = async () => {
    hapticFeedback.light();
    setRefreshing(true);
    await refreshLessons();
    setRefreshing(false);
  };

  const completedCount = completedLessons.length;
  const totalLessons = LESSONS.length;
  const progressPercentage = Math.round((completedCount / totalLessons) * 100);

  const handleLessonPress = (lesson: any, index: number) => {
    const isPremiumLesson = index >= 5;

    if (isPremiumLesson && !isPremium) {
      hapticFeedback.warning();
      Alert.alert(
        "🔒 Premium Lesson",
        "This lesson is part of our Premium collection. Upgrade to unlock all 50+ expert lessons!",
        [
          { text: "Maybe Later", style: "cancel" },
          {
            text: "Upgrade to Premium",
            onPress: () => navigation.navigate("Paywall"),
            style: "default",
          },
        ]
      );
      return;
    }

    hapticFeedback.light();
    navigation.navigate("Lesson", { lessonId: lesson.id });
  };

  // Get filtered lessons
  const getFilteredLessons = () => {
    if (filter === "completed") {
      return LESSONS.filter((lesson) => completedLessons.includes(lesson.id));
    } else if (filter === "incomplete") {
      // Only show lessons that are incomplete AND unlocked
      return LESSONS.filter((lesson, idx) => {
        const isCompleted = completedLessons.includes(lesson.id);
        // First lesson is always unlocked
        if (idx === 0) return !isCompleted;
        // Unlocked if previous lesson is completed
        const prevLessonId = LESSONS[idx - 1].id;
        const isPrevCompleted = completedLessons.includes(prevLessonId);
        return !isCompleted && isPrevCompleted;
      });
    }
    return LESSONS;
  };

  const filteredLessons = getFilteredLessons();

  // ✅ SKELETON LOADER - While loading
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.container}>
          <ScrollView style={styles.scrollView}>
            <View style={styles.header}>
              <Text style={styles.title}>Learn Lucid Dreaming</Text>
              <Text style={styles.subtitle}>
                Master the techniques to control your dreams
              </Text>
            </View>
            <View style={styles.lessonsSection}>
              <SkeletonLessonCard />
              <SkeletonLessonCard />
              <SkeletonLessonCard />
              <SkeletonLessonCard />
              <SkeletonLessonCard />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ EMPTY STATE - All lessons completed!
  if (filter === "incomplete" && filteredLessons.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.container}>
          <ScrollView style={styles.scrollView}>
            <View style={styles.header}>
              <Text style={styles.title}>Learn Lucid Dreaming</Text>
            </View>

            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterTab]}
                onPress={() => {
                  hapticFeedback.light();
                  setFilter("all");
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.filterText}>All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTab]}
                onPress={() => {
                  hapticFeedback.light();
                  setFilter("completed");
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.filterText}>Completed</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTab, styles.filterTabActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, styles.filterTextActive]}>
                  Incomplete
                </Text>
              </TouchableOpacity>
            </View>

            <EmptyState
              emoji="🎓"
              title="All lessons completed!"
              description="Congratulations! You've finished all available lessons."
              actionLabel="View All Lessons"
              onAction={() => setFilter("all")} // ✅ This is correct (local state)
              secondaryActionLabel="Go to Journal"
              onSecondaryAction={() =>
                navigation.navigate("MainTabs", { screen: "Journal" })
              } // ✅ Fixed
            />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ EMPTY STATE - No completed lessons yet
  if (filter === "completed" && filteredLessons.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.container}>
          <ScrollView style={styles.scrollView}>
            <View style={styles.header}>
              <Text style={styles.title}>Learn Lucid Dreaming</Text>
            </View>

            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterTab]}
                onPress={() => {
                  hapticFeedback.light();
                  setFilter("all");
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.filterText}>All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTab, styles.filterTabActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, styles.filterTextActive]}>
                  Completed
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTab]}
                onPress={() => {
                  hapticFeedback.light();
                  setFilter("incomplete");
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.filterText}>Incomplete</Text>
              </TouchableOpacity>
            </View>

            <EmptyState
              emoji="📚"
              title="No lessons completed yet"
              description="Start your learning journey!"
              actionLabel="Browse All Lessons"
              onAction={() => setFilter("all")} // ✅ This is correct (local state)
            />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ Normal content with lessons
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
          <View style={styles.header}>
            <Text style={styles.title}>Learn Lucid Dreaming</Text>
            <Text style={styles.subtitle}>
              Master the techniques to control your dreams
            </Text>

            <Card variant="highlighted">
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>Your Progress</Text>
                <Text style={styles.progressCount}>
                  {completedCount} / {totalLessons} Lessons
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${progressPercentage}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressPercentage}>
                {progressPercentage}% Complete
              </Text>
            </Card>
          </View>

          {!isPremium && (
            <View style={styles.premiumBannerWrapper}>
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  navigation.navigate("Paywall");
                }}
                activeOpacity={0.7}
              >
                <Card variant="highlighted">
                  <View style={styles.premiumBannerContent}>
                    <Text style={styles.premiumBannerIcon}>⭐</Text>
                    <View style={styles.premiumBannerText}>
                      <Text style={styles.premiumBannerTitle}>
                        Unlock All Lessons
                      </Text>
                      <Text style={styles.premiumBannerSubtitle}>
                        Get access to 50+ expert lessons with Premium
                      </Text>
                    </View>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            </View>
          )}

          {/* ✅ Filter Tabs */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterTab,
                filter === "all" && styles.filterTabActive,
              ]}
              onPress={() => {
                hapticFeedback.light();
                setFilter("all");
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === "all" && styles.filterTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterTab,
                filter === "completed" && styles.filterTabActive,
              ]}
              onPress={() => {
                hapticFeedback.light();
                setFilter("completed");
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === "completed" && styles.filterTextActive,
                ]}
              >
                Completed
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterTab,
                filter === "incomplete" && styles.filterTabActive,
              ]}
              onPress={() => {
                hapticFeedback.light();
                setFilter("incomplete");
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === "incomplete" && styles.filterTextActive,
                ]}
              >
                Incomplete
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.lessonsSection}>
            {filteredLessons.map((lesson, index) => {
              const isCompleted = completedLessons.includes(lesson.id);
              const previousLessonId = index > 0 ? LESSONS[index - 1].id : null;
              const isPreviousCompleted = previousLessonId
                ? completedLessons.includes(previousLessonId)
                : true;
              const isSequentiallyLocked = index > 0 && !isPreviousCompleted;

              const isPremiumLesson = index >= 5;
              const isPremiumLocked = isPremiumLesson && !isPremium;

              const isLocked = isSequentiallyLocked || isPremiumLocked;

              return (
                <TouchableOpacity
                  key={lesson.id}
                  onPress={() => {
                    if (!isSequentiallyLocked) {
                      handleLessonPress(lesson, index);
                    }
                  }}
                  disabled={isSequentiallyLocked}
                  activeOpacity={0.7}
                  style={styles.lessonCardWrapper}
                >
                  <Card style={isLocked ? styles.lessonCardLocked : undefined}>
                    <View style={styles.lessonCardContent}>
                      <View style={styles.lessonIconContainer}>
                        <View
                          style={[
                            styles.lessonIcon,
                            isCompleted && styles.lessonIconCompleted,
                            isLocked && styles.lessonIconLocked,
                            isPremiumLocked && styles.lessonIconPremium,
                          ]}
                        >
                          {isCompleted ? (
                            <Ionicons
                              name="checkmark"
                              size={24}
                              color={COLORS.textPrimary}
                            />
                          ) : isPremiumLocked ? (
                            <Ionicons
                              name="star"
                              size={24}
                              color={COLORS.primary}
                            />
                          ) : isSequentiallyLocked ? (
                            <Ionicons
                              name="lock-closed"
                              size={24}
                              color={COLORS.textTertiary}
                            />
                          ) : (
                            <Text style={styles.lessonNumber}>{index + 1}</Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.lessonContent}>
                        <View style={styles.lessonTitleRow}>
                          <Text
                            style={[
                              styles.lessonTitle,
                              isLocked && styles.lessonTitleLocked,
                            ]}
                          >
                            {lesson.title}
                          </Text>
                          {isPremiumLesson && (
                            <View style={styles.premiumBadge}>
                              <Text style={styles.premiumBadgeText}>PRO</Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.lessonDescription,
                            isLocked && styles.lessonDescriptionLocked,
                          ]}
                        >
                          {isPremiumLocked
                            ? "Premium lesson - Upgrade to unlock"
                            : isSequentiallyLocked
                            ? "Complete the previous lesson to unlock"
                            : lesson.description}
                        </Text>
                        <View style={styles.lessonFooter}>
                          <Text style={styles.lessonDuration}>
                            ⏱️ {lesson.duration}
                          </Text>
                          {isCompleted && (
                            <View style={styles.completedBadge}>
                              <Text style={styles.completedText}>
                                Completed
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.footer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl - 4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxl,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
  },
  progressCount: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
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
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
  },
  progressPercentage: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: "right",
  },
  premiumBannerWrapper: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  premiumBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  premiumBannerIcon: {
    fontSize: 32,
  },
  premiumBannerText: {
    flex: 1,
  },
  premiumBannerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  premiumBannerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.textPrimary,
  },
  lessonsSection: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
  },
  lessonCardWrapper: {
    marginBottom: SPACING.lg,
  },
  lessonCardLocked: {
    opacity: 0.6,
  },
  lessonCardContent: {
    flexDirection: "row",
  },
  lessonIconContainer: {
    marginRight: SPACING.lg,
  },
  lessonIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  lessonIconCompleted: {
    backgroundColor: COLORS.success,
  },
  lessonIconLocked: {
    backgroundColor: COLORS.border,
  },
  lessonIconPremium: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  lessonNumber: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  lessonTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  lessonTitleLocked: {
    color: COLORS.textTertiary,
  },
  premiumBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.sm,
  },
  premiumBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs - 2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  lessonDescription: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  lessonDescriptionLocked: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textTertiary,
    fontStyle: "italic",
  },
  lessonFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lessonDuration: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.primary,
  },
  completedBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  completedText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  footer: {
    height: SPACING.xxxl,
  },
});
