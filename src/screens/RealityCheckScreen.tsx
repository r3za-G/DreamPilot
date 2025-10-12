import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RealityCheckScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

const REMINDER_MESSAGES = [
  { title: '✨ Reality Check Time!', body: 'Am I dreaming? Check your hands!' },
  { title: '🔍 Quick Reality Check', body: 'Look around. Does anything seem strange?' },
  { title: '👁️ Awareness Check', body: 'Try to push your finger through your palm!' },
  { title: '💭 Dream or Reality?', body: 'Pinch your nose and try to breathe!' },
  { title: '🌟 Stay Lucid', body: 'Read some text twice. Does it change?' },
  { title: '⚡ Reality Test', body: 'Look at your hands. Do they look normal?' },
  { title: '🎯 Lucidity Trigger', body: 'Question your reality right now!' },
];

export default function RealityCheckScreen({ navigation, route }: RealityCheckScreenProps) {
  const [interval, setInterval] = useState<number>(2);
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(false);
  const [randomize, setRandomize] = useState<boolean>(true);
  const [startHour, setStartHour] = useState<number>(8);
  const [endHour, setEndHour] = useState<number>(22);
  const [useSound, setUseSound] = useState<boolean>(true);
  const [useVibration, setUseVibration] = useState<boolean>(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('realityCheckSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setInterval(parsed.interval || 2);
        setRandomize(parsed.randomize ?? true);
        setStartHour(parsed.startHour || 8);
        setEndHour(parsed.endHour || 22);
        setUseSound(parsed.useSound ?? true);
        setUseVibration(parsed.useVibration ?? true);
        setRemindersEnabled(parsed.enabled || false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (settings: any) => {
    try {
      await AsyncStorage.setItem('realityCheckSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const getRandomMessage = () => {
    return REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
  };

  const scheduleReminders = async (intervalHours: number) => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      const wakeHours = endHour - startHour;
      const baseNumReminders = Math.floor(wakeHours / intervalHours);

      // Schedule notifications
      for (let i = 0; i < baseNumReminders; i++) {
        const message = getRandomMessage();
        
        // Add randomization (±30 minutes if enabled)
        const randomOffset = randomize ? (Math.random() * 60 - 30) : 0;
        const baseTime = startHour + (i * intervalHours);
        const hour = Math.floor(baseTime + randomOffset / 60);
        const minute = Math.floor(randomOffset % 60);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: message.title,
            body: message.body,
            sound: useSound,
            vibrate: useVibration ? [0, 250, 250, 250] : undefined,
            data: { type: 'reality_check' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: Math.max(startHour, Math.min(endHour - 1, hour)),
            minute: Math.abs(minute),
            repeats: true,
          },
        });
      }

      setRemindersEnabled(true);

      const settings = {
        interval: intervalHours,
        randomize,
        startHour,
        endHour,
        useSound,
        useVibration,
        enabled: true,
      };
      await saveSettings(settings);

      Alert.alert(
        'Reminders Set! 🎉',
        `You'll receive ${baseNumReminders} reality check reminders every ${intervalHours} hours${randomize ? ' (with random timing)' : ''} between ${startHour}:00 and ${endHour}:00.`
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

  const cancelAllReminders = async () => {
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
            setRemindersEnabled(false);
            await saveSettings({ ...await getSettings(), enabled: false });
            Alert.alert('Reminders Cancelled', 'All reality check reminders have been removed.');
          },
        },
      ]
    );
  };

  const getSettings = async () => {
    const settings = await AsyncStorage.getItem('realityCheckSettings');
    return settings ? JSON.parse(settings) : {};
  };

  const intervalOptions = [
    { hours: 1, label: 'Every Hour', description: `~${endHour - startHour} reminders per day` },
    { hours: 2, label: 'Every 2 Hours', description: `~${Math.floor((endHour - startHour) / 2)} reminders per day` },
    { hours: 3, label: 'Every 3 Hours', description: `~${Math.floor((endHour - startHour) / 3)} reminders per day` },
    { hours: 4, label: 'Every 4 Hours', description: `~${Math.floor((endHour - startHour) / 4)} reminders per day` },
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

        {/* Status Banner */}
        {remindersEnabled && (
          <View style={styles.statusBanner}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.statusText}>Reality checks are active! 🔥</Text>
          </View>
        )}

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

        {/* Advanced Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Settings</Text>

          {/* Randomize */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="shuffle" size={22} color="#6366f1" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Randomize Timing</Text>
                <Text style={styles.settingDescription}>
                  Vary reminder times by ±30 minutes to prevent habituation
                </Text>
              </View>
            </View>
            <Switch
              value={randomize}
              onValueChange={async (value) => {
                setRandomize(value);
                if (remindersEnabled) {
                  await scheduleReminders(interval);
                }
              }}
              trackColor={{ false: '#333', true: '#6366f1' }}
              thumbColor={randomize ? '#fff' : '#888'}
            />
          </View>

          {/* Sound */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="volume-high" size={22} color="#6366f1" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Notification Sound</Text>
                <Text style={styles.settingDescription}>Play sound with reminders</Text>
              </View>
            </View>
            <Switch
              value={useSound}
              onValueChange={setUseSound}
              trackColor={{ false: '#333', true: '#6366f1' }}
              thumbColor={useSound ? '#fff' : '#888'}
            />
          </View>

          {/* Vibration */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="phone-portrait" size={22} color="#6366f1" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Vibration</Text>
                <Text style={styles.settingDescription}>Vibrate with reminders</Text>
              </View>
            </View>
            <Switch
              value={useVibration}
              onValueChange={setUseVibration}
              trackColor={{ false: '#333', true: '#6366f1' }}
              thumbColor={useVibration ? '#fff' : '#888'}
            />
          </View>
        </View>

        {/* Reality Check Techniques */}
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

        {/* Bottom Buttons */}
        <View style={styles.section}>
          <View style={styles.bottomButtons}>
            {route.params?.fromOnboarding ? (
              <>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => navigation.replace('MainTabs')}
                >
                  <Text style={styles.skipButtonText}>Skip for Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => navigation.replace('MainTabs')}
                >
                  <Text style={styles.continueButtonText}>Continue to App</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              remindersEnabled && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={cancelAllReminders}
                >
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                  <Text style={styles.cancelButtonText}>Cancel All Reminders</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b98120',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#10b981',
    gap: 12,
  },
  statusText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
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
  bottomButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  skipButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
    gap: 8,
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
