import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { getUserDreamPatterns } from '../services/dreamAnalysisService';

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

const { width } = Dimensions.get('window');

export default function InsightsScreen({ navigation }: InsightsScreenProps) {
  const lastLoadTime = useRef<number>(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [patterns, setPatterns] = useState<DreamPattern>({
    totalDreams: 0,
    lucidDreams: 0,
    lucidPercentage: 0,
    topTags: [],
    mostActiveDayOfWeek: { day: 'N/A', count: 0 },
    averageDreamsPerWeek: 0,
    longestLucidStreak: 0,
    dreamsByMonth: [],
  });

  const [aiPatterns, setAiPatterns] = useState<{
    topDreamSigns: Array<{ sign: string; count: number }>;
    topThemes: Array<{ theme: string; count: number }>;
    topEmotions: Array<{ emotion: string; count: number }>;
  }>({
    topDreamSigns: [],
    topThemes: [],
    topEmotions: [],
  });

  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      const timeSinceLastLoad = now - lastLoadTime.current;
      
      if (lastLoadTime.current === 0 || timeSinceLastLoad > 2000) {
        lastLoadTime.current = now;
        loadAllData();
      }
    }, [])
  );

  const loadAllData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    await Promise.all([
      analyzeDreamPatterns(),
      loadAIPatterns(user.uid),
    ]);
  };

  const loadAIPatterns = async (userId: string) => {
    try {
      const patterns = await getUserDreamPatterns(userId);
      setAiPatterns(patterns);
    } catch (error) {
      console.error('Error loading AI patterns:', error);
    }
  };

  const analyzeDreamPatterns = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const dreamsQuery = query(
        collection(db, 'dreams'),
        where('userId', '==', user.uid)
      );

      const querySnapshot = await getDocs(dreamsQuery);
      const dreams: any[] = [];

      querySnapshot.forEach((doc) => {
        dreams.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      if (dreams.length === 0) {
        setInitialLoading(false);
        return;
      }

      // Calculate patterns
      const totalDreams = dreams.length;
      const lucidDreams = dreams.filter(d => d.isLucid).length;
      const lucidPercentage = Math.round((lucidDreams / totalDreams) * 100);

      // Top tags analysis
      const tagCounts: { [key: string]: number } = {};
      dreams.forEach(dream => {
        dream.tags?.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      const topTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Day of week analysis
      const dayCounts: { [key: string]: number } = {};
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      dreams.forEach(dream => {
        const day = dayNames[new Date(dream.createdAt).getDay()];
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });
      const mostActiveDayOfWeek = Object.entries(dayCounts)
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => b.count - a.count)[0] || { day: 'N/A', count: 0 };

      // Average dreams per week
      const sortedDates = dreams
        .map(d => new Date(d.createdAt).getTime())
        .sort((a, b) => a - b);
      const firstDream = sortedDates[0];
      const lastDream = sortedDates[sortedDates.length - 1];
      const daysBetween = (lastDream - firstDream) / (1000 * 60 * 60 * 24);
      const weeksBetween = Math.max(daysBetween / 7, 1);
      const averageDreamsPerWeek = Math.round((totalDreams / weeksBetween) * 10) / 10;

      // Longest lucid streak
      const lucidDates = dreams
        .filter(d => d.isLucid)
        .map(d => new Date(d.createdAt).toDateString())
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      let longestLucidStreak = 0;
      let currentStreak = 0;
      for (let i = 0; i < lucidDates.length; i++) {
        if (i === 0) {
          currentStreak = 1;
        } else {
          const prevDate = new Date(lucidDates[i - 1]);
          const currDate = new Date(lucidDates[i]);
          const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
          } else {
            longestLucidStreak = Math.max(longestLucidStreak, currentStreak);
            currentStreak = 1;
          }
        }
      }
      longestLucidStreak = Math.max(longestLucidStreak, currentStreak);

      // Dreams by month (last 6 months)
      const monthCounts: { [key: string]: { total: number; lucid: number } } = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      dreams.forEach(dream => {
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
    } catch (error) {
      console.error('Error analyzing patterns:', error);
    } finally {
      if (initialLoading) {
        setInitialLoading(false);
      }
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (patterns.totalDreams === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>No Data Yet</Text>
        <Text style={styles.emptyText}>
          Start logging dreams to see your patterns and insights!
        </Text>
      </View>
    );
  }

  const maxMonthCount = Math.max(...patterns.dreamsByMonth.map(m => m.count), 1);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dream Insights</Text>
          <Text style={styles.subtitle}>Discover patterns in your dreams</Text>
        </View>

        {/* Overview Cards */}
        <View style={styles.overviewSection}>
          <View style={styles.overviewCard}>
            <Ionicons name="bar-chart" size={28} color="#6366f1" />
            <Text style={styles.overviewNumber}>{patterns.lucidPercentage}%</Text>
            <Text style={styles.overviewLabel}>Lucid Rate</Text>
          </View>

          <View style={styles.overviewCard}>
            <Ionicons name="calendar" size={28} color="#10b981" />
            <Text style={styles.overviewNumber}>{patterns.averageDreamsPerWeek}</Text>
            <Text style={styles.overviewLabel}>Dreams/Week</Text>
          </View>

          <View style={styles.overviewCard}>
            <Ionicons name="flame" size={28} color="#f59e0b" />
            <Text style={styles.overviewNumber}>{patterns.longestLucidStreak}</Text>
            <Text style={styles.overviewLabel}>Best Streak</Text>
          </View>
        </View>

        {/* AI Dream Signs Section - NEW! */}
        {aiPatterns.topDreamSigns.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Your Personal Dream Signs</Text>
            <View style={styles.insightCard}>
              <Text style={styles.dreamSignDescription}>
                AI detected these unusual elements in your dreams - perfect for reality checks!
              </Text>
              {aiPatterns.topDreamSigns.slice(0, 5).map((item, index) => (
                <View key={item.sign} style={styles.dreamSignRow}>
                  <View style={styles.dreamSignBadge}>
                    <Text style={styles.dreamSignIcon}>✨</Text>
                  </View>
                  <View style={styles.dreamSignInfo}>
                    <Text style={styles.dreamSignName}>{item.sign}</Text>
                    <View style={styles.dreamSignBar}>
                      <View 
                        style={[
                          styles.dreamSignBarFill, 
                          { width: `${(item.count / aiPatterns.topDreamSigns[0].count) * 100}%` }
                        ]} 
                      />
                    </View>
                  </View>
                  <Text style={styles.dreamSignCount}>×{item.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Emotional Patterns - NEW! */}
        {aiPatterns.topEmotions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💭 Emotional Patterns</Text>
            <View style={styles.insightCard}>
              <View style={styles.emotionGrid}>
                {aiPatterns.topEmotions.map((item) => (
                  <View key={item.emotion} style={styles.emotionChip}>
                    <Text style={styles.emotionName}>{item.emotion}</Text>
                    <Text style={styles.emotionCount}>{item.count}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* AI Themes - NEW! */}
        {aiPatterns.topThemes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎨 AI-Detected Themes</Text>
            <View style={styles.insightCard}>
              <View style={styles.themesContainer}>
                {aiPatterns.topThemes.map((item, index) => (
                  <View key={item.theme} style={styles.themeRow}>
                    <View style={styles.themeIconContainer}>
                      <Text style={styles.themeIcon}>🌟</Text>
                    </View>
                    <View style={styles.themeInfo}>
                      <Text style={styles.themeName}>{item.theme}</Text>
                      <Text style={styles.themeCount}>Appeared {item.count} times</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Most Active Day */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Most Active Day</Text>
          <View style={styles.insightCard}>
            <View style={styles.insightContent}>
              <Text style={styles.insightValue}>{patterns.mostActiveDayOfWeek.day}</Text>
              <Text style={styles.insightDescription}>
                You log {patterns.mostActiveDayOfWeek.count} dreams on {patterns.mostActiveDayOfWeek.day}s
              </Text>
            </View>
          </View>
        </View>

        {/* Top Dream Tags */}
        {patterns.topTags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏷️ Common Dream Tags</Text>
            <View style={styles.insightCard}>
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
                          { width: `${(item.count / patterns.topTags[0].count) * 100}%` }
                        ]} 
                      />
                    </View>
                  </View>
                  <Text style={styles.tagCount}>{item.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Dreams Over Time */}
        {patterns.dreamsByMonth.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📈 Dream Activity</Text>
            <View style={styles.insightCard}>
              <View style={styles.chartContainer}>
                {patterns.dreamsByMonth.map((month, index) => {
                  const barHeight = (month.count / maxMonthCount) * 100;
                  const lucidBarHeight = (month.lucidCount / maxMonthCount) * 100;
                  
                  return (
                    <View key={index} style={styles.chartBar}>
                      <View style={styles.chartColumn}>
                        <View 
                          style={[
                            styles.chartBarTotal,
                            { height: `${Math.max(barHeight, 5)}%` }
                          ]} 
                        />
                        {month.lucidCount > 0 && (
                          <View 
                            style={[
                              styles.chartBarLucid,
                              { height: `${Math.max(lucidBarHeight, 3)}%` }
                            ]} 
                          />
                        )}
                      </View>
                      <Text style={styles.chartLabel} numberOfLines={1}>
                        {month.month.split(' ')[0]}
                      </Text>
                      <Text style={styles.chartValue}>{month.count}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#6366f1' }]} />
                  <Text style={styles.legendText}>Total Dreams</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#a855f7' }]} />
                  <Text style={styles.legendText}>Lucid Dreams</Text>
                </View>
              </View>
            </View>
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
    backgroundColor: '#0f0f23',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  overviewSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 10,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  insightCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  insightContent: {
    alignItems: 'center',
  },
  insightValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 8,
  },
  insightDescription: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  // Dream Signs Styles - NEW
  dreamSignDescription: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 16,
    lineHeight: 18,
  },
  dreamSignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  dreamSignBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dreamSignIcon: {
    fontSize: 18,
  },
  dreamSignInfo: {
    flex: 1,
    marginRight: 12,
  },
  dreamSignName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  dreamSignBar: {
    height: 6,
    backgroundColor: '#0f0f23',
    borderRadius: 3,
    overflow: 'hidden',
  },
  dreamSignBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  dreamSignCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6366f1',
    minWidth: 36,
    textAlign: 'right',
  },
  // Emotion Styles - NEW
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emotionChip: {
    backgroundColor: '#0f0f23',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#a855f7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emotionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a855f7',
    textTransform: 'capitalize',
  },
  emotionCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  // Theme Styles - NEW
  themesContainer: {
    gap: 12,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
    borderRadius: 10,
    padding: 12,
  },
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  themeIcon: {
    fontSize: 20,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 3,
    textTransform: 'capitalize',
  },
  themeCount: {
    fontSize: 12,
    color: '#888',
  },
  // Existing Tag Styles
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tagRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tagRankText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tagInfo: {
    flex: 1,
    marginRight: 12,
  },
  tagName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  tagBar: {
    height: 6,
    backgroundColor: '#0f0f23',
    borderRadius: 3,
    overflow: 'hidden',
  },
  tagBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  tagCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
    minWidth: 30,
    textAlign: 'right',
  },
  // Chart Styles
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    marginBottom: 20,
    paddingTop: 10,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartColumn: {
    width: '80%',
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  chartBarTotal: {
    width: '100%',
    backgroundColor: '#6366f1',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 8,
    position: 'absolute',
    bottom: 0,
  },
  chartBarLucid: {
    width: '100%',
    backgroundColor: '#a855f7',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 5,
    position: 'absolute',
    bottom: 0,
    zIndex: 1,
  },
  chartLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 8,
    fontWeight: '600',
  },
  chartValue: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#888',
  },
  footer: {
    height: 40,
  },
});
