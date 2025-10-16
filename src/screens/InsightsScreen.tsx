import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useData } from "../contexts/DataContext";
import Card from "../components/Card";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";

type InsightsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type DreamPattern = {
  totalDreams: number;
  lucidDreams: number;
  lucidPercentage: number;
  topTags: { tag: string; count: number }[];
  mostActiveDayOfWeek: { day: string; count: number };
  averageDreamsPerWeek: number;
  longestLucidStreak: number;
  dreamsByMonth: { month: string; count: number; lucidCount: number }[];
};

export default function InsightsScreen({ navigation }: InsightsScreenProps) {
  const { dreams, dreamPatterns, loading, refreshData, isPremium } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [patterns, setPatterns] = useState<DreamPattern>({
    totalDreams: 0,
    lucidDreams: 0,
    lucidPercentage: 0,
    topTags: [],
    mostActiveDayOfWeek: { day: "N/A", count: 0 },
    averageDreamsPerWeek: 0,
    longestLucidStreak: 0,
    dreamsByMonth: [],
  });

  useEffect(() => {
    if (!loading && dreams.length >= 0) {
      analyzeDreamPatterns();
    }
  }, [dreams, loading]);

  const onRefresh = async () => {
    hapticFeedback.light();
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const analyzeDreamPatterns = () => {
    if (dreams.length === 0) {
      return;
    }

    const totalDreams = dreams.length;
    const lucidDreams = dreams.filter((d) => d.isLucid).length;
    const lucidPercentage = Math.round((lucidDreams / totalDreams) * 100);

    const tagCounts: { [key: string]: number } = {};
    dreams.forEach((dream) => {
      dream.tags?.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const dayCounts: { [key: string]: number } = {};
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    dreams.forEach((dream) => {
      const day = dayNames[new Date(dream.createdAt).getDay()];
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const mostActiveDayOfWeek = Object.entries(dayCounts)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => b.count - a.count)[0] || { day: "N/A", count: 0 };

    const sortedDates = dreams
      .map((d) => new Date(d.createdAt).getTime())
      .sort((a, b) => a - b);
    const firstDream = sortedDates[0];
    const lastDream = sortedDates[sortedDates.length - 1];
    const daysBetween = (lastDream - firstDream) / (1000 * 60 * 60 * 24);
    const weeksBetween = Math.max(daysBetween / 7, 1);
    const averageDreamsPerWeek =
      Math.round((totalDreams / weeksBetween) * 10) / 10;

    const lucidDates = dreams
      .filter((d) => d.isLucid)
      .map((d) => new Date(d.createdAt).toDateString())
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    let longestLucidStreak = 0;
    let currentStreak = 0;
    for (let i = 0; i < lucidDates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevDate = new Date(lucidDates[i - 1]);
        const currDate = new Date(lucidDates[i]);
        const diffDays = Math.floor(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          currentStreak++;
        } else {
          longestLucidStreak = Math.max(longestLucidStreak, currentStreak);
          currentStreak = 1;
        }
      }
    }
    longestLucidStreak = Math.max(longestLucidStreak, currentStreak);

    const monthCounts: { [key: string]: { total: number; lucid: number } } = {};
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    dreams.forEach((dream) => {
      const date = new Date(dream.createdAt);
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

      if (!monthCounts[monthKey]) {
        monthCounts[monthKey] = { total: 0, lucid: 0 };
      }
      monthCounts[monthKey].total++;
      if (dream.isLucid) {
        monthCounts[monthKey].lucid++;
      }
    });

    const dreamsByMonth = Object.entries(monthCounts)
      .map(([month, counts]) => ({
        month,
        count: counts.total,
        lucidCount: counts.lucid,
      }))
      .slice(-6);

    setPatterns({
      totalDreams,
      lucidDreams,
      lucidPercentage,
      topTags,
      mostActiveDayOfWeek,
      averageDreamsPerWeek,
      longestLucidStreak,
      dreamsByMonth,
    });
  };

  const renderPremiumLockedSection = (title: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity
        style={styles.lockedCard}
        onPress={() => {
          hapticFeedback.light();
          navigation.navigate("Paywall");
        }}
        activeOpacity={0.8}
      >
        <View style={styles.lockedContent}>
          <Ionicons name="lock-closed" size={40} color={COLORS.primary} />
          <Text style={styles.lockedTitle}>Premium Feature</Text>
          <Text style={styles.lockedDescription}>
            Unlock AI-powered insights to discover patterns in your dreams
          </Text>
          <View style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={COLORS.textPrimary}
            />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading insights...</Text>
      </View>
    );
  }

  if (patterns.totalDreams === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="bar-chart-outline"
          size={64}
          color={COLORS.textSecondary}
        />
        <Text style={styles.emptyTitle}>No Data Yet</Text>
        <Text style={styles.emptyText}>
          Start logging dreams to see your patterns and insights!
        </Text>
      </View>
    );
  }

  const maxMonthCount = Math.max(
    ...patterns.dreamsByMonth.map((m) => m.count),
    1
  );

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
        <View style={styles.header}>
          <Text style={styles.title}>Dream Insights</Text>
          <Text style={styles.subtitle}>Discover patterns in your dreams</Text>
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
                  <View style={styles.premiumBannerText}>
                    <Text style={styles.premiumBannerTitle}>
                      Unlock AI Insights
                    </Text>
                    <Text style={styles.premiumBannerSubtitle}>
                      Get dream signs, emotional patterns & themes
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

        <View style={styles.overviewSection}>
          <Card style={styles.overviewCard}>
            <Ionicons name="bar-chart" size={28} color={COLORS.primary} />
            <Text style={styles.overviewNumber}>
              {patterns.lucidPercentage}%
            </Text>
            <Text style={styles.overviewLabel}>Lucid Rate</Text>
          </Card>

          <Card style={styles.overviewCard}>
            <Ionicons name="calendar" size={28} color={COLORS.success} />
            <Text style={styles.overviewNumber}>
              {patterns.averageDreamsPerWeek}
            </Text>
            <Text style={styles.overviewLabel}>Dreams/Week</Text>
          </Card>

          <Card style={styles.overviewCard}>
            <Ionicons name="flame" size={28} color={COLORS.warning} />
            <Text style={styles.overviewNumber}>
              {patterns.longestLucidStreak}
            </Text>
            <Text style={styles.overviewLabel}>Best Streak</Text>
          </Card>
        </View>

        {!isPremium
          ? renderPremiumLockedSection("Dream Signs")
          : dreamPatterns.topDreamSigns.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Your Personal Dream Signs
                </Text>
                <Card>
                  <Text style={styles.dreamSignDescription}>
                    AI detected these unusual elements in your dreams - perfect
                    for reality checks!
                  </Text>
                  {dreamPatterns.topDreamSigns
                    .slice(0, 5)
                    .map((item: { sign: string; count: number }) => (
                      <View key={item.sign} style={styles.dreamSignRow}>
                        <View style={styles.dreamSignBadge}></View>
                        <View style={styles.dreamSignInfo}>
                          <Text style={styles.dreamSignName}>{item.sign}</Text>
                          <View style={styles.dreamSignBar}>
                            <View
                              style={[
                                styles.dreamSignBarFill,
                                {
                                  width: `${
                                    (item.count /
                                      dreamPatterns.topDreamSigns[0].count) *
                                    100
                                  }%`,
                                },
                              ]}
                            />
                          </View>
                        </View>
                        <Text style={styles.dreamSignCount}>×{item.count}</Text>
                      </View>
                    ))}
                </Card>
              </View>
            )}

        {!isPremium
          ? renderPremiumLockedSection("Emotional Patterns")
          : dreamPatterns.topEmotions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Emotional Patterns</Text>
                <Card>
                  <View style={styles.emotionGrid}>
                    {dreamPatterns.topEmotions.map(
                      (item: { emotion: string; count: number }) => (
                        <View key={item.emotion} style={styles.emotionChip}>
                          <Text style={styles.emotionName}>{item.emotion}</Text>
                          <Text style={styles.emotionCount}>{item.count}</Text>
                        </View>
                      )
                    )}
                  </View>
                </Card>
              </View>
            )}

        {!isPremium
          ? renderPremiumLockedSection("Common Themes")
          : dreamPatterns.topThemes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Common Themes</Text>
                <Card>
                  <View style={styles.themesContainer}>
                    {dreamPatterns.topThemes.map(
                      (item: { theme: string; count: number }) => (
                        <View key={item.theme} style={styles.themeRow}>
                          <View style={styles.themeIconContainer}></View>
                          <View style={styles.themeInfo}>
                            <Text style={styles.themeName}>{item.theme}</Text>
                            <Text style={styles.themeCount}>
                              Appeared {item.count} times
                            </Text>
                          </View>
                        </View>
                      )
                    )}
                  </View>
                </Card>
              </View>
            )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most Active Day</Text>
          <Card>
            <View style={styles.insightContent}>
              <Text style={styles.insightValue}>
                {patterns.mostActiveDayOfWeek.day}
              </Text>
              <Text style={styles.insightDescription}>
                You log {patterns.mostActiveDayOfWeek.count} dreams on{" "}
                {patterns.mostActiveDayOfWeek.day}s
              </Text>
            </View>
          </Card>
        </View>

        {patterns.topTags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Common Tags</Text>
            <Card>
              {patterns.topTags.map((item, index) => (
                <View key={item.tag} style={styles.tagRow}>
                  <View style={styles.tagRank}>
                    <Text style={styles.tagRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.tagInfo}>
                    <Text style={styles.tagName}>{item.tag}</Text>
                    <View style={styles.tagBar}>
                      <View
                        style={[
                          styles.tagBarFill,
                          {
                            width: `${
                              (item.count / patterns.topTags[0].count) * 100
                            }%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.tagCount}>{item.count}</Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        {patterns.dreamsByMonth.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dream Activity</Text>
            <Card>
              <View style={styles.chartContainer}>
                {patterns.dreamsByMonth.map((month, index) => {
                  const barHeight = (month.count / maxMonthCount) * 100;
                  const lucidBarHeight =
                    (month.lucidCount / maxMonthCount) * 100;

                  return (
                    <View key={index} style={styles.chartBar}>
                      <View style={styles.chartColumn}>
                        <View
                          style={[
                            styles.chartBarTotal,
                            { height: `${Math.max(barHeight, 5)}%` },
                          ]}
                        />
                        {month.lucidCount > 0 && (
                          <View
                            style={[
                              styles.chartBarLucid,
                              { height: `${Math.max(lucidBarHeight, 3)}%` },
                            ]}
                          />
                        )}
                      </View>
                      <Text style={styles.chartLabel} numberOfLines={1}>
                        {month.month.split(" ")[0]}
                      </Text>
                      <Text style={styles.chartValue}>{month.count}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: COLORS.primary },
                    ]}
                  />
                  <Text style={styles.legendText}>Total Dreams</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: COLORS.secondary },
                    ]}
                  />
                  <Text style={styles.legendText}>Lucid Dreams</Text>
                </View>
              </View>
            </Card>
          </View>
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
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xxxl + 10,
    gap: SPACING.lg, // ✅ Add gap
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
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
    paddingHorizontal: SPACING.xl,
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
  lockedCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.md,
    padding: SPACING.xxxl + 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
  },
  lockedContent: {
    alignItems: "center",
  },
  lockedTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  lockedDescription: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  upgradeButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    gap: SPACING.sm,
  },
  upgradeButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  overviewSection: {
    flexDirection: "row",
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  overviewCard: {
    flex: 1,
    padding: SPACING.lg,
    alignItems: "center",
  },
  overviewNumber: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  overviewLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  insightContent: {
    alignItems: "center",
  },
  insightValue: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  insightDescription: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  dreamSignDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 18,
  },
  dreamSignRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  dreamSignBadge: {
    width: 8, // ✅ Make it a simple color indicator
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.md,
  },

  dreamSignIcon: {
    fontSize: 18,
  },
  dreamSignInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  dreamSignName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textTransform: "capitalize",
  },
  dreamSignBar: {
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    overflow: "hidden",
  },
  dreamSignBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
  },
  dreamSignCount: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    minWidth: 36,
    textAlign: "right",
  },
  emotionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  emotionChip: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.round,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  emotionName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.secondary,
    textTransform: "capitalize",
  },
  emotionCount: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textTertiary,
  },
  themesContainer: {
    gap: SPACING.md,
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
  },
  themeIconContainer: {
    width: 8, // ✅ Thin color bar
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.secondary,
    marginRight: SPACING.md,
  },
  themeIcon: {
    fontSize: 20,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
    textTransform: "capitalize",
  },
  themeCount: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  tagRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  tagRankText: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.bold,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  tagInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  tagName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  tagBar: {
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    overflow: "hidden",
  },
  tagBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
  },
  tagCount: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    minWidth: 30,
    textAlign: "right",
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 150,
    marginBottom: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  chartBar: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  chartColumn: {
    width: "80%",
    height: 120,
    justifyContent: "flex-end",
    alignItems: "center",
    position: "relative",
  },
  chartBarTotal: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: RADIUS.sm,
    borderTopRightRadius: RADIUS.sm,
    minHeight: 8,
    position: "absolute",
    bottom: 0,
  },
  chartBarLucid: {
    width: "100%",
    backgroundColor: COLORS.secondary,
    borderTopLeftRadius: RADIUS.sm,
    borderTopRightRadius: RADIUS.sm,
    minHeight: 5,
    position: "absolute",
    bottom: 0,
    zIndex: 1,
  },
  chartLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  chartValue: {
    fontSize: TYPOGRAPHY.sizes.xs - 2,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs / 2,
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  footer: {
    height: SPACING.xxxl,
  },
});
