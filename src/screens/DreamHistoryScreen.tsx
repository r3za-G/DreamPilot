import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Swipeable } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { format } from 'date-fns';
import { MaterialIcons } from '@expo/vector-icons';



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

  useFocusEffect(
  React.useCallback(() => {
    loadDreams();
    
    return () => {
      // Cleanup refs when leaving screen
      swipeableRefs.current.clear();
    };
  }, [])
);


const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());



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

  const deleteDream = async (dreamId: string, dreamTitle: string) => {
  Alert.alert(
    'Delete Dream',
    `Are you sure you want to delete "${dreamTitle}"? This action cannot be undone.`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => {
          // Close the swipeable when cancelled
          swipeableRefs.current.get(dreamId)?.close();
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'dreams', dreamId));
            // Remove from refs
            swipeableRefs.current.delete(dreamId);
            // Refresh the list
            loadDreams();
          } catch (error) {
            console.error('Error deleting dream:', error);
            Alert.alert('Error', 'Failed to delete dream. Please try again.');
          }
        },
      },
    ]
  );
};

  const renderRightActions = (item: Dream) => {
  return (
    <View style={styles.deleteActionContainer}>
      <TouchableOpacity
        style={styles.deleteActionButton}
        onPress={() => {
          swipeableRefs.current.get(item.id)?.close();
          deleteDream(item.id, item.title);
        }}
      >
      <MaterialIcons name="delete" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};


const renderDream = ({ item }: { item: Dream }) => {
  const date = new Date(item.createdAt);
  const formattedDate = format(date, 'MMM d, yyyy');

  return (
    <View style={styles.swipeableWrapper}>
      <Swipeable
        ref={(ref) => {
          if (ref) {
            swipeableRefs.current.set(item.id, ref);
          }
        }}
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
        friction={2}
        rightThreshold={40}
      >
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
                <Text style={styles.moreTagsText}>+{item.tags.length - 3} more</Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      </Swipeable>
    </View>
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
  <GestureHandlerRootView style={styles.container}>
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : dreams.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No dreams yet</Text>
          <Text style={styles.emptySubtext}>Start logging your dreams!</Text>
        </View>
      ) : (
        <FlatList
          data={dreams}
          renderItem={renderDream}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  </GestureHandlerRootView>
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
  dreamCardContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 15,
  paddingHorizontal: 20,
  },
  deleteButtonSmall: {
    padding: 12,
    backgroundColor: '#3a1a1a',
    borderRadius: 8,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteIconSmall: {
    fontSize: 18,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  swipeableContainer: {
  marginBottom: 15,
  marginHorizontal: 20,
  overflow: 'hidden',
},

deleteAction: {
  backgroundColor: '#ef4444',
  justifyContent: 'center',
  alignItems: 'flex-end',
  borderTopRightRadius: 12,
  borderBottomRightRadius: 12,
  paddingRight: 20,
  height: '100%',
},
swipeableWrapper: {
  marginBottom: 15,
  marginHorizontal: 20,
},
dreamCard: {
  backgroundColor: '#1a1a2e',
  borderRadius: 12,
  padding: 20,
  borderWidth: 1,
  borderColor: '#333',
  // Important: This makes the card slide over the delete button
},
deleteActionContainer: {
  backgroundColor: '#ef4444',
  justifyContent: 'center',
  alignItems: 'center',
  width: 100,
  marginLeft: -20, // Negative margin to position it properly
  borderTopRightRadius: 12,
  borderBottomRightRadius: 12,
  paddingHorizontal: 10,
},
deleteActionButton: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
},
});