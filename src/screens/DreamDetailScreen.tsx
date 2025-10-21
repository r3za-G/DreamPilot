import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import {
  DreamAnalysis,
  analyzeDream,
  saveDreamAnalysis,
} from "../services/dreamAnalysisService";
import { Ionicons } from "@expo/vector-icons";
import { useData } from "../contexts/DataContext";
import Card from "../components/Card";
import Button from "../components/Button";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";
import { useToast } from "../contexts/ToastContext";

type DreamDetailScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

type Dream = {
  title: string;
  content: string;
  isLucid: boolean;
  tags: string[];
  createdAt: string;
  analysis?: DreamAnalysis;
  analyzed?: boolean;
};

export default function DreamDetailScreen({
  navigation,
  route,
}: DreamDetailScreenProps) {
  const { dreamId } = route.params;
  const [dream, setDream] = useState<Dream | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const { refreshDreams } = useData();
  const toast = useToast();
  const [showReanalyzeModal, setShowReanalyzeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDream();
  }, []);

  const loadDream = async () => {
    try {
      const dreamDoc = await getDoc(doc(db, "dreams", dreamId));
      if (dreamDoc.exists()) {
        setDream(dreamDoc.data() as Dream);
      } else {
        toast.error("Dream not found"); // ✅ Toast instead of Alert
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error loading dream:", error);
      toast.error("Failed to load dream"); // ✅ Toast instead of Alert
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = () => {
    if (!dream) return;
    hapticFeedback.light();
    setShowReanalyzeModal(true);
  };

  // ✅ NEW: Confirm reanalyze
  const confirmReanalyze = async () => {
    setShowReanalyzeModal(false);
    // ✅ Add null check
    if (!dream) {
      toast.error("Dream not found");
      return;
    }
    try {
      setReanalyzing(true);
      const user = auth.currentUser;
      if (!user) return;

      const analysis = await analyzeDream(
        dream.title,
        dream.content,
        dream.isLucid
      );

      if (analysis) {
        await saveDreamAnalysis(user.uid, dreamId, analysis);
        await loadDream();
        hapticFeedback.success();
        toast.success("Dream re-analyzed! Fresh insights generated");
      } else {
        hapticFeedback.error();
        toast.error("Failed to analyze dream. Please try again.");
      }
    } catch (error) {
      console.error("Error re-analyzing dream:", error);
      hapticFeedback.error();
      toast.error("Something went wrong. Please try again.");
    } finally {
      setReanalyzing(false);
    }
  };

  const onRefresh = async () => {
    if (!dream) return;

    setRefreshing(true);
    hapticFeedback.light();

    try {
      const user = auth.currentUser;
      if (!user) return;

      if (dream.analysis) {
        toast.info(
          "Analysis already exists. Press Re-analyze for fresh insight"
        );
        await loadDream();
        setRefreshing(false);
        return;
      }

      // Generate new analysis
      const analysis = await analyzeDream(
        dream.title,
        dream.content,
        dream.isLucid
      );

      if (analysis) {
        await saveDreamAnalysis(user.uid, dreamId, analysis);
        await loadDream();
        hapticFeedback.success();
        toast.success("AI analysis generated! 🧠✨");
      } else {
        hapticFeedback.error();
        toast.error("Failed to analyze dream. Please try again.");
      }
    } catch (error) {
      console.error("Error analyzing dream:", error);
      hapticFeedback.error();
      toast.error("Something went wrong. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const deleteDream = () => {
    hapticFeedback.warning();
    setShowDeleteModal(true);
  };

  // ✅ NEW: Confirm delete
  const confirmDeleteDream = async () => {
    setShowDeleteModal(false);
    try {
      setLoading(true);
      await deleteDoc(doc(db, "dreams", dreamId));
      await refreshDreams();
      hapticFeedback.success();
      navigation.goBack();
      toast.success("Dream deleted");
    } catch (error) {
      console.error("Error deleting dream:", error);
      hapticFeedback.error();
      toast.error("Failed to delete dream. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case "high":
        return COLORS.success;
      case "medium":
        return COLORS.warning;
      case "low":
        return COLORS.error;
      default:
        return COLORS.textTertiary;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dream...</Text>
      </View>
    );
  }

  if (!dream) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Dream not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
            title="Pull to analyze with AI"
            titleColor={COLORS.textSecondary}
          />
        }
      >
        {!dream.analysis && (
          <View style={styles.analysisPrompt}>
            <Card variant="highlighted">
              <View style={styles.analysisPromptContent}>
                <Ionicons name="sparkles" size={32} color={COLORS.primary} />
                <View style={styles.analysisPromptText}>
                  <Text style={styles.analysisPromptTitle}>
                    Get AI Insights
                  </Text>
                  <Text style={styles.analysisPromptDescription}>
                    Pull down to refresh and generate AI analysis of your dream
                  </Text>
                </View>
                <Ionicons name="arrow-down" size={24} color={COLORS.primary} />
              </View>
            </Card>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{dream.title}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                hapticFeedback.light();
                navigation.navigate("EditDream", { dreamId, dream });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.date}>
              {new Date(dream.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
            {dream.isLucid && (
              <View style={styles.lucidBadge}>
                <Text style={styles.lucidText}>✨ Lucid</Text>
              </View>
            )}
          </View>
        </View>

        {/* Dream Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dream Content</Text>
          <Text style={styles.content}>{dream.content}</Text>
        </View>

        {/* Tags */}
        {dream.tags && dream.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {dream.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* AI Analysis */}
        {dream.analyzed && dream.analysis ? (
          <View style={styles.aiSection}>
            <View style={styles.aiHeader}>
            <View style={styles.aiTitleContainer}>
              <Ionicons name="analytics" size={24} color={COLORS.primary} />
              <Text style={styles.aiTitle}>AI Analysis</Text>
            </View>
              <TouchableOpacity
                style={styles.reanalyzeButton}
                onPress={handleReanalyze}
                disabled={reanalyzing}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={reanalyzing ? "hourglass" : "refresh"}
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={styles.reanalyzeText}>
                  {reanalyzing ? "Analyzing..." : "Re-analyze"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Lucidity Potential */}
            <Card style={styles.analysisCard}>
              <View style={styles.potentialContent}>
                <Text style={styles.cardLabel}>Lucidity Potential</Text>
                <View
                  style={[
                    styles.potentialBadge,
                    {
                      backgroundColor:
                        getPotentialColor(dream.analysis.lucidityPotential) +
                        "20",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.potentialText,
                      {
                        color: getPotentialColor(
                          dream.analysis.lucidityPotential
                        ),
                      },
                    ]}
                  >
                    {dream.analysis.lucidityPotential.toUpperCase()}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Dream Signs */}
            {dream.analysis.dreamSigns.length > 0 && (
              <Card style={styles.analysisCard}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="flag-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.cardTitle}>Dream Signs</Text>
                </View>
                <Text style={styles.cardDescription}>
                  Watch for these in future dreams to trigger lucidity
                </Text>
                <View style={styles.chipContainer}>
                  {dream.analysis.dreamSigns.map((sign, index) => (
                    <View key={index} style={styles.chip}>
                      <Text style={styles.chipText}>{sign}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {/* Themes */}
            {dream.analysis.themes.length > 0 && (
              <Card style={styles.analysisCard}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="color-palette-outline" size={20} color={COLORS.secondary} />
                  <Text style={styles.cardTitle}>Themes</Text>
                </View>
                <View style={styles.chipContainer}>
                  {dream.analysis.themes.map((theme, index) => (
                    <View key={index} style={[styles.chip, styles.themeChip]}>
                      <Text style={styles.chipText}>{theme}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {/* Emotions */}
            {dream.analysis.emotions.length > 0 && (
              <Card style={styles.analysisCard}>
               <View style={styles.cardTitleRow}>
  <Ionicons name="heart-outline" size={20} color="#ec4899" />
  <Text style={styles.cardTitle}>Emotions</Text>
</View>
                <View style={styles.chipContainer}>
                  {dream.analysis.emotions.map((emotion, index) => (
                    <View key={index} style={[styles.chip, styles.emotionChip]}>
                      <Text style={styles.chipText}>{emotion}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {/* Insights */}
            <Card style={styles.analysisCard}>
             <View style={styles.cardTitleRow}>
  <Ionicons name="bulb-outline" size={20} color={COLORS.warning} />
  <Text style={styles.cardTitle}>Insights</Text>
</View>
              <Text style={styles.insightText}>{dream.analysis.insights}</Text>
            </Card>

            {/* Suggestions */}
            {dream.analysis.suggestions.length > 0 && (
              <Card style={styles.analysisCard}>
                <Text style={styles.cardTitle}>
                  ✨ Suggestions for Lucidity
                </Text>
                {dream.analysis.suggestions.map((suggestion, index) => (
                  <View key={index} style={styles.suggestionItem}>
                    <Text style={styles.suggestionNumber}>{index + 1}.</Text>
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </View>
                ))}
              </Card>
            )}

            <Text style={styles.analysisTimestamp}>
              Analyzed{" "}
              {new Date(dream.analysis.analyzedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>
          </View>
        ) : (
          <Card style={styles.noAnalysisCard}>
  <Ionicons name="hourglass-outline" size={32} color={COLORS.textSecondary} style={{ marginBottom: SPACING.sm }} />
  <Text style={styles.noAnalysisText}>
    AI analysis in progress...
  </Text>
</Card>
        )}

        {/* Delete Button */}
        <View style={styles.deleteSection}>
          <Button
            title=""
            onPress={deleteDream}
            variant="danger"
            icon={
              <Ionicons name="trash" size={22} color={COLORS.textPrimary} />
            }
          />
        </View>
      </ScrollView>
      <Modal
        visible={showReanalyzeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReanalyzeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons
              name="refresh"
              size={48}
              color={COLORS.primary}
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>Re-analyze Dream</Text>
            <Text style={styles.modalText}>
              This will generate a fresh AI analysis of your dream. Continue?
            </Text>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowReanalyzeModal(false)}
                variant="ghost"
                style={styles.modalButton}
              />
              <Button
                title="Re-analyze"
                onPress={confirmReanalyze}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ NEW: Delete Dream Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons
              name="warning"
              size={48}
              color={COLORS.error}
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>Delete Dream</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete this dream? This action cannot be
              undone.
            </Text>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowDeleteModal(false)}
                variant="ghost"
                style={styles.modalButton}
              />
              <Button
                title="Delete"
                onPress={confirmDeleteDream}
                variant="danger"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.md,
    marginTop: SPACING.md,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.lg,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: SPACING.xl,
    paddingTop: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl - 4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  date: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
  },
  lucidBadge: {
    backgroundColor: "#1a3229",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  lucidText: {
    color: COLORS.success,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  section: {
    padding: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  content: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    lineHeight: 26,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  tag: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  aiSection: {
    padding: SPACING.xl,
    paddingTop: SPACING.sm,
  },
  aiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  aiTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  reanalyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SPACING.xs,
  },
  reanalyzeText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  potentialContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  potentialBadge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
  },
  potentialText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: 1,
  },
  analysisCard: {
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  cardDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  chip: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
  },
  themeChip: {
    backgroundColor: COLORS.secondary,
  },
  emotionChip: {
    backgroundColor: "#ec4899",
  },
  chipText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  insightText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  suggestionItem: {
    flexDirection: "row",
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  suggestionNumber: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  suggestionText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  analysisTimestamp: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    textAlign: "center",
    marginTop: SPACING.sm,
    fontStyle: "italic",
  },
  noAnalysisCard: {
    margin: SPACING.xl,
    padding: SPACING.xxxl,
    alignItems: "center",
  },
  noAnalysisText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  noAnalysisSubtext: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textTertiary,
    textAlign: "center",
  },
  deleteSection: {
    padding: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxxl + 10,
  },
  deleteWarning: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.xs,
    textAlign: "center",
    marginTop: SPACING.sm,
    fontStyle: "italic",
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
  analysisPrompt: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  analysisPromptContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  analysisPromptText: {
    flex: 1,
  },
  analysisPromptTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  analysisPromptDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  aiTitleContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: SPACING.sm,
},
cardTitleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: SPACING.sm,
  marginBottom: SPACING.sm,
},
});
