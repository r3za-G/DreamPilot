import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f0f23', '#1a1a3e', '#2d1b4e']}
        style={styles.gradient}
      >
        {/* Top Section - Logo & Title */}
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🌙</Text>
          </View>
          <Text style={styles.title}>Dream Pilot</Text>
          <Text style={styles.tagline}>Master the Art of Lucid Dreaming</Text>
        </View>

        {/* AI Banner */}
        <View style={styles.aiBanner}>
          <Ionicons name="sparkles" size={28} color="#f59e0b" />
          <View style={styles.aiContent}>
            <Text style={styles.aiTitle}>Powered by AI</Text>
            <Text style={styles.aiDescription}>
              Get personalized dream insights & analysis
            </Text>
          </View>
        </View>

        {/* Quick Features */}
        <View style={styles.featuresGrid}>
          <View style={styles.miniFeature}>
            <Text style={styles.miniFeatureIcon}>📖</Text>
            <Text style={styles.miniFeatureText}>Dream Journal</Text>
          </View>
          <View style={styles.miniFeature}>
            <Text style={styles.miniFeatureIcon}>🎓</Text>
            <Text style={styles.miniFeatureText}>Learn Techniques</Text>
          </View>
          <View style={styles.miniFeature}>
            <Text style={styles.miniFeatureIcon}>🏆</Text>
            <Text style={styles.miniFeatureText}>Track Progress</Text>
          </View>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Bottom Section - CTAs */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>I Already Have an Account</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  gradient: {
    flex: 1,
    paddingVertical: 60,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  logoIcon: {
    fontSize: 54,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 15,
    color: '#aaa',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  aiBanner: {
    marginHorizontal: 30,
    marginTop: 20,
    marginBottom: 25,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiContent: {
    flex: 1,
    marginLeft: 12,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 3,
  },
  aiDescription: {
    fontSize: 13,
    color: '#ddd',
    lineHeight: 18,
  },
  featuresGrid: {
    flexDirection: 'row',
    paddingHorizontal: 30,
    gap: 12,
  },
  miniFeature: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  miniFeatureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  miniFeatureText: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomSection: {
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  secondaryButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
});
