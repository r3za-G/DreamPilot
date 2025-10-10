import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LESSONS, Lesson, LessonSection } from '../data/lessons';
import { auth, db } from '../../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { awardXP } from '../utils/xpManager';
import { XP_REWARDS } from '../data/levels';


type LessonScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

export default function LessonScreen({ navigation, route }: LessonScreenProps) {
  const { lessonId } = route.params;
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLesson();
  }, []);

  const loadLesson = async () => {
    const foundLesson = LESSONS.find(l => l.id === lessonId);
    if (foundLesson) {
      setLesson(foundLesson);
      await checkIfCompleted(lessonId);
    }
    setLoading(false);
  };

  const checkIfCompleted = async (lessonId: number) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const progressDoc = await getDoc(
        doc(db, 'users', user.uid, 'lessonProgress', `lesson_${lessonId}`)
      );

      if (progressDoc.exists()) {
        setCompleted(progressDoc.data().completed);
      }
    } catch (error) {
      console.error('Error checking lesson completion:', error);
    }
  };

  const markAsComplete = async () => {
  try {
    const user = auth.currentUser;
    if (!user || !lesson) return;

    setLoading(true);

    await setDoc(
      doc(db, 'users', user.uid, 'lessonProgress', `lesson_${lesson.id}`),
      {
        lessonId: lesson.id,
        completed: true,
        completedAt: new Date().toISOString(),
      }
    );

    // Award XP
    await awardXP(user.uid, XP_REWARDS.LESSON_COMPLETED, `Completed lesson: ${lesson.title}`);

    setCompleted(true);
    
    Alert.alert(
      'Lesson Complete! 🎉',
      `+${XP_REWARDS.LESSON_COMPLETED} XP!\n\n${lesson.content.practiceTask 
        ? `Now go practice: ${lesson.content.practiceTask}`
        : 'Well done! Keep up the great work!'}`,
      [
        {
          text: 'Continue',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  } catch (error) {
    console.error('Error marking lesson complete:', error);
    Alert.alert('Error', 'Failed to save progress');
  } finally {
    setLoading(false);
  }
};


  const renderSection = (section: LessonSection, index: number) => {
    switch (section.type) {
      case 'heading':
        return (
          <Text key={index} style={styles.heading}>
            {section.content}
          </Text>
        );
      
      case 'text':
        return (
          <Text key={index} style={styles.bodyText}>
            {section.content}
          </Text>
        );
      
      case 'bullet':
        return (
          <View key={index} style={styles.bulletContainer}>
            <Text style={styles.bulletText}>{section.content}</Text>
          </View>
        );
      
      case 'tip':
        return (
          <View key={index} style={styles.tipBox}>
            <Text style={styles.tipText}>{section.content}</Text>
          </View>
        );
      
      case 'exercise':
        return (
          <View key={index} style={styles.exerciseBox}>
            <Text style={styles.exerciseText}>{section.content}</Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  if (loading || !lesson) {
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{lesson.title}</Text>
          <View style={styles.metaContainer}>
            <Text style={styles.duration}>⏱ {lesson.duration}</Text>
            <Text style={styles.level}>Level {lesson.level}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {lesson.content.sections.map((section, index) => 
            renderSection(section, index)
          )}
        </View>

        {completed && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedText}>✅ Completed</Text>
          </View>
        )}

        {!completed && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={markAsComplete}
          >
            <Text style={styles.completeButtonText}>Mark as Complete</Text>
          </TouchableOpacity>
        )}
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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  duration: {
    fontSize: 14,
    color: '#888',
  },
  level: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 25,
    marginBottom: 15,
  },
  bodyText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 26,
    marginBottom: 15,
  },
  bulletContainer: {
    marginBottom: 15,
  },
  bulletText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 26,
  },
  tipBox: {
    backgroundColor: '#1a2332',
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
  },
  tipText: {
    fontSize: 15,
    color: '#e0e0e0',
    lineHeight: 24,
  },
  exerciseBox: {
    backgroundColor: '#1a3229',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
  },
  exerciseText: {
    fontSize: 15,
    color: '#e0e0e0',
    lineHeight: 24,
    fontWeight: '500',
  },
  completedBanner: {
    marginHorizontal: 20,
    backgroundColor: '#1a3229',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  completedText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    marginHorizontal: 20,
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
