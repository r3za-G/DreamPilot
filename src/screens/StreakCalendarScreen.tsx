import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useData } from "../contexts/DataContext";
import { calculateStreak } from "../utils/streakCalculator";
import { Ionicons } from "@expo/vector-icons";
import Card from "../components/Card";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";

type StreakCalendarScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function StreakCalendarScreen({
  navigation,
}: StreakCalendarScreenProps) {
  const { dreams, loading, isPremium } = useData();
  const [markedDates, setMarkedDates] = useState<any>({});
  const [stats, setStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalDays: 0,
  });

  useEffect(() => {
    if (dreams.length > 0) {
      calculateCalendarData();
    }
  }, [dreams, isPremium]);

  const calculateCalendarData = () => {
    const marked: any = {};
    const dreamDates = new Set<string>();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filteredDreams = isPremium
      ? dreams
      : dreams.filter((d) => new Date(d.createdAt) >= thirtyDaysAgo);

    filteredDreams.forEach((dream) => {
      const date = new Date(dream.createdAt).toISOString().split("T")[0];
      dreamDates.add(date);

      marked[date] = {
        marked: true,
        dotColor: dream.isLucid ? COLORS.secondary : COLORS.primary,
        customStyles: {
          container: {
            backgroundColor: dream.isLucid
              ? `${COLORS.secondary}20`
              : `${COLORS.primary}20`,
            borderRadius: 16,
          },
          text: {
            color: COLORS.textPrimary,
            fontWeight: "bold",
          },
        },
      };
    });

    const dreamEntries = dreams.map((d) => ({ createdAt: d.createdAt }));
    const currentStreak = calculateStreak(dreamEntries);
    const longestStreak = calculateLongestStreak(dreams);

    setMarkedDates(marked);
    setStats({
      currentStreak,
      longestStreak,
      totalDays: dreamDates.size,
    });
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
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Dream Streak Calendar</Text>
          <Text style={styles.subtitle}>
            {isPremium ? "Track your daily dream journaling" : "Last 30 days"}
          </Text>
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
                  <Ionicons
                    name="lock-closed"
                    size={24}
                    color={COLORS.primary}
                  />
                  <View style={styles.premiumBannerText}>
                    <Text style={styles.premiumBannerTitle}>
                      Unlock Full Calendar
                    </Text>
                    <Text style={styles.premiumBannerSubtitle}>
                      Upgrade to see your entire dream history
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

        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Ionicons name="flame" size={32} color={COLORS.warning} />
            <Text style={styles.statNumber}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </Card>

          <Card style={styles.statCard}>
            <Ionicons name="trophy" size={32} color={COLORS.success} />
            <Text style={styles.statNumber}>{stats.longestStreak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </Card>

          <Card style={styles.statCard}>
            <Ionicons name="calendar" size={32} color={COLORS.primary} />
            <Text style={styles.statNumber}>{stats.totalDays}</Text>
            <Text style={styles.statLabel}>
              {isPremium ? "Total Days" : "Last 30 Days"}
            </Text>
          </Card>
        </View>

        <Card style={styles.calendarContainer}>
          <Calendar
            markedDates={markedDates}
            markingType="custom"
            maxDate={new Date().toISOString().split("T")[0]}
            minDate={
              isPremium
                ? undefined
                : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0]
            }
            theme={{
              calendarBackground: COLORS.backgroundSecondary,
              textSectionTitleColor: COLORS.textSecondary,
              selectedDayBackgroundColor: COLORS.primary,
              selectedDayTextColor: COLORS.textPrimary,
              todayTextColor: COLORS.warning,
              dayTextColor: COLORS.textPrimary,
              textDisabledColor: COLORS.border,
              monthTextColor: COLORS.textPrimary,
              textMonthFontWeight: "bold",
              textDayFontSize: 14,
              textMonthFontSize: 18,
              arrowColor: COLORS.primary,
            }}
            style={styles.calendar}
          />
        </Card>

        {!isPremium && (
          <View style={styles.limitHint}>
            <Ionicons
              name="lock-closed"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.limitHintText}>
              Showing last 30 days only • Upgrade for full history
            </Text>
          </View>
        )}

        <Card style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: COLORS.primary }]}
              />
              <Text style={styles.legendText}>Regular Dream</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: COLORS.secondary },
                ]}
              />
              <Text style={styles.legendText}>Lucid Dream</Text>
            </View>
          </View>
        </Card>
        {stats.currentStreak > 0 && (
          <Card style={styles.motivationCard}>
            <Ionicons
              name={
                stats.currentStreak >= 30
                  ? "trophy"
                  : stats.currentStreak >= 7
                  ? "star"
                  : "flame"
              }
              size={48}
              color={COLORS.success}
              style={{ marginBottom: SPACING.sm }}
            />
            <Text style={styles.motivationTitle}>
              {stats.currentStreak >= 30
                ? "Incredible Dedication!"
                : stats.currentStreak >= 7
                ? "Amazing Streak!"
                : "Keep it going!"}
            </Text>
            <Text style={styles.motivationText}>
              {stats.currentStreak >= 30
                ? `${stats.currentStreak} days straight! You're a dream master!`
                : stats.currentStreak >= 7
                ? `${stats.currentStreak} days in a row! You're building a strong habit!`
                : `${stats.currentStreak} day streak! Log another dream tomorrow to keep it alive!`}
            </Text>
          </Card>
        )}

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
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
  },
  premiumBannerWrapper: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  premiumBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
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
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    padding: SPACING.lg,
    alignItems: "center",
  },
  statNumber: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  calendarContainer: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    padding: SPACING.sm,
  },
  calendar: {
    borderRadius: RADIUS.md,
  },
  limitHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  limitHintText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  legendContainer: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  legendTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  legendItems: {
    gap: SPACING.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
  },
  motivationCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    backgroundColor: "#1a3229",
    padding: SPACING.lg,
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  motivationTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.success,
    marginBottom: SPACING.sm,
  },
  motivationText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    height: SPACING.xxxl,
  },
});
