import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  increment,
} from "firebase/firestore";
import { awardXP } from "../utils/xpManager";
import { XP_REWARDS } from "../data/levels";
import {
  analyzeDream,
  saveDreamAnalysis,
  getUserDreamPatterns,
} from "../services/dreamAnalysisService";
import { useData } from "../contexts/DataContext";
import { Ionicons } from "@expo/vector-icons";
import Button from "../components/Button";
import Card from "../components/Card";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";
import { useToast } from "../contexts/ToastContext";

type DreamJournalScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function DreamJournalScreen({
  navigation,
}: DreamJournalScreenProps) {
  const { refreshDreams, refreshUserData, dreams, isPremium } = useData();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLucid, setIsLucid] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [monthlyDreamCount, setMonthlyDreamCount] = useState(0);
  const toast = useToast();

  const commonTags = [
    "🌊 Water",
    "✈️ Flying",
    "👥 People",
    "🏃 Running",
    "🏠 House",
    "🌳 Nature",
    "🐕 Animals",
    "🚗 Vehicles",
    "😨 Nightmare",
    "😊 Pleasant",
    "🤔 Confusing",
    "🎨 Vivid",
  ];

  useEffect(() => {
    loadTipPreference();
    loadMonthlyDreamCount();
  }, [dreams, isPremium]);

  const loadMonthlyDreamCount = async () => {
    if (isPremium) {
      setMonthlyDreamCount(0);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const dreamsQuery = query(
        collection(db, "dreams"),
        where("userId", "==", user.uid),
        where("createdAt", ">=", startOfMonth.toISOString()),
        where("createdAt", "<=", endOfMonth.toISOString())
      );

      const snapshot = await getDocs(dreamsQuery);
      setMonthlyDreamCount(snapshot.size);
    } catch (error) {
      console.error("Error loading monthly dream count:", error);
    }
  };

  const loadTipPreference = async () => {
    try {
      const dismissed = await AsyncStorage.getItem("voiceTipDismissed");
      if (dismissed === "true") {
        setShowTip(false);
      }
    } catch (error) {
      console.error("Error loading tip preference:", error);
    }
  };

  const dismissTip = async () => {
    try {
      hapticFeedback.light();
      await AsyncStorage.setItem("voiceTipDismissed", "true");
      setShowTip(false);
    } catch (error) {
      console.error("Error saving tip preference:", error);
    }
  };

  const toggleTag = (tag: string) => {
    hapticFeedback.light();
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const checkDreamLimit = async (): Promise<boolean> => {
    if (isPremium) return true;

    try {
      const user = auth.currentUser;
      if (!user) return false;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const dreamsQuery = query(
        collection(db, "dreams"),
        where("userId", "==", user.uid),
        where("createdAt", ">=", startOfMonth.toISOString()),
        where("createdAt", "<=", endOfMonth.toISOString())
      );

      const snapshot = await getDocs(dreamsQuery);
      const monthlyDreamCount = snapshot.size;

      if (monthlyDreamCount >= 10) {
        hapticFeedback.warning();
        Alert.alert(
          "🔒 Free Limit Reached",
          `You've created ${monthlyDreamCount} dreams this month. Upgrade to Premium for unlimited dreams!`,
          [
            { text: "Maybe Later", style: "cancel" },
            {
              text: "Upgrade to Premium",
              onPress: () => navigation.navigate("Paywall"),
              style: "default",
            },
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking dream limit:", error);
      return true;
    }
  };

  const handleSaveDream = async () => {
    if (!title.trim() || !content.trim()) {
      hapticFeedback.error();
      toast.error("Please fill in both title and content");
      return;
    }

    const canSave = await checkDreamLimit();
    if (!canSave) {
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      const now = new Date();
      const todayDate = now.toISOString().split("T")[0];

      const dreamRef = await addDoc(collection(db, "dreams"), {
        userId: user.uid,
        title,
        content,
        isLucid,
        tags,
        createdAt: now.toISOString(),
        isDeleted: false,
      });

      const dreamId = dreamRef.id; // ✅ Store the dream ID

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      const lastDreamDate = userData?.lastDreamDate || "";

      let newStreak = 1;
      if (lastDreamDate) {
        const lastDate = new Date(lastDreamDate);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().split("T")[0];

        if (lastDreamDate === yesterdayDate) {
          newStreak = (userData?.currentStreak || 0) + 1;
        } else if (lastDreamDate === todayDate) {
          newStreak = userData?.currentStreak || 1;
        }
      }

      const userRef = doc(db, "users", user.uid);
      const updates: any = {
        totalDreams: increment(1),
        lastDreamDate: todayDate,
        currentStreak: newStreak,
      };

      if (isLucid) {
        updates.lucidDreams = increment(1);
      }

      await updateDoc(userRef, updates);

      const xpAmount = isLucid
        ? XP_REWARDS.LUCID_DREAM
        : XP_REWARDS.DREAM_LOGGED;
      const xpReason = isLucid ? "Logged a lucid dream" : "Logged a dream";
      await awardXP(user.uid, xpAmount, xpReason);

      await Promise.all([refreshDreams(), refreshUserData()]);

      analyzeDreamInBackground(user.uid, dreamRef.id, title, content, isLucid);

      hapticFeedback.success();
      // ✅ Navigate to dream detail instead of going back
      navigation.replace("DreamDetail", { dreamId });

      toast.success(
        `Dream saved! +${xpAmount} XP${
          newStreak > 1 ? ` • ${newStreak} day streak 🔥` : ""
        }`,
        3000
      );
    } catch (error) {
      console.error("Error saving dream:", error);
      hapticFeedback.error();
      toast.error("Failed to save dream. Please try again");
    } finally {
      setLoading(false);
    }
  };

  const analyzeDreamInBackground = async (
    userId: string,
    dreamId: string,
    title: string,
    content: string,
    isLucid: boolean
  ) => {
    try {
      console.log("🤖 Starting AI analysis...");

      const analysis = await analyzeDream(title, content, isLucid);

      if (analysis) {
        console.log("✅ Analysis complete, saving...");
        await saveDreamAnalysis(userId, dreamId, analysis);
        console.log("💾 Analysis saved successfully");

        await refreshDreams();

        // ✅ Only show recurring dream sign notification if count >= 3
        if (analysis.dreamSigns.length > 0) {
          const patterns = await getUserDreamPatterns(userId);

          const recurringSign = analysis.dreamSigns.find((sign) =>
            patterns.topDreamSigns.some(
              (p) => p.sign.toLowerCase() === sign.toLowerCase() && p.count >= 3
            )
          );

          if (recurringSign) {
            const signData = patterns.topDreamSigns.find(
              (p) => p.sign.toLowerCase() === recurringSign.toLowerCase()
            );

            // ✅ Use toast instead of Alert so it doesn't interrupt
            setTimeout(() => {
              toast.info(
                `🎯 Recurring sign detected: "${recurringSign}" (${signData?.count}x). Perfect reality check trigger!`,
                5000
              );
            }, 2000);
          }
        }
      }
    } catch (error) {
      console.error("❌ Background analysis error:", error);
    }
  };

  const renderLimitBanner = () => {
    if (isPremium) return null;

    const remaining = 10 - monthlyDreamCount;

    if (remaining <= 3 && remaining > 0) {
      return (
        <TouchableOpacity
          style={styles.limitBanner}
          onPress={() => {
            hapticFeedback.light();
            navigation.navigate("Paywall");
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="information-circle"
            size={20}
            color={COLORS.warning}
          />
          <Text style={styles.limitBannerText}>
            {remaining} {remaining === 1 ? "dream" : "dreams"} remaining this
            month
          </Text>
          <Text style={styles.limitBannerLink}>Upgrade →</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {renderLimitBanner()}

          {showTip && (
            <Card style={styles.tipBanner}>
              <View style={styles.tipContent}>
                <Text style={styles.tipText}>
                  💡 Tap the{" "}
                  <Ionicons name="mic" size={16} color={COLORS.primary} /> on
                  your keyboard for voice input!
                </Text>
                <TouchableOpacity
                  onPress={dismissTip}
                  style={styles.dismissButton}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </Card>
          )}

          <Text style={styles.sectionTitle}>Dream Title</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Give your dream a title..."
            placeholderTextColor={COLORS.textTertiary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          <Text style={styles.sectionTitle}>What did you dream about?</Text>
          <TextInput
            style={styles.contentInput}
            placeholder="Describe your dream in as much detail as you can remember..."
            placeholderTextColor={COLORS.textTertiary}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.sectionTitle}>Was this a lucid dream?</Text>
          <View style={styles.lucidContainer}>
            <TouchableOpacity
              style={[styles.lucidButton, !isLucid && styles.lucidButtonActive]}
              onPress={() => {
                hapticFeedback.light();
                setIsLucid(false);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.lucidButtonText,
                  !isLucid && styles.lucidButtonTextActive,
                ]}
              >
                No
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.lucidButton, isLucid && styles.lucidButtonActive]}
              onPress={() => {
                hapticFeedback.light();
                setIsLucid(true);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.lucidButtonText,
                  isLucid && styles.lucidButtonTextActive,
                ]}
              >
                Yes! ✨
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Tags (optional)</Text>
          <View style={styles.tagsContainer}>
            {commonTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, tags.includes(tag) && styles.tagActive]}
                onPress={() => toggleTag(tag)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tagText,
                    tags.includes(tag) && styles.tagTextActive,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title="Save Dream"
            onPress={handleSaveDream}
            loading={loading}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  content: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl + 10,
  },
  limitBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.warning}20`,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.warning,
    gap: SPACING.sm,
  },
  limitBannerText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  limitBannerLink: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  tipBanner: {
    marginBottom: SPACING.lg,
  },
  tipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  tipText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  dismissButton: {
    padding: SPACING.xs,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  titleInput: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.sizes.xl,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  contentInput: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textPrimary,
    minHeight: 200,
    lineHeight: 24,
  },
  lucidContainer: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  lucidButton: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: "center",
  },
  lucidButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  lucidButtonText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  lucidButtonTextActive: {
    color: COLORS.textPrimary,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  tag: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  tagActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  tagTextActive: {
    color: COLORS.textPrimary,
  },
  saveButton: {
    marginTop: SPACING.xxxl,
  },
});
