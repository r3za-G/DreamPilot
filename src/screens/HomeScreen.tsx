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
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LESSONS } from '../data/lessons';
import { calculateStreak } from '../utils/streakCalculator';
import { checkAchievements, getRecentAchievements } from '../utils/achievementChecker';
import AchievementModal from '../components/AchievementModal';
import { Achievement } from '../data/achievements';
import { getUserXP } from '../utils/xpManager';
import { calculateLevel, getLevelTier, getProgressToNextLevel } from '../data/levels';


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
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [achievementModal, setAchievementModal] = useState<{
    visible: boolean;
    achievement: Achievement | null;
  }>({
    visible: false,
    achievement: null,
  });
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);

  // Use useFocusEffect instead of useEffect to reload data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const [userLevel, setUserLevel] = useState({
    level: 1,
    xp: 0,
    tier: { title: 'Beginner Dreamer', icon: '😴', color: '#6b7280', minLevel: 1, maxLevel: 3 },
    progress: { current: 0, required: 100, percentage: 0 },
  });

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
        // Get user data
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserName(data.name);
        }

        // Calculate stats from dreams collection
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
        
        // Calculate current streak
        const currentStreak = calculateStreak(dreamEntries);
        
        setUserStats({
          currentStreak,
          totalDreams,
          lucidDreams,
        });

        // Load lesson progress and get the count
        const lessonCount = await loadLessonProgress(user.uid);

        await loadUserLevel(user.uid);

        
        // Check for new achievements AFTER lesson progress is loaded
        const newAchievements = await checkAchievements(
          user.uid,
          { currentStreak, totalDreams, lucidDreams, completedLessons: lessonCount }
        );

        // Also check for recently unlocked achievements (within last 30 seconds)
        // This handles cases where achievement was saved but modal didn't show
        if (newAchievements.length === 0) {
          const recentAchievements = await getRecentAchievements(user.uid, 0.5); // 30 seconds
          if (recentAchievements.length > 0) {
            setAchievementQueue(recentAchievements);
            setAchievementModal({
              visible: true,
              achievement: recentAchievements[0],
            });
          }
        } else if (newAchievements.length > 0) {
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

  const loadLessonProgress = async (userId: string): Promise<number> => {
    try {
      const completed: number[] = [];
      
      for (const lesson of LESSONS) {
        const progressDoc = await getDoc(
          doc(db, 'users', userId, 'lessonProgress', `lesson_${lesson.id}`)
        );
        
        if (progressDoc.exists() && progressDoc.data().completed) {
          completed.push(lesson.id);
        }
      }
      
      setCompletedLessons(completed);
      return completed.length;
    } catch (error) {
      console.error('Error loading lesson progress:', error);
      return 0;
    }
  };

  const handleCloseAchievement = () => {
    // Remove first achievement from queue
    const remaining = achievementQueue.slice(1);
    setAchievementQueue(remaining);

    if (remaining.length > 0) {
      // Show next achievement
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
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
          <View style={{flex: 1}}>
            <Text style={styles.greeting}>Hello, {userName}! 👋</Text>
            <Text style={styles.subtitle}>Ready to practice lucid dreaming?</Text>
            
            {/* Level Badge */}
            <View style={styles.levelBadge}>
              <Text style={styles.levelIcon}>{userLevel.tier.icon}</Text>
              <View style={styles.levelInfo}>
                <Text style={styles.levelTitle}>{userLevel.tier.title}</Text>
                <Text style={styles.levelText}>Level {userLevel.level}</Text>
              </View>
            </View>
            
            {/* XP Progress Bar */}
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
          
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.currentStreak}</Text>
            <Text style={styles.statLabel}>🔥 Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.totalDreams}</Text>
            <Text style={styles.statLabel}>📖 Total Dreams</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.lucidDreams}</Text>
            <Text style={styles.statLabel}>✨ Lucid Dreams</Text>
          </View>
        </View>

        {/* Streak Motivation Banner */}
        {userStats.currentStreak > 0 && (
          <View style={styles.streakBanner}>
            <Text style={styles.streakBannerText}>
              {userStats.currentStreak === 1 
                ? '🎉 Great start! Log a dream tomorrow to build your streak!' 
                : userStats.currentStreak < 7
                ? `🔥 ${userStats.currentStreak} days strong! Keep it going!`
                : userStats.currentStreak < 30
                ? `⭐ Amazing ${userStats.currentStreak}-day streak! You're building a real habit!`
                : `🏆 Incredible ${userStats.currentStreak}-day streak! You're a dream master!`
              }
            </Text>
          </View>
        )}

        {userStats.currentStreak === 0 && userStats.totalDreams > 0 && (
          <View style={styles.streakWarningBanner}>
            <Text style={styles.streakWarningText}>
              ⚠️ Your streak ended. Log a dream today to start a new one!
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <TouchableOpacity
          style={styles.journalButton}
          onPress={() => navigation.navigate('DreamJournal')}
        >
          <Text style={styles.journalButtonText}>📝 Log Your Dream</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('DreamHistory')}
        >
          <Text style={styles.historyButtonText}>📚 View Dream History</Text>
        </TouchableOpacity>

        {/* Daily Lessons */}
        <Text style={styles.sectionTitle}>Daily Lessons</Text>
        
        {LESSONS.map((lesson, index) => {
          const isCompleted = completedLessons.includes(lesson.id);
          
          // Check if previous lesson is completed (to unlock this one)
          const previousLessonId = index > 0 ? LESSONS[index - 1].id : null;
          const isPreviousCompleted = previousLessonId 
            ? completedLessons.includes(previousLessonId) 
            : true;
          
          // First lesson is always unlocked, others unlock when previous is complete
          const isLocked = index > 0 && !isPreviousCompleted;
          
          return (
            <TouchableOpacity
              key={lesson.id}
              style={[styles.lessonCard, isLocked && styles.lessonCardLocked]}
              onPress={() => {
                if (!isLocked) {
                  navigation.navigate('Lesson', { lessonId: lesson.id });
                }
              }}
              disabled={isLocked}
            >
              <View style={styles.lessonContent}>
                <View style={styles.lessonHeader}>
                  <Text style={[styles.lessonTitle, isLocked && styles.lessonTitleLocked]}>
                    {isLocked && '🔒 '}
                    {lesson.title}
                  </Text>
                  {isCompleted && <Text style={styles.completedBadge}>✅</Text>}
                </View>
                <Text style={[styles.lessonDescription, isLocked && styles.lessonDescriptionLocked]}>
                  {isLocked ? 'Complete the previous lesson to unlock' : lesson.description}
                </Text>
                <Text style={styles.lessonDuration}>{lesson.duration}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
    paddingTop: 60,
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
  logoutButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
  },
  logoutText: {
    color: '#888',
    fontSize: 14,
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
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  streakBanner: {
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: '#1a3229',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    padding: 15,
    borderRadius: 8,
    overflow: 'hidden',
  },
  streakBannerText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  streakWarningBanner: {
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: '#3a2a1a',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    padding: 15,
    borderRadius: 8,
    overflow: 'hidden',
  },
  streakWarningText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  journalButton: {
    marginHorizontal: 20,
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  journalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  historyButton: {
    marginHorizontal: 20,
    backgroundColor: '#1a1a2e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#333',
  },
  historyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  lessonCard: {
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  lessonCardLocked: {
    opacity: 0.5,
  },
  lessonContent: {
    gap: 8,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  lessonTitleLocked: {
    color: '#666',
  },
  completedBadge: {
    fontSize: 16,
    marginLeft: 10,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  lessonDescriptionLocked: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  lessonDuration: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 5,
  },
  levelBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 15,
  backgroundColor: '#1a1a2e',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 20,
  alignSelf: 'flex-start',
  borderWidth: 1,
  borderColor: '#333',
  },
  levelIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelTitle: {
    fontSize: 13,
    color: '#aaa',
    fontWeight: '500',
  },
  levelText: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '700',
  },
  xpContainer: {
    marginTop: 10,
    width: '100%',
  },
  xpBar: {
    height: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  xpProgress: {
    height: '100%',
    borderRadius: 4,
  },
  xpText: {
    fontSize: 11,
    color: '#888',
  },

});
