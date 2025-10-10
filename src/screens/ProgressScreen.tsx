import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { ACHIEVEMENTS } from '../data/achievements';
import { calculateStreak } from '../utils/streakCalculator';
import { getUserXP } from '../utils/xpManager';
import { calculateLevel, getLevelTier } from '../data/levels';

type ProgressScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ProgressScreen({ navigation }: ProgressScreenProps) {
  const lastLoadTime = useRef<number>(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDreams: 0,
    lucidDreams: 0,
    currentStreak: 0,
    longestStreak: 0,
    achievementsUnlocked: 0,
    level: 1,
    xp: 0,
    tier: { title: 'Beginner Dreamer', icon: '😴', color: '#6b7280' },
  });

  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      const timeSinceLastLoad = now - lastLoadTime.current;
      
      if (lastLoadTime.current === 0 || timeSinceLastLoad > 2000) {
        lastLoadTime.current = now;
        loadProgressData();
      }
    }, [])
  );

  const loadProgressData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Load achievements
      const achievementsDoc = await getDoc(doc(db, 'users', user.uid, 'data', 'achievements'));
      const achievementData = achievementsDoc.exists() ? achievementsDoc.data() : {};
      const achievementsUnlocked = achievementData?.achievements?.length || 0;

      // Load dreams data
      const dreamsQuery = query(
        collection(db, 'dreams'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(dreamsQuery);
      let totalDreams = 0;
      let lucidDreams = 0;
      const dreamEntries: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const dreamData = doc.data();
        totalDreams++;
        if (dreamData.isLucid) {
          lucidDreams++;
        }
        dreamEntries.push({
          createdAt: dreamData.createdAt,
        });
      });
      
      const currentStreak = calculateStreak(dreamEntries);
      const longestStreak = calculateLongestStreak(dreamEntries);

      // Load level data
      const xp = await getUserXP(user.uid);
      const level = calculateLevel(xp);
      const tier = getLevelTier(level);

      setStats({
        totalDreams,
        lucidDreams,
        currentStreak,
        longestStreak,
        achievementsUnlocked,
        level,
        xp,
        tier,
      });
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      if (initialLoading) {
        setInitialLoading(false);
      }
    }
  };

  const calculateLongestStreak = (dreams: any[]): number => {
    if (dreams.length === 0) return 0;

    const sortedDates = dreams
      .map(d => new Date(d.createdAt).toDateString())
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    let longest = 1;
    let current = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        current++;
        longest = Math.max(longest, current);
      } else if (diffDays > 1) {
        current = 1;
      }
    }

    return longest;
  };

  const lucidPercentage = stats.totalDreams > 0
    ? Math.round((stats.lucidDreams / stats.totalDreams) * 100)
    : 0;

  const achievementProgress = Math.round((stats.achievementsUnlocked / ACHIEVEMENTS.length) * 100);

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Level Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Progress</Text>
          <View style={[styles.levelCard, { borderColor: stats.tier.color }]}>
            <Text style={styles.levelIcon}>{stats.tier.icon}</Text>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>{stats.tier.title}</Text>
              <Text style={[styles.levelText, { color: stats.tier.color }]}>
                Level {stats.level}
              </Text>
            </View>
            <View style={styles.xpInfo}>
              <Text style={styles.xpNumber}>{stats.xp}</Text>
              <Text style={styles.xpLabel}>XP</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Dream Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.totalDreams}</Text>
              <Text style={styles.statLabel}>Total Dreams</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#a855f7' }]}>
                {stats.lucidDreams}
              </Text>
              <Text style={styles.statLabel}>Lucid Dreams</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
                {lucidPercentage}%
              </Text>
              <Text style={styles.statLabel}>Lucid Rate</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#10b981' }]}>
                {stats.currentStreak}
              </Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#ef4444' }]}>
                {stats.longestStreak}
              </Text>
              <Text style={styles.statLabel}>Longest Streak</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#3b82f6' }]}>
                {stats.xp}
              </Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
          </View>
        </View>
        {/* Achievements Section */}
        <TouchableOpacity 
          style={styles.achievementsSection}
          onPress={() => navigation.navigate('Achievements')}
        >
          <View style={styles.achievementsHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </View>
          
          <View style={styles.achievementProgress}>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementCount}>
                {stats.achievementsUnlocked}/{ACHIEVEMENTS.length}
              </Text>
              <Text style={styles.achievementLabel}>Unlocked</Text>
            </View>
            
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercentage}>{achievementProgress}%</Text>
            </View>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${achievementProgress}%` }]} />
          </View>

          <Text style={styles.viewAllText}>Tap to view all achievements →</Text>
        </TouchableOpacity>

        {/* Dream Insights Section - NEW */}
        <TouchableOpacity 
          style={styles.insightsSection}
          onPress={() => navigation.navigate('Insights')}
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
    backgroundColor: '#0f0f23',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  levelCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#aaa',
    marginBottom: 4,
  },
  levelText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  xpInfo: {
    alignItems: 'flex-end',
  },
  xpNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  xpLabel: {
    fontSize: 12,
    color: '#888',
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    width: '31%',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
  },
  achievementsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  achievementProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  achievementLabel: {
    fontSize: 14,
    color: '#888',
  },
  progressCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#f59e0b',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#0f0f23',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 4,
  },
  viewAllText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
  footer: {
    height: 40,
  },
  insightsSection: {
  marginHorizontal: 20,
  marginBottom: 20,
  backgroundColor: '#1a1a2e',
  borderRadius: 16,
  padding: 20,
  borderWidth: 1,
  borderColor: '#a855f7',
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  insightsDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 16,
    lineHeight: 20,
  },
  insightsFeatures: {
    flexDirection: 'row',
    gap: 12,
  },
  insightFeature: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
  },
  insightFeatureText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },

});
