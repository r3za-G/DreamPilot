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

type ProgressScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ProgressScreen({ navigation }: ProgressScreenProps) {
  const { userData, dreams, loading, refreshData } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [achievementsUnlocked, setAchievementsUnlocked] = useState(0);

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
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Calculate stats from cached data
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
    : { title: "Beginner Dreamer", icon: "😴", color: "#6b7280" };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
            colors={["#6366f1"]}
          />
        }
      >
        {/* Level Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Progress</Text>
          <View style={[styles.levelCard, { borderColor: tier.color }]}>
            <Text style={styles.levelIcon}>{tier.icon}</Text>
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
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Dream Statistics</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalDreams}</Text>
              <Text style={styles.statLabel}>Total Dreams</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: "#a855f7" }]}>
                {lucidDreams}
              </Text>
              <Text style={styles.statLabel}>Lucid Dreams</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: "#f59e0b" }]}>
                {lucidPercentage}%
              </Text>
              <Text style={styles.statLabel}>Lucid Rate</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: "#10b981" }]}>
                {currentStreak}
              </Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: "#ef4444" }]}>
                {longestStreak}
              </Text>
              <Text style={styles.statLabel}>Longest Streak</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: "#3b82f6" }]}>
                {userData?.totalXP || 0}
              </Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
          </View>
        </View>

        {/* Achievements Section */}
        <TouchableOpacity
          style={styles.achievementsSection}
          onPress={() => navigation.navigate("Achievements")}
        >
          <View style={styles.achievementsHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" />
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
              style={[styles.progressBar, { width: `${achievementProgress}%` }]}
            />
          </View>

          <Text style={styles.viewAllText}>Tap to view all achievements →</Text>
        </TouchableOpacity>

        {/* Dream Insights Section */}
        <TouchableOpacity
          style={styles.insightsSection}
          onPress={() => navigation.navigate("Insights")}
        >
          <View style={styles.insightsHeader}>
            <Ionicons name="analytics" size={24} color="#a855f7" />
            <Text style={styles.sectionTitle}>Dream Insights</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </View>

          <Text style={styles.insightsDescription}>
            Discover patterns and trends in your dreams
          </Text>

          <View style={styles.insightsFeatures}>
            <View style={styles.insightFeature}>
              <Ionicons name="trending-up" size={18} color="#6366f1" />
              <Text style={styles.insightFeatureText}>Activity Trends</Text>
            </View>
            <View style={styles.insightFeature}>
              <Ionicons name="pie-chart" size={18} color="#10b981" />
              <Text style={styles.insightFeatureText}>Common Themes</Text>
            </View>
            <View style={styles.insightFeature}>
              <Ionicons name="calendar" size={18} color="#f59e0b" />
              <Text style={styles.insightFeatureText}>Dream Patterns</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0f0f23",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  levelCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    gap: 15,
  },
  levelIcon: {
    fontSize: 48,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 4,
  },
  levelText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  xpInfo: {
    alignItems: "flex-end",
  },
  xpNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6366f1",
  },
  xpLabel: {
    fontSize: 12,
    color: "#888",
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statBox: {
    width: "31%",
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6366f1",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 11,
    color: "#888",
    textAlign: "center",
  },
  achievementsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  achievementsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  achievementProgress: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementCount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#f59e0b",
  },
  achievementLabel: {
    fontSize: 14,
    color: "#888",
  },
  progressCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#0f0f23",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#f59e0b",
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f59e0b",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#0f0f23",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#f59e0b",
    borderRadius: 4,
  },
  viewAllText: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
  },
  footer: {
    height: 40,
  },
  insightsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#a855f7",
  },
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  insightsDescription: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 16,
    lineHeight: 20,
  },
  insightsFeatures: {
    flexDirection: "row",
    gap: 12,
  },
  insightFeature: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f0f23",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
  },
  insightFeatureText: {
    fontSize: 11,
    color: "#888",
    fontWeight: "500",
  },
});
