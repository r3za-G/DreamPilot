import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import * as Notifications from "expo-notifications";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { DataProvider } from "../contexts/DataContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SubscriptionProvider } from "../contexts/SubscriptionContext";

// Auth Screens
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignUpScreen";

// Tab Screens
import HomeScreen from "../screens/HomeScreen";
import JournalScreen from "../screens/JournalScreen";
import LearnScreen from "../screens/LearnScreen";
import ProgressScreen from "../screens/ProgressScreen";
import ProfileScreen from "../screens/ProfileScreen";

// Stack Screens
import DreamJournalScreen from "../screens/DreamJournalScreen";
import LessonScreen from "../screens/LessonScreen";
import DreamDetailScreen from "../screens/DreamDetailScreen";
import AchievementsScreen from "../screens/AchievementsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import RealityCheckScreen from "../screens/RealityCheckScreen";
import WelcomeScreen from "../screens/WelcomeScreen";
import InsightsScreen from "../screens/InsightsScreen";
import EditDreamScreen from "../screens/EditDreamScreen";
import StreakCalendarScreen from "../screens/StreakCalendarScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import PaywallScreen from "../screens/PaywallScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const AppScreens = () => {
  return (
    <>
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DreamJournal"
        component={DreamJournalScreen}
        options={{ title: "Log Dream" }}
      />
      <Stack.Screen
        name="Lesson"
        component={LessonScreen}
        options={{ title: "Lesson" }}
      />
      <Stack.Screen
        name="DreamDetail"
        component={DreamDetailScreen}
        options={{ title: "Dream Details" }}
      />
      <Stack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ title: "Achievements" }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
      <Stack.Screen
        name="RealityCheck"
        component={RealityCheckScreen}
        options={{ title: "Reality Check Reminders" }}
      />
      <Stack.Screen
        name="Insights"
        component={InsightsScreen}
        options={{ title: "Dream Insights" }}
      />
      <Stack.Screen
        name="EditDream"
        component={EditDreamScreen}
        options={{ title: "Edit Dream" }}
      />
      <Stack.Screen
        name="StreakCalendar"
        component={StreakCalendarScreen}
        options={{ title: "Streak Calendar" }}
      />
    </>
  );
};

// Bottom Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#1a1a2e",
          borderTopColor: "#333",
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 25,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#888",
        headerStyle: {
          backgroundColor: "#0f0f23",
          borderBottomColor: "#333",
          borderBottomWidth: 1,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          title: "Journal",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Learn"
        component={LearnScreen}
        options={{
          title: "Learn",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="school" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          title: "Progress",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true); // ✅ Keep loading while checking

      if (user) {
        // Check if user has completed onboarding
        const completed = await AsyncStorage.getItem("onboardingCompleted");
        console.log("Onboarding completed:", completed);
        setShowOnboarding(completed !== "true");
      } else {
        setShowOnboarding(false);
      }

      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return null;
  }

  return (
    // <SubscriptionProvider>
    <DataProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: "#0f0f23",
              },
              headerTintColor: "#fff",
              headerTitleStyle: {
                fontWeight: "bold",
                color: "#fff",
              },
              headerShadowVisible: false,
              contentStyle: {
                backgroundColor: "#0f0f23",
              },
              animation: "slide_from_right",
              headerBackButtonDisplayMode: "minimal",
            }}
          >
            {!user ? (
              // Not logged in - Show auth screens
              <>
                <Stack.Screen
                  name="Welcome"
                  component={WelcomeScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Login"
                  component={LoginScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Signup"
                  component={SignupScreen}
                  options={{ headerShown: false }}
                />
              </>
            ) : showOnboarding ? (
              // Logged in but hasn't seen onboarding
              <>
                <Stack.Screen
                  name="Onboarding"
                  component={OnboardingScreen}
                  options={{ headerShown: false }}
                />
                {AppScreens()}
              </>
            ) : (
              // Logged in and completed onboarding - Show main app
              <>{AppScreens()}</>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </DataProvider>
    // </SubscriptionProvider>
  );
}
