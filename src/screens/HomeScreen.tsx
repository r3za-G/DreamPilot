import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';



type HomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

// Sample lessons data (we'll expand this later)
const LESSONS = [
  {
    id: 1,
    title: 'What is Lucid Dreaming?',
    description: 'Learn the basics and what makes a dream "lucid"',
    duration: '5 min',
    locked: false,
  },
  {
    id: 2,
    title: 'Your First Reality Check',
    description: 'Master the finger-through-palm technique',
    duration: '4 min',
    locked: false,
  },
  {
    id: 3,
    title: 'Dream Journaling 101',
    description: 'Why writing dreams down changes everything',
    duration: '6 min',
    locked: false,
  },
  {
    id: 4,
    title: 'The MILD Technique',
    description: 'Mnemonic Induction of Lucid Dreams',
    duration: '8 min',
    locked: true,
  },
  {
    id: 5,
    title: 'Dream Signs & Patterns',
    description: 'Recognize your personal dream triggers',
    duration: '7 min',
    locked: true,
  },
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [userName, setUserName] = useState('');
  const [userStats, setUserStats] = useState({
    currentStreak: 0,
    totalDreams: 0,
    lucidDreams: 0,
  });
  const [loading, setLoading] = useState(true);

 useFocusEffect(
  React.useCallback(() => {
    loadUserData();
  }, [])
);


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
      
      querySnapshot.forEach((doc) => {
        totalDreams++;
        if (doc.data().isLucid) {
          lucidDreams++;
        }
      });
      
      setUserStats({
        currentStreak: 0, // We'll implement this later
        totalDreams,
        lucidDreams,
      });
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  } finally {
    setLoading(false);
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
          <View>
            <Text style={styles.greeting}>Hello, {userName}! 👋</Text>
            <Text style={styles.subtitle}>Ready to practice lucid dreaming?</Text>
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
        
        {LESSONS.map((lesson) => (
          <TouchableOpacity
            key={lesson.id}
            style={[styles.lessonCard, lesson.locked && styles.lessonCardLocked]}
            onPress={() => {
              if (!lesson.locked) {
                navigation.navigate('Lesson', { lessonId: lesson.id });
              }
            }}
            disabled={lesson.locked}
          >
            <View style={styles.lessonContent}>
              <Text style={[styles.lessonTitle, lesson.locked && styles.lessonTitleLocked]}>
                {lesson.locked && '🔒 '}
                {lesson.title}
              </Text>
              <Text style={styles.lessonDescription}>{lesson.description}</Text>
              <Text style={styles.lessonDuration}>{lesson.duration}</Text>
            </View>
          </TouchableOpacity>
        ))}
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
  journalButton: {
    marginHorizontal: 20,
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  journalButtonText: {
    color: '#fff',
    fontSize: 18,
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
  lessonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  lessonTitleLocked: {
    color: '#666',
  },
  lessonDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  lessonDuration: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 5,
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
});