import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

type JournalScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type Dream = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isLucid: boolean;
  tags: string[];
};

export default function JournalScreen({ navigation }: JournalScreenProps) {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'lucid' | 'recent'>('all');

  useFocusEffect(
    React.useCallback(() => {
      loadDreams();
    }, [])
  );

  const loadDreams = async () => {
    try {
      setLoading(true);
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

  const getFilteredDreams = () => {
    switch (filter) {
      case 'lucid':
        return dreams.filter(d => d.isLucid);
      case 'recent':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return dreams.filter(d => new Date(d.createdAt) > sevenDaysAgo);
      default:
        return dreams;
    }
  };

  const filteredDreams = getFilteredDreams();
  const lucidCount = dreams.filter(d => d.isLucid).length;

  const renderDream = ({ item }: { item: Dream }) => {
    const date = new Date(item.createdAt);
    const formattedDate = format(date, 'MMM d, yyyy');

    return (
      <TouchableOpacity
        style={styles.dreamCard}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('DreamDetail', { dreamId: item.id })}
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
              <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
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

  return (
    <View style={styles.container}>
      {/* Header with Stats */}
      <View style={styles.header}>
        <Text style={styles.title}>Dream Journal</Text>
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statNumber}>{dreams.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statChip, styles.statChipLucid]}>
            <Text style={styles.statNumber}>{lucidCount}</Text>
            <Text style={styles.statLabel}>Lucid</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'lucid' && styles.filterTabActive]}
          onPress={() => setFilter('lucid')}
        >
          <Text style={[styles.filterText, filter === 'lucid' && styles.filterTextActive]}>
            Lucid
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'recent' && styles.filterTabActive]}
          onPress={() => setFilter('recent')}
        >
          <Text style={[styles.filterText, filter === 'recent' && styles.filterTextActive]}>
            Recent
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dreams List */}
      {filteredDreams.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={styles.emptyTitle}>No dreams yet</Text>
          <Text style={styles.emptyText}>
            {filter === 'all' 
              ? 'Start your lucid dreaming journey by logging your first dream!'
              : filter === 'lucid'
              ? 'No lucid dreams yet. Keep practicing!'
              : 'No dreams logged in the past 7 days.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredDreams}
          renderItem={renderDream}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('DreamJournal')}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
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
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statChip: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  statChipLucid: {
    borderColor: '#a855f7',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 10,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  filterTabActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  dreamCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  dreamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  },
  dreamTag: {
    backgroundColor: '#0f0f23',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  dreamTagText: {
    fontSize: 11,
    color: '#888',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#666',
    alignSelf: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
