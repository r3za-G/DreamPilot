import React, { useState, useEffect } from 'react';
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
import { doc, updateDoc } from 'firebase/firestore';
import { analyzeDream, saveDreamAnalysis } from '../services/dreamAnalysisService';

type EditDreamScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

export default function EditDreamScreen({ navigation, route }: EditDreamScreenProps) {
  const { dreamId, dream } = route.params;
  
  const [title, setTitle] = useState(dream.title);
  const [content, setContent] = useState(dream.content);
  const [isLucid, setIsLucid] = useState(dream.isLucid);
  const [tags, setTags] = useState<string[]>(dream.tags || []);
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

  const handleUpdateDream = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }

    // Check if anything changed
    const hasChanges = 
      title !== dream.title || 
      content !== dream.content || 
      isLucid !== dream.isLucid ||
      JSON.stringify(tags) !== JSON.stringify(dream.tags);

    if (!hasChanges) {
      Alert.alert('No Changes', 'You haven\'t made any changes to this dream.');
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      // Update dream in Firestore
      await updateDoc(doc(db, 'dreams', dreamId), {
        title,
        content,
        isLucid,
        tags,
        updatedAt: new Date().toISOString(),
      });

      // Ask if user wants to re-analyze
      Alert.alert(
        'Dream Updated! ✅',
        'Your dream has been saved. Would you like to re-analyze it with AI for updated insights?',
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => navigation.goBack(),
          },
          {
            text: 'Re-analyze',
            onPress: async () => {
              try {
                setLoading(true);
                const analysis = await analyzeDream(title, content, isLucid);
                
                if (analysis) {
                  await saveDreamAnalysis(user.uid, dreamId, analysis);
                  Alert.alert(
                    'Analysis Complete! 🤖',
                    'Your dream has been re-analyzed with fresh insights.',
                    [{ text: 'Great!', onPress: () => navigation.goBack() }]
                  );
                } else {
                  navigation.goBack();
                }
              } catch (error) {
                console.error('Error re-analyzing:', error);
                navigation.goBack();
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
      
    } catch (error) {
      console.error('Error updating dream:', error);
      Alert.alert('Error', 'Failed to update dream. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const hasChanges = 
      title !== dream.title || 
      content !== dream.content || 
      isLucid !== dream.isLucid ||
      JSON.stringify(tags) !== JSON.stringify(dream.tags);

    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          {
            text: 'Keep Editing',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
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

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleUpdateDream}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
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
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 30,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
