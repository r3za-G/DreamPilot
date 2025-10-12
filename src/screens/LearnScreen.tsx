import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LESSONS } from '../data/lessons';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../contexts/DataContext';

type LearnScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function LearnScreen({ navigation }: LearnScreenProps) {
  const { completedLessons, refreshLessons, isPremium } = useData(); // ✅ Added isPremium
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshLessons();
    setRefreshing(false);
  };

  const completedCount = completedLessons.length;
  const totalLessons = LESSONS.length;
  const progressPercentage = Math.round((completedCount / totalLessons) * 100);

  // ✅ NEW: Handle lesson press with premium check
  const handleLessonPress = (lesson: any, index: number) => {
    // Check if lesson is premium-only
    const isPremiumLesson = index >= 5; // Lessons 6+ (index 5+)

    if (isPremiumLesson && !isPremium) {
      Alert.alert(
        '🔒 Premium Lesson',
        'This lesson is part of our Premium collection. Upgrade to unlock all 50+ expert lessons!',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { 
            text: 'Upgrade to Premium', 
            onPress: () => navigation.navigate('Paywall'),
            style: 'default'
          }
        ]
      );
      return;
    }

    // Navigate to lesson
    navigation.navigate('Lesson', { lessonId: lesson.id });
  };

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
        <View style={styles.header}>
          <Text style={styles.title}>Learn Lucid Dreaming</Text>
          <Text style={styles.subtitle}>
            Master the techniques to control your dreams
          </Text>

          <View style={styles.progressCard}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Your Progress</Text>
              <Text style={styles.progressCount}>
                {completedCount} / {totalLessons} Lessons
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressPercentage}>{progressPercentage}% Complete</Text>
          </View>
        </View>

        {/* ✅ NEW: Premium banner for free users */}
        {!isPremium && (
          <TouchableOpacity 
            style={styles.premiumBanner}
            onPress={() => navigation.navigate('Paywall')}
          >
            <View style={styles.premiumBannerContent}>
              <Text style={styles.premiumBannerIcon}>⭐</Text>
              <View style={styles.premiumBannerText}>
                <Text style={styles.premiumBannerTitle}>Unlock All Lessons</Text>
                <Text style={styles.premiumBannerSubtitle}>
                  Get access to 50+ expert lessons with Premium
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#6366f1" />
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.lessonsSection}>
          {LESSONS.map((lesson, index) => {
            const isCompleted = completedLessons.includes(lesson.id);
            const previousLessonId = index > 0 ? LESSONS[index - 1].id : null;
            const isPreviousCompleted = previousLessonId 
              ? completedLessons.includes(previousLessonId) 
              : true;
            const isSequentiallyLocked = index > 0 && !isPreviousCompleted;
            
            // ✅ NEW: Check if lesson is premium-only
            const isPremiumLesson = index >= 5; // Lessons 6+ require premium
            const isPremiumLocked = isPremiumLesson && !isPremium;
            
            const isLocked = isSequentiallyLocked || isPremiumLocked;
            
            return (
              <TouchableOpacity
                key={lesson.id}
                style={[styles.lessonCard, isLocked && styles.lessonCardLocked]}
                onPress={() => {
                  if (!isSequentiallyLocked) {
                    handleLessonPress(lesson, index);
                  }
                }}
                disabled={isSequentiallyLocked}
              >
                <View style={styles.lessonIconContainer}>
                  <View style={[
                    styles.lessonIcon,
                    isCompleted && styles.lessonIconCompleted,
                    isLocked && styles.lessonIconLocked,
                    isPremiumLocked && styles.lessonIconPremium,
                  ]}>
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={24} color="#fff" />
                    ) : isPremiumLocked ? (
                      <Ionicons name="star" size={24} color="#6366f1" />
                    ) : isSequentiallyLocked ? (
                      <Ionicons name="lock-closed" size={24} color="#666" />
                    ) : (
                      <Text style={styles.lessonNumber}>{index + 1}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.lessonContent}>
                  <View style={styles.lessonTitleRow}>
                    <Text style={[styles.lessonTitle, isLocked && styles.lessonTitleLocked]}>
                      {lesson.title}
                    </Text>
                    {/* ✅ NEW: Premium badge */}
                    {isPremiumLesson && (
                      <View style={styles.premiumBadge}>
                        <Text style={styles.premiumBadgeText}>PRO</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.lessonDescription, isLocked && styles.lessonDescriptionLocked]}>
                    {isPremiumLocked 
                      ? 'Premium lesson - Upgrade to unlock' 
                      : isSequentiallyLocked 
                      ? 'Complete the previous lesson to unlock' 
                      : lesson.description}
                  </Text>
                  <View style={styles.lessonFooter}>
                    <Text style={styles.lessonDuration}>⏱️ {lesson.duration}</Text>
                    {isCompleted && (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedText}>Completed</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
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
    padding: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 24,
  },
  progressCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  progressCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#0f0f23',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
  },
  // ✅ NEW: Premium banner styles
  premiumBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#6366f1',
    overflow: 'hidden',
  },
  premiumBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  premiumBannerIcon: {
    fontSize: 32,
  },
  premiumBannerText: {
    flex: 1,
  },
  premiumBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  premiumBannerSubtitle: {
    fontSize: 13,
    color: '#888',
  },
  lessonsSection: {
    padding: 20,
    paddingTop: 10,
  },
  lessonCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#333',
  },
  lessonCardLocked: {
    opacity: 0.6,
  },
  lessonIconContainer: {
    marginRight: 16,
  },
  lessonIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonIconCompleted: {
    backgroundColor: '#10b981',
  },
  lessonIconLocked: {
    backgroundColor: '#333',
  },
  // ✅ NEW: Premium icon style
  lessonIconPremium: {
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  lessonNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  lessonContent: {
    flex: 1,
  },
  // ✅ NEW: Title row with badge
  lessonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
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
  // ✅ NEW: Premium badge
  premiumBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  lessonDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
    marginBottom: 10,
  },
  lessonDescriptionLocked: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  lessonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonDuration: {
    fontSize: 12,
    color: '#6366f1',
  },
  completedBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  completedText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    height: 40,
  },
});
