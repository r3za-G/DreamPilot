import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import Button from "../components/Button";
import Input from "../components/Input";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";
import { useToast } from "../contexts/ToastContext";

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Password reset modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const toast = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    // Clear previous errors
    setEmailError("");
    setPasswordError("");

    // Validation
    if (!email.trim()) {
      setEmailError("Email is required");
      hapticFeedback.error();
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email");
      hapticFeedback.error();
      return;
    }

    if (!password) {
      setPasswordError("Password is required");
      hapticFeedback.error();
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      hapticFeedback.success();
      // Navigation happens via auth state change
    } catch (error: any) {
      console.error("Login error:", error);
      hapticFeedback.error();

      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        setEmailError("Invalid email or password");
      } else if (error.code === "auth/invalid-email") {
        setEmailError("Invalid email address");
      } else {
        setEmailError("Failed to log in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) {
      hapticFeedback.error();
      return;
    }

    if (!validateEmail(resetEmail)) {
      hapticFeedback.error();
      return;
    }

    setResetLoading(true);

    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());

      setShowResetModal(false);
      setResetEmail("");
      hapticFeedback.success();

      // ✅ Show success via Toast immediately
      toast.success(
        `Check your email! Password reset sent to ${resetEmail.trim()} 📧`,
        5000
      );
    } catch (error: any) {
      console.error("Password reset error:", error);
      hapticFeedback.error();
    } finally {
      setResetLoading(false);
    }
  };

  const openResetModal = () => {
    setResetEmail(email);
    setShowResetModal(true);
    hapticFeedback.light();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require("../../assets/app_icons/icon.png")}
              style={styles.avatarIcon}
            />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Continue your lucid dreaming journey
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError("");
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              icon="mail-outline"
              error={emailError}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError("");
              }}
              secureTextEntry
              autoCapitalize="none"
              icon="lock-closed-outline"
              error={passwordError}
            />

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotButton}
              onPress={openResetModal}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Button
              title="Log In"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            {/* Sign Up Link */}
            <TouchableOpacity
              style={styles.signupButton}
              onPress={() => {
                hapticFeedback.light();
                navigation.navigate("Signup");
              }}
            >
              <Text style={styles.signupText}>
                Don't have an account?{" "}
                <Text style={styles.signupTextBold}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Password Reset Modal */}
      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowResetModal(false);
                setResetEmail("");
                hapticFeedback.light();
              }}
            >
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <Text style={styles.modalIcon}>🔐</Text>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalText}>
              Enter your email address and we'll send you instructions to reset
              your password.
            </Text>

            <Input
              placeholder="Email address"
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              icon="mail-outline"
              containerStyle={styles.modalInput}
            />

            <Button
              title="Send Reset Link"
              onPress={handlePasswordReset}
              loading={resetLoading}
              style={styles.modalButton}
            />

            <Button
              title="Cancel"
              onPress={() => {
                setShowResetModal(false);
                setResetEmail("");
                hapticFeedback.light();
              }}
              variant="ghost"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xxxl,
  },
  icon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  form: {
    gap: SPACING.md,
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  loginButton: {
    marginTop: SPACING.lg,
  },
  signupButton: {
    alignItems: "center",
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  signupText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  signupTextBold: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
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
    fontSize: 48,
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
    marginBottom: SPACING.xxl,
    lineHeight: 20,
    textAlign: "center",
  },
  modalInput: {
    width: "100%",
    marginBottom: SPACING.lg,
  },
  modalButton: {
    width: "100%",
    marginBottom: SPACING.md,
  },
  avatarIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
});
