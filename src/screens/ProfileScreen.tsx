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

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { userData, dreams, loading, isPremium } = useData(); // ✅ Added isPremium
  const [exporting, setExporting] = useState(false);

  const exportDreams = async () => {
    try {
      setExporting(true);
      const user = auth.currentUser;
      if (!user) return;

      if (dreams.length === 0) {
        Alert.alert("No Dreams", "You have no dreams to export yet.");
        return;
      }

      // Format as readable text using cached dreams
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

      // Share directly
      await Share.share({
        message: textContent,
        title: "Dream Journal Export",
      });
    } catch (error) {
      console.error("Error exporting dreams:", error);
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

      // Share JSON as text
      await Share.share({
        message: JSON.stringify(exportData, null, 2),
        title: "Dream Journal Export (JSON)",
      });
    } catch (error) {
      console.error("Error exporting dreams:", error);
      Alert.alert("Error", "Failed to export dreams. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const showExportOptions = () => {
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
        <ActivityIndicator size="large" color="#6366f1" />
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
            {userData?.firstName || "Dreamer"}
          </Text>

          {/* ✅ NEW: Premium badge */}
          {isPremium ? (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={14} color="#fff" />
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
              { month: "long", year: "numeric" }
            )}
          </Text>
        </View>

        {/* ✅ NEW: Upgrade banner for free users */}
        {!isPremium && (
          <TouchableOpacity
            style={styles.upgradeCard}
            onPress={() => navigation.navigate("Paywall")}
          >
            <View style={styles.upgradeCardContent}>
              <Text style={styles.upgradeCardIcon}>⭐</Text>
              <View style={styles.upgradeCardText}>
                <Text style={styles.upgradeCardTitle}>Upgrade to Premium</Text>
                <Text style={styles.upgradeCardSubtitle}>
                  Unlock unlimited dreams, AI insights & more
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={24} color="#6366f1" />
            </View>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Account</Text>

          {/* ✅ NEW: Show "Manage Subscription" for premium users */}
          {isPremium && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("Paywall")}
            >
              <Ionicons name="star" size={24} color="#6366f1" />
              <Text style={styles.actionText}>Manage Subscription</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Settings")}
          >
            <Ionicons name="settings" size={24} color="#6366f1" />
            <Text style={styles.actionText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("RealityCheck")}
          >
            <Ionicons name="notifications" size={24} color="#f59e0b" />
            <Text style={styles.actionText}>Reality Check Reminders</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              exporting && styles.actionButtonDisabled,
            ]}
            onPress={showExportOptions}
            disabled={exporting}
          >
            <Ionicons name="download" size={24} color="#10b981" />
            <Text style={styles.actionText}>
              {exporting ? "Exporting..." : "Export Dream Journal"}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
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
    backgroundColor: "#0f0f23",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0f0f23",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    padding: 30,
    paddingTop: 40,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#6366f1",
  },
  avatarIcon: {
    fontSize: 48,
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  // ✅ NEW: Badge styles
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 10,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  freeBadge: {
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  freeBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#888",
  },
  userEmail: {
    fontSize: 14,
    color: "#888",
    marginBottom: 10,
  },
  joinedText: {
    fontSize: 12,
    color: "#666",
  },
  // ✅ NEW: Upgrade card
  upgradeCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#6366f1",
    overflow: "hidden",
  },
  upgradeCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 15,
  },
  upgradeCardIcon: {
    fontSize: 40,
  },
  upgradeCardText: {
    flex: 1,
  },
  upgradeCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  upgradeCardSubtitle: {
    fontSize: 13,
    color: "#888",
    lineHeight: 18,
  },
  actionsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
    marginLeft: 15,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  footer: {
    height: 40,
  },
});
