import React from "react";
import { StyleSheet, Text, View, Image } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Card from "../components/Card";
import Button from "../components/Button";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0f0f23", "#1a1a3e", "#2d1b4e"]}
        style={styles.gradient}
      >
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/app_icons/icon.png")}
              style={styles.avatarIcon}
            />
          </View>
          <Text style={styles.title}>Dream Pilot</Text>
          <Text style={styles.tagline}>Master the Art of Lucid Dreaming</Text>
        </View>

        <View style={styles.aiBannerWrapper}>
          <Card style={styles.aiBanner}>
            <Ionicons name="sparkles" size={28} color={COLORS.warning} />
            <View style={styles.aiContent}>
              <Text style={styles.aiTitle}>Powered by AI</Text>
              <Text style={styles.aiDescription}>
                Get personalised dream insights & analysis
              </Text>
            </View>
          </Card>
        </View>

        <View style={styles.featuresGrid}>
          <Card style={styles.miniFeature}>
            <View style={styles.miniFeatureIconContainer}>
              <Ionicons name="book-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.miniFeatureText}>Dream Journal</Text>
          </Card>

          <Card style={styles.miniFeature}>
            <View style={styles.miniFeatureIconContainer}>
              <Ionicons
                name="school-outline"
                size={28}
                color={COLORS.secondary}
              />
            </View>
            <Text style={styles.miniFeatureText}>Learn Techniques</Text>
          </Card>

          <Card style={styles.miniFeature}>
            <View style={styles.miniFeatureIconContainer}>
              <Ionicons
                name="trophy-outline"
                size={28}
                color={COLORS.warning}
              />
            </View>
            <Text style={styles.miniFeatureText}>Track Progress</Text>
          </Card>
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottomSection}>
          <Button
            title="Get Started"
            onPress={() => {
              hapticFeedback.medium();
              navigation.navigate("Signup");
            }}
            style={styles.primaryButton}
          />

          <Button
            title="I Already Have an Account"
            onPress={() => {
              hapticFeedback.light();
              navigation.navigate("Login");
            }}
            variant="secondary"
          />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradient: {
    flex: 1,
    paddingVertical: SPACING.xxxl * 2,
  },
  topSection: {
    alignItems: "center",
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  logoIcon: {
    fontSize: 54,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl + 4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingHorizontal: SPACING.xxxl + 10,
  },
  aiBannerWrapper: {
    marginHorizontal: SPACING.xxxl,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  aiBanner: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 2,
    borderColor: COLORS.warning,
    flexDirection: "row",
    alignItems: "center",
  },
  aiContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  aiTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.warning,
    marginBottom: SPACING.xs / 2,
  },
  aiDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  featuresGrid: {
    flexDirection: "row",
    paddingHorizontal: SPACING.xxxl,
    gap: SPACING.md,
  },
  miniFeature: {
    flex: 1,
    backgroundColor: "rgba(26, 26, 46, 0.6)",
    padding: SPACING.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  // ✅ NEW: Icon container
  miniFeatureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  miniFeatureText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: SPACING.xxxl,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  primaryButton: {
    ...SHADOWS.large,
  },
  avatarIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
});
