import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

const { width } = Dimensions.get('window');

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type OnboardingSlide = {
  id: string;
  title: string;
  description: string;
  icon: string;
  features?: { icon: string; text: string }[];
  goals?: { id: string; icon: string; text: string }[];
};

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to DreamPilot',
    description: 'Your personal guide to lucid dreaming and dream exploration',
    icon: '🌙',
  },
  {
    id: '2',
    title: 'Take Control of Your Dreams',
    description: 'Lucid dreaming is when you become aware you\'re dreaming—and can control what happens. Imagine flying, exploring fantasy worlds, or meeting anyone you want.\n\n55% of people have experienced it at least once!',
    icon: '✨',
  },
  {
    id: '3',
    title: 'Your Path to Lucid Dreams',
    description: 'Most people have their first lucid dream within 2-4 weeks',
    icon: '🎯',
    features: [
      { icon: '📖', text: 'Log Dreams Daily - Train your dream recall' },
      { icon: '🎓', text: 'Complete Lessons - Learn proven techniques' },
      { icon: '⏰', text: 'Reality Checks - Build awareness habits' },
    ],
  },
  {
    id: '4',
    title: 'Everything You Need',
    description: 'Powerful features to help you succeed',
    icon: '🚀',
    features: [
      { icon: '🤖', text: 'AI Dream Analysis - Discover patterns & signs' },
      { icon: '🔥', text: 'Streak Tracking - Build daily habits' },
      { icon: '📊', text: 'Progress Insights - See your improvement' },
      { icon: '🎓', text: 'Expert Lessons - Learn from masters' },
    ],
  },
  {
    id: '5',
    title: 'What\'s Your Dream Goal?',
    description: 'We\'ll personalize your experience',
    icon: '🎨',
    goals: [
      { id: 'first_lucid', icon: '🚀', text: 'Experience my first lucid dream' },
      { id: 'dream_recall', icon: '🌈', text: 'Improve dream recall' },
      { id: 'master_lucid', icon: '🧠', text: 'Master lucid dreaming techniques' },
      { id: 'creative', icon: '🎨', text: 'Explore creative inspiration' },
    ],
  },
];

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
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
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const completeOnboarding = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    await AsyncStorage.setItem('onboardingCompleted', 'true');
    
    if (selectedGoal) {
      await updateDoc(doc(db, 'users', user.uid), {
        dreamGoal: selectedGoal,
      });
    }

    // Navigate with param
    if (currentIndex === slides.length - 1) {
      navigation.replace('RealityCheck', { fromOnboarding: true });
    } else {
      navigation.replace('Back');
    }
  } catch (error) {
    console.error('Error completing onboarding:', error);
    navigation.replace('Back');
  }
};


  const skipOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      navigation.replace('Back');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      navigation.replace('Back');
    }
  };

  

  const renderSlide = ({ item }: { item: OnboardingSlide }) => {
    return (
      <View style={styles.slide}>
        <Text style={styles.icon}>{item.icon}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>

        {/* Features List */}
        {item.features && (
          <View style={styles.featuresList}>
            {item.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Goals Selection */}
        {item.goals && (
          <View style={styles.goalsList}>
            {item.goals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalItem,
                  selectedGoal === goal.id && styles.goalItemSelected,
                ]}
                onPress={() => setSelectedGoal(goal.id)}
              >
                <Text style={styles.goalIcon}>{goal.icon}</Text>
                <Text style={[
                  styles.goalText,
                  selectedGoal === goal.id && styles.goalTextSelected,
                ]}>
                  {goal.text}
                </Text>
                {selectedGoal === goal.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                )}
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

      {/* Pagination Dots */}
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
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                { width: dotWidth, opacity },
              ]}
            />
          );
        })}
      </View>

      {/* Bottom Buttons */}
      <View style={styles.buttonContainer}>
        {currentIndex === slides.length - 1 ? (
          <>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={skipOnboarding}
            >
              <Text style={styles.skipButtonText}>Skip for Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                !selectedGoal && styles.primaryButtonDisabled,
              ]}
              onPress={completeOnboarding}
              disabled={!selectedGoal}
            >
              <Text style={styles.primaryButtonText}>
                Set Up Reality Checks
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={skipOnboarding}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={scrollTo}>
              <Text style={styles.primaryButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
  },
  slideContainer: {
    flex: 3,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 80,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  featuresList: {
    width: '100%',
    marginTop: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  goalsList: {
    width: '100%',
    marginTop: 20,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#333',
  },
  goalItemSelected: {
    borderColor: '#10b981',
    backgroundColor: '#10b98110',
  },
  goalIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  goalText: {
    flex: 1,
    fontSize: 15,
    color: '#aaa',
    fontWeight: '500',
  },
  goalTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366f1',
    marginHorizontal: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  skipButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
