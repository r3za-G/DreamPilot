import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  requestNotificationPermissions,
  scheduleCustomIntervalReminders,
  cancelAllReminders,
  getScheduledNotifications,
  testNotification,
} from '../utils/notificationManager';

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const INTERVAL_OPTIONS = [
  { label: 'Every 30 minutes', value: 30 },
  { label: 'Every hour', value: 60 },
  { label: 'Every 2 hours', value: 120 },
  { label: 'Every 3 hours', value: 180 },
  { label: 'Every 4 hours', value: 240 },
];

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState(120); // 2 hours default
  const [scheduledCount, setScheduledCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const settingsDoc = await getDoc(doc(db, 'users', user.uid, 'data', 'settings'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setRemindersEnabled(data.remindersEnabled || false);
        setSelectedInterval(data.reminderInterval || 120);
      }

      const count = await getScheduledNotifications();
      setScheduledCount(count);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (enabled: boolean, interval: number) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await setDoc(
        doc(db, 'users', user.uid, 'data', 'settings'),
        {
          remindersEnabled: enabled,
          reminderInterval: interval,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleToggleReminders = async (value: boolean) => {
    setLoading(true);

    if (value) {
      // Request permissions
      const hasPermission = await requestNotificationPermissions();
      
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive reality check reminders.'
        );
        setLoading(false);
        return;
      }

      // Schedule notifications
      await scheduleCustomIntervalReminders(selectedInterval);
      const count = await getScheduledNotifications();
      setScheduledCount(count);

      Alert.alert(
        'Reminders Enabled! 🔔',
        `You'll receive reality check reminders every ${selectedInterval} minutes between 8 AM and 10 PM.`
      );
    } else {
      // Cancel all notifications
      await cancelAllReminders();
      setScheduledCount(0);
      Alert.alert('Reminders Disabled', 'All reality check reminders have been cancelled.');
    }

    setRemindersEnabled(value);
    await saveSettings(value, selectedInterval);
    setLoading(false);
  };

  const handleChangeInterval = async (interval: number) => {
    setSelectedInterval(interval);

    if (remindersEnabled) {
      setLoading(true);
      await scheduleCustomIntervalReminders(interval);
      const count = await getScheduledNotifications();
      setScheduledCount(count);
      await saveSettings(true, interval);
      setLoading(false);

      Alert.alert(
        'Interval Updated',
        `Reality check reminders will now occur every ${interval} minutes.`
      );
    } else {
      await saveSettings(false, interval);
    }
  };

  const handleTestNotification = async () => {
    await testNotification();
    Alert.alert('Test Sent!', 'You should receive a test notification in 2 seconds.');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your Dream Pilot experience</Text>
        </View>

        {/* Reality Check Reminders Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reality Check Reminders</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Reminders</Text>
              <Text style={styles.settingDescription}>
                Get reminded to do reality checks throughout the day
              </Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={handleToggleReminders}
              trackColor={{ false: '#333', true: '#6366f1' }}
              thumbColor={remindersEnabled ? '#fff' : '#888'}
              disabled={loading}
            />
          </View>

          {remindersEnabled && (
            <>
              <View style={styles.divider} />
              
              <Text style={styles.intervalTitle}>Reminder Frequency</Text>
              
              {INTERVAL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.intervalOption,
                    selectedInterval === option.value && styles.intervalOptionSelected,
                  ]}
                  onPress={() => handleChangeInterval(option.value)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.intervalLabel,
                      selectedInterval === option.value && styles.intervalLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selectedInterval === option.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  📊 {scheduledCount} reminders currently scheduled
                </Text>
                <Text style={styles.infoSubtext}>
                  Active between 8:00 AM and 10:00 PM daily
                </Text>
              </View>

              <TouchableOpacity
                style={styles.testButton}
                onPress={handleTestNotification}
              >
                <Text style={styles.testButtonText}>🧪 Send Test Notification</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Future sections can go here */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Dream Pilot v1.0</Text>
            <Text style={styles.infoSubtext}>Your lucid dreaming companion</Text>
          </View>
        </View>
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
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  settingDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 20,
  },
  intervalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#aaa',
    marginBottom: 15,
  },
  intervalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  intervalOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#1a1a3e',
  },
  intervalLabel: {
    fontSize: 16,
    color: '#aaa',
  },
  intervalLabelSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#1a1a2e',
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  infoText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 5,
  },
  infoSubtext: {
    fontSize: 12,
    color: '#888',
  },
  testButton: {
    backgroundColor: '#1a1a2e',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  testButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
});
