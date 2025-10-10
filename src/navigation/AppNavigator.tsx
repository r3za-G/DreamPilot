import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { ActivityIndicator, View } from 'react-native';

// Import screens
import WelcomeScreen from '../screens/WelcomeScreen';
import SignUpScreen from '../screens/SignUpScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import DreamJournalScreen from '../screens/DreamJournalScreen';
import LessonScreen from '../screens/LessonScreen';
import DreamHistoryScreen from '../screens/DreamHistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DreamDetailScreen from '../screens/DreamDetailScreen';
import RealityCheckScreen from '../screens/RealityCheckScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f23' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0f0f23',
          },
          headerTintColor: '#fff',
          headerShadowVisible: false,
        }}
      >
        {user ? (
          // Authenticated screens
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="DreamJournal" 
              component={DreamJournalScreen}
              options={{ title: 'Dream Journal' }}
            />
            <Stack.Screen 
              name="DreamHistory" 
              component={DreamHistoryScreen}
              options={{ title: 'Dream History' }}
            />
            <Stack.Screen 
              name="Lesson" 
              component={LessonScreen}
              options={{ title: 'Lesson' }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ title: 'Settings' }}
            />
            <Stack.Screen 
              name="DreamDetail" 
              component={DreamDetailScreen}
              options={{ title: 'Dream Details' }}
            />
           <Stack.Screen 
              name="RealityCheck" 
              component={RealityCheckScreen}
              options={{ title: 'Reality Check Reminders' }}
            />
            <Stack.Screen 
              name="Achievements" 
              component={AchievementsScreen}
              options={{ title: 'Achievements' }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ title: 'Profile' }}
            />
          </>
        ) : (
          // Auth screens
          <>
            <Stack.Screen 
              name="Welcome" 
              component={WelcomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="SignUp" 
              component={SignUpScreen}
              options={{ title: 'Sign Up' }}
            />
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ title: 'Log In' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}