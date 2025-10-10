import React, { useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { ACHIEVEMENTS } from '../data/achievements';
import { calculateStreak } from '../utils/streakCalculator';
import { getUserXP } from '../utils/xpManager';
import { calculateLevel, getLevelTier } from '../data/levels';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const lastLoadTime = useRef<number>(0);
  const [initialLoading, setInitialLoading] = useState(true); // NEW: separate initial loading
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    joinedDate: '',
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
      
      // Always load on first visit or after 2 seconds
      if (lastLoadTime.current === 0 || timeSinceLastLoad > 2000) {
        console.log('Loading profile data');
        lastLoadTime.current = now;
        loadProfileData();
      } else {
        console.log('Skipping reload - too soon');
      }
    }, [])
  );

  const loadProfileData = async () => {
    try {
      // Only show loading spinner on first load
      const isFirstLoad = lastLoadTime.current === Date.now();
      
      const user = auth.currentUser;
      if (!user) return;

      // Load user data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

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

      setUserProfile({
        name: userData?.name || 'Dreamer',
        email: user.email || '',
        joinedDate: userData?.createdAt || new Date().toISOString(),
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
      console.error('Error loading profile:', error);
    } finally {
      // Only turn off initial loading after first load
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

  const lucidPercentage = userProfile.totalDreams > 0
    ? Math.round((userProfile.lucidDreams / userProfile.totalDreams) * 100)
    : 0;

  const achievementProgress = Math.round((userProfile.achievementsUnlocked / ACHIEVEMENTS.length) * 100);

  // Only show loading screen on initial load
  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarIcon}>🌙</Text>
          </View>
          <Text style={styles.userName}>{userProfile.name}</Text>
          <Text style={styles.userEmail}>{userProfile.email}</Text>
          
          {/* Level Badge */}
          <View style={[styles.levelBadge, { borderColor: userProfile.tier.color }]}>
            <Text style={styles.levelIcon}>{userProfile.tier.icon}</Text>
            <Text style={styles.levelTitle}>{userProfile.tier.title}</Text>
            <Text style={[styles.levelText, { color: userProfile.tier.color }]}>
              Level {userProfile.level}
            </Text>
          </View>

          <Text style={styles.joinedText}>
            Member since {new Date(userProfile.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Dream Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{userProfile.totalDreams}</Text>
              <Text style={styles.statLabel}>Total Dreams</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#a855f7' }]}>
                {userProfile.lucidDreams}
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
                {userProfile.currentStreak}
              </Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#ef4444' }]}>
                {userProfile.longestStreak}
              </Text>
              <Text style={styles.statLabel}>Longest Streak</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#3b82f6' }]}>
                {userProfile.xp}
              </Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
          </View>
        </View>

        {/* Achievements Progress */}
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
                {userProfile.achievementsUnlocked}/{ACHIEVEMENTS.length}
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
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('DreamHistory')}
          >
            <Ionicons name="book" size={24} color="#6366f1" />
            <Text style={styles.actionText}>View Dream History</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings" size={24} color="#888" />
            <Text style={styles.actionText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

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
    alignItems: 'center',
    padding: 30,
    paddingTop: 40,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#6366f1',
  },
  avatarIcon: {
    fontSize: 48,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 15,
    borderWidth: 2,
    gap: 10,
  },
  levelIcon: {
    fontSize: 24,
  },
  levelTitle: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '500',
  },
  levelText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  joinedText: {
    fontSize: 12,
    color: '#666',
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
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 4,
  },
  actionsSection: {
    padding: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 15,
  },
  footer: {
    height: 40,
  },
});
