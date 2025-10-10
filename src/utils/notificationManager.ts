import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Reality check reminder messages
const REALITY_CHECK_MESSAGES = [
  '🤚 Time for a reality check! Push your finger through your palm.',
  '✋ Reality check reminder! Are you dreaming right now?',
  '🌟 Quick! Do a reality check. Look at your hands.',
  '💭 Is this a dream? Do a reality check to find out!',
  '👁️ Reality check time! Look around - does anything seem unusual?',
  '🔍 Pause and question: Am I dreaming? Do a reality check!',
  '⚡ Reality check reminder! Test if you\'re awake or dreaming.',
  '🎯 Time to check reality! Push your finger through your palm.',
  '✨ Quick reality check! Look at text, look away, look back.',
  '🌙 Are you awake or dreaming? Do a reality check now!',
];

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reality-checks', {
        name: 'Reality Check Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366f1',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

export const scheduleRealityCheckReminders = async (
  frequency: number // in hours
): Promise<string[]> => {
  try {
    // Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    const notificationIds: string[] = [];

    // Calculate how many notifications to schedule per day
    const notificationsPerDay = Math.floor(24 / frequency);

    // Schedule notifications for the next 7 days
    for (let day = 0; day < 7; day++) {
      for (let i = 0; i < notificationsPerDay; i++) {
        const hour = 8 + i * frequency; // Start at 8 AM
        
        if (hour >= 22) break; // Don't schedule past 10 PM

        const trigger: Notifications.CalendarTriggerInput = {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour,
          minute: 0,
          repeats: true,
        };

        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Reality Check Time! 🌟',
            body: REALITY_CHECK_MESSAGES[Math.floor(Math.random() * REALITY_CHECK_MESSAGES.length)],
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            ...(Platform.OS === 'android' && {
              channelId: 'reality-checks',
            }),
          },
          trigger,
        });

        notificationIds.push(id);
      }
    }

    console.log(`Scheduled ${notificationIds.length} reality check reminders`);
    return notificationIds;
  } catch (error) {
    console.error('Error scheduling notifications:', error);
    return [];
  }
};

export const scheduleCustomIntervalReminders = async (
  intervalMinutes: number,
  startHour: number = 8,
  endHour: number = 22
): Promise<string[]> => {
  try {
    // Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    const notificationIds: string[] = [];
    const totalMinutesPerDay = (endHour - startHour) * 60;
    const notificationsPerDay = Math.floor(totalMinutesPerDay / intervalMinutes);

    for (let i = 0; i < notificationsPerDay; i++) {
      const totalMinutes = startHour * 60 + i * intervalMinutes;
      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;

      if (hour >= endHour) break;

      const trigger: Notifications.CalendarTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      };

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Reality Check Time! 🌟',
          body: REALITY_CHECK_MESSAGES[Math.floor(Math.random() * REALITY_CHECK_MESSAGES.length)],
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          ...(Platform.OS === 'android' && {
            channelId: 'reality-checks',
          }),
        },
        trigger,
      });

      notificationIds.push(id);
    }

    console.log(`Scheduled ${notificationIds.length} reality check reminders`);
    return notificationIds;
  } catch (error) {
    console.error('Error scheduling custom interval notifications:', error);
    return [];
  }
};

export const cancelAllReminders = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All reality check reminders cancelled');
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
};

export const getScheduledNotifications = async (): Promise<number> => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications.length;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return 0;
  }
};

export const testNotification = async (): Promise<void> => {
  try {
    const trigger: Notifications.TimeIntervalTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      repeats: false,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification 🧪',
        body: 'This is a test reality check reminder!',
        sound: true,
      },
      trigger,
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
};
