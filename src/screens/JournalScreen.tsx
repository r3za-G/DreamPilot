import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert, 
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, deleteDoc } from 'firebase/firestore'; 
import { db } from '../../firebaseConfig'; 
import { format } from 'date-fns';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useData } from '../contexts/DataContext';

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
  const { dreams, refreshDreams } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'lucid' | 'recent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshDreams();
    setRefreshing(false);
  };

  const getFilteredDreams = () => {
    let filtered = dreams;

    switch (filter) {
      case 'lucid':
        filtered = filtered.filter(d => d.isLucid);
        break;
      case 'recent':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filtered = filtered.filter(d => new Date(d.createdAt) > sevenDaysAgo);
        break;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(dream => {
        if (dream.title.toLowerCase().includes(query)) return true;
        if (dream.content.toLowerCase().includes(query)) return true;
        if (dream.tags.some(tag => tag.toLowerCase().includes(query))) return true;
        return false;
      });
    }

    return filtered;
  };

  const filteredDreams = getFilteredDreams();
  const lucidCount = dreams.filter(d => d.isLucid).length;

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() ? (
        <Text key={index} style={styles.highlight}>{part}</Text>
      ) : (
        part
      )
    );
  };

  const handleDeleteDream = async (dreamId: string) => {
    Alert.alert(
      'Delete Dream',
      'Are you sure you want to delete this dream?',
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
              await deleteDoc(doc(db, 'dreams', dreamId));
              await refreshDreams();
              Alert.alert('Dream Deleted', 'Your dream has been removed.');
            } catch (error) {
              console.error('Error deleting dream:', error);
              Alert.alert('Error', 'Failed to delete dream.');
            }
          },
        },
      ]
    );
  };

  const renderDream = ({ item }: { item: Dream }) => {
  const date = new Date(item.createdAt);
  const formattedDate = format(date, 'MMM d, yyyy');

  return (
    <TouchableOpacity
      style={styles.dreamCard}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('DreamDetail', { dreamId: item.id })}
      onLongPress={() => handleDeleteDream(item.id)} // ✅ Long press to delete
    >
      <View style={styles.dreamHeader}>
        <Text style={styles.dreamTitle}>
          {item.isLucid && '✨ '}
          {searchQuery ? highlightText(item.title, searchQuery) : item.title}
        </Text>
        <View style={styles.dreamHeaderRight}>
          <Text style={styles.dreamDate}>{formattedDate}</Text>
          {/* ✅ Add visible delete icon */}
          <TouchableOpacity
            style={styles.deleteIcon}
            onPress={(e) => {
              e.stopPropagation(); // Prevent dream detail navigation
              handleDeleteDream(item.id);
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.dreamContent} numberOfLines={3}>
        {searchQuery ? highlightText(item.content, searchQuery) : item.content}
      </Text>
      {item.tags.length > 0 && (
        <View style={styles.dreamTags}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View 
              key={index} 
              style={[
                styles.dreamTag,
                searchQuery && tag.toLowerCase().includes(searchQuery.toLowerCase()) && styles.dreamTagHighlighted
              ]}
            >
              <Text style={[
                styles.dreamTagText,
                searchQuery && tag.toLowerCase().includes(searchQuery.toLowerCase()) && styles.dreamTagTextHighlighted
              ]}>
                {tag}
              </Text>
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


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Dream Journal</Text>
          <TouchableOpacity
            style={styles.searchToggle}
            onPress={() => {
              setIsSearching(!isSearching);
              if (isSearching) setSearchQuery('');
            }}
          >
            <Ionicons 
              name={isSearching ? "close" : "search"} 
              size={22} 
              color="#6366f1" 
            />
          </TouchableOpacity>
        </View>

        {isSearching && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search dreams, tags..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        )}

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

      {searchQuery.trim() && (
        <View style={styles.searchResultsBar}>
          <Text style={styles.searchResultsText}>
            {filteredDreams.length} {filteredDreams.length === 1 ? 'result' : 'results'} found
          </Text>
        </View>
      )}

      {filteredDreams.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>
            {searchQuery ? '🔍' : '📖'}
          </Text>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No matches found' : 'No dreams yet'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery 
              ? `No dreams match "${searchQuery}"`
              : filter === 'all' 
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366f1"
              colors={['#6366f1']}
            />
          }
        />
      )}
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  searchResultsBar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
  },
  searchResultsText: {
    fontSize: 13,
    color: '#888',
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
  highlight: {
    backgroundColor: '#6366f1',
    color: '#fff',
    fontWeight: 'bold',
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
  dreamTagHighlighted: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  dreamTagText: {
    fontSize: 11,
    color: '#888',
  },
  dreamTagTextHighlighted: {
    color: '#fff',
    fontWeight: 'bold',
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
  dreamHeaderRight: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  },
  deleteIcon: {
  padding: 4,
  },


});
