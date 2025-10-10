import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth, db } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { awardXP } from '../utils/xpManager';
import { XP_REWARDS } from '../data/levels';
import { analyzeDream, saveDreamAnalysis, getUserDreamPatterns } from '../services/dreamAnalysisService';

type DreamJournalScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function DreamJournalScreen({ navigation }: DreamJournalScreenProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLucid, setIsLucid] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const commonTags = [
    '🌊 Water', '✈️ Flying', '👥 People', '🏃 Running',
    '🏠 House', '🌳 Nature', '🐕 Animals', '🚗 Vehicles',
    '😨 Nightmare', '😊 Pleasant', '🤔 Confusing', '🎨 Vivid'
  ];

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleSaveDream = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      // Save dream to Firestore
      const dreamRef = await addDoc(collection(db, 'dreams'), {
        userId: user.uid,
        title,
        content,
        isLucid,
        tags,
        createdAt: new Date().toISOString(),
      });

      // Award XP
      const xpAmount = isLucid ? XP_REWARDS.LUCID_DREAM : XP_REWARDS.DREAM_LOGGED;
      const xpReason = isLucid ? 'Logged a lucid dream' : 'Logged a dream';
      await awardXP(user.uid, xpAmount, xpReason);

      // Start AI analysis in background with notification check
      analyzeDreamInBackground(user.uid, dreamRef.id, title, content, isLucid);

      // Navigate back immediately
      navigation.goBack();

      // Show success message
      Alert.alert(
        'Dream Saved! ✨',
        `+${xpAmount} XP earned!\n\n🤖 AI is analyzing your dream for patterns and insights...`
      );
      
    } catch (error) {
      console.error('Error saving dream:', error);
      Alert.alert('Error', 'Failed to save dream. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced background analysis with dream sign notification
  const analyzeDreamInBackground = async (
    userId: string,
    dreamId: string,
    title: string,
    content: string,
    isLucid: boolean
  ) => {
    try {
      console.log('🤖 Starting AI analysis...');
      
      // Analyze the dream
      const analysis = await analyzeDream(title, content, isLucid);
      
      if (analysis) {
        console.log('✅ Analysis complete, saving...');
        await saveDreamAnalysis(userId, dreamId, analysis);
        console.log('💾 Analysis saved successfully');

        // Check for recurring dream signs
        if (analysis.dreamSigns.length > 0) {
          const patterns = await getUserDreamPatterns(userId);
          
          // Find dream signs that appear 3+ times
          const recurringSign = analysis.dreamSigns.find(sign => 
            patterns.topDreamSigns.some(p => 
              p.sign.toLowerCase() === sign.toLowerCase() && p.count >= 3
            )
          );
          
          if (recurringSign) {
            // Get the count
            const signData = patterns.topDreamSigns.find(p => 
              p.sign.toLowerCase() === recurringSign.toLowerCase()
            );
            
            // Show notification about recurring sign
            setTimeout(() => {
              Alert.alert(
                '🎯 Recurring Dream Sign Detected!',
                `"${recurringSign}" has appeared ${signData?.count} times in your dreams.\n\nThis is a perfect reality check trigger! Try checking if you're dreaming whenever you see this.`,
                [
                  {
                    text: 'Got it!',
                    style: 'default',
                  },
                  {
                    text: 'View Insights',
                    onPress: () => navigation.navigate('Insights'),
                  }
                ]
              );
            }, 2000); // Delay to avoid overlapping with save alert
          }
        }
      }
    } catch (error) {
      console.error('❌ Background analysis error:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Dream Title</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Give your dream a title..."
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          <Text style={styles.sectionTitle}>What did you dream about?</Text>
          <TextInput
            style={styles.contentInput}
            placeholder="Describe your dream in as much detail as you can remember..."
            placeholderTextColor="#666"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.sectionTitle}>Was this a lucid dream?</Text>
          <View style={styles.lucidContainer}>
            <TouchableOpacity
              style={[styles.lucidButton, !isLucid && styles.lucidButtonActive]}
              onPress={() => setIsLucid(false)}
            >
              <Text style={[styles.lucidButtonText, !isLucid && styles.lucidButtonTextActive]}>
                No
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.lucidButton, isLucid && styles.lucidButtonActive]}
              onPress={() => setIsLucid(true)}
            >
              <Text style={[styles.lucidButtonText, isLucid && styles.lucidButtonTextActive]}>
                Yes! ✨
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Tags (optional)</Text>
          <View style={styles.tagsContainer}>
            {commonTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, tags.includes(tag) && styles.tagActive]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.tagText, tags.includes(tag) && styles.tagTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSaveDream}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Dream</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    marginTop: 20,
  },
  titleInput: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  contentInput: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    minHeight: 200,
    lineHeight: 24,
  },
  lucidContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  lucidButton: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  lucidButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  lucidButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  lucidButtonTextActive: {
    color: '#fff',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tagActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  tagText: {
    color: '#888',
    fontSize: 14,
  },
  tagTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
