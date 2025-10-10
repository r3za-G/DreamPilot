import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ACHIEVEMENTS } from '../data/achievements';
import { useFocusEffect } from '@react-navigation/native';


type AchievementsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type DisplayAchievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
};

export default function AchievementsScreen({ navigation }: AchievementsScreenProps) {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<DisplayAchievement[]>([]);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');


useFocusEffect(
  React.useCallback(() => {
    loadAchievements();
  }, [])
);



  const loadAchievements = async () => {
  try {
    setLoading(true);
    const user = auth.currentUser;
    if (!user) {
      console.log('No user logged in!');
      return;
    }


    // FIX: Read from the correct location - subcollection
    const achievementsDoc = await getDoc(doc(db, 'users', user.uid, 'data', 'achievements'));
    
    if (!achievementsDoc.exists()) {
      setAchievements(ACHIEVEMENTS.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        icon: a.icon,
        unlocked: false,
        rarity: a.rarity,
      })));
      setLoading(false);
      return;
    }

    const achievementData = achievementsDoc.data();
    const unlockedAchievements = achievementData?.achievements || [];
    

    // Map the ACHIEVEMENTS data with unlock status
    const achievementsWithStatus: DisplayAchievement[] = ACHIEVEMENTS.map((achievement) => {
      const unlockedData = unlockedAchievements.find(
        (a: any) => a.id === achievement.id
      );
      
      const unlocked = !!unlockedData;

      return {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        unlocked,
        unlockedAt: unlockedData?.unlockedAt,
        rarity: achievement.rarity,
      };
    });

    setAchievements(achievementsWithStatus);
  } catch (error) {
    console.error('Error loading achievements:', error);
  } finally {
    setLoading(false);
  }
};



  const getFilteredAchievements = () => {
    switch (filter) {
      case 'unlocked':
        return achievements.filter((a) => a.unlocked);
      case 'locked':
        return achievements.filter((a) => !a.unlocked);
      default:
        return achievements;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#6b7280';
      case 'rare': return '#3b82f6';
      case 'epic': return '#a855f7';
      case 'legendary': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getRarityLabel = (rarity: string) => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const progress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const filteredAchievements = getFilteredAchievements();

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.header}>
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>{unlockedCount}/{totalCount}</Text>
          <Text style={styles.statsLabel}>Achievements Unlocked</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress.toFixed(0)}% Complete</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({totalCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'unlocked' && styles.filterTabActive]}
          onPress={() => setFilter('unlocked')}
        >
          <Text style={[styles.filterText, filter === 'unlocked' && styles.filterTextActive]}>
            Unlocked ({unlockedCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'locked' && styles.filterTabActive]}
          onPress={() => setFilter('locked')}
        >
          <Text style={[styles.filterText, filter === 'locked' && styles.filterTextActive]}>
            Locked ({totalCount - unlockedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Achievements Grid */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.achievementsGrid}>
          {filteredAchievements.map((achievement) => (
            <View
              key={achievement.id}
              style={[
                styles.achievementCard,
                !achievement.unlocked && styles.achievementCardLocked,
                { borderColor: achievement.unlocked ? getRarityColor(achievement.rarity) : '#333' }
              ]}
            >
              <View style={styles.achievementIconContainer}>
                <Text style={[
                  styles.achievementIcon,
                  !achievement.unlocked && styles.achievementIconLocked,
                ]}>
                  {achievement.icon}
                </Text>
                {achievement.unlocked && (
                  <View style={styles.checkBadge}>
                    <MaterialCommunityIcons name="check" size={12} color="#fff" />
                  </View>
                )}
              </View>

              <Text style={[
                styles.achievementName,
                !achievement.unlocked && styles.achievementNameLocked,
              ]}>
                {achievement.title}
              </Text>

              <Text style={styles.achievementDescription}>
                {achievement.description}
              </Text>

              {achievement.unlocked ? (
                <>
                  <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(achievement.rarity) }]}>
                    <Text style={styles.rarityText}>{getRarityLabel(achievement.rarity)}</Text>
                  </View>
                  {achievement.unlockedAt && (
                    <Text style={styles.unlockedDate}>
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </Text>
                  )}
                </>
              ) : (
                <View style={styles.lockedBadge}>
                  <Text style={styles.lockedText}>🔒 Locked</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {filteredAchievements.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyText}>
              {filter === 'unlocked'
                ? 'No achievements unlocked yet'
                : 'Keep going to unlock more achievements!'}
            </Text>
          </View>
        )}

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
  header: {
    padding: 20,
  },
  statsCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  statsNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 8,
  },
  statsLabel: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
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
  scrollView: {
    flex: 1,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    gap: 15,
  },
  achievementCard: {
    width: '47%',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  achievementCardLocked: {
    opacity: 0.6,
  },
  achievementIconContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  achievementIcon: {
    fontSize: 48,
  },
  achievementIconLocked: {
    opacity: 0.4,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#22c55e',
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  achievementNameLocked: {
    color: '#666',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 6,
  },
  rarityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  lockedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  lockedText: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
  },
  unlockedDate: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  footer: {
    height: 40,
  },
});
