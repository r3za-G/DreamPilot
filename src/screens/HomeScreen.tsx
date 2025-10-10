import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LESSONS } from '../data/lessons';
import { calculateStreak } from '../utils/streakCalculator';
import { checkAchievements } from '../utils/achievementChecker';
import AchievementModal from '../components/AchievementModal';
import { Achievement } from '../data/achievements';
import { getUserXP } from '../utils/xpManager';
import { calculateLevel, getLevelTier, getProgressToNextLevel } from '../data/levels';
import { Ionicons } from '@expo/vector-icons';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [userName, setUserName] = useState('');
  const [userStats, setUserStats] = useState({
    currentStreak: 0,
    totalDreams: 0,
    lucidDreams: 0,
  });
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [achievementModal, setAchievementModal] = useState<{
    visible: boolean;
    achievement: Achievement | null;
  }>({
    visible: false,
    achievement: null,
  });
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
  const [userLevel, setUserLevel] = useState({
    level: 1,
    xp: 0,
    tier: { title: 'Beginner Dreamer', icon: '😴', color: '#6b7280', minLevel: 1, maxLevel: 3 },
    progress: { current: 0, required: 100, percentage: 0 },
  });

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserLevel = async (userId: string) => {
    try {
      const xp = await getUserXP(userId);
      const level = calculateLevel(xp);
      const tier = getLevelTier(level);
      const progress = getProgressToNextLevel(xp);

      setUserLevel({
        level,
        xp,
        tier,
        progress,
      });
    } catch (error) {
      console.error('Error loading user level:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserName(data.name);
        }

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
        
        setUserStats({
          currentStreak,
          totalDreams,
          lucidDreams,
        });

        // Load next lesson
        const lessonCount = await loadNextLesson(user.uid);
        await loadUserLevel(user.uid);
        
        // Check achievements
        const newAchievements = await checkAchievements(
          user.uid,
          { currentStreak, totalDreams, lucidDreams, completedLessons: lessonCount }
        );

        if (newAchievements.length > 0) {
          setAchievementQueue(newAchievements);
          setAchievementModal({
            visible: true,
            achievement: newAchievements[0],
          });
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNextLesson = async (userId: string): Promise<number> => {
  try {
    let completedCount = 0;
    let foundNextLesson = false;
    
    for (const lesson of LESSONS) {
      const progressDoc = await getDoc(
        doc(db, 'users', userId, 'lessonProgress', `lesson_${lesson.id}`)
      );
      
      if (progressDoc.exists() && progressDoc.data().completed) {
        completedCount++;
      } else if (!foundNextLesson) {
        // This is the first uncompleted lesson - show this one
        setNextLesson(lesson);
        foundNextLesson = true;
        // Don't break - we still need to count completed lessons
      }
    }
    
    // If all lessons are completed, don't show any lesson
    if (completedCount === LESSONS.length) {
      setNextLesson(null);
    }
    
    return completedCount;
  } catch (error) {
    console.error('Error loading lessons:', error);
    return 0;
  }
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hello, {userName}! 👋</Text>
            <Text style={styles.subtitle}>Ready to explore your dreams?</Text>
          </View>
        </View>

        {/* Level Progress */}
        <View style={styles.levelSection}>
          <View style={[styles.levelCard, { borderColor: userLevel.tier.color }]}>
            <Text style={styles.levelIcon}>{userLevel.tier.icon}</Text>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>{userLevel.tier.title}</Text>
              <Text style={[styles.levelText, { color: userLevel.tier.color }]}>
                Level {userLevel.level}
              </Text>
            </View>
          </View>
          <View style={styles.xpContainer}>
            <View style={styles.xpBar}>
              <View 
                style={[
                  styles.xpProgress, 
                  { 
                    width: `${userLevel.progress.percentage}%`,
                    backgroundColor: userLevel.tier.color,
                  }
                ]} 
              />
            </View>
            <Text style={styles.xpText}>
              {userLevel.progress.current} / {userLevel.progress.required} XP
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statNumber}>{userStats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📖</Text>
            <Text style={styles.statNumber}>{userStats.totalDreams}</Text>
            <Text style={styles.statLabel}>Dreams</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>✨</Text>
            <Text style={styles.statNumber}>{userStats.lucidDreams}</Text>
            <Text style={styles.statLabel}>Lucid</Text>
          </View>
        </View>

        {/* Streak Motivation */}
        {userStats.currentStreak > 0 && (
          <View style={styles.motivationBanner}>
            <Text style={styles.motivationText}>
              {userStats.currentStreak < 7
                ? `🔥 ${userStats.currentStreak} day streak! Keep it going!`
                : userStats.currentStreak < 30
                ? `⭐ Amazing ${userStats.currentStreak}-day streak!`
                : `🏆 Incredible ${userStats.currentStreak}-day streak!`}
            </Text>
          </View>
        )}

        {/* Daily Lesson Card */}
        {nextLesson && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Lesson</Text>
            <TouchableOpacity
              style={styles.featuredLessonCard}
              onPress={() => navigation.navigate('Lesson', { lessonId: nextLesson.id })}
            >
              <View style={styles.lessonIconCircle}>
                <Ionicons name="book" size={24} color="#6366f1" />
              </View>
              <View style={styles.lessonContent}>
                <Text style={styles.lessonTitle}>{nextLesson.title}</Text>
                <Text style={styles.lessonDescription}>{nextLesson.description}</Text>
                <Text style={styles.lessonDuration}>⏱️ {nextLesson.duration}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('DreamJournal')}
          >
            <Ionicons name="create" size={22} color="#6366f1" />
            <Text style={styles.actionText}>Log a Dream</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AchievementModal
        visible={achievementModal.visible}
        achievement={achievementModal.achievement}
        onClose={handleCloseAchievement}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  levelSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  levelCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    gap: 12,
    marginBottom: 12,
  },
  levelIcon: {
    fontSize: 32,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 2,
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  xpContainer: {
    width: '100%',
  },
  xpBar: {
    height: 6,
    backgroundColor: '#1a1a2e',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
  },
  xpProgress: {
    height: '100%',
    borderRadius: 3,
  },
  xpText: {
    fontSize: 10,
    color: '#888',
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
  },
  motivationBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1a3229',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    padding: 15,
    borderRadius: 8,
  },
  motivationText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  featuredLessonCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  lessonIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  lessonDescription: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
  },
  lessonDuration: {
    fontSize: 11,
    color: '#6366f1',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
    fontWeight: '500',
  },
});
