import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Button from "../components/Button";
import Input from "../components/Input";
import { COLORS, SPACING, TYPOGRAPHY } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";

type SignUpScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function SignUpScreen({ navigation }: SignUpScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);

  // Error states
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async () => {
    // Clear previous errors
    setFirstNameError("");
    setLastNameError("");
    setEmailError("");
    setPasswordError("");

    // Validation
    let hasError = false;

    if (!firstName.trim()) {
      setFirstNameError("First name is required");
      hasError = true;
    }

    if (!lastName.trim()) {
      setLastNameError("Last name is required");
      hasError = true;
    }

    if (!email.trim()) {
      setEmailError("Email is required");
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Password is required");
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      hasError = true;
    }

    if (hasError) {
      hapticFeedback.error();
      return;
    }

    setLoading(true);

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Create Firestore document
      await setDoc(doc(db, "users", userCredential.user.uid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        createdAt: new Date().toISOString(),
        currentStreak: 0,
        totalDreams: 0,
        lucidDreams: 0,
        currentLevel: 1,
        isPremium: false,
        lastDreamDate: "",
      });

      // Clear onboarding flag for new users
      await AsyncStorage.removeItem("onboardingCompleted");

      hapticFeedback.success();
      // Navigation will happen automatically via auth state change
    } catch (error: any) {
      console.error("Sign up error:", error);
      hapticFeedback.error();

      if (error.code === "auth/email-already-in-use") {
        setEmailError("This email is already registered");
      } else if (error.code === "auth/invalid-email") {
        setEmailError("Invalid email address");
      } else if (error.code === "auth/weak-password") {
        setPasswordError("Password is too weak");
      } else {
        setEmailError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.icon}>✨</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Start your lucid dreaming journey
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="First Name"
              placeholder="Enter your first name"
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                setFirstNameError("");
              }}
              autoCapitalize="words"
              icon="person-outline"
              error={firstNameError}
            />

            <Input
              label="Last Name"
              placeholder="Enter your last name"
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                setLastNameError("");
              }}
              autoCapitalize="words"
              icon="person-outline"
              error={lastNameError}
            />

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
              placeholder="At least 6 characters"
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

            {/* Sign Up Button */}
            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
              style={styles.signupButton}
            />

            {/* Login Link */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => {
                hapticFeedback.light();
                navigation.navigate("Login");
              }}
            >
              <Text style={styles.loginText}>
                Already have an account?{" "}
                <Text style={styles.loginTextBold}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    gap: SPACING.sm,
  },
  signupButton: {
    marginTop: SPACING.lg,
  },
  loginButton: {
    alignItems: "center",
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  loginText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  loginTextBold: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
