import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../firebaseConfig";
import {
  signOut,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import {
  doc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import * as Notifications from "expo-notifications";

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false); // ✅ Modal state
  const [passwordInput, setPasswordInput] = useState(""); // ✅ Password input
  const user = auth.currentUser;

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await signOut(auth);
            // Navigation will be handled by auth state listener in App.tsx
          } catch (error) {
            console.error("Error logging out:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "⚠️ WARNING: This will permanently delete your account and all data including:\n\n• All dream journal entries\n• Your progress and achievements\n• All settings and preferences\n\nThis action cannot be undone!",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "I understand, delete my account",
          style: "destructive",
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    // ✅ Show password modal instead of Alert.prompt
    setShowPasswordModal(true);
  };

  // ✅ Handle delete with password re-authentication
  const handleDeleteWithPassword = async () => {
    if (!passwordInput.trim()) {
      Alert.alert("Error", "Password is required to delete your account.");
      return;
    }

    try {
      setLoading(true);
      setShowPasswordModal(false);

      if (!user || !user.email) {
        Alert.alert("Error", "User not found.");
        setLoading(false);
        return;
      }

      // ✅ Re-authenticate user with their password
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordInput
      );
      await reauthenticateWithCredential(user, credential);

      // ✅ Delete all user data from Firestore
      await deleteUserData(user.uid);

      // ✅ Delete the Firebase Auth account
      await deleteUser(user);

      // ✅ Auth state listener will handle navigation automatically
    } catch (error: any) {
      console.error("Error deleting account:", error);

      // ✅ Show modal again so user can retry
      setShowPasswordModal(true);

      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential" ||
        error.code === "auth/invalid-email"
      ) {
        Alert.alert(
          "Incorrect Password",
          "The password you entered is incorrect. Please try again."
        );
      } else if (error.code === "auth/requires-recent-login") {
        Alert.alert(
          "Re-authentication Required",
          "For security, please logout and login again, then try deleting your account."
        );
      } else {
        Alert.alert("Error", "Failed to delete account. Please try again.");
      }
    } finally {
      setLoading(false);
      setPasswordInput(""); // Clear password for retry
    }
  };

  const deleteUserData = async (userId: string) => {
    try {
      // Delete all dreams
      const dreamsQuery = query(
        collection(db, "dreams"),
        where("userId", "==", userId)
      );
      const dreamsSnapshot = await getDocs(dreamsQuery);
      const deletePromises = dreamsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      // Delete user profile data
      await deleteDoc(doc(db, "users", userId));

      console.log("All user data deleted successfully");
    } catch (error) {
      console.error("Error deleting user data:", error);
      throw error;
    }
  };

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);

    if (!value) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      Alert.alert(
        "Notifications Disabled",
        "All reality check reminders have been cancelled."
      );
    } else {
      Alert.alert(
        "Notifications Enabled",
        "Go to Reality Check Reminders in Settings to set up your schedule."
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Processing...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.infoCard}>
            <Ionicons name="person-circle" size={24} color="#6366f1" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>
                {user?.email || "Not available"}
              </Text>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon" size={22} color="#888" />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: "#333", true: "#6366f1" }}
              thumbColor={notificationsEnabled ? "#fff" : "#888"}
            />
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="privacy-tip" size={22} color="#888" />
              <Text style={styles.settingText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="description" size={22} color="#888" />
              <Text style={styles.settingText}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle" size={22} color="#888" />
              <Text style={styles.settingText}>App Version</Text>
            </View>
            <Text style={styles.versionText}>1.0.0</Text>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#f59e0b" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
          >
            <MaterialIcons name="delete-forever" size={22} color="#ef4444" />
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Dream Pilot</Text>
          <Text style={styles.footerSubtext}>
            Your journey to lucid dreaming
          </Text>
        </View>
      </ScrollView>
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowPasswordModal(false);
          setPasswordInput("");
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              // Optional: close modal when tapping outside
              // setShowPasswordModal(false);
              // setPasswordInput("");
            }}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.modalContent}>
                <Ionicons
                  name="warning"
                  size={48}
                  color="#ef4444"
                  style={styles.modalIcon}
                />
                <Text style={styles.modalTitle}>Confirm Deletion</Text>
                <Text style={styles.modalText}>
                  Enter your password to permanently delete your account and all
                  data:
                </Text>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  placeholderTextColor="#666"
                  secureTextEntry
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleDeleteWithPassword}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => {
                      setShowPasswordModal(false);
                      setPasswordInput("");
                    }}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalDeleteButton}
                    onPress={handleDeleteWithPassword}
                  >
                    <Text style={styles.modalDeleteText}>Delete Forever</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
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
  loadingText: {
    color: "#888",
    fontSize: 16,
    marginTop: 10,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  settingItem: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: "#fff",
    marginLeft: 15,
  },
  versionText: {
    fontSize: 14,
    color: "#666",
  },
  logoutButton: {
    backgroundColor: "#2a2410",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#f59e0b",
  },
  logoutText: {
    fontSize: 16,
    color: "#f59e0b",
    fontWeight: "600",
    marginLeft: 10,
  },
  deleteButton: {
    backgroundColor: "#3a1a1a",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#ef4444",
  },
  deleteText: {
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "600",
    marginLeft: 10,
  },
  footer: {
    alignItems: "center",
    padding: 40,
    marginTop: 20,
  },
  footerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6366f1",
    marginBottom: 5,
  },
  footerSubtext: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  // ✅ Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    borderWidth: 1,
    borderColor: "#ef4444",
    alignItems: "center",
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  modalText: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 20,
    lineHeight: 20,
    textAlign: "center",
  },
  passwordInput: {
    backgroundColor: "#0f0f23",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
    width: 280, // ✅ Fixed width in pixels
    height: 50, // ✅ Fixed height
    alignSelf: "center",
  },

  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#333",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: "#ef4444",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalDeleteText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
