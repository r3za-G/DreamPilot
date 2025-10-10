import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebaseConfig';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [joinedDate, setJoinedDate] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      setUserName(userData?.name || 'Dreamer');
      setUserEmail(user.email || '');
      setJoinedDate(userData?.createdAt || new Date().toISOString());
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportDreams = async () => {
    try {
      setExporting(true);
      const user = auth.currentUser;
      if (!user) return;

      const dreamsQuery = query(
        collection(db, 'dreams'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(dreamsQuery);
      const dreams: any[] = [];

      querySnapshot.forEach((doc) => {
        dreams.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      if (dreams.length === 0) {
        Alert.alert('No Dreams', 'You have no dreams to export yet.');
        return;
      }

      // Format as readable text
      let textContent = `Dream Journal Export\n`;
      textContent += `User: ${userName}\n`;
      textContent += `Exported: ${new Date().toLocaleString()}\n`;
      textContent += `Total Dreams: ${dreams.length}\n`;
      textContent += `\n${'='.repeat(50)}\n\n`;

      dreams.forEach((dream, index) => {
        const date = new Date(dream.createdAt).toLocaleString();
        textContent += `Dream #${index + 1}\n`;
        textContent += `Date: ${date}\n`;
        textContent += `Title: ${dream.title}\n`;
        textContent += `Lucid: ${dream.isLucid ? 'Yes ✨' : 'No'}\n`;
        if (dream.tags && dream.tags.length > 0) {
          textContent += `Tags: ${dream.tags.join(', ')}\n`;
        }
        textContent += `\n${dream.content}\n`;
        textContent += `\n${'-'.repeat(50)}\n\n`;
      });

      // Share directly
      await Share.share({
        message: textContent,
        title: 'Dream Journal Export',
      });
    } catch (error) {
      console.error('Error exporting dreams:', error);
      Alert.alert('Error', 'Failed to export dreams. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportDreamsJSON = async () => {
    try {
      setExporting(true);
      const user = auth.currentUser;
      if (!user) return;

      const dreamsQuery = query(
        collection(db, 'dreams'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(dreamsQuery);
      const dreams: any[] = [];

      querySnapshot.forEach((doc) => {
        dreams.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      if (dreams.length === 0) {
        Alert.alert('No Dreams', 'You have no dreams to export yet.');
        return;
      }

      const exportData = {
        user: {
          name: userName,
          email: userEmail,
        },
        exportDate: new Date().toISOString(),
        totalDreams: dreams.length,
        dreams: dreams,
      };

      // Share JSON as text
      await Share.share({
        message: JSON.stringify(exportData, null, 2),
        title: 'Dream Journal Export (JSON)',
      });
    } catch (error) {
      console.error('Error exporting dreams:', error);
      Alert.alert('Error', 'Failed to export dreams. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const showExportOptions = () => {
    Alert.alert(
      'Export Dreams',
      'Choose export format',
      [
        {
          text: 'Text File (.txt)',
          onPress: exportDreams,
        },
        {
          text: 'JSON File (.json)',
          onPress: exportDreamsJSON,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarIcon}>🌙</Text>
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
          <Text style={styles.joinedText}>
            Member since {new Date(joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings" size={24} color="#6366f1" />
            <Text style={styles.actionText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('RealityCheck')}
          >
            <Ionicons name="notifications" size={24} color="#f59e0b" />
            <Text style={styles.actionText}>Reality Check Reminders</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, exporting && styles.actionButtonDisabled]}
            onPress={showExportOptions}
            disabled={exporting}
          >
            <Ionicons name="download" size={24} color="#10b981" />
            <Text style={styles.actionText}>
              {exporting ? 'Exporting...' : 'Export Dream Journal'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 30,
    paddingTop: 40,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#6366f1',
  },
  avatarIcon: {
    fontSize: 48,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  joinedText: {
    fontSize: 12,
    color: '#666',
  },
  actionsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 15,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  footer: {
    height: 40,
  },
});
