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
  KeyboardAvoidingView,
  Platform,
  Linking,
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
  updateDoc,
} from "firebase/firestore";
import * as Notifications from "expo-notifications";
import { useData } from "../contexts/DataContext";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";
import { useToast } from "../contexts/ToastContext"; // ✅ Add this import

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const user = auth.currentUser;
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const { userData, refreshUserData } = useData();
  const toast = useToast(); // ✅ Add this hook

  const openPrivacyPolicy = () => {
    hapticFeedback.light();
    Linking.openURL("https://r3za-g.github.io/dreampilot-privacy/");
  };

  const openTermsOfService = () => {
    hapticFeedback.light();
    Linking.openURL("https://r3za-g.github.io/dreampilot-privacy/terms.html");
  };

  const handleLogout = () => {
    hapticFeedback.warning();
    // ✅ Keep Alert for confirmation
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
            hapticFeedback.success();
            toast.success("Logged out successfully"); // ✅ Toast
          } catch (error) {
            console.error("Error logging out:", error);
            hapticFeedback.error();
            toast.error("Failed to logout. Please try again"); // ✅ Toast
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    hapticFeedback.warning();
    // ✅ Keep Alert for destructive action
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
    setShowPasswordModal(true);
  };

  const handleDeleteWithPassword = async () => {
    if (!passwordInput.trim()) {
      hapticFeedback.error();
      toast.error("Password is required to delete your account"); // ✅ Toast
      return;
    }

    try {
      setLoading(true);
      setShowPasswordModal(false);

      if (!user || !user.email) {
        toast.error("User not found"); // ✅ Toast
        setLoading(false);
        return;
      }

      const credential = EmailAuthProvider.credential(
        user.email,
        passwordInput
      );
      await reauthenticateWithCredential(user, credential);
      await deleteUser(user);
      await deleteUserData(user.uid);
      hapticFeedback.success();
      toast.success("Account deleted successfully"); // ✅ Toast
    } catch (error: any) {
      console.error("Error deleting account:", error);
      hapticFeedback.error();
      setShowPasswordModal(true);

      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential" ||
        error.code === "auth/invalid-email"
      ) {
        toast.error("Incorrect password. Please try again"); // ✅ Toast
      } else if (error.code === "auth/requires-recent-login") {
        toast.warning("Please logout and login again, then try deleting", 5000); // ✅ Toast
      } else {
        toast.error(
          `Failed to delete account: ${error.message || "Unknown error"}`
        ); // ✅ Toast
      }
    } finally {
      setLoading(false);
      setPasswordInput("");
    }
  };

  const deleteUserData = async (userId: string) => {
    try {
      const dreamsQuery = query(
        collection(db, "dreams"),
        where("userId", "==", userId)
      );
      const dreamsSnapshot = await getDocs(dreamsQuery);
      const deletePromises = dreamsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);
      await deleteDoc(doc(db, "users", userId));
      console.log("All user data deleted successfully");
    } catch (error) {
      console.error("Error deleting user data:", error);
      throw error;
    }
  };

  const toggleNotifications = async (value: boolean) => {
    hapticFeedback.light();
    setNotificationsEnabled(value);

    if (!value) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      toast.info("All reality check reminders cancelled"); // ✅ Toast
    } else {
      toast.info("Go to Reality Check Reminders to set up your schedule"); // ✅ Toast
    }
  };

  const handleEditProfile = () => {
    hapticFeedback.light();
    setEditFirstName(userData?.firstName || "");
    setEditLastName(userData?.lastName || "");
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editFirstName.trim()) {
      hapticFeedback.error();
      toast.error("Please enter your first name"); // ✅ Toast
      return;
    }

    if (!editLastName.trim()) {
      hapticFeedback.error();
      toast.error("Please enter your last name"); // ✅ Toast
      return;
    }

    try {
      setEditLoading(true);

      if (!user) {
        toast.error("User not found"); // ✅ Toast
        return;
      }

      await updateDoc(doc(db, "users", user.uid), {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
      });

      setShowEditModal(false);
      hapticFeedback.success();

      toast.success("Profile updated successfully! ✅"); // ✅ Toast

      if (refreshUserData) {
        await refreshUserData();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      hapticFeedback.error();
      toast.error("Failed to update profile. Please try again"); // ✅ Toast
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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

          <Card style={styles.infoCard}>
            <Ionicons name="person-circle" size={24} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>
                {user?.email || "Not available"}
              </Text>
            </View>
          </Card>

          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <Card>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="moon" size={22} color={COLORS.textSecondary} />
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={
                  notificationsEnabled
                    ? COLORS.textPrimary
                    : COLORS.textSecondary
                }
              />
            </View>
          </Card>
        </View>

        {/* Data & Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>

          <TouchableOpacity onPress={openPrivacyPolicy} activeOpacity={0.7}>
            <Card style={styles.settingCardMargin}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <MaterialIcons
                    name="privacy-tip"
                    size={22}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.settingText}>Privacy Policy</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.textTertiary}
                />
              </View>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity onPress={openTermsOfService} activeOpacity={0.7}>
            <Card>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <MaterialIcons
                    name="description"
                    size={22}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.settingText}>Terms of Service</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.textTertiary}
                />
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <Card>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons
                  name="information-circle"
                  size={22}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.settingText}>App Version</Text>
              </View>
              <Text style={styles.versionText}>1.0.0</Text>
            </View>
          </Card>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="secondary"
            icon={
              <Ionicons
                name="log-out-outline"
                size={22}
                color={COLORS.warning}
              />
            }
            style={styles.logoutButton}
            textStyle={styles.logoutText}
          />

          <Button
            title="Delete Account"
            onPress={handleDeleteAccount}
            variant="danger"
            icon={
              <MaterialIcons
                name="delete-forever"
                size={22}
                color={COLORS.textPrimary}
              />
            }
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Dream Pilot</Text>
          <Text style={styles.footerSubtext}>
            Your journey to lucid dreaming
          </Text>
        </View>
      </ScrollView>

      {/* Delete Account Modal */}
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
          <View style={styles.modalContent}>
            <Ionicons
              name="warning"
              size={48}
              color={COLORS.error}
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>Confirm Deletion</Text>
            <Text style={styles.modalText}>
              Enter your password to permanently delete your account and all
              data:
            </Text>

            <Input
              placeholder="Password"
              value={passwordInput}
              onChangeText={setPasswordInput}
              secureTextEntry
              autoCapitalize="none"
              icon="lock-closed-outline"
              containerStyle={styles.modalInput}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowPasswordModal(false);
                  setPasswordInput("");
                }}
                variant="ghost"
                style={styles.modalButton}
              />
              <Button
                title="Delete Forever"
                onPress={handleDeleteWithPassword}
                variant="danger"
                style={styles.modalButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowEditModal(false);
                hapticFeedback.light();
              }}
            >
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <Ionicons
              name="person-circle"
              size={48}
              color={COLORS.primary}
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Text style={styles.modalText}>
              Update your first and last name
            </Text>

            <Input
              placeholder="First name"
              value={editFirstName}
              onChangeText={setEditFirstName}
              autoCapitalize="words"
              icon="person-outline"
              containerStyle={styles.modalInput}
            />

            <Input
              placeholder="Last name"
              value={editLastName}
              onChangeText={setEditLastName}
              autoCapitalize="words"
              icon="person-outline"
              containerStyle={styles.modalInput}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowEditModal(false)}
                variant="ghost"
                style={styles.modalButton}
              />
              <Button
                title="Save"
                onPress={handleSaveProfile}
                loading={editLoading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
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
    fontSize: TYPOGRAPHY.sizes.lg,
    marginTop: SPACING.md,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  infoContent: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  settingCardMargin: {
    marginBottom: SPACING.sm,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
  },
  versionText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textTertiary,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SPACING.sm,
  },
  editButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  logoutButton: {
    marginBottom: SPACING.sm,
    borderColor: COLORS.warning,
  },
  logoutText: {
    color: COLORS.warning,
  },
  footer: {
    alignItems: "center",
    padding: SPACING.xxxl,
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  footerSubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    fontStyle: "italic",
  },
  // Modal styles
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
  closeButton: {
    position: "absolute",
    top: SPACING.lg,
    right: SPACING.lg,
    padding: SPACING.sm,
    zIndex: 1,
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
  modalInput: {
    width: "100%",
    marginBottom: SPACING.sm,
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
});
