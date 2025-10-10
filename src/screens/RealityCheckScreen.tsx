import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

type RealityCheckScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function RealityCheckScreen({ navigation }: RealityCheckScreenProps) {
  const [interval, setInterval] = useState<number>(2); // Default 2 hours

  const scheduleReminders = async (intervalHours: number) => {
  try {
    // Cancel all existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Calculate how many reminders we can fit in a day (8 AM to 10 PM = 14 hours)
    const wakeHours = 14;
    const numReminders = Math.floor(wakeHours / intervalHours);

    // Schedule notifications
    for (let i = 0; i < numReminders; i++) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✨ Reality Check Time!',
          body: 'Am I dreaming? Check your hands!',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: 8 + (i * intervalHours),
          minute: 0,
          repeats: true,
        },
      });
    }

    Alert.alert(
      'Reminders Set!',
      `You'll receive ${numReminders} reality check reminders every ${intervalHours} hours between 8 AM and 10 PM.`
    );
  } catch (error) {
    console.error('Error scheduling reminders:', error);
    Alert.alert('Error', 'Failed to schedule reminders. Please try again.');
  }
};


  const handleSetInterval = async (hours: number) => {
    const { status } = await Notifications.getPermissionsAsync();
    
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications to receive reality check reminders.'
        );
        return;
      }
    }

    setInterval(hours);
    await scheduleReminders(hours);
  };

  const cancelAll = async () => {
    Alert.alert(
      'Cancel All Reminders',
      'Are you sure you want to cancel all reality check reminders?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Cancel All',
          style: 'destructive',
          onPress: async () => {
            await Notifications.cancelAllScheduledNotificationsAsync();
            Alert.alert('Reminders Cancelled', 'All reality check reminders have been removed.');
          },
        },
      ]
    );
  };

  const intervalOptions = [
    { hours: 1, label: 'Every Hour', description: '~14 reminders per day' },
    { hours: 2, label: 'Every 2 Hours', description: '~7 reminders per day' },
    { hours: 3, label: 'Every 3 Hours', description: '~5 reminders per day' },
    { hours: 4, label: 'Every 4 Hours', description: '~3 reminders per day' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={40} color="#6366f1" />
          <Text style={styles.infoTitle}>Why Reality Checks?</Text>
          <Text style={styles.infoText}>
            Regular reality checks train your brain to question whether you're dreaming.
            Do them often in waking life, and you'll start doing them in dreams too!
          </Text>
        </View>

        {/* Interval Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminder Frequency</Text>
          
          {intervalOptions.map((option) => (
            <TouchableOpacity
              key={option.hours}
              style={[
                styles.optionCard,
                interval === option.hours && styles.optionCardActive,
              ]}
              onPress={() => handleSetInterval(option.hours)}
            >
              <View style={styles.optionLeft}>
                <Ionicons
                  name={interval === option.hours ? 'radio-button-on' : 'radio-button-off'}
                  size={24}
                  color={interval === option.hours ? '#6366f1' : '#888'}
                />
                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionLabel,
                      interval === option.hours && styles.optionLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reality Check Techniques</Text>
          
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>🤚</Text>
            <Text style={styles.tipTitle}>Finger Through Palm</Text>
            <Text style={styles.tipText}>
              Try to push your finger through your palm. In dreams, it often goes through!
            </Text>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>👃</Text>
            <Text style={styles.tipTitle}>Nose Pinch</Text>
            <Text style={styles.tipText}>
              Pinch your nose and try to breathe. In dreams, you can still breathe!
            </Text>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>📖</Text>
            <Text style={styles.tipTitle}>Read Twice</Text>
            <Text style={styles.tipText}>
              Read text, look away, then read again. In dreams, text changes!
            </Text>
          </View>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity style={styles.cancelButton} onPress={cancelAll}>
          <Ionicons name="close-circle" size={22} color="#ef4444" />
          <Text style={styles.cancelText}>Cancel All Reminders</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    margin: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  optionCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#333',
  },
  optionCardActive: {
    borderColor: '#6366f1',
    backgroundColor: '#1a1a3a',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    marginLeft: 15,
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  optionLabelActive: {
    color: '#6366f1',
  },
  optionDescription: {
    fontSize: 13,
    color: '#888',
  },
  tipCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  tipEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  cancelButton: {
    margin: 20,
    backgroundColor: '#3a1a1a',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  cancelText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 10,
  },
});
