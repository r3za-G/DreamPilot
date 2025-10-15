import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import Card from "../components/Card";
import Button from "../components/Button";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";

type PaywallScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

const PREMIUM_FEATURES = [
  {
    icon: "✨",
    title: "Unlimited Dreams",
    description: "Log as many dreams as you want",
  },
  {
    icon: "🎓",
    title: "50+ Expert Lessons",
    description: "Master lucid dreaming techniques",
  },
  {
    icon: "🤖",
    title: "Unlimited AI Analysis",
    description: "Deep insights for every dream",
  },
  {
    icon: "📊",
    title: "Advanced Analytics",
    description: "Track patterns & progress",
  },
  {
    icon: "🔥",
    title: "Full Streak Calendar",
    description: "Visualize your consistency",
  },
  {
    icon: "🎯",
    title: "Premium Features",
    description: "Custom reality checks & more",
  },
  { icon: "💾", title: "Cloud Backup", description: "Never lose your dreams" },
  { icon: "🚫", title: "Ad-Free", description: "Distraction-free experience" },
];

const MOCK_MONTHLY_PACKAGE = {
  identifier: "$rc_monthly",
  product: {
    priceString: "$4.99",
  },
};

const MOCK_YEARLY_PACKAGE = {
  identifier: "$rc_annual",
  product: {
    priceString: "$39.99",
  },
};

export default function PaywallScreen({ navigation }: PaywallScreenProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>("yearly");
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = (pkg: any) => {
    hapticFeedback.light();
    setPurchasing(true);
    setTimeout(() => {
      hapticFeedback.success();
      Alert.alert(
        "Mock Purchase",
        `Pretend you purchased: ${pkg.identifier} (${pkg.product.priceString})`
      );
      setPurchasing(false);
      navigation.goBack();
    }, 1000);
  };

  const handleRestore = () => {
    hapticFeedback.light();
    setPurchasing(true);
    setTimeout(() => {
      hapticFeedback.success();
      Alert.alert(
        "Mock Restore",
        "Pretend your subscription has been restored."
      );
      setPurchasing(false);
      navigation.goBack();
    }, 1000);
  };

  const monthlyPackage = MOCK_MONTHLY_PACKAGE;
  const yearlyPackage = MOCK_YEARLY_PACKAGE;

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
            <Text style={styles.badgeText}>⭐ PREMIUM</Text>
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
              <Text style={styles.featureIcon}>{feature.icon}</Text>
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
                  <Text style={styles.pricingPerMonth}>Just $3.33/month</Text>
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
              <Text style={styles.saveBadge}>💰 Save 33% vs monthly</Text>
            </Card>
          </TouchableOpacity>

          {/* Monthly Plan */}
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
        </View>

        {/* CTA Button */}
        <View style={styles.ctaWrapper}>
          <Button
            title="Start Free Trial"
            onPress={() => {
              const pkg =
                selectedPackage === "yearly" ? yearlyPackage : monthlyPackage;
              handlePurchase(pkg);
            }}
            loading={purchasing}
            disabled={purchasing}
          />
          <Text style={styles.ctaSubtext}>
            7 days free, then{" "}
            {selectedPackage === "yearly"
              ? yearlyPackage.product.priceString
              : monthlyPackage.product.priceString}
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
  featureIcon: {
    fontSize: 28,
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
    fontSize: TYPOGRAPHY.sizes.sm,
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
