import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import Card from "../components/Card";
import Button from "../components/Button";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";
import { useToast } from "../contexts/ToastContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { scheduleTrialReminder } from "../utils/notificationManager";

type PaywallScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

// ✅ REWRITTEN: Outcome-focused benefits, not feature lists
const PREMIUM_FEATURES = [
  {
    icon: "infinite-outline",
    title: "Never Lose a Dream",
    description: "Log unlimited dreams forever",
  },
  {
    icon: "sparkles-outline", // Changed from "infinite" for AI
    title: "Unlimited AI Analysis",
    description: "Decode every dream—no limits",
  },
  {
    icon: "school-outline",
    title: "Master Lucid Dreaming",
    description: "Access all 20 expert lessons",
  },
  {
    icon: "trending-up-outline", // Changed from bar-chart for better visual
    title: "Track Your Progress",
    description: "See patterns and milestones",
  },
];

export default function PaywallScreen({ navigation }: PaywallScreenProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>("yearly");
  const [purchasing, setPurchasing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [monthlyPackage, setMonthlyPackage] = useState<any>(null);
  const [yearlyPackage, setYearlyPackage] = useState<any>(null);
  const toast = useToast();

  const {
    purchasePackage,
    restorePurchases,
    getOfferings,
    checkSubscriptionStatus,
  } = useSubscription();

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      setLoading(true);
      const offerings = await getOfferings();

      if (
        offerings?.current &&
        offerings.current.availablePackages.length > 0
      ) {
        const packages = offerings.current.availablePackages;

        const monthly = packages.find(
          (pkg: any) =>
            pkg.identifier === "$rc_monthly" || pkg.packageType === "MONTHLY"
        );
        const yearly = packages.find(
          (pkg: any) =>
            pkg.identifier === "$rc_annual" || pkg.packageType === "ANNUAL"
        );

        setMonthlyPackage(monthly || null);
        setYearlyPackage(yearly || null);

        console.log("📦 Loaded packages:", {
          monthly: monthly?.product.priceString,
          yearly: yearly?.product.priceString,
        });
      } else {
        console.warn("⚠️ No offerings available");
        toast.error("Unable to load subscription options");
      }
    } catch (error) {
      console.error("Error loading offerings:", error);
      toast.error("Failed to load subscriptions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    const pkg = selectedPackage === "yearly" ? yearlyPackage : monthlyPackage;

    if (!pkg) {
      toast.error("Package not available");
      return;
    }

    try {
      setPurchasing(true);
      hapticFeedback.light();

      const success = await purchasePackage(pkg);

      if (success) {
        await checkSubscriptionStatus();

        // ✅ ADD THIS: Schedule trial reminder
        await scheduleTrialReminder();

        toast.success("Welcome to Premium! 7-day free trial started! 🎉", 4000);

        setTimeout(() => {
          navigation.goBack();
        }, 500);
      }
    } catch (error: any) {
      console.error("❌ Purchase error:", error);
      hapticFeedback.error();

      if (!error.userCancelled) {
        toast.error("Purchase failed. Please try again.");
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setPurchasing(true);
      hapticFeedback.light();

      console.log("🔄 Restoring purchases...");

      const restored = await restorePurchases();

      if (restored) {
        console.log("✅ Purchases restored successfully!");
        hapticFeedback.success();
        toast.success("Subscription restored! 🎉");
        navigation.goBack();
      } else {
        console.log("ℹ️ No active subscription found");
        hapticFeedback.warning();
        toast.info("No active subscription found");
      }
    } catch (error) {
      console.error("❌ Restore error:", error);
      hapticFeedback.error();
      toast.error("Failed to restore purchases");
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading subscription options...</Text>
      </View>
    );
  }

  if (!monthlyPackage && !yearlyPackage) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="warning-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>Unable to load subscriptions</Text>
        <Button
          title="Try Again"
          onPress={loadOfferings}
          style={{ marginTop: SPACING.lg }}
        />
        <Button
          title="Close"
          onPress={() => navigation.goBack()}
          variant="ghost"
          style={{ marginTop: SPACING.sm }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              hapticFeedback.light();
              navigation.goBack();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>

          {/* ✅ REWRITTEN: Clear, bold, specific headline */}
          <Text style={styles.headerTitle}>Master Lucid Dreaming</Text>
          <Text style={styles.headerSubtitle}>
            Everything you need to start controlling your dreams
          </Text>
        </View>

        {/* ✅ REWRITTEN: Vertical list instead of 2x2 grid for better mobile UX */}
        <View style={styles.featuresContainer}>
          {PREMIUM_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIconContainer}>
                <Ionicons
                  name={feature.icon as any}
                  size={24}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing Cards */}
        <View style={styles.pricingContainer}>
          {/* Yearly Plan */}
          {yearlyPackage && (
            <TouchableOpacity
              onPress={() => {
                hapticFeedback.light();
                setSelectedPackage("yearly");
              }}
              activeOpacity={0.7}
              style={styles.pricingCardWrapper}
            >
              <Card
                style={{
                  ...styles.pricingCard,
                  ...(selectedPackage === "yearly" &&
                    styles.pricingCardSelected),
                }}
              >
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>BEST VALUE</Text>
                </View>
                <View style={styles.pricingHeader}>
                  <View style={styles.pricingContent}>
                    <Text style={styles.pricingTitle}>Yearly</Text>
                    <Text style={styles.pricingPrice}>
                      ${(yearlyPackage.product.price / 12).toFixed(2)}
                      <Text style={styles.pricingPeriod}>/month</Text>
                    </Text>

                    <Text style={styles.pricingSubtext}>
                      {yearlyPackage.product.priceString} billed annually
                    </Text>
                  </View>
                  <Ionicons
                    name={
                      selectedPackage === "yearly"
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={28}
                    color={
                      selectedPackage === "yearly"
                        ? COLORS.success
                        : COLORS.textSecondary
                    }
                  />
                </View>
                <Text style={styles.saveBadge}>Save 33% vs monthly</Text>
              </Card>
            </TouchableOpacity>
          )}

          {/* Monthly Plan */}
          {monthlyPackage && (
            <TouchableOpacity
              onPress={() => {
                hapticFeedback.light();
                setSelectedPackage("monthly");
              }}
              activeOpacity={0.7}
            >
              <Card
                style={
                  selectedPackage === "monthly"
                    ? {
                        ...styles.pricingCard,
                        ...styles.pricingCardSelectedMonthly,
                      }
                    : styles.pricingCard
                }
              >
                <View style={styles.pricingHeader}>
                  <View style={styles.pricingContent}>
                    <Text style={styles.pricingTitle}>Monthly</Text>
                    <Text style={styles.pricingPrice}>
                      {monthlyPackage.product.priceString}
                      <Text style={styles.pricingPeriod}>/month</Text>
                    </Text>
                  </View>
                  <Ionicons
                    name={
                      selectedPackage === "monthly"
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={28}
                    color={
                      selectedPackage === "monthly"
                        ? COLORS.primary
                        : COLORS.textSecondary
                    }
                  />
                </View>
              </Card>
            </TouchableOpacity>
          )}
        </View>

        {/* ✅ REWRITTEN: Better CTA copy */}
        <View style={styles.ctaWrapper}>
          <Button
            title={purchasing ? "Processing..." : "Start 7-Day Free Trial"}
            onPress={handlePurchase}
            loading={purchasing}
            disabled={purchasing}
          />
          {/* ✅ UPDATED: Show trial terms */}
          <Text style={styles.ctaSubtext}>
            Then{" "}
            {selectedPackage === "yearly"
              ? `${yearlyPackage.product.priceString}/year`
              : `${monthlyPackage.product.priceString}/month`}
            • We'll remind you before charging
          </Text>
        </View>

        {/* Restore Purchases */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={purchasing}
          activeOpacity={0.7}
        >
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* Fine Print */}
        <Text style={styles.finePrint}>
          Payment charged to App Store account. Subscription auto-renews unless
          cancelled 24 hours before period ends.
        </Text>

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
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: SPACING.xl,
    paddingTop: SPACING.xxxl * 2,
    alignItems: "center",
    paddingHorizontal: SPACING.xxl, // ✅ More horizontal padding
  },
  closeButton: {
    position: "absolute",
    top: SPACING.xxxl * 1.8, // ✅ Adjusted position
    right: SPACING.lg,
    zIndex: 10,
    padding: SPACING.xs,
    backgroundColor: "rgba(0, 0, 0, 0.3)", // ✅ Optional: add subtle background
    borderRadius: RADIUS.round,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xxxl + 4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg, // ✅ Push down from X button
    paddingHorizontal: SPACING.xl, // ✅ Prevent text wrapping near edges
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: SPACING.lg, // ✅ Add padding
  },

  featuresContainer: {
    padding: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.lg,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`, // 15% opacity
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  featureTextContainer: {
    flex: 1,
    paddingTop: 2,
  },
  featureTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  featureDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  pricingContainer: {
    padding: SPACING.xl,
    paddingTop: SPACING.md,
  },
  pricingCardWrapper: {
    marginBottom: SPACING.md,
  },
  pricingCard: {
    padding: SPACING.lg,
    position: "relative",
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundSecondary,
  },
  pricingCardSelected: {
    borderColor: COLORS.success,
    backgroundColor: "#1a1a3a",
  },
  pricingCardSelectedMonthly: {
    borderColor: COLORS.primary,
    backgroundColor: "#1a1a3a",
  },
  popularBadge: {
    position: "absolute",
    top: -12, // ✅ FIXED: Better positioning
    right: SPACING.lg,
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  popularText: {
    fontSize: TYPOGRAPHY.sizes.xs - 2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  pricingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pricingContent: {
    flex: 1,
  },
  pricingTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  pricingPrice: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
  },
  pricingPeriod: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.textSecondary,
  },
  pricingSubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
  },
  saveBadge: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginTop: SPACING.sm,
  },
  ctaWrapper: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  ctaSubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
  restoreButton: {
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  restoreText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  finePrint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    textAlign: "center",
    paddingHorizontal: SPACING.xxxl,
    lineHeight: 16,
    marginTop: SPACING.sm,
  },
  footer: {
    height: SPACING.xxxl,
  },
});
