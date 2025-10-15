import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import {
  DreamAnalysis,
  analyzeDream,
  saveDreamAnalysis,
} from "../services/dreamAnalysisService";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useData } from "../contexts/DataContext";
import Card from "../components/Card";
import Button from "../components/Button";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";

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

  useEffect(() => {
    loadDream();
  }, []);

  const loadDream = async () => {
    try {
      const dreamDoc = await getDoc(doc(db, "dreams", dreamId));
      if (dreamDoc.exists()) {
        setDream(dreamDoc.data() as Dream);
      }
    } catch (error) {
      console.error("Error loading dream:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async () => {
    if (!dream) return;

    hapticFeedback.light();
    Alert.alert(
      "Re-analyze Dream",
      "This will generate a fresh AI analysis of your dream. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Re-analyze",
          onPress: async () => {
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
                Alert.alert(
                  "Analysis Complete! 🎉",
                  "Your dream has been re-analyzed with fresh insights.",
                  [{ text: "Great!" }]
                );
              } else {
                hapticFeedback.error();
                Alert.alert(
                  "Error",
                  "Failed to analyze dream. Please try again."
                );
              }
            } catch (error) {
              console.error("Error re-analyzing dream:", error);
              hapticFeedback.error();
              Alert.alert("Error", "Something went wrong. Please try again.");
            } finally {
              setReanalyzing(false);
            }
          },
        },
      ]
    );
  };

  const deleteDream = async () => {
    hapticFeedback.warning();
    Alert.alert(
      "Delete Dream",
      "Are you sure you want to delete this dream? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteDoc(doc(db, "dreams", dreamId));
              await refreshDreams();

              hapticFeedback.success();
              navigation.goBack();

              Alert.alert(
                "Dream Deleted",
                "Your dream has been removed from your journal."
              );
            } catch (error) {
              console.error("Error deleting dream:", error);
              hapticFeedback.error();
              Alert.alert("Error", "Failed to delete dream. Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
      >
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
              <Text style={styles.aiTitle}>🤖 AI Analysis</Text>
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
            <Card>
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
                <Text style={styles.cardTitle}>🎯 Dream Signs</Text>
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
                <Text style={styles.cardTitle}>💭 Themes</Text>
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
                <Text style={styles.cardTitle}>❤️ Emotions</Text>
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
              <Text style={styles.cardTitle}>💡 Insights</Text>
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
            <Text style={styles.noAnalysisText}>
              🤖 AI analysis in progress...
            </Text>
            <Text style={styles.noAnalysisSubtext}>
              Check back in a moment for insights about this dream
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
              <MaterialIcons
                name="delete"
                size={24}
                color={COLORS.textPrimary}
              />
            }
          />
          <Text style={styles.deleteWarning}>This action cannot be undone</Text>
        </View>
      </ScrollView>
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
    marginBottom: SPACING.sm,
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
});
