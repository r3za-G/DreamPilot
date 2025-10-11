import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { DreamAnalysis, analyzeDream, saveDreamAnalysis } from '../services/dreamAnalysisService';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useData } from '../contexts/DataContext';

type DreamDetailScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

type Dream = {
  title: string;
  content: string;
  isLucid: boolean;
  tags: string[];
  createdAt: string;
  analysis?: DreamAnalysis;
  analyzed?: boolean;
};

export default function DreamDetailScreen({ navigation, route }: DreamDetailScreenProps) {
  const { dreamId } = route.params;
  const [dream, setDream] = useState<Dream | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const { refreshDreams } = useData(); 

  useEffect(() => {
    loadDream();
  }, []);

  const loadDream = async () => {
    try {
      const dreamDoc = await getDoc(doc(db, 'dreams', dreamId));
      if (dreamDoc.exists()) {
        setDream(dreamDoc.data() as Dream);
      }
    } catch (error) {
      console.error('Error loading dream:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async () => {
    if (!dream) return;
    
    Alert.alert(
      'Re-analyze Dream',
      'This will generate a fresh AI analysis of your dream. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Re-analyze',
          onPress: async () => {
            try {
              setReanalyzing(true);
              const user = auth.currentUser;
              if (!user) return;

              const analysis = await analyzeDream(dream.title, dream.content, dream.isLucid);
              
              if (analysis) {
                await saveDreamAnalysis(user.uid, dreamId, analysis);
                await loadDream(); // Reload dream with new analysis
                
                Alert.alert(
                  'Analysis Complete! 🎉',
                  'Your dream has been re-analyzed with fresh insights.',
                  [{ text: 'Great!' }]
                );
              } else {
                Alert.alert('Error', 'Failed to analyze dream. Please try again.');
              }
            } catch (error) {
              console.error('Error re-analyzing dream:', error);
              Alert.alert('Error', 'Something went wrong. Please try again.');
            } finally {
              setReanalyzing(false);
            }
          },
        },
      ]
    );
  };

  const deleteDream = async () => {
    Alert.alert(
      'Delete Dream',
      'Are you sure you want to delete this dream? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteDoc(doc(db, 'dreams', dreamId));
              await refreshDreams();
              
              navigation.goBack();
              
              Alert.alert('Dream Deleted', 'Your dream has been removed from your journal.');
            } catch (error) {
              console.error('Error deleting dream:', error);
              Alert.alert('Error', 'Failed to delete dream. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };


  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case 'high': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'low': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!dream) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Dream not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{dream.title}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditDream', { dreamId, dream })}
            >
              <Ionicons name="pencil" size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.date}>
              {new Date(dream.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            {dream.isLucid && (
              <View style={styles.lucidBadge}>
                <Text style={styles.lucidText}>✨ Lucid</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dream Content</Text>
          <Text style={styles.content}>{dream.content}</Text>
        </View>

        {dream.tags && dream.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {dream.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {dream.analyzed && dream.analysis ? (
          <>
            <View style={styles.aiSection}>
              <View style={styles.aiHeader}>
                <Text style={styles.aiTitle}>🤖 AI Analysis</Text>
                <TouchableOpacity
                  style={styles.reanalyzeButton}
                  onPress={handleReanalyze}
                  disabled={reanalyzing}
                >
                  <Ionicons 
                    name={reanalyzing ? "hourglass" : "refresh"} 
                    size={18} 
                    color="#6366f1" 
                  />
                  <Text style={styles.reanalyzeText}>
                    {reanalyzing ? 'Analyzing...' : 'Re-analyze'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Lucidity Potential */}
              <View style={styles.potentialCard}>
                <Text style={styles.cardLabel}>Lucidity Potential</Text>
                <View style={[styles.potentialBadge, { backgroundColor: getPotentialColor(dream.analysis.lucidityPotential) + '20' }]}>
                  <Text style={[styles.potentialText, { color: getPotentialColor(dream.analysis.lucidityPotential) }]}>
                    {dream.analysis.lucidityPotential.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Dream Signs */}
              {dream.analysis.dreamSigns.length > 0 && (
                <View style={styles.analysisCard}>
                  <Text style={styles.cardTitle}>🎯 Dream Signs</Text>
                  <Text style={styles.cardDescription}>
                    Watch for these in future dreams to trigger lucidity
                  </Text>
                  <View style={styles.chipContainer}>
                    {dream.analysis.dreamSigns.map((sign, index) => (
                      <View key={index} style={styles.chip}>
                        <Text style={styles.chipText}>{sign}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Themes */}
              {dream.analysis.themes.length > 0 && (
                <View style={styles.analysisCard}>
                  <Text style={styles.cardTitle}>💭 Themes</Text>
                  <View style={styles.chipContainer}>
                    {dream.analysis.themes.map((theme, index) => (
                      <View key={index} style={[styles.chip, styles.themeChip]}>
                        <Text style={styles.chipText}>{theme}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Emotions */}
              {dream.analysis.emotions.length > 0 && (
                <View style={styles.analysisCard}>
                  <Text style={styles.cardTitle}>❤️ Emotions</Text>
                  <View style={styles.chipContainer}>
                    {dream.analysis.emotions.map((emotion, index) => (
                      <View key={index} style={[styles.chip, styles.emotionChip]}>
                        <Text style={styles.chipText}>{emotion}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Insights */}
              <View style={styles.analysisCard}>
                <Text style={styles.cardTitle}>💡 Insights</Text>
                <Text style={styles.insightText}>{dream.analysis.insights}</Text>
              </View>

              {/* Suggestions */}
              {dream.analysis.suggestions.length > 0 && (
                <View style={styles.analysisCard}>
                  <Text style={styles.cardTitle}>✨ Suggestions for Lucidity</Text>
                  {dream.analysis.suggestions.map((suggestion, index) => (
                    <View key={index} style={styles.suggestionItem}>
                      <Text style={styles.suggestionNumber}>{index + 1}.</Text>
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Analysis timestamp */}
              <Text style={styles.analysisTimestamp}>
                Analyzed {new Date(dream.analysis.analyzedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.noAnalysisCard}>
            <Text style={styles.noAnalysisText}>
              🤖 AI analysis in progress...
            </Text>
            <Text style={styles.noAnalysisSubtext}>
              Check back in a moment for insights about this dream
            </Text>
          </View>
        )}

        {/* Delete Button at Bottom */}
        <View style={styles.deleteSection}>
          <TouchableOpacity 
            style={styles.deleteButtonBottom}
            onPress={deleteDream}
          >
            <MaterialIcons name="delete" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.deleteWarning}>
            This action cannot be undone
          </Text>
        </View>
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
  errorText: {
    color: '#888',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  date: {
    fontSize: 14,
    color: '#888',
  },
  lucidBadge: {
    backgroundColor: '#1a3229',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lucidText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  content: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 26,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  tagText: {
    color: '#888',
    fontSize: 14,
  },
  aiSection: {
    padding: 20,
    paddingTop: 10,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  aiTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  reanalyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
    gap: 6,
  },
  reanalyzeText: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '600',
  },
  potentialCard: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 16,
    color: '#aaa',
    fontWeight: '600',
  },
  potentialBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  potentialText: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  analysisCard: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 13,
    color: '#888',
    marginBottom: 15,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  themeChip: {
    backgroundColor: '#8b5cf6',
  },
  emotionChip: {
    backgroundColor: '#ec4899',
  },
  chipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  insightText: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 24,
  },
  suggestionItem: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  suggestionNumber: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    color: '#ccc',
    lineHeight: 24,
  },
  analysisTimestamp: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  noAnalysisCard: {
    margin: 20,
    backgroundColor: '#1a1a2e',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  noAnalysisText: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 8,
    textAlign: 'center',
  },
  noAnalysisSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  deleteSection: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  deleteButtonBottom: {
    backgroundColor: '#3a1a1a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  deleteWarning: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  titleRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 10,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
});
