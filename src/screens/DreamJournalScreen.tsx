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

      // ✅ Count ALL dreams created this month (including soft-deleted)
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
      await AsyncStorage.setItem("voiceTipDismissed", "true");
      setShowTip(false);
    } catch (error) {
      console.error("Error saving tip preference:", error);
    }
  };

  const toggleTag = (tag: string) => {
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

      // ✅ Query ALL dreams created this month (including soft-deleted)
      const dreamsQuery = query(
        collection(db, "dreams"),
        where("userId", "==", user.uid),
        where("createdAt", ">=", startOfMonth.toISOString()),
        where("createdAt", "<=", endOfMonth.toISOString())
      );

      const snapshot = await getDocs(dreamsQuery);
      const monthlyDreamCount = snapshot.size;

      if (monthlyDreamCount >= 10) {
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
      Alert.alert("Error", "Please fill in both title and content");
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
      const todayDate = now.toISOString().split("T")[0]; // "2025-10-14"

      // ✅ Save the dream
      const dreamRef = await addDoc(collection(db, "dreams"), {
        userId: user.uid,
        title,
        content,
        isLucid,
        tags,
        createdAt: now.toISOString(),
        isDeleted: false,
      });

      // ✅ Calculate streak
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      const lastDreamDate = userData?.lastDreamDate || "";

      let newStreak = 1;
      if (lastDreamDate) {
        const lastDate = new Date(lastDreamDate);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().split("T")[0];

        // If last dream was yesterday, increment streak
        if (lastDreamDate === yesterdayDate) {
          newStreak = (userData?.currentStreak || 0) + 1;
        } else if (lastDreamDate === todayDate) {
          // Already logged today, keep current streak
          newStreak = userData?.currentStreak || 1;
        }
        // If more than 1 day gap, streak resets to 1 (handled by default value)
      }

      // ✅ Update user stats in Firestore
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

      // ✅ Award XP
      const xpAmount = isLucid
        ? XP_REWARDS.LUCID_DREAM
        : XP_REWARDS.DREAM_LOGGED;
      const xpReason = isLucid ? "Logged a lucid dream" : "Logged a dream";
      await awardXP(user.uid, xpAmount, xpReason);

      // ✅ Refresh data
      await Promise.all([refreshDreams(), refreshUserData()]);

      // ✅ Background analysis
      analyzeDreamInBackground(user.uid, dreamRef.id, title, content, isLucid);

      navigation.goBack();

      Alert.alert(
        "Dream Saved! ✨",
        `+${xpAmount} XP earned!${
          newStreak > 1 ? `\n🔥 ${newStreak} day streak!` : ""
        }\n\n🤖 AI is analyzing your dream for patterns and insights...`
      );
    } catch (error) {
      console.error("Error saving dream:", error);
      Alert.alert("Error", "Failed to save dream. Please try again.");
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

            setTimeout(() => {
              Alert.alert(
                "🎯 Recurring Dream Sign Detected!",
                `"${recurringSign}" has appeared ${signData?.count} times in your dreams.\n\nThis is a perfect reality check trigger! Try checking if you're dreaming whenever you see this.`,
                [
                  {
                    text: "Got it!",
                    style: "default",
                  },
                  {
                    text: "View Insights",
                    onPress: () => navigation.navigate("Insights"),
                  },
                ]
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
          onPress={() => navigation.navigate("Paywall")}
        >
          <Ionicons name="information-circle" size={20} color="#f59e0b" />
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
            <View style={styles.tipBanner}>
              <Text style={styles.tipText}>
                Tap the {<Ionicons name="mic" size={18} color="#6366f1" />} on
                your keyboard for voice input!
              </Text>
              <TouchableOpacity
                onPress={dismissTip}
                style={styles.dismissButton}
              >
                <Ionicons name="close" size={20} color="#888" />
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.sectionTitle}>Dream Title</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Give your dream a title..."
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          <Text style={styles.sectionTitle}>What did you dream about?</Text>
          <TextInput
            style={styles.contentInput}
            placeholder="Describe your dream in as much detail as you can remember..."
            placeholderTextColor="#666"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.sectionTitle}>Was this a lucid dream?</Text>
          <View style={styles.lucidContainer}>
            <TouchableOpacity
              style={[styles.lucidButton, !isLucid && styles.lucidButtonActive]}
              onPress={() => setIsLucid(false)}
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
              onPress={() => setIsLucid(true)}
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

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSaveDream}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Dream</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  limitBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f59e0b20",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#f59e0b",
    gap: 10,
  },
  limitBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#f59e0b",
    fontWeight: "600",
  },
  limitBannerLink: {
    fontSize: 13,
    color: "#f59e0b",
    fontWeight: "bold",
  },
  tipBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#6366f1",
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: "#aaa",
    lineHeight: 18,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
    marginTop: 20,
  },
  titleInput: {
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  contentInput: {
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    minHeight: 200,
    lineHeight: 24,
  },
  lucidContainer: {
    flexDirection: "row",
    gap: 10,
  },
  lucidButton: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  lucidButtonActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  lucidButtonText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "600",
  },
  lucidButtonTextActive: {
    color: "#fff",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tag: {
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tagActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  tagText: {
    color: "#888",
    fontSize: 14,
  },
  tagTextActive: {
    color: "#fff",
  },
  saveButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
