import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useData } from '../contexts/DataContext';
import { calculateStreak } from '../utils/streakCalculator';
import { Ionicons } from '@expo/vector-icons';

type StreakCalendarScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function StreakCalendarScreen({ navigation }: StreakCalendarScreenProps) {
  const { dreams, loading } = useData();
  const [markedDates, setMarkedDates] = useState<any>({});
  const [stats, setStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalDays: 0,
  });

  useEffect(() => {
    if (dreams.length > 0) {
      calculateCalendarData();
    }
  }, [dreams]);

  const calculateCalendarData = () => {
    const marked: any = {};
    const dreamDates = new Set<string>();
    
    // Mark all days with dreams
    dreams.forEach(dream => {
      const date = new Date(dream.createdAt).toISOString().split('T')[0];
      dreamDates.add(date);
      
      marked[date] = {
        marked: true,
        dotColor: dream.isLucid ? '#a855f7' : '#6366f1',
        customStyles: {
          container: {
            backgroundColor: dream.isLucid ? '#a855f720' : '#6366f120',
            borderRadius: 16,
          },
          text: {
            color: '#fff',
            fontWeight: 'bold',
          },
        },
      };
    });

    // Calculate streaks
    const dreamEntries = dreams.map(d => ({ createdAt: d.createdAt }));
    const currentStreak = calculateStreak(dreamEntries);
    const longestStreak = calculateLongestStreak(dreams);
    
    setMarkedDates(marked);
    setStats({
      currentStreak,
      longestStreak,
      totalDays: dreamDates.size,
    });
  };

  const calculateLongestStreak = (dreamsList: any[]): number => {
    if (dreamsList.length === 0) return 0;

    const sortedDates = dreamsList
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
        {/* Header Stats */}
        <View style={styles.header}>
          <Text style={styles.title}>Dream Streak Calendar</Text>
          <Text style={styles.subtitle}>Track your daily dream journaling</Text>
        </View>

        {/* Streak Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={32} color="#f59e0b" />
            <Text style={styles.statNumber}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="trophy" size={32} color="#10b981" />
            <Text style={styles.statNumber}>{stats.longestStreak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="calendar" size={32} color="#6366f1" />
            <Text style={styles.statNumber}>{stats.totalDays}</Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            markedDates={markedDates}
            markingType="custom"
            theme={{
              calendarBackground: '#1a1a2e',
              textSectionTitleColor: '#888',
              selectedDayBackgroundColor: '#6366f1',
              selectedDayTextColor: '#fff',
              todayTextColor: '#f59e0b',
              dayTextColor: '#fff',
              textDisabledColor: '#444',
              monthTextColor: '#fff',
              textMonthFontWeight: 'bold',
              textDayFontSize: 14,
              textMonthFontSize: 18,
              arrowColor: '#6366f1',
            }}
            style={styles.calendar}
          />
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#6366f1' }]} />
              <Text style={styles.legendText}>Regular Dream</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#a855f7' }]} />
              <Text style={styles.legendText}>Lucid Dream</Text>
            </View>
          </View>
        </View>

        {/* Motivation Message */}
        {stats.currentStreak > 0 && (
          <View style={styles.motivationCard}>
            <Text style={styles.motivationEmoji}>
              {stats.currentStreak >= 30 ? '🏆' : stats.currentStreak >= 7 ? '⭐' : '🔥'}
            </Text>
            <Text style={styles.motivationTitle}>
              {stats.currentStreak >= 30 
                ? 'Incredible Dedication!' 
                : stats.currentStreak >= 7 
                ? 'Amazing Streak!' 
                : 'Keep it going!'}
            </Text>
            <Text style={styles.motivationText}>
              {stats.currentStreak >= 30
                ? `${stats.currentStreak} days straight! You're a dream master!`
                : stats.currentStreak >= 7
                ? `${stats.currentStreak} days in a row! You're building a strong habit!`
                : `${stats.currentStreak} day streak! Log another dream tomorrow to keep it alive!`}
            </Text>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
  },
  calendarContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  calendar: {
    borderRadius: 12,
  },
  legendContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  legendItems: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#aaa',
  },
  motivationCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1a3229',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  motivationEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  motivationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    height: 40,
  },
});
