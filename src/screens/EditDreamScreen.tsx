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
  Modal,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { auth, db } from "../../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import {
  analyzeDream,
  saveDreamAnalysis,
} from "../services/dreamAnalysisService";
import { Ionicons } from "@expo/vector-icons";
import Button from "../components/Button";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";
import { useToast } from "../contexts/ToastContext";

type EditDreamScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

export default function EditDreamScreen({
  navigation,
  route,
}: EditDreamScreenProps) {
  const { dreamId, dream } = route.params;
  const toast = useToast();

  const [title, setTitle] = useState(dream.title);
  const [content, setContent] = useState(dream.content);
  const [isLucid, setIsLucid] = useState(dream.isLucid);
  const [tags, setTags] = useState<string[]>(dream.tags || []);
  const [loading, setLoading] = useState(false);

  // ✅ Modal states
  const [showReanalyzeModal, setShowReanalyzeModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const commonTags = [
    "Water",
    "Flying",
    "People",
    "Running",
    "Nature",
    "Animals",
    "Vehicles",
    "Nightmare",
    "Pleasant",
    "Confusing",
    "Vivid",
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
    toast.error("Please fill in both title and content");
    return;
  }

  // ✅ Add minimum length validation
  const MIN_CONTENT_LENGTH = 50;
  const contentLength = content.trim().length;

  if (contentLength < MIN_CONTENT_LENGTH) {
    hapticFeedback.warning();
    toast.error(
      `Dream content too short for AI analysis. Need ${MIN_CONTENT_LENGTH} characters.`,
      4000
    );
    return;
  }

  const hasChanges =
    title !== dream.title ||
    content !== dream.content ||
    isLucid !== dream.isLucid ||
    JSON.stringify(tags) !== JSON.stringify(dream.tags);

  if (!hasChanges) {
    hapticFeedback.warning();
    toast.warning("No changes made to this dream");
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
      toast.success("Dream updated! ✅");

      // ✅ Show re-analyze modal
      setShowReanalyzeModal(true);
    } catch (error) {
      console.error("Error updating dream:", error);
      hapticFeedback.error();
      toast.error("Failed to update dream. Please try again");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle re-analyze confirmation
  const handleReanalyzeConfirm = async () => {
    setShowReanalyzeModal(false);

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      const analysis = await analyzeDream(content, title, isLucid);

      if (analysis) {
        await saveDreamAnalysis(user.uid, dreamId, analysis);
        hapticFeedback.success();
        toast.success("Dream re-analyzed! Fresh insights ready 🤖");
      } else {
        toast.error("Failed to analyze dream");
      }
    } catch (error) {
      console.error("Error re-analyzing:", error);
      hapticFeedback.error();
      toast.error("Analysis failed. Please try again");
    } finally {
      setLoading(false);
      navigation.goBack();
    }
  };

  const handleReanalyzeSkip = () => {
    setShowReanalyzeModal(false);
    navigation.goBack();
  };

  const handleCancel = () => {
    const hasChanges =
      title !== dream.title ||
      content !== dream.content ||
      isLucid !== dream.isLucid ||
      JSON.stringify(tags) !== JSON.stringify(dream.tags);

    if (hasChanges) {
      hapticFeedback.warning();
      setShowDiscardModal(true);
    } else {
      hapticFeedback.light();
      navigation.goBack();
    }
  };

  // ✅ Handle discard confirmation
  const handleDiscardConfirm = () => {
    setShowDiscardModal(false);
    hapticFeedback.light();
    navigation.goBack();
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
          {/* ✅ Add character counter */}
          <Text
            style={[
              styles.characterCounter,
              content.trim().length >= 50 && styles.characterCounterValid,
            ]}
          >
            {content.trim().length}/50 characters (minimum for AI analysis)
          </Text>

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

      {/* ✅ Re-analyze Modal */}
      <Modal
        visible={showReanalyzeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReanalyzeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons
              name="sparkles"
              size={48}
              color={COLORS.primary}
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>Re-analyze Dream?</Text>
            <Text style={styles.modalText}>
              Would you like to re-analyze this dream with AI for updated
              insights?
            </Text>

            <View style={styles.modalButtons}>
              <Button
                title="Not Now"
                onPress={handleReanalyzeSkip}
                variant="ghost"
                style={styles.modalButton}
              />
              <Button
                title="Re-analyze"
                onPress={handleReanalyzeConfirm}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ Discard Changes Modal */}
      <Modal
        visible={showDiscardModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDiscardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons
              name="warning"
              size={48}
              color={COLORS.warning}
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>Discard Changes?</Text>
            <Text style={styles.modalText}>
              You have unsaved changes. Are you sure you want to discard them?
            </Text>

            <View style={styles.modalButtons}>
              <Button
                title="Keep Editing"
                onPress={() => setShowDiscardModal(false)}
                variant="ghost"
                style={styles.modalButton}
              />
              <Button
                title="Discard"
                onPress={handleDiscardConfirm}
                variant="danger"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.xxl,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: "center",
  },
  modalIcon: {
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  modalText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: SPACING.md,
    width: "100%",
    marginTop: SPACING.md,
  },
  modalButton: {
    flex: 1,
  },
  characterCounter: {
  fontSize: TYPOGRAPHY.sizes.xs,
  color: COLORS.textTertiary,
  marginTop: SPACING.xs,
  fontStyle: "italic",
  },
  characterCounterValid: {
    color: COLORS.success,
  },

});
