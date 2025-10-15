import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth"; // ✅ Added sendPasswordResetEmail
import { auth } from "../../firebaseConfig";
import { Ionicons } from "@expo/vector-icons"; // ✅ Added for close icon

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ NEW: Password reset modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Navigation will happen automatically via auth state change
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Failed to log in";

      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        errorMessage = "Invalid email or password";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Handle password reset
  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setResetLoading(true);

    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());

      setShowResetModal(false);
      setResetEmail("");

      Alert.alert(
        "Email Sent! ✅",
        `Password reset instructions have been sent to ${resetEmail.trim()}.\n\nCheck your inbox (and spam folder) and follow the link to reset your password.`,
        [{ text: "OK" }]
      );
    } catch (error: any) {
      console.error("Password reset error:", error);
      let errorMessage = "Failed to send password reset email";

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Please try again later";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  // ✅ NEW: Open reset modal
  const openResetModal = () => {
    setResetEmail(email); // Pre-fill with current email input
    setShowResetModal(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Continue your lucid dreaming practice
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {/* ✅ NEW: Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={openResetModal}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate("Signup")}
          >
            <Text style={styles.linkText}>
              Don't have an account?{" "}
              <Text style={styles.linkTextBold}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ NEW: Password Reset Modal */}
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
              }}
            >
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>

            <Text style={styles.modalIcon}>🔐</Text>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalText}>
              Enter your email address and we'll send you instructions to reset
              your password.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Email address"
              placeholderTextColor="#666"
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoFocus
            />

            <TouchableOpacity
              style={[
                styles.modalButton,
                resetLoading && styles.buttonDisabled,
              ]}
              onPress={handlePasswordReset}
              disabled={resetLoading}
            >
              {resetLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowResetModal(false);
                setResetEmail("");
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 40,
  },
  form: {
    gap: 15,
  },
  input: {
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
  },
  // ✅ NEW: Forgot password button
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginTop: -5,
  },
  forgotPasswordText: {
    color: "#6366f1",
    fontSize: 14,
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#6366f1",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  linkButton: {
    alignItems: "center",
    marginTop: 20,
  },
  linkText: {
    color: "#888",
    fontSize: 14,
  },
  linkTextBold: {
    color: "#6366f1",
    fontWeight: "600",
  },
  // ✅ NEW: Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#6366f1",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 8,
    zIndex: 1,
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  modalText: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 24,
    lineHeight: 20,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: "#0f0f23",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    width: "100%",
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalCancelButton: {
    paddingVertical: 12,
  },
  modalCancelText: {
    color: "#888",
    fontSize: 14,
  },
});
