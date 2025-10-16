import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import Card from "../components/Card";
import Button from "../components/Button";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";

const { width } = Dimensions.get("window");

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type OnboardingSlide = {
  id: string;
  title: string;
  description: string;
  icon?: string;
  features?: { icon: string; text: string }[];
  goals?: { id: string; icon: string; text: string }[];
  image?: any;
};

const slides: OnboardingSlide[] = [
  {
    id: "1",
    title: "Welcome to DreamPilot",
    description: "Your personal guide to lucid dreaming and dream exploration",
    image: require("../../assets/app_icons/icon.png"),
  },
  {
    id: "2",
    title: "Take Control of Your Dreams",
    description:
      "Lucid dreaming is when you become aware you're dreaming—and can control what happens. Imagine flying, exploring fantasy worlds, or meeting anyone you want.\n\n55% of people have experienced it at least once!",
    icon: "✨",
  },
  {
    id: "3",
    title: "Your Path to Lucid Dreams",
    description: "Most people have their first lucid dream within 2-4 weeks",
    icon: "🎯",
    features: [
      { icon: "📖", text: "Log Dreams Daily - Train your dream recall" },
      { icon: "🎓", text: "Complete Lessons - Learn proven techniques" },
      { icon: "⏰", text: "Reality Checks - Build awareness habits" },
    ],
  },
  {
    id: "4",
    title: "Everything You Need",
    description: "Powerful features to help you succeed",
    icon: "🚀",
    features: [
      { icon: "🤖", text: "AI Dream Analysis - Discover patterns & signs" },
      { icon: "🔥", text: "Streak Tracking - Build daily habits" },
      { icon: "📊", text: "Progress Insights - See your improvement" },
      { icon: "🎓", text: "Expert Lessons - Learn from masters" },
    ],
  },
  {
    id: "5",
    title: "What's Your Dream Goal?",
    description: "We'll personalize your experience",
    icon: "🎨",
    goals: [
      {
        id: "first_lucid",
        icon: "🚀",
        text: "Experience my first lucid dream",
      },
      { id: "dream_recall", icon: "🌈", text: "Improve dream recall" },
      {
        id: "master_lucid",
        icon: "🧠",
        text: "Master lucid dreaming techniques",
      },
      { id: "creative", icon: "🎨", text: "Explore creative inspiration" },
    ],
  },
];

export default function OnboardingScreen({
  navigation,
}: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    hapticFeedback.light();
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const completeOnboarding = async () => {
    try {
      hapticFeedback.success();
      const user = auth.currentUser;
      if (!user) return;

      await AsyncStorage.setItem("onboardingCompleted", "true");

      if (selectedGoal) {
        await updateDoc(doc(db, "users", user.uid), {
          dreamGoal: selectedGoal,
        });
      }

      if (currentIndex === slides.length - 1) {
        navigation.replace("RealityCheck", { fromOnboarding: true });
      } else {
        navigation.replace("MainTabs");
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      navigation.replace("MainTabs");
    }
  };

  const skipOnboarding = async () => {
    try {
      hapticFeedback.light();
      await AsyncStorage.setItem("onboardingCompleted", "true");
      navigation.replace("MainTabs");
    } catch (error) {
      console.error("Error skipping onboarding:", error);
      navigation.replace("MainTabs");
    }
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => {
    return (
      <View style={styles.slide}>
        {item.image ? (
          <Image source={item.image} style={styles.iconImage} />
        ) : (
          <Text style={styles.icon}>{item.icon}</Text>
        )}
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>

        {item.features && (
          <View style={styles.featuresList}>
            {item.features.map((feature, index) => (
              <Card key={index} style={styles.featureItem}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureText}>{feature.text}</Text>
              </Card>
            ))}
          </View>
        )}

        {item.goals && (
          <View style={styles.goalsList}>
            {item.goals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                onPress={() => {
                  hapticFeedback.light();
                  setSelectedGoal(goal.id);
                }}
                activeOpacity={0.7}
              >
                <Card
                  style={{
                    ...styles.goalItem,
                    borderColor:
                      selectedGoal === goal.id ? COLORS.success : COLORS.border,
                    borderWidth: 2,
                    backgroundColor:
                      selectedGoal === goal.id
                        ? `${COLORS.success}10`
                        : COLORS.backgroundSecondary,
                  }}
                >
                  <Text style={styles.goalIcon}>{goal.icon}</Text>
                  <Text
                    style={[
                      styles.goalText,
                      selectedGoal === goal.id && styles.goalTextSelected,
                    ]}
                  >
                    {goal.text}
                  </Text>
                  {selectedGoal === goal.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={COLORS.success}
                    />
                  )}
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.slideContainer}>
        <FlatList
          data={slides}
          renderItem={renderSlide}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
          scrollEventThrottle={32}
        />
      </View>

      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 20, 10],
            extrapolate: "clamp",
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={index}
              style={[styles.dot, { width: dotWidth, opacity }]}
            />
          );
        })}
      </View>

      <View style={styles.buttonContainer}>
        {currentIndex === slides.length - 1 ? (
          <>
            <Button
              title="Skip for Now"
              onPress={skipOnboarding}
              variant="ghost"
              style={styles.skipButton}
            />
            <Button
              title="Set Up Reality Checks"
              onPress={completeOnboarding}
              disabled={!selectedGoal}
              style={styles.primaryButton}
            />
          </>
        ) : (
          <>
            <Button
              title="Skip"
              onPress={skipOnboarding}
              variant="ghost"
              style={styles.skipButton}
            />
            <Button
              title="Next"
              onPress={scrollTo}
              icon={
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={COLORS.textPrimary}
                />
              }
              style={styles.primaryButton}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
  },
  slideContainer: {
    flex: 3,
  },
  slide: {
    width,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xxxl + 10,
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },

  iconImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 20,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl - 4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: "center",
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: SPACING.xxxl,
  },
  featuresList: {
    width: "100%",
    marginTop: SPACING.lg,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  featureText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  goalsList: {
    width: "100%",
    marginTop: SPACING.lg,
  },
  goalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  goalIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  goalText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  goalTextSelected: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  pagination: {
    flexDirection: "row",
    height: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.sm,
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl + 10,
    gap: SPACING.md,
  },
  skipButton: {
    flex: 1,
  },
  primaryButton: {
    flex: 2,
  },
});
