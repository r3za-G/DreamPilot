import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../firebaseConfig";
import { useData } from "../contexts/DataContext";
import Card from "../components/Card";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { userData, dreams, loading, isPremium } = useData();
  const [exporting, setExporting] = useState(false);

  const exportDreams = async () => {
    try {
      setExporting(true);
      const user = auth.currentUser;
      if (!user) return;

      if (dreams.length === 0) {
        hapticFeedback.warning();
        Alert.alert("No Dreams", "You have no dreams to export yet.");
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

      await Share.share({
        message: textContent,
        title: "Dream Journal Export",
      });
      hapticFeedback.success();
    } catch (error) {
      console.error("Error exporting dreams:", error);
      hapticFeedback.error();
      Alert.alert("Error", "Failed to export dreams. Please try again.");
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
        Alert.alert("No Dreams", "You have no dreams to export yet.");
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

      await Share.share({
        message: JSON.stringify(exportData, null, 2),
        title: "Dream Journal Export (JSON)",
      });
      hapticFeedback.success();
    } catch (error) {
      console.error("Error exporting dreams:", error);
      hapticFeedback.error();
      Alert.alert("Error", "Failed to export dreams. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const showExportOptions = () => {
    hapticFeedback.light();
    Alert.alert("Export Dreams", "Choose export format", [
      {
        text: "Text File (.txt)",
        onPress: exportDreams,
      },
      {
        text: "JSON File (.json)",
        onPress: exportDreamsJSON,
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
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
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarIcon}>🌙</Text>
          </View>
          <Text style={styles.userName}>
            {userData?.firstName && userData?.lastName
              ? `${userData.firstName} ${userData.lastName}`
              : userData?.firstName || "Dreamer"}
          </Text>

          {/* Premium Badge */}
          {isPremium ? (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={14} color={COLORS.textPrimary} />
              <Text style={styles.premiumBadgeText}>Premium Member</Text>
            </View>
          ) : (
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>Free Plan</Text>
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
                  <Text style={styles.upgradeCardIcon}>⭐</Text>
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
                  <Ionicons name="star" size={24} color={COLORS.primary} />
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
                <Ionicons name="settings" size={24} color={COLORS.primary} />
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
                <Ionicons
                  name="notifications"
                  size={24}
                  color={COLORS.warning}
                />
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
                <Ionicons name="download" size={24} color={COLORS.success} />
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
    fontSize: 48,
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
    marginLeft: SPACING.md,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  footer: {
    height: SPACING.xxxl,
  },
});
