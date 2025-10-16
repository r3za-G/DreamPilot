import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
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
import { useToast } from "../contexts/ToastContext";

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // ✅ NEW
  const [showDeleteModal, setShowDeleteModal] = useState(false); // ✅ NEW
  const [passwordInput, setPasswordInput] = useState("");
  const user = auth.currentUser;
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const { userData, refreshUserData } = useData();
  const toast = useToast();

  const openPrivacyPolicy = () => {
    hapticFeedback.light();
    Linking.openURL("https://r3za-g.github.io/dreampilot-privacy/");
  };

  const openTermsOfService = () => {
    hapticFeedback.light();
    Linking.openURL("https://r3za-g.github.io/dreampilot-privacy/terms.html");
  };

  // ✅ UPDATED: Show modal instead of Alert
  const handleLogout = () => {
    hapticFeedback.warning();
    setShowLogoutModal(true);
  };

  // ✅ NEW: Confirm logout
  const confirmLogout = async () => {
    try {
      setLoading(true);
      setShowLogoutModal(false);
      await signOut(auth);
      hapticFeedback.success();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Error logging out:", error);
      hapticFeedback.error();
      toast.error("Failed to logout. Please try again");
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Show modal instead of Alert
  const handleDeleteAccount = () => {
    hapticFeedback.warning();
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = () => {
    setShowDeleteModal(false);
    setShowPasswordModal(true);
  };

  const handleDeleteWithPassword = async () => {
    if (!passwordInput.trim()) {
      hapticFeedback.error();
      toast.error("Password is required to delete your account");
      return;
    }

    try {
      setLoading(true);
      setShowPasswordModal(false);

      if (!user || !user.email) {
        toast.error("User not found");
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
      toast.success("Account deleted successfully");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      hapticFeedback.error();
      setShowPasswordModal(true);

      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential" ||
        error.code === "auth/invalid-email"
      ) {
        toast.error("Incorrect password. Please try again");
      } else if (error.code === "auth/requires-recent-login") {
        toast.warning("Please logout and login again, then try deleting", 5000);
      } else {
        toast.error(
          `Failed to delete account: ${error.message || "Unknown error"}`
        );
      }
    } finally {
      setLoading(false);
      setPasswordInput("");
    }
  };

  const deleteUserData = async (userId: string) => {
    try {
      console.log("🗑️ Starting complete user data deletion for:", userId);

      // ✅ 1. Delete all dreams
      console.log("📖 Deleting dreams...");
      const dreamsQuery = query(
        collection(db, "dreams"),
        where("userId", "==", userId)
      );
      const dreamsSnapshot = await getDocs(dreamsQuery);
      const dreamDeletePromises = dreamsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(dreamDeletePromises);
      console.log(`✅ Deleted ${dreamsSnapshot.size} dreams`);

      // ✅ 2. Delete xpHistory subcollection
      console.log("📊 Deleting xpHistory...");
      const xpHistoryRef = collection(db, "users", userId, "xpHistory");
      const xpHistorySnapshot = await getDocs(xpHistoryRef);
      const xpDeletePromises = xpHistorySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(xpDeletePromises);
      console.log(`✅ Deleted ${xpHistorySnapshot.size} xpHistory entries`);

      // ✅ 3. Delete data subcollection
      console.log("💾 Deleting data subcollection...");
      const dataRef = collection(db, "users", userId, "data");
      const dataSnapshot = await getDocs(dataRef);
      const dataDeletePromises = dataSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(dataDeletePromises);
      console.log(`✅ Deleted ${dataSnapshot.size} data entries`);

      // ✅ 4. Delete achievements (if you have this)
      console.log("🏆 Deleting achievements...");
      const achievementsQuery = query(
        collection(db, "achievements"),
        where("userId", "==", userId)
      );
      const achievementsSnapshot = await getDocs(achievementsQuery);
      const achievementsDeletePromises = achievementsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(achievementsDeletePromises);
      console.log(`✅ Deleted ${achievementsSnapshot.size} achievements`);

      // ✅ 5. Delete the main user document last
      console.log("👤 Deleting user document...");
      await deleteDoc(doc(db, "users", userId));
      console.log("✅ User document deleted");

      console.log("🎉 All user data deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting user data:", error);
      throw error;
    }
  };

  const toggleNotifications = async (value: boolean) => {
    hapticFeedback.light();
    setNotificationsEnabled(value);

    if (!value) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      toast.info("All reality check reminders cancelled");
    } else {
      toast.info("Go to Reality Check Reminders to set up your schedule");
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
      toast.error("Please enter your first name");
      return;
    }

    if (!editLastName.trim()) {
      hapticFeedback.error();
      toast.error("Please enter your last name");
      return;
    }

    try {
      setEditLoading(true);

      if (!user) {
        toast.error("User not found");
        return;
      }

      await updateDoc(doc(db, "users", user.uid), {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
      });

      setShowEditModal(false);
      hapticFeedback.success();

      toast.success("Profile updated successfully! ✅");

      if (refreshUserData) {
        await refreshUserData();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      hapticFeedback.error();
      toast.error("Failed to update profile. Please try again");
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
              <Ionicons name="trash" size={22} color={COLORS.textPrimary} />
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

      {/* ✅ NEW: Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons
              name="log-out-outline"
              size={48}
              color={COLORS.warning}
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalText}>
              Are you sure you want to logout?
            </Text>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowLogoutModal(false)}
                variant="ghost"
                style={styles.modalButton}
              />
              <Button
                title="Logout"
                onPress={confirmLogout}
                variant="secondary"
                textStyle={{ color: COLORS.warning }}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ NEW: Delete Account Warning Modal */}
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
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalText}>
              ⚠️ WARNING: This will permanently delete your account and all data
              including:{"\n\n"}• All dream journal entries{"\n"}• Your progress
              and achievements{"\n"}• All settings and preferences{"\n\n"}
              This action cannot be undone!
            </Text>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowDeleteModal(false)}
                variant="ghost"
                style={styles.modalButton}
                textStyle={{ fontSize: TYPOGRAPHY.sizes.md }}
              />
              <Button
                title="I understand, delete my account"
                onPress={confirmDeleteAccount}
                variant="danger"
                style={{ flex: 2 }}
                textStyle={{ fontSize: TYPOGRAPHY.sizes.md }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ Delete Account Password Modal (unchanged) */}
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
                textStyle={{ fontSize: TYPOGRAPHY.sizes.md }}
              />
              <Button
                title="Delete Forever"
                onPress={handleDeleteWithPassword}
                variant="danger"
                style={styles.modalButton}
                textStyle={{ fontSize: TYPOGRAPHY.sizes.md }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Profile Modal (unchanged) */}
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

// Styles remain the same
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
    lineHeight: 22,
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
