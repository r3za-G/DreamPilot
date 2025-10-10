import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';

type DreamHistoryScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type Dream = {
  id: string;
  title: string;
  content: string;
  isLucid: boolean;
  tags: string[];
  createdAt: string;
  date: string;
};

export default function DreamHistoryScreen({ navigation }: DreamHistoryScreenProps) {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDreams();
  }, []);

  const loadDreams = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const dreamsQuery = query(
        collection(db, 'dreams'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(dreamsQuery);
      const dreamsData: Dream[] = [];
      
      querySnapshot.forEach((doc) => {
        dreamsData.push({
          id: doc.id,
          ...doc.data(),
        } as Dream);
      });

      setDreams(dreamsData);
    } catch (error) {
      console.error('Error loading dreams:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDream = ({ item }: { item: Dream }) => {
  const date = new Date(item.createdAt);
  const formattedDate = format(date, 'MMM d, yyyy');

  return (
    <TouchableOpacity 
      style={styles.dreamCard}
      onPress={() => navigation.navigate('DreamDetail', { dreamId: item.id })} // Use item.id, not dream.id
    >
      <View style={styles.dreamHeader}>
        <Text style={styles.dreamTitle}>
          {item.isLucid && '✨ '}
          {item.title}
        </Text>
        <Text style={styles.dreamDate}>{formattedDate}</Text>
      </View>
      <Text style={styles.dreamContent} numberOfLines={3}>
        {item.content}
      </Text>
      {item.tags.length > 0 && (
        <View style={styles.dreamTags}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.dreamTag}>
              <Text style={styles.dreamTagText}>{tag}</Text>
            </View>
          ))}
          {item.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{item.tags.length - 3} more</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (dreams.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>💭</Text>
        <Text style={styles.emptyTitle}>No dreams yet</Text>
        <Text style={styles.emptySubtitle}>
          Start logging your dreams to track patterns and improve recall
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('DreamJournal')}
        >
          <Text style={styles.emptyButtonText}>Log Your First Dream</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={dreams}
        renderItem={renderDream}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
  },
  dreamCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  dreamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  dreamTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    marginRight: 10,
  },
  dreamDate: {
    fontSize: 12,
    color: '#888',
  },
  dreamContent: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    marginBottom: 12,
  },
  dreamTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  dreamTag: {
    backgroundColor: '#0f0f23',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dreamTagText: {
    fontSize: 12,
    color: '#888',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});