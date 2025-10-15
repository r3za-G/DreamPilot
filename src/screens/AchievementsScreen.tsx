import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ACHIEVEMENTS } from "../data/achievements";
import { useFocusEffect } from "@react-navigation/native";
import Card from "../components/Card";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";
import EmptyState from "../components/EmptyState";
import { SkeletonAchievementCard } from "../components/SkeletonLoader";

type AchievementsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type DisplayAchievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
};

export default function AchievementsScreen({
  navigation,
}: AchievementsScreenProps) {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<DisplayAchievement[]>([]);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");

  useFocusEffect(
    React.useCallback(() => {
      loadAchievements();
    }, [])
  );

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        console.log("No user logged in!");
        return;
      }

      const achievementsDoc = await getDoc(
        doc(db, "users", user.uid, "data", "achievements")
      );

      if (!achievementsDoc.exists()) {
        setAchievements(
          ACHIEVEMENTS.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            icon: a.icon,
            unlocked: false,
            rarity: a.rarity,
          }))
        );
        setLoading(false);
        return;
      }

      const achievementData = achievementsDoc.data();
      const unlockedAchievements = achievementData?.achievements || [];

      const achievementsWithStatus: DisplayAchievement[] = ACHIEVEMENTS.map(
        (achievement) => {
          const unlockedData = unlockedAchievements.find(
            (a: any) => a.id === achievement.id
          );

          const unlocked = !!unlockedData;

          return {
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            unlocked,
            unlockedAt: unlockedData?.unlockedAt,
            rarity: achievement.rarity,
          };
        }
      );

      setAchievements(achievementsWithStatus);
    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAchievements = () => {
    switch (filter) {
      case "unlocked":
        return achievements.filter((a) => a.unlocked);
      case "locked":
        return achievements.filter((a) => !a.unlocked);
      default:
        return achievements;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return COLORS.textTertiary;
      case "rare":
        return "#3b82f6";
      case "epic":
        return COLORS.secondary;
      case "legendary":
        return COLORS.warning;
      default:
        return COLORS.textTertiary;
    }
  };

  const getRarityLabel = (rarity: string) => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const progress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  // ✅ SKELETON LOADER - While loading
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Card variant="highlighted">
            <View style={styles.statsContent}>
              <Text style={styles.statsLabel}>Loading achievements...</Text>
            </View>
          </Card>
        </View>
        <View style={styles.achievementsGrid}>
          <SkeletonAchievementCard />
          <SkeletonAchievementCard />
          <SkeletonAchievementCard />
          <SkeletonAchievementCard />
          <SkeletonAchievementCard />
          <SkeletonAchievementCard />
        </View>
      </View>
    );
  }

  const filteredAchievements = getFilteredAchievements();

  // ✅ EMPTY STATE - No achievements unlocked with "unlocked" filter
  if (filter === "unlocked" && filteredAchievements.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Card variant="highlighted">
            <View style={styles.statsContent}>
              <Text style={styles.statsNumber}>
                {unlockedCount}/{totalCount}
              </Text>
              <Text style={styles.statsLabel}>Achievements Unlocked</Text>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>
                {progress.toFixed(0)}% Complete
              </Text>
            </View>
          </Card>
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
            <Text style={styles.filterText}>All ({totalCount})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, styles.filterTabActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, styles.filterTextActive]}>
              Unlocked ({unlockedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab]}
            onPress={() => {
              hapticFeedback.light();
              setFilter("locked");
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.filterText}>
              Locked ({totalCount - unlockedCount})
            </Text>
          </TouchableOpacity>
        </View>

        <EmptyState
          emoji="🏆"
          title="No achievements unlocked yet"
          description="Start logging dreams and completing lessons to unlock achievements! Each achievement brings you closer to mastering lucid dreaming."
          actionLabel="Log a Dream"
          onAction={() => navigation.navigate("DreamJournal")}
          secondaryActionLabel="Browse Lessons"
          onSecondaryAction={() =>
            navigation.navigate("MainTabs", { screen: "Learn" })
          }
        />
      </View>
    );
  }

  // ✅ Normal content with achievements
  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.header}>
        <Card variant="highlighted">
          <View style={styles.statsContent}>
            <Text style={styles.statsNumber}>
              {unlockedCount}/{totalCount}
            </Text>
            <Text style={styles.statsLabel}>Achievements Unlocked</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {progress.toFixed(0)}% Complete
            </Text>
          </View>
        </Card>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === "all" && styles.filterTabActive]}
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
            All ({totalCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === "unlocked" && styles.filterTabActive,
          ]}
          onPress={() => {
            hapticFeedback.light();
            setFilter("unlocked");
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterText,
              filter === "unlocked" && styles.filterTextActive,
            ]}
          >
            Unlocked ({unlockedCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === "locked" && styles.filterTabActive,
          ]}
          onPress={() => {
            hapticFeedback.light();
            setFilter("locked");
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterText,
              filter === "locked" && styles.filterTextActive,
            ]}
          >
            Locked ({totalCount - unlockedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Achievements Grid */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.achievementsGrid}>
          {filteredAchievements.map((achievement) => (
            <Card
              key={achievement.id}
              style={{
                ...styles.achievementCard,
                ...(!achievement.unlocked && styles.achievementCardLocked),
                borderColor: achievement.unlocked
                  ? getRarityColor(achievement.rarity)
                  : COLORS.border,
                borderWidth: 2,
              }}
            >
              <View style={styles.achievementIconContainer}>
                <Text
                  style={[
                    styles.achievementIcon,
                    !achievement.unlocked && styles.achievementIconLocked,
                  ]}
                >
                  {achievement.icon}
                </Text>
                {achievement.unlocked && (
                  <View style={styles.checkBadge}>
                    <MaterialCommunityIcons
                      name="check"
                      size={12}
                      color={COLORS.textPrimary}
                    />
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.achievementName,
                  !achievement.unlocked && styles.achievementNameLocked,
                ]}
              >
                {achievement.title}
              </Text>

              <Text style={styles.achievementDescription} numberOfLines={2}>
                {achievement.description}
              </Text>

              {achievement.unlocked ? (
                <>
                  <View
                    style={[
                      styles.rarityBadge,
                      { backgroundColor: getRarityColor(achievement.rarity) },
                    ]}
                  >
                    <Text style={styles.rarityText}>
                      {getRarityLabel(achievement.rarity)}
                    </Text>
                  </View>
                  {achievement.unlockedAt && (
                    <Text style={styles.unlockedDate}>
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </Text>
                  )}
                </>
              ) : (
                <View style={styles.lockedBadge}>
                  <Text style={styles.lockedText}>🔒 Locked</Text>
                </View>
              )}
            </Card>
          ))}
        </View>

        <View style={styles.footer} />
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
  header: {
    padding: SPACING.xl,
  },
  statsContent: {
    alignItems: "center",
  },
  statsNumber: {
    fontSize: 48,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  statsLabel: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.sm,
    overflow: "hidden",
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
  },
  progressText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.md,
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
  scrollView: {
    flex: 1,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  achievementCard: {
    width: "48%",
    padding: SPACING.md,
    alignItems: "center",
  },
  achievementCardLocked: {
    opacity: 0.6,
  },
  achievementIconContainer: {
    position: "relative",
    marginBottom: SPACING.md,
  },
  achievementIcon: {
    fontSize: 36,
  },
  achievementIconLocked: {
    opacity: 0.4,
  },
  checkBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.success,
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  achievementName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  achievementNameLocked: {
    color: COLORS.textTertiary,
  },
  achievementDescription: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.sm,
    lineHeight: 14,
  },
  rarityBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs / 2,
  },
  rarityText: {
    fontSize: TYPOGRAPHY.sizes.xs - 2,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.bold,
    textTransform: "uppercase",
  },
  lockedBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.border,
  },
  lockedText: {
    fontSize: TYPOGRAPHY.sizes.xs - 2,
    color: COLORS.textTertiary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  unlockedDate: {
    fontSize: TYPOGRAPHY.sizes.xs - 2,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: SPACING.xxxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  footer: {
    height: SPACING.xxxl,
  },
});
