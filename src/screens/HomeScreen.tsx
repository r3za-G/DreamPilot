import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LESSONS, Lesson } from '../data/lessons';
import { calculateStreak } from '../utils/streakCalculator';
import { checkAchievements } from '../utils/achievementChecker';
import AchievementModal from '../components/AchievementModal';
import { Achievement } from '../data/achievements';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../contexts/DataContext';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { userData, dreams, completedLessons, loading, refreshData } = useData();
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [achievementModal, setAchievementModal] = useState<{
    visible: boolean;
    achievement: Achievement | null;
  }>({
    visible: false,
    achievement: null,
  });
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);

  useEffect(() => {
    if (!loading && userData && dreams.length >= 0) {
      checkForAchievements();
    }
  }, [loading, userData, dreams, completedLessons]);

  useEffect(() => {
    // Find next incomplete lesson
    const firstIncomplete = LESSONS.find(
      lesson => !completedLessons.includes(lesson.id)
    );
    setNextLesson(firstIncomplete || null);
  }, [completedLessons]);

  const checkForAchievements = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const dreamEntries = dreams.map(d => ({ createdAt: d.createdAt }));
      const currentStreak = calculateStreak(dreamEntries);
      const lucidDreams = dreams.filter(d => d.isLucid).length;

      const newAchievements = await checkAchievements(
        user.uid,
        { 
          currentStreak, 
          totalDreams: dreams.length, 
          lucidDreams, 
          completedLessons: completedLessons.length 
        }
      );

      if (newAchievements.length > 0) {
        setAchievementQueue(newAchievements);
        setAchievementModal({
          visible: true,
          achievement: newAchievements[0],
        });
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
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

  const lucidDreams = dreams.filter(d => d.isLucid).length;
  const dreamEntries = dreams.map(d => ({ createdAt: d.createdAt }));
  const currentStreak = calculateStreak(dreamEntries);

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
            colors={['#6366f1']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hello, {userData?.name}! 👋</Text>
            <Text style={styles.subtitle}>Ready to explore your dreams?</Text>
          </View>
        </View>

        {/* Level Progress */}
        <View style={styles.levelSection}>
          <View style={[styles.levelCard, { borderColor: userData?.level ? getLevelTier(userData.level).color : '#6b7280' }]}>
            <Text style={styles.levelIcon}>
              {userData?.level ? getLevelTier(userData.level).icon : '😴'}
            </Text>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>
                {userData?.level ? getLevelTier(userData.level).title : 'Beginner Dreamer'}
              </Text>
              <Text style={[styles.levelText, { color: userData?.level ? getLevelTier(userData.level).color : '#6b7280' }]}>
                Level {userData?.level || 1}
              </Text>
            </View>
          </View>
          <View style={styles.xpContainer}>
            <View style={styles.xpBar}>
              <View 
                style={[
                  styles.xpProgress, 
                  { 
                    width: `${userData?.xp ? getProgressToNextLevel(userData.totalXP).percentage : 0}%`,
                    backgroundColor: userData?.level ? getLevelTier(userData.level).color : '#6b7280',
                  }
                ]} 
              />
            </View>
            <Text style={styles.xpText}>
              {userData?.xp ? getProgressToNextLevel(userData.totalXP).current : 0} / {userData?.xp ? getProgressToNextLevel(userData.totalXP).required : 100} XP
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statNumber}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📖</Text>
            <Text style={styles.statNumber}>{dreams.length}</Text>
            <Text style={styles.statLabel}>Dreams</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>✨</Text>
            <Text style={styles.statNumber}>{lucidDreams}</Text>
            <Text style={styles.statLabel}>Lucid</Text>
          </View>
        </View>

        {/* Streak Motivation */}
        {currentStreak > 0 && (
          <View style={styles.motivationBanner}>
            <Text style={styles.motivationText}>
              {currentStreak < 7
                ? `🔥 ${currentStreak} day streak! Keep it going!`
                : currentStreak < 30
                ? `⭐ Amazing ${currentStreak}-day streak!`
                : `🏆 Incredible ${currentStreak}-day streak!`}
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

// Import these helper functions at the top
import { getLevelTier, getProgressToNextLevel } from '../data/levels';
import { auth } from '../../firebaseConfig';

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
