import React, { useState } from "react";
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
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { auth, db } from "../../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import {
  analyzeDream,
  saveDreamAnalysis,
} from "../services/dreamAnalysisService";
import Button from "../components/Button";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";

type EditDreamScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

export default function EditDreamScreen({
  navigation,
  route,
}: EditDreamScreenProps) {
  const { dreamId, dream } = route.params;

  const [title, setTitle] = useState(dream.title);
  const [content, setContent] = useState(dream.content);
  const [isLucid, setIsLucid] = useState(dream.isLucid);
  const [tags, setTags] = useState<string[]>(dream.tags || []);
  const [loading, setLoading] = useState(false);

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

  const toggleTag = (tag: string) => {
    hapticFeedback.light();
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleUpdateDream = async () => {
    if (!title.trim() || !content.trim()) {
      hapticFeedback.error();
      Alert.alert("Error", "Please fill in both title and content");
      return;
    }

    const hasChanges =
      title !== dream.title ||
      content !== dream.content ||
      isLucid !== dream.isLucid ||
      JSON.stringify(tags) !== JSON.stringify(dream.tags);

    if (!hasChanges) {
      hapticFeedback.warning();
      Alert.alert("No Changes", "You haven't made any changes to this dream.");
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(db, "dreams", dreamId), {
        title,
        content,
        isLucid,
        tags,
        updatedAt: new Date().toISOString(),
      });

      hapticFeedback.success();

      Alert.alert(
        "Dream Updated! ✅",
        "Your dream has been saved. Would you like to re-analyze it with AI for updated insights?",
        [
          {
            text: "Not Now",
            style: "cancel",
            onPress: () => navigation.goBack(),
          },
          {
            text: "Re-analyze",
            onPress: async () => {
              try {
                setLoading(true);
                const analysis = await analyzeDream(title, content, isLucid);

                if (analysis) {
                  await saveDreamAnalysis(user.uid, dreamId, analysis);
                  hapticFeedback.success();
                  Alert.alert(
                    "Analysis Complete! 🤖",
                    "Your dream has been re-analyzed with fresh insights.",
                    [{ text: "Great!", onPress: () => navigation.goBack() }]
                  );
                } else {
                  navigation.goBack();
                }
              } catch (error) {
                console.error("Error re-analyzing:", error);
                hapticFeedback.error();
                navigation.goBack();
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error updating dream:", error);
      hapticFeedback.error();
      Alert.alert("Error", "Failed to update dream. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const hasChanges =
      title !== dream.title ||
      content !== dream.content ||
      isLucid !== dream.isLucid ||
      JSON.stringify(tags) !== JSON.stringify(dream.tags);

    if (hasChanges) {
      hapticFeedback.warning();
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          {
            text: "Keep Editing",
            style: "cancel",
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              hapticFeedback.light();
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      hapticFeedback.light();
      navigation.goBack();
    }
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

          <View style={styles.buttonRow}>
            <Button
              title="Cancel"
              onPress={handleCancel}
              variant="ghost"
              disabled={loading}
              style={styles.cancelButton}
            />

            <Button
              title="Save Changes"
              onPress={handleUpdateDream}
              loading={loading}
              style={styles.saveButton}
            />
          </View>
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
  buttonRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.xxxl,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});
