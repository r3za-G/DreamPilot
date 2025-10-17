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
import Purchases, { PurchasesPackage } from "react-native-purchases";
import Card from "../components/Card";
import Button from "../components/Button";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";
import { useToast } from "../contexts/ToastContext";

type PaywallScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

const PREMIUM_FEATURES = [
  {
    icon: "infinite-outline",
    title: "Unlimited Dreams",
    description: "Log as many dreams as you want",
  },
  {
    icon: "school-outline",
    title: "20+ Expert Lessons",
    description: "Master lucid dreaming techniques",
  },
  {
    icon: "analytics-outline",
    title: "Unlimited AI Analysis",
    description: "Deep insights for every dream",
  },
  {
    icon: "bar-chart-outline",
    title: "Advanced Analytics",
    description: "Track patterns & progress",
  },
  {
    icon: "flame-outline",
    title: "Full Streak Calendar",
    description: "Visualize your consistency",
  },
  {
    icon: "star-outline",
    title: "Premium Features",
    description: "Custom reality checks & more",
  },
];

export default function PaywallScreen({ navigation }: PaywallScreenProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>("yearly");
  const [purchasing, setPurchasing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [yearlyPackage, setYearlyPackage] = useState<PurchasesPackage | null>(null);
  const toast = useToast();

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      setLoading(true);
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current && offerings.current.availablePackages.length > 0) {
        const packages = offerings.current.availablePackages;
        
        // Find monthly and yearly packages
        const monthly = packages.find(
          (pkg) => pkg.identifier === "$rc_monthly" || pkg.packageType === "MONTHLY"
        );
        const yearly = packages.find(
          (pkg) => pkg.identifier === "$rc_annual" || pkg.packageType === "ANNUAL"
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

      const { customerInfo } = await Purchases.purchasePackage(pkg);

      // Check if user is now premium
      if (customerInfo.entitlements.active["premium"]) {
        hapticFeedback.success();
        toast.success("Welcome to Premium! 🎉");
        navigation.goBack();
      } else {
        toast.error("Purchase failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      hapticFeedback.error();

      // Handle different error types
      if (error.userCancelled) {
        // User cancelled, don't show error
        console.log("User cancelled purchase");
      } else {
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

      const customerInfo = await Purchases.restorePurchases();

      if (customerInfo.entitlements.active["premium"]) {
        hapticFeedback.success();
        toast.success("Subscription restored! 🎉");
        navigation.goBack();
      } else {
        hapticFeedback.warning();
        toast.info("No active subscription found");
      }
    } catch (error) {
      console.error("Restore error:", error);
      hapticFeedback.error();
      toast.error("Failed to restore purchases");
    } finally {
      setPurchasing(false);
    }
  };

  // Show loading state while fetching offerings
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading subscription options...</Text>
      </View>
    );
  }

  // Show error if no packages available
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
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PREMIUM</Text>
          </View>
          <Text style={styles.headerTitle}>Unlock Your Dream Potential</Text>
          <Text style={styles.headerSubtitle}>
            Join thousands mastering lucid dreaming
          </Text>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresContainer}>
          {PREMIUM_FEATURES.map((feature, index) => (
            <Card key={index} style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons
                  name={feature.icon as any}
                  size={24}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>
                {feature.description}
              </Text>
            </Card>
          ))}
        </View>

        {/* Pricing Cards */}
        <View style={styles.pricingContainer}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>

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
                  borderColor:
                    selectedPackage === "yearly" ? COLORS.success : COLORS.border,
                  borderWidth: 2,
                  backgroundColor:
                    selectedPackage === "yearly"
                      ? "#1a1a3a"
                      : COLORS.backgroundSecondary,
                }}
              >
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>BEST VALUE</Text>
                </View>
                <View style={styles.pricingHeader}>
                  <View>
                    <Text style={styles.pricingTitle}>Annual</Text>
                    <Text style={styles.pricingPrice}>
                      {yearlyPackage.product.priceString}/year
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
                style={{
                  ...styles.pricingCard,
                  borderColor:
                    selectedPackage === "monthly"
                      ? COLORS.primary
                      : COLORS.border,
                  borderWidth: 2,
                  backgroundColor:
                    selectedPackage === "monthly"
                      ? "#1a1a3a"
                      : COLORS.backgroundSecondary,
                }}
              >
                <View style={styles.pricingHeader}>
                  <View>
                    <Text style={styles.pricingTitle}>Monthly</Text>
                    <Text style={styles.pricingPrice}>
                      {monthlyPackage.product.priceString}/month
                    </Text>
                    <Text style={styles.pricingPerMonth}>Cancel anytime</Text>
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

        {/* CTA Button */}
        <View style={styles.ctaWrapper}>
          <Button
            title="Start Free Trial"
            onPress={handlePurchase}
            loading={purchasing}
            disabled={purchasing}
          />
          <Text style={styles.ctaSubtext}>
            7 days free, then{" "}
            {selectedPackage === "yearly"
              ? yearlyPackage?.product.priceString
              : monthlyPackage?.product.priceString}
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
          Cancel anytime. Payment will be charged to your App Store account.
          Subscription automatically renews unless auto-renew is turned off at
          least 24 hours before the end of the current period.
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
    padding: SPACING.xxxl,
    paddingTop: SPACING.xxxl * 2,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: SPACING.xxxl * 2,
    right: SPACING.lg,
    zIndex: 10,
    padding: SPACING.xs,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    marginBottom: SPACING.md,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  featureCard: {
    width: "48%",
    padding: SPACING.lg,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  featureTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  pricingContainer: {
    padding: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: "center",
  },
  pricingCardWrapper: {
    marginBottom: SPACING.md,
  },
  pricingCard: {
    padding: SPACING.lg,
    position: "relative",
  },
  popularBadge: {
    position: "absolute",
    top: -10,
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
    marginBottom: SPACING.sm,
  },
  pricingTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  pricingPrice: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs / 2,
  },
  pricingPerMonth: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
  },
  saveBadge: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.weights.semibold,
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
