import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Card from "../components/Card";
import Button from "../components/Button";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";
import { useToast } from "../contexts/ToastContext"; // ✅ Add this import

type RealityCheckScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

const REMINDER_MESSAGES = [
  { title: "✨ Reality Check Time!", body: "Am I dreaming? Check your hands!" },
  {
    title: "🔍 Quick Reality Check",
    body: "Look around. Does anything seem strange?",
  },
  {
    title: "👁️ Awareness Check",
    body: "Try to push your finger through your palm!",
  },
  {
    title: "💭 Dream or Reality?",
    body: "Pinch your nose and try to breathe!",
  },
  { title: "🌟 Stay Lucid", body: "Read some text twice. Does it change?" },
  {
    title: "⚡ Reality Test",
    body: "Look at your hands. Do they look normal?",
  },
  { title: "🎯 Lucidity Trigger", body: "Question your reality right now!" },
];

export default function RealityCheckScreen({
  navigation,
  route,
}: RealityCheckScreenProps) {
  const [interval, setInterval] = useState<number>(2);
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(false);
  const [randomize, setRandomize] = useState<boolean>(true);
  const [startHour, setStartHour] = useState<number>(8);
  const [endHour, setEndHour] = useState<number>(22);
  const [useSound, setUseSound] = useState<boolean>(true);
  const [useVibration, setUseVibration] = useState<boolean>(true);
  const toast = useToast(); // ✅ Add this hook

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem("realityCheckSettings");
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
      console.error("Error loading settings:", error);
    }
  };

  const saveSettings = async (settings: any) => {
    try {
      await AsyncStorage.setItem(
        "realityCheckSettings",
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const getRandomMessage = () => {
    return REMINDER_MESSAGES[
      Math.floor(Math.random() * REMINDER_MESSAGES.length)
    ];
  };

  const scheduleReminders = async (intervalHours: number) => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      const wakeHours = endHour - startHour;
      const baseNumReminders = Math.floor(wakeHours / intervalHours);

      for (let i = 0; i < baseNumReminders; i++) {
        const message = getRandomMessage();
        const randomOffset = randomize ? Math.random() * 60 - 30 : 0;
        const baseTime = startHour + i * intervalHours;
        const hour = Math.floor(baseTime + randomOffset / 60);
        const minute = Math.floor(randomOffset % 60);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: message.title,
            body: message.body,
            sound: useSound,
            vibrate: useVibration ? [0, 250, 250, 250] : undefined,
            data: { type: "reality_check" },
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

      hapticFeedback.success();
      // ✅ Toast instead of Alert
      toast.success(
        `Reality checks set! ${baseNumReminders} reminders every ${intervalHours}h 🎉`,
        4000
      );
    } catch (error) {
      console.error("Error scheduling reminders:", error);
      hapticFeedback.error();
      toast.error("Failed to schedule reminders. Please try again"); // ✅ Toast
    }
  };

  const handleSetInterval = async (hours: number) => {
    const { status } = await Notifications.getPermissionsAsync();

    if (status !== "granted") {
      const { status: newStatus } =
        await Notifications.requestPermissionsAsync();
      if (newStatus !== "granted") {
        hapticFeedback.warning();
        toast.warning(
          "Please enable notifications for reality check reminders"
        ); // ✅ Toast
        return;
      }
    }

    hapticFeedback.light();
    setInterval(hours);
    await scheduleReminders(hours);
  };

  const cancelAllReminders = async () => {
    hapticFeedback.warning();
    // ✅ Keep Alert for destructive confirmation
    Alert.alert(
      "Cancel All Reminders",
      "Are you sure you want to cancel all reality check reminders?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Cancel All",
          style: "destructive",
          onPress: async () => {
            await Notifications.cancelAllScheduledNotificationsAsync();
            setRemindersEnabled(false);
            await saveSettings({ ...(await getSettings()), enabled: false });
            hapticFeedback.success();
            toast.success("All reminders cancelled"); // ✅ Toast
          },
        },
      ]
    );
  };

  const getSettings = async () => {
    const settings = await AsyncStorage.getItem("realityCheckSettings");
    return settings ? JSON.parse(settings) : {};
  };

  const intervalOptions = [
    {
      hours: 1,
      label: "Every Hour",
      description: `~${endHour - startHour} reminders per day`,
    },
    {
      hours: 2,
      label: "Every 2 Hours",
      description: `~${Math.floor(
        (endHour - startHour) / 2
      )} reminders per day`,
    },
    {
      hours: 3,
      label: "Every 3 Hours",
      description: `~${Math.floor(
        (endHour - startHour) / 3
      )} reminders per day`,
    },
    {
      hours: 4,
      label: "Every 4 Hours",
      description: `~${Math.floor(
        (endHour - startHour) / 4
      )} reminders per day`,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCardWrapper}>
          <Card variant="highlighted">
            <View style={styles.infoCardContent}>
              <Ionicons
                name="information-circle"
                size={40}
                color={COLORS.primary}
              />
              <Text style={styles.infoTitle}>Why Reality Checks?</Text>
              <Text style={styles.infoText}>
                Regular reality checks train your brain to question whether
                you're dreaming. Do them often in waking life, and you'll start
                doing them in dreams too!
              </Text>
            </View>
          </Card>
        </View>

        {remindersEnabled && (
          <View style={styles.statusBannerWrapper}>
            <Card style={styles.statusBanner}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={COLORS.success}
              />
              <Text style={styles.statusText}>
                Reality checks are active! 🔥
              </Text>
            </Card>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminder Frequency</Text>

          {intervalOptions.map((option) => (
            <TouchableOpacity
              key={option.hours}
              onPress={() => handleSetInterval(option.hours)}
              activeOpacity={0.7}
              style={styles.optionWrapper}
            >
              <Card
                style={{
                  borderColor:
                    interval === option.hours ? COLORS.primary : COLORS.border,
                  borderWidth: 2,
                  backgroundColor:
                    interval === option.hours
                      ? "#1a1a3a"
                      : COLORS.backgroundSecondary,
                }}
              >
                <View style={styles.optionContent}>
                  <Ionicons
                    name={
                      interval === option.hours
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={24}
                    color={
                      interval === option.hours
                        ? COLORS.primary
                        : COLORS.textSecondary
                    }
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
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Settings</Text>

          <Card style={styles.settingWrapper}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="shuffle" size={22} color={COLORS.primary} />
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
                  hapticFeedback.light();
                  setRandomize(value);
                  if (remindersEnabled) {
                    await scheduleReminders(interval);
                  }
                }}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={
                  randomize ? COLORS.textPrimary : COLORS.textSecondary
                }
              />
            </View>
          </Card>

          <Card style={styles.settingWrapper}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="volume-high" size={22} color={COLORS.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Notification Sound</Text>
                  <Text style={styles.settingDescription}>
                    Play sound with reminders
                  </Text>
                </View>
              </View>
              <Switch
                value={useSound}
                onValueChange={(value) => {
                  hapticFeedback.light();
                  setUseSound(value);
                }}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={
                  useSound ? COLORS.textPrimary : COLORS.textSecondary
                }
              />
            </View>
          </Card>

          <Card style={styles.settingWrapper}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons
                  name="phone-portrait"
                  size={22}
                  color={COLORS.primary}
                />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Vibration</Text>
                  <Text style={styles.settingDescription}>
                    Vibrate with reminders
                  </Text>
                </View>
              </View>
              <Switch
                value={useVibration}
                onValueChange={(value) => {
                  hapticFeedback.light();
                  setUseVibration(value);
                }}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={
                  useVibration ? COLORS.textPrimary : COLORS.textSecondary
                }
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reality Check Techniques</Text>

          <Card style={styles.tipWrapper}>
            <Text style={styles.tipEmoji}>🤚</Text>
            <Text style={styles.tipTitle}>Finger Through Palm</Text>
            <Text style={styles.tipText}>
              Try to push your finger through your palm. In dreams, it often
              goes through!
            </Text>
          </Card>

          <Card style={styles.tipWrapper}>
            <Text style={styles.tipEmoji}>👃</Text>
            <Text style={styles.tipTitle}>Nose Pinch</Text>
            <Text style={styles.tipText}>
              Pinch your nose and try to breathe. In dreams, you can still
              breathe!
            </Text>
          </Card>

          <Card style={styles.tipWrapper}>
            <Text style={styles.tipEmoji}>📖</Text>
            <Text style={styles.tipTitle}>Read Twice</Text>
            <Text style={styles.tipText}>
              Read text, look away, then read again. In dreams, text changes!
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
          {route.params?.fromOnboarding ? (
            <View style={styles.bottomButtons}>
              <Button
                title="Skip for Now"
                onPress={() => {
                  hapticFeedback.light();
                  navigation.replace("MainTabs");
                }}
                variant="ghost"
                style={styles.skipButton}
              />
              <Button
                title="Continue to App"
                onPress={() => {
                  hapticFeedback.light();
                  navigation.replace("MainTabs");
                }}
                icon={
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={COLORS.textPrimary}
                  />
                }
                style={styles.continueButton}
              />
            </View>
          ) : (
            remindersEnabled && (
              <Button
                title="Cancel All Reminders"
                onPress={cancelAllReminders}
                variant="danger"
                icon={
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={COLORS.textPrimary}
                  />
                }
              />
            )
          )}
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  infoCardWrapper: {
    margin: SPACING.xl,
  },
  infoCardContent: {
    alignItems: "center",
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  statusBannerWrapper: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.success}20`,
    borderWidth: 1,
    borderColor: COLORS.success,
    gap: SPACING.md,
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  optionWrapper: {
    marginBottom: SPACING.md,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  optionLabelActive: {
    color: COLORS.primary,
  },
  optionDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  settingWrapper: {
    marginBottom: SPACING.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: SPACING.md,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  tipWrapper: {
    marginBottom: SPACING.md,
  },
  tipEmoji: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  tipTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  tipText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bottomButtons: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  skipButton: {
    flex: 1,
  },
  continueButton: {
    flex: 2,
  },
  footer: {
    height: SPACING.xxxl,
  },
});
