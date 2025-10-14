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

// 💡 Mock package data
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
  const [selectedPackage, setSelectedPackage] = useState<string>("monthly");
  const [purchasing, setPurchasing] = useState(false);

  // 🟢 Handlers just show alerts and navigate back
  const handlePurchase = (pkg: any) => {
    setPurchasing(true);
    setTimeout(() => {
      Alert.alert(
        "Mock Purchase",
        `Pretend you purchased: ${pkg.identifier} (${pkg.product.priceString})`
      );
      setPurchasing(false);
      navigation.goBack();
    }, 1000);
  };

  const handleRestore = () => {
    setPurchasing(true);
    setTimeout(() => {
      Alert.alert(
        "Mock Restore",
        "Pretend your subscription has been restored."
      );
      setPurchasing(false);
      navigation.goBack();
    }, 1000);
  };

  // Assign packages directly (mock)
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
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.badge}>⭐ PREMIUM</Text>
          <Text style={styles.headerTitle}>Unlock Your Dream Potential</Text>
          <Text style={styles.headerSubtitle}>
            Join thousands mastering lucid dreaming
          </Text>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresContainer}>
          {PREMIUM_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>
                {feature.description}
              </Text>
            </View>
          ))}
        </View>

        {/* Pricing Cards */}
        <View style={styles.pricingContainer}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>

          {/* Yearly Plan */}
          <TouchableOpacity
            style={[
              styles.pricingCard,
              selectedPackage === "yearly" && styles.pricingCardSelected,
            ]}
            onPress={() => setSelectedPackage("yearly")}
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
                color={selectedPackage === "yearly" ? "#10b981" : "#888"}
              />
            </View>
            <Text style={styles.saveBadge}>💰 Save 33% vs monthly</Text>
          </TouchableOpacity>

          {/* Monthly Plan */}
          <TouchableOpacity
            style={[
              styles.pricingCard,
              selectedPackage === "monthly" && styles.pricingCardSelected,
            ]}
            onPress={() => setSelectedPackage("monthly")}
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
                color={selectedPackage === "monthly" ? "#6366f1" : "#888"}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={[styles.ctaButton, purchasing && styles.ctaButtonDisabled]}
          onPress={() => {
            const pkg =
              selectedPackage === "yearly" ? yearlyPackage : monthlyPackage;
            handlePurchase(pkg);
          }}
          disabled={purchasing}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.ctaButtonText}>Start Free Trial</Text>
              <Text style={styles.ctaButtonSubtext}>
                7 days free, then{" "}
                {selectedPackage === "yearly"
                  ? yearlyPackage.product.priceString
                  : monthlyPackage.product.priceString}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Restore Purchases */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={purchasing}
        >
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* Fine Print */}
        <Text style={styles.finePrint}>
          Cancel anytime. Payment will be charged to your App Store account.
          Subscription automatically renews unless auto-renew is turned off at
          least 24 hours before the end of the current period.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// (Retain your styles block as-is)

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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 30,
    paddingTop: 60,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
  },
  badge: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    gap: 12,
  },
  featureCard: {
    width: "48%",
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: "#888",
    lineHeight: 16,
  },
  pricingContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  pricingCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#333",
    position: "relative",
  },
  pricingCardSelected: {
    borderColor: "#6366f1",
    backgroundColor: "#1a1a3a",
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    right: 20,
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  pricingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  pricingPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6366f1",
    marginBottom: 2,
  },
  pricingPerMonth: {
    fontSize: 14,
    color: "#888",
  },
  saveBadge: {
    fontSize: 13,
    color: "#10b981",
    fontWeight: "600",
  },
  ctaButton: {
    backgroundColor: "#6366f1",
    marginHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 15,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  ctaButtonSubtext: {
    fontSize: 13,
    color: "#fff",
    opacity: 0.8,
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  restoreText: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "600",
  },
  finePrint: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 30,
    lineHeight: 16,
    marginTop: 10,
  },
  loadingText: {
    color: "#888",
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: "#888",
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
