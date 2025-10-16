import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Share,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../firebaseConfig";
import { useData } from "../contexts/DataContext";
import Card from "../components/Card";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToast } from "../contexts/ToastContext"; // ✅ Add this import
import Button from "../components/Button";

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { userData, dreams, loading, isPremium } = useData();
  const [exporting, setExporting] = useState(false);
  const toast = useToast(); // ✅ Add this hook
  const insets = useSafeAreaInsets();
  const [showExportModal, setShowExportModal] = useState(false); // ✅ NEW

  const exportDreams = async () => {
    console.log("🔍 Export started");

    try {
      setExporting(true);
      const user = auth.currentUser;

      if (!user) {
        console.log("❌ No user found");
        return;
      }

      if (dreams.length === 0) {
        hapticFeedback.warning();
        toast.warning("No dreams to export yet");
        return;
      }

      let textContent = `Dream Journal Export\n`;
      textContent += `User: ${
        userData?.firstName && userData?.lastName
          ? `${userData.firstName} ${userData.lastName}`
          : userData?.firstName || "Dreamer"
      }\n`;
      textContent += `Exported: ${new Date().toLocaleString()}\n`;
      textContent += `Total Dreams: ${dreams.length}\n`;
      textContent += `\n${"=".repeat(50)}\n\n`;

      dreams.forEach((dream, index) => {
        const date = new Date(dream.createdAt).toLocaleString();
        textContent += `Dream #${index + 1}\n`;
        textContent += `Date: ${date}\n`;
        textContent += `Title: ${dream.title}\n`;
        textContent += `Lucid: ${dream.isLucid ? "Yes ✨" : "No"}\n`;
        if (dream.tags && dream.tags.length > 0) {
          textContent += `Tags: ${dream.tags.join(", ")}\n`;
        }
        textContent += `\n${dream.content}\n`;
        textContent += `\n${"-".repeat(50)}\n\n`;
      });

      console.log("📝 Text content length:", textContent.length);

      // ✅ Simple Share.share - works everywhere
      try {
        const result = await Share.share({
          message: textContent,
        });

        console.log("✅ Share result:", result);

        if (result.action === Share.sharedAction) {
          hapticFeedback.success();
          toast.success(`Exported ${dreams.length} dreams! 📄`);
        }
      } catch (shareError: any) {
        console.error("Share error:", shareError);
        throw shareError;
      }
    } catch (error: any) {
      console.error("❌ Export error:", error);
      hapticFeedback.error();
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const exportDreamsJSON = async () => {
    try {
      setExporting(true);
      const user = auth.currentUser;
      if (!user) return;

      if (dreams.length === 0) {
        hapticFeedback.warning();
        toast.warning("No dreams to export yet");
        return;
      }

      const exportData = {
        user: {
          firstName: userData?.firstName || "",
          lastName: userData?.lastName || "",
          fullName:
            userData?.firstName && userData?.lastName
              ? `${userData.firstName} ${userData.lastName}`
              : userData?.firstName || "Dreamer",
          email: userData?.email || user.email || "",
        },
        exportDate: new Date().toISOString(),
        totalDreams: dreams.length,
        dreams: dreams,
      };

      const jsonContent = JSON.stringify(exportData, null, 2);

      // ✅ Simple Share.share
      const result = await Share.share({
        message: jsonContent,
      });

      if (result.action === Share.sharedAction) {
        hapticFeedback.success();
        toast.success(`Exported ${dreams.length} dreams as JSON! 📊`);
      }
    } catch (error: any) {
      console.error("❌ JSON Export error:", error);
      hapticFeedback.error();
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const showExportOptions = () => {
    hapticFeedback.light();
    setShowExportModal(true); // ✅ Show modal instead of Alert
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Image
                source={require("../../assets/app_icons/icon.png")}
                style={styles.avatarIcon}
              />
            </View>
            <Text style={styles.userName}>
              {userData?.firstName && userData?.lastName
                ? `${userData.firstName} ${userData.lastName}`
                : userData?.firstName || "Dreamer"}
            </Text>

            {/* Premium Badge */}
            {isPremium ? (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            ) : (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>Free</Text>
              </View>
            )}

            <Text style={styles.userEmail}>{userData?.email || ""}</Text>
            <Text style={styles.joinedText}>
              Member since{" "}
              {new Date(userData?.createdAt || new Date()).toLocaleDateString(
                "en-US",
                {
                  month: "long",
                  year: "numeric",
                }
              )}
            </Text>
          </View>

          {/* Upgrade Banner for Free Users */}
          {!isPremium && (
            <View style={styles.upgradeSection}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  hapticFeedback.light();
                  navigation.navigate("Paywall");
                }}
              >
                <Card variant="highlighted">
                  <View style={styles.upgradeCardContent}>
                    <View style={styles.upgradeCardText}>
                      <Text style={styles.upgradeCardTitle}>
                        Upgrade to Premium
                      </Text>
                      <Text style={styles.upgradeCardSubtitle}>
                        Unlock unlimited dreams, AI insights & more
                      </Text>
                    </View>
                    <Ionicons
                      name="arrow-forward"
                      size={24}
                      color={COLORS.primary}
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Account</Text>

            {/* Manage Subscription for Premium Users */}
            {isPremium && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  hapticFeedback.light();
                  navigation.navigate("Paywall");
                }}
                style={styles.actionWrapper}
              >
                <Card>
                  <View style={styles.actionButton}>
                    <Text style={styles.actionText}>Manage Subscription</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={COLORS.textTertiary}
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                hapticFeedback.light();
                navigation.navigate("Settings");
              }}
              style={styles.actionWrapper}
            >
              <Card>
                <View style={styles.actionButton}>
                  <Text style={styles.actionText}>Settings</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.textTertiary}
                  />
                </View>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                hapticFeedback.light();
                navigation.navigate("RealityCheck");
              }}
              style={styles.actionWrapper}
            >
              <Card>
                <View style={styles.actionButton}>
                  <Text style={styles.actionText}>Reality Check Reminders</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.textTertiary}
                  />
                </View>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={showExportOptions}
              disabled={exporting}
            >
              <Card style={exporting ? styles.actionButtonDisabled : undefined}>
                <View style={styles.actionButton}>
                  <Text style={styles.actionText}>
                    {exporting ? "Exporting..." : "Export Dream Journal"}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.textTertiary}
                  />
                </View>
              </Card>
            </TouchableOpacity>
          </View>

          <View style={styles.footer} />
        </ScrollView>
        {/* ✅ NEW: Export Options Modal */}
        <Modal
          visible={showExportModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowExportModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons
                name="download"
                size={48}
                color={COLORS.success}
                style={styles.modalIcon}
              />
              <Text style={styles.modalTitle}>Export Dreams</Text>
              <Text style={styles.modalText}>
                Choose your preferred export format
              </Text>

              <View style={styles.exportButtonsContainer}>
                <Button
                  title="Text File (.txt)"
                  onPress={() => {
                    setShowExportModal(false);
                    exportDreams();
                  }}
                  variant="secondary"
                  icon={
                    <Ionicons
                      name="document-text"
                      size={20}
                      color={COLORS.primary}
                    />
                  }
                  style={styles.exportButton}
                />

                <Button
                  title="JSON File (.json)"
                  onPress={() => {
                    setShowExportModal(false);
                    exportDreamsJSON();
                  }}
                  variant="secondary"
                  icon={
                    <Ionicons name="code" size={20} color={COLORS.primary} />
                  }
                  style={styles.exportButton}
                />

                <Button
                  title="Cancel"
                  onPress={() => setShowExportModal(false)}
                  variant="ghost"
                  style={styles.exportButton}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    padding: SPACING.xxxl,
    paddingTop: SPACING.xxxl + 10,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userName: {
    fontSize: TYPOGRAPHY.sizes.xxxl - 4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  premiumBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  freeBadge: {
    backgroundColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    marginBottom: SPACING.sm,
  },
  freeBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textSecondary,
  },
  userEmail: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  joinedText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
  },
  upgradeSection: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  upgradeCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  upgradeCardIcon: {
    fontSize: 40,
  },
  upgradeCardText: {
    flex: 1,
  },
  upgradeCardTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  upgradeCardSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  actionsSection: {
    paddingHorizontal: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  actionWrapper: {
    marginBottom: SPACING.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  footer: {
    height: SPACING.xxxl,
  },
  // Add to your existing styles object
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
  exportButtonsContainer: {
    width: "100%",
    gap: SPACING.sm,
  },
  exportButton: {
    width: "100%",
  },
});
